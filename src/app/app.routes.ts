import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/home/pm-home.component').then((m) => m.PmHomeComponent),
  },
  {
    path: 'project-view/:id',
    loadComponent: () =>
      import('./components/project-view-modal/project-view-modal.component').then((m) => m.ProjectViewModalComponent),
  },
];

