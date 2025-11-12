import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatDateFormats,
  MatNativeDateModule,
  NativeDateAdapter,
} from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDatepicker,
  MatDatepickerModule,
  MatDatepickerInputEvent,
} from '@angular/material/datepicker';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CvService } from '../services/cv.service';

type NullableDate = Date | null;

export interface StoredProject {
  name: string;
  role: string;
  startDate: string | null;
  endDate: string | null;
  description: string;
  responsibilities: string[];
  technologies: string[];
  photo?: string | null;
}

class MonthYearDateAdapter extends NativeDateAdapter {
  override parse(value: string): Date | null {
    if (value) {
      const [month, year] = value.split('/').map((part) => parseInt(part, 10));
      if (!isNaN(month) && !isNaN(year)) {
        return new Date(year, month - 1, 1);
      }
    }
    return super.parse(value);
  }

  override format(date: Date, displayFormat: MatDateFormats['display']): string {
    if (displayFormat === MONTH_YEAR_FORMATS.display.dateInput && date) {
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      return `${month}/${date.getFullYear()}`;
    }
    return super.format(date, displayFormat);
  }
}

const MONTH_YEAR_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-projects',
  standalone: true,
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatCardModule,
    MatTooltipModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: MonthYearDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MONTH_YEAR_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
  ],
})
export class ProjectsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cvService = inject(CvService);
  private readonly destroyRef = inject(DestroyRef);

  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  readonly projectsForm = this.fb.group({
    projects: new FormArray<FormGroup<ProjectForm>>([]),
  });

  get projects(): FormArray<FormGroup<ProjectForm>> {
    return this.projectsForm.get('projects') as FormArray<FormGroup<ProjectForm>>;
  }

  ngOnInit(): void {
    const existing = (this.cvService.getCvData()?.projects ?? []) as StoredProject[];

    if (existing.length) {
      existing.forEach((project) => this.addProject(project));
    } else {
      this.addProject();
    }

    this.projectsForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(200))
      .subscribe(() => this.persistProjects());
  }

  addProject(project?: StoredProject): void {
    const group = this.fb.group<ProjectForm>({
      name: new FormControl<string>(project?.name ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      role: new FormControl<string>(project?.role ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      startDate: new FormControl<Date | null>(
        project?.startDate ? this.parseMonthYear(project.startDate) : null,
        { validators: [Validators.required] }
      ),
      endDate: new FormControl<Date | null>(
        project?.endDate ? this.parseMonthYear(project.endDate) : null
      ),
      description: new FormControl<string>(project?.description ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(1000)],
      }),
      responsibilities: new FormArray<FormControl<string | null>>(
        (project?.responsibilities?.length ? project.responsibilities : ['']).map(
          (item) => new FormControl<string | null>(item)
        )
      ),
      technologies: new FormArray<FormControl<string | null>>(
        (project?.technologies?.length ? project.technologies : []).map(
          (tech) => new FormControl<string | null>(tech)
        )
      ),
      photo: new FormControl<string | null>(project?.photo ?? null),
    });

    this.projects.push(group);
    this.persistProjects();
  }

  removeProject(index: number): void {
    this.projects.removeAt(index);
    if (!this.projects.length) {
      this.addProject();
    } else {
      this.persistProjects();
    }
  }

  addResponsibility(projectIndex: number): void {
    this.getResponsibilities(projectIndex).push(new FormControl<string | null>(''));
  }

  removeResponsibility(projectIndex: number, responsibilityIndex: number): void {
    const responsibilities = this.getResponsibilities(projectIndex);
    responsibilities.removeAt(responsibilityIndex);
    if (!responsibilities.length) {
      responsibilities.push(new FormControl(''));
    }
  }

  addTechnology(event: MatChipInputEvent, projectIndex: number): void {
    const value = (event.value || '').trim();
    if (value) {
      this.getTechnologies(projectIndex).push(new FormControl<string | null>(value));
    }
    event.chipInput?.clear();
  }

  removeTechnology(projectIndex: number, techIndex: number): void {
    this.getTechnologies(projectIndex).removeAt(techIndex);
  }

  onMonthSelected(date: Date, datepicker: MatDatepicker<Date>, projectIndex: number, controlName: 'startDate' | 'endDate'): void {
    const control = this.projects.at(projectIndex).get(controlName) as FormControl<NullableDate>;
    control.setValue(date);
    datepicker.close();
  }

  handleDateInput(event: MatDatepickerInputEvent<Date>, projectIndex: number, controlName: 'startDate' | 'endDate'): void {
    const control = this.projects.at(projectIndex).get(controlName) as FormControl<NullableDate>;
    control.setValue(event.value ?? null);
  }

  onPhotoSelected(event: Event, projectIndex: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const control = this.projects.at(projectIndex).get('photo') as FormControl<string | null>;
      control.setValue(typeof reader.result === 'string' ? reader.result : null);
      control.markAsDirty();
      input.value = '';
      this.persistProjects();
    };
    reader.readAsDataURL(file);
  }

  clearPhoto(projectIndex: number): void {
    const control = this.projects.at(projectIndex).get('photo') as FormControl<string | null>;
    control.setValue(null);
    control.markAsDirty();
    this.persistProjects();
  }

  onSubmit(): void {
    if (this.projectsForm.valid) {
      this.persistProjects();
    } else {
      this.projectsForm.markAllAsTouched();
    }
  }

  getResponsibilities(projectIndex: number): FormArray<FormControl<string | null>> {
    return this.projects.at(projectIndex).get('responsibilities') as FormArray<FormControl<string | null>>;
  }

  getTechnologies(projectIndex: number): FormArray<FormControl<string | null>> {
    return this.projects.at(projectIndex).get('technologies') as FormArray<FormControl<string | null>>;
  }

  trackByProject = (index: number) => index;
  trackByIndex = (index: number) => index;

  private persistProjects(): void {
    const projects = this.projects.controls.map((control) => this.normalizeProject(control));
    this.cvService.updateSection('projects', projects);
  }

  private normalizeProject(group: FormGroup<ProjectForm>): StoredProject {
    const raw = group.getRawValue();
    return {
      name: raw.name.trim(),
      role: raw.role.trim(),
      startDate: this.toMonthYearString(raw.startDate),
      endDate: this.toMonthYearString(raw.endDate),
      description: raw.description.trim(),
      responsibilities: raw.responsibilities
        .map((item) => (item ?? '').trim())
        .filter((item) => !!item),
      technologies: raw.technologies
        .map((item) => (item ?? '').trim())
        .filter((item) => !!item),
      photo: raw.photo ?? null,
    };
  }

  private parseMonthYear(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    if (/^\d{4}-\d{2}$/.test(value)) {
      const [year, month] = value.split('-').map((part) => parseInt(part, 10));
      return new Date(year, month - 1, 1);
    }

    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    const parts = value.split(/[\/\-]/);
    if (parts.length >= 2) {
      const [first, second] = parts.map((part) => parseInt(part, 10));
      if (!isNaN(first) && !isNaN(second)) {
        // Assume MM/YYYY
        const month = first > 12 ? second : first;
        const year = first > 12 ? first : second;
        return new Date(year, month - 1, 1);
      }
    }

    return null;
  }

  private toMonthYearString(date: Date | null): string | null {
    if (!date || isNaN(date.getTime())) {
      return null;
    }
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${year}-${month}`;
  }
}

type ProjectForm = {
  name: FormControl<string>;
  role: FormControl<string>;
  startDate: FormControl<NullableDate>;
  endDate: FormControl<NullableDate>;
  description: FormControl<string>;
  responsibilities: FormArray<FormControl<string | null>>;
  technologies: FormArray<FormControl<string | null>>;
  photo: FormControl<string | null>;
};

