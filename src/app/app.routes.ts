import { Routes } from '@angular/router';
import { ProjectComponent } from './components/project/project.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: ProjectComponent,
  },
  {
    path: 'project-view/:id',
    loadComponent: () =>
      import('./components/project-view-modal/project-view-modal.component').then((m) => m.ProjectViewModalComponent),
  },
];

