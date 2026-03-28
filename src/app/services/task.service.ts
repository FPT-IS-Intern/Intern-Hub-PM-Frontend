import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PaginatedData } from '../models/common.types';
import { environment } from '../../environments/environment';

export interface TaskResponse {
  id: number;
  projectId: number;
  taskUUID: string;
  name: string;
  description: string;
  status: string;
  rewardToken: number;
  creatorId: number;
  assigneeId: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStatistics {
  totalTasks: number;
  notStartedTasks: number;
  inProgressTasks: number;
  pendingReviewTasks: number;
  completedTasks: number;
  overdueTasks: number;
  needsRevisionTasks: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pm`;

  getTasks(teamId: string, page: number = 0, size: number = 10, filter?: any): Observable<ApiResponse<PaginatedData<TaskResponse>>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (filter) {
      if (filter.name) params = params.set('name', filter.name);
      if (filter.status) params = params.set('status', filter.status);
      if (filter.startDate) params = params.set('startDate', filter.startDate);
      if (filter.endDate) params = params.set('endDate', filter.endDate);
    }

    return this.http.get<ApiResponse<PaginatedData<TaskResponse>>>(`${this.apiUrl}/teams/${teamId}/tasks`, { params });
  }

  getTaskStatistics(teamId: string): Observable<ApiResponse<TaskStatistics>> {
    return this.http.get<ApiResponse<TaskStatistics>>(`${this.apiUrl}/teams/${teamId}/tasks/statistics`);
  }

  submitTask(taskId: number, deliverableLink?: string, files?: File[]): Observable<ApiResponse<TaskResponse>> {
    const formData = new FormData();
    if (deliverableLink) formData.append('deliverableLink', deliverableLink);
    if (files && files.length > 0) {
      files.forEach(f => formData.append('files', f, f.name));
    }
    return this.http.post<ApiResponse<TaskResponse>>(`${this.apiUrl}/tasks/${taskId}/submit`, formData);
  }

  approveTask(taskId: number, reviewComment?: string): Observable<ApiResponse<TaskResponse>> {
    return this.http.post<ApiResponse<TaskResponse>>(`${this.apiUrl}/tasks/${taskId}/approve`, { reviewComment });
  }

  refuseTask(taskId: number, reviewComment?: string): Observable<ApiResponse<TaskResponse>> {
    return this.http.post<ApiResponse<TaskResponse>>(`${this.apiUrl}/tasks/${taskId}/refuse`, { reviewComment });
  }

  getTeamMembers(teamId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/pm/teams/${teamId}/members`);
  }
}
