import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PaginatedData } from '../models/common.types';
import { environment } from '../../environments/environment';

export interface TeamApiRequest {
  name: string;
  description: string;
  budgetToken: number;
  rewardToken: number;
  assigneeId: string;
  projectId: string;
  startDate: string;
  endDate: string;
  memberList: { userId: string; role: string }[];
}

export interface TeamStatistics {
  totalTeams: number;
  notStartedTeams: number;
  inProgressTeams: number;
  completedTeams: number;
  overdueTeams: number;
}

@Injectable({
  providedIn: 'root'
})
export class TeamApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pm/teams`;

  createTeam(request: TeamApiRequest, files: File[]): Observable<ApiResponse<any>> {
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

  getTeams(page: number = 0, size: number = 10, filter?: any): Observable<ApiResponse<PaginatedData<any>>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (filter) {
      if (filter.projectId) params = params.set('projectId', filter.projectId);
      if (filter.name) params = params.set('name', filter.name);
      if (filter.status) params = params.set('status', filter.status);
      if (filter.startDate) params = params.set('startDate', filter.startDate);
      if (filter.endDate) params = params.set('endDate', filter.endDate);
    }

    return this.http.get<ApiResponse<PaginatedData<any>>>(this.apiUrl, { params });
  }

  getTeamStatistics(projectId?: string): Observable<ApiResponse<TeamStatistics>> {
    let params = new HttpParams();
    if (projectId) {
      params = params.set('projectId', projectId);
    }
    return this.http.get<ApiResponse<TeamStatistics>>(`${this.apiUrl}/statistics`, { params });
  }
}
