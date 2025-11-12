import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProjectsComponent } from './components/projects/projects';
import { PreviewComponent } from './components/preview/preview';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProjectsComponent, PreviewComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
}
