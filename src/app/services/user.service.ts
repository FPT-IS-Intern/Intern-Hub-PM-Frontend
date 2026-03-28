import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, PaginatedData } from '../models/common.types';

export interface User {
  id: string;
  username: string;
  email?: string;
  countProjectTeam?: number;
  role?: string;
  position?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pm/users`;

  getUsers(keyword: string = '', page: number = 0, size: number = 20): Observable<ApiResponse<PaginatedData<User>>> {
    const body: any = {};

    if (keyword && keyword.trim()) {
      body.keyword = keyword.trim();
    }

    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    return this.http.post<ApiResponse<PaginatedData<any>>>(`${this.apiUrl}/filter`, body, { params })
      .pipe(
        map(response => ({
          ...response,
          data: {
            ...response.data,
            items: response.data.items.map((item: any) => ({
              id: String(item.userId),
              username: item.fullName,
              email: item.email,
              countProjectTeam: item.countProjectTeam,
              role: item.role,
              position: item.position
            }))
          }
        }))
      );
  }

  searchProjectMembers(projectId: string, keyword: string = '', page: number = 0, size: number = 20): Observable<ApiResponse<PaginatedData<User>>> {
    const body: any = {};

    if (keyword && keyword.trim()) {
      body.keyword = keyword.trim();
    }

    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    return this.http.post<ApiResponse<PaginatedData<any>>>(`${this.apiUrl}/project-members/${projectId}/search`, body, { params })
      .pipe(
        map(response => ({
          ...response,
          data: {
            ...response.data,
            items: response.data.items.map((item: any) => ({
              id: String(item.userId),
              username: item.fullName,
              email: item.email,
              countProjectTeam: item.countProjectTeam,
              role: item.role,
              position: item.position
            }))
          }
        }))
      );
  }

  addProjectMembers(projectId: string, members: { userId: number, role: string }[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/pm/projects/${projectId}/users`, members);
  }
}
