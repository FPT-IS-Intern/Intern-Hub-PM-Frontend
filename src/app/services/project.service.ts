import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProjectListItem } from '../models/project.types';
import { ApiResponse, PaginatedData } from '../models/common.types';
import { environment } from '../../environments/environment';

export interface ProjectApiRequest {
  assigneeId: string;
  name: string;
  description: string;
  budgetToken: number;
  rewardToken: number;
  startDate: string;
  endDate: string;
  memberList: { userId: string; role: string }[];
}

export interface ProjectStatistics {
  totalProjects: number;
  notStartedProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  overdueProjects: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pm/projects`;

  getProjects(page: number = 0, size: number = 10, filter?: any): Observable<ApiResponse<PaginatedData<ProjectListItem>>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (filter) {
      if (filter.name) params = params.set('name', filter.name);
      if (filter.status) params = params.set('status', filter.status);
      if (filter.startDate) params = params.set('startDate', filter.startDate);
      if (filter.endDate) params = params.set('endDate', filter.endDate);
    }

    return this.http.get<ApiResponse<PaginatedData<ProjectListItem>>>(this.apiUrl, { params });
  }

  getProjectStatistics(): Observable<ApiResponse<ProjectStatistics>> {
    return this.http.get<ApiResponse<ProjectStatistics>>(`${this.apiUrl}/statistics`);
  }

  createProject(request: ProjectApiRequest, files: File[]): Observable<ApiResponse<any>> {
    const formData = new FormData();

    // Create a Blob for the JSON part to specify application/json content type
    const requestBlob = new Blob([JSON.stringify(request)], { type: 'application/json' });
    formData.append('request', requestBlob);

    // Append files
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file, file.name);
      });
    }

    return this.http.post<ApiResponse<any>>(this.apiUrl, formData);
  }
}
