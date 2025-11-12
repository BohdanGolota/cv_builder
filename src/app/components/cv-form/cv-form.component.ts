import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CvDataService } from '../../services/cv-data.service';
import { CvData, Experience } from '../../models/cv-data';

type ExperienceFormGroup = {
  projectName: FormControl<string>;
  role: FormControl<string>;
  dates: FormControl<string>;
  description: FormControl<string>;
  bullets: FormArray<FormControl<string>>;
  technologies: FormArray<FormControl<string>>;
};

type CvFormGroup = {
  fullName: FormControl<string>;
  position: FormControl<string>;
  summary: FormControl<string>;
  photoUrl: FormControl<string | null>;
  languages: FormArray<FormControl<string>>;
  technologies: FormArray<FormControl<string>>;
  experiences: FormArray<FormGroup<ExperienceFormGroup>>;
};

@Component({
  selector: 'app-cv-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './cv-form.component.html',
  styleUrl: './cv-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cvDataService = inject(CvDataService);
  private readonly destroyRef = inject(DestroyRef);
  private isInitializing = false;

  readonly cvForm = this.fb.group<CvFormGroup>({
    fullName: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    position: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    summary: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(400)],
    }),
    photoUrl: this.fb.control<string | null>(null),
    languages: this.fb.array<FormControl<string>>([]),
    technologies: this.fb.array<FormControl<string>>([]),
    experiences: this.fb.array<FormGroup<ExperienceFormGroup>>([]),
  });

  readonly languagesArray = computed(() => this.cvForm.controls.languages);
  readonly technologiesArray = computed(() => this.cvForm.controls.technologies);
  readonly experiencesArray = computed(() => this.cvForm.controls.experiences);

  ngOnInit(): void {
    this.populateInitialData(this.cvDataService.snapshot);

    this.cvForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(200))
      .subscribe(() => this.persistForm());
  }

  addLanguage(initialValue = ''): void {
    this.languagesArray().push(
      this.fb.control(initialValue, {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(120)],
      })
    );
  }

  removeLanguage(index: number): void {
    this.languagesArray().removeAt(index);
    this.persistForm();
  }

  addTechnology(initialValue = ''): void {
    this.technologiesArray().push(
      this.fb.control(initialValue, {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(60)],
      })
    );
  }

  removeTechnology(index: number): void {
    this.technologiesArray().removeAt(index);
    this.persistForm();
  }

  addExperience(initial?: Experience): void {
    const experienceGroup = this.fb.group<ExperienceFormGroup>({
      projectName: this.fb.control(initial?.projectName ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(80)],
      }),
      role: this.fb.control(initial?.role ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(60)],
      }),
      dates: this.fb.control(initial?.dates ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(80)],
      }),
      description: this.fb.control(initial?.description ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(800)],
      }),
      bullets: this.fb.array<FormControl<string>>(
        (initial?.bullets?.length ? initial.bullets : ['']).map((bullet) =>
          this.fb.control(bullet, {
            nonNullable: true,
            validators: [Validators.required, Validators.maxLength(220)],
          })
        )
      ),
      technologies: this.fb.array<FormControl<string>>(
        (initial?.technologies?.length ? initial.technologies : []).map((tech) =>
          this.fb.control(tech, {
            nonNullable: true,
            validators: [Validators.required, Validators.maxLength(50)],
          })
        )
      ),
    });

    this.experiencesArray().push(experienceGroup);
    this.persistForm();
  }

  removeExperience(index: number): void {
    this.experiencesArray().removeAt(index);
    this.persistForm();
  }

  addBullet(experienceIndex: number): void {
    const bullets = this.getBullets(experienceIndex);
    bullets.push(
      this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(220)],
      })
    );
  }

  removeBullet(experienceIndex: number, bulletIndex: number): void {
    const bullets = this.getBullets(experienceIndex);
    bullets.removeAt(bulletIndex);
    this.persistForm();
  }

  addExperienceTechnology(experienceIndex: number, initialValue = ''): void {
    const technologies = this.getExperienceTechnologies(experienceIndex);
    technologies.push(
      this.fb.control(initialValue, {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(50)],
      })
    );
  }

  removeExperienceTechnology(experienceIndex: number, techIndex: number): void {
    const technologies = this.getExperienceTechnologies(experienceIndex);
    technologies.removeAt(techIndex);
    this.persistForm();
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.cvForm.controls.photoUrl.setValue(typeof reader.result === 'string' ? reader.result : null);
      this.persistForm();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  clearPhoto(): void {
    this.cvForm.controls.photoUrl.setValue(null);
    this.persistForm();
  }

  trackByIndex = (_: number, index: number) => index;

  private populateInitialData(data: CvData): void {
    this.isInitializing = true;
    this.cvForm.patchValue(
      {
        fullName: data.fullName,
        position: data.position,
        summary: data.summary,
        photoUrl: data.photoUrl,
      },
      { emitEvent: false }
    );

    this.languagesArray().clear({ emitEvent: false });
    data.languages.forEach((language) => this.languagesArray().push(
      this.fb.control(language, {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(120)],
      })
    ));

    this.technologiesArray().clear({ emitEvent: false });
    data.technologies.forEach((tech) => this.technologiesArray().push(
      this.fb.control(tech, {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(60)],
      })
    ));

    this.experiencesArray().clear({ emitEvent: false });
    data.experiences.forEach((experience) => {
      const experienceGroup = this.fb.group<ExperienceFormGroup>({
        projectName: this.fb.control(experience.projectName, {
          nonNullable: true,
          validators: [Validators.required, Validators.maxLength(80)],
        }),
        role: this.fb.control(experience.role, {
          nonNullable: true,
          validators: [Validators.required, Validators.maxLength(60)],
        }),
        dates: this.fb.control(experience.dates, {
          nonNullable: true,
          validators: [Validators.required, Validators.maxLength(80)],
        }),
        description: this.fb.control(experience.description, {
          nonNullable: true,
          validators: [Validators.required, Validators.maxLength(800)],
        }),
        bullets: this.fb.array<FormControl<string>>(
          (experience.bullets.length ? experience.bullets : ['']).map((bullet) =>
            this.fb.control(bullet, {
              nonNullable: true,
              validators: [Validators.required, Validators.maxLength(220)],
            })
          )
        ),
        technologies: this.fb.array<FormControl<string>>(
          (experience.technologies.length ? experience.technologies : []).map((tech) =>
            this.fb.control(tech, {
              nonNullable: true,
              validators: [Validators.required, Validators.maxLength(50)],
            })
          )
        ),
      });

      this.experiencesArray().push(experienceGroup, { emitEvent: false });
    });

    this.cvForm.markAsPristine();
    this.isInitializing = false;
    this.persistForm();
  }

  private persistForm(): void {
    if (this.isInitializing) {
      return;
    }

    const formValue = this.cvForm.getRawValue();
    const normalizedExperiences = formValue.experiences
      .map((exp) => ({
        projectName: exp.projectName.trim(),
        role: exp.role.trim(),
        dates: exp.dates.trim(),
        description: exp.description.trim(),
        bullets: exp.bullets.map((bullet) => bullet.trim()).filter(Boolean),
        technologies: exp.technologies.map((tech) => tech.trim()).filter(Boolean),
      }))
      .filter(
        (exp) =>
          exp.projectName ||
          exp.role ||
          exp.dates ||
          exp.description ||
          exp.bullets.length > 0 ||
          exp.technologies.length > 0
      );

    const normalized: CvData = {
      fullName: formValue.fullName.trim(),
      position: formValue.position.trim(),
      summary: formValue.summary.trim(),
      photoUrl: formValue.photoUrl,
      languages: formValue.languages.map((language) => language.trim()).filter(Boolean),
      technologies: formValue.technologies.map((tech) => tech.trim()).filter(Boolean),
      experiences: normalizedExperiences,
    };

    this.cvDataService.set(normalized);
  }

  private getBullets(index: number): FormArray<FormControl<string>> {
    return this.experiencesArray().at(index).controls.bullets;
  }

  private getExperienceTechnologies(index: number): FormArray<FormControl<string>> {
    return this.experiencesArray().at(index).controls.technologies;
  }
}

