import { Routes } from '@angular/router';
import { ProjectComponent } from './components/projects/project/project.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: ProjectComponent,
  },
  {
    path: 'project-view/:id',
    loadComponent: () =>
      import('./components/projects/project-view-modal/project-view-modal.component').then((m) => m.ProjectViewModalComponent),
  },
  {
    path: 'project-team-view/:id',
    loadComponent: () =>
      import('./components/project-teams/project-team-view-modal/project-team-view-modal.component').then((m) => m.ProjectTeamViewModalComponent),
  },
  {
    path: 'task-view/:id',
    loadComponent: () =>
      import('./components/teams/task-detail-modal/task-detail.component').then((m) => m.TaskDetailComponent),
  },
];

