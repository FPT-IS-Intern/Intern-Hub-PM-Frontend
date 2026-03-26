import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, PaginatedData } from '../models/common.types';

export interface User {
  id: number;
  username: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
  position?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pm/users`;

  getUsers(keyword: string = '', page: number = 0, size: number = 20): Observable<ApiResponse<User[]>> {
    const body = {
      keyword: keyword,
      sysStatuses: [],
      roles: [],
      positions: []
    };

    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    return this.http.post<ApiResponse<PaginatedData<any>>>(`${this.apiUrl}/filter`, body, { params })
      .pipe(
        map(response => ({
          ...response,
          data: response.data.items.map(item => ({
            id: item.userId,
            username: item.fullName,
            email: item.email,
            avatarUrl: item.avatarUrl,
            role: item.role,
            position: item.position
          }))
        }))
      );
  }
}
