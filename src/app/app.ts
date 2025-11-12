import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CvFormComponent } from './components/cv-form/cv-form.component';
import { CvPreviewComponent } from './components/cv-preview/cv-preview.component';

@Component({
  selector: 'app-root',
  imports: [CvFormComponent, CvPreviewComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
}
