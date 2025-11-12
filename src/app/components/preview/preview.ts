import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CvService } from '../services/cv.service';
import { MatCardModule } from '@angular/material/card';
import { toSignal } from '@angular/core/rxjs-interop';

interface PreviewProject {
  name: string;
  role: string;
  startDate: string | null;
  endDate: string | null;
  description: string;
  responsibilities: string[];
  technologies: string[];
  photo?: string | null;
}

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './preview.html',
  styleUrl: './preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewComponent {
  private readonly cvService = inject(CvService);
  private readonly cvState = toSignal(this.cvService.currentCv$, {
    initialValue: this.cvService.getCvData(),
  });

  readonly projects = computed(() => {
    const data = this.cvState();
    return (data?.projects ?? []) as PreviewProject[];
  });

  trackByProject = (index: number) => index;
  trackByIndex = (index: number) => index;

  formatProjectPeriod(startDate: string | null, endDate: string | null): string {
    const start = this.formatMonthYear(startDate);
    const end = endDate ? this.formatMonthYear(endDate) : 'Present';
    return start && end ? `${start} - ${end}` : start || end || '';
  }

  formatMonthYear(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = this.parseMonthYear(value);
    if (!date) {
      return value;
    }

    try {
      return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
    } catch {
      return value;
    }
  }

  private parseMonthYear(value: string): Date | null {
    if (/^\d{4}-\d{2}$/.test(value)) {
      const [year, month] = value.split('-').map((part) => parseInt(part, 10));
      return new Date(year, month - 1, 1);
    }

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
}

