import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { CreateProjectParams } from '../models/project.types';

export interface ProjectApiRequest {
  assigneeId: number;
  name: string;
  description: string;
  bt: number;
  rt: number;
  startDate: string;
  endDate: string;
  userList: { id: number; role: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectApiService {
  createProject(request: ProjectApiRequest, files: File[]): Observable<{ status: number; message: string }> {
    console.log('API Create Project Request:', request, 'Files:', files.length);
    return of({
      status: 200,
      message: 'Dự án đã được tạo thành công!'
    });
  }
}
