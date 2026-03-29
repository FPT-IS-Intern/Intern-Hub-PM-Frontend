import { Component } from '@angular/core';
import { ProjectComponent } from '../../components/projects/project/project.component';

@Component({
  selector: 'app-pm-home',
  standalone: true,
  imports: [ProjectComponent],
  template: `
    <app-project></app-project>
  `,
  styles: []
})
export class PmHomeComponent { }
