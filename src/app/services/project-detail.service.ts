import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { ProjectDetail, Task, TaskFilter, Statistics } from '../models/project-detail.types';

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectDetailService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1';

  /**
   * Lấy thông tin chi tiết dự án
   */
  getProjectDetail(projectId: string): Observable<ProjectDetail | null> {
    return this.http
      .get<ApiResponse<ProjectDetail>>(
        `${this.apiUrl}/project/${projectId}/detail`
      )
      .pipe(
        map(res => res.data),
        catchError(error => {
          console.error("Error fetching project detail:", error)
          return of(null)
        })
      )
  }

  /**
   * Chuyển đổi status sang tiếng Việt
   */
  mapTaskStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'CHUA_DUYET': 'Chưa duyệt',
      'CHO_DUYET': 'Chờ duyệt',
      'DA_DUYET': 'Đã duyệt',
      'CHUA_BAT_DAU': 'Chưa bắt đầu',
      'DANG_THUC_HIEN': 'Đang thực hiện',
      'HOAN_THANH': 'Hoàn thành',
      'QUA_HAN': 'Quá hạn'
    };
    return statusMap[status] || status;
  }

  /**
   * Lấy class CSS cho status badge
   */
  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'CHUA_DUYET': 'bg-gray-200 text-gray-700',
      'CHO_DUYET': 'bg-yellow-100 text-yellow-800',
      'DA_DUYET': 'bg-green-100 text-green-700',
      'CHUA_BAT_DAU': 'bg-gray-200 text-gray-700',
      'DANG_THUC_HIEN': 'bg-blue-100 text-blue-700',
      'HOAN_THANH': 'bg-green-100 text-green-700',
      'QUA_HAN': 'bg-red-100 text-red-700'
    };
    return classMap[status] || 'bg-gray-100 text-gray-600';
  }

  /**
   * Format ngày
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  }

  /** 
   * Format ngày giờ
   */
  formatDateTimeShort(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  }
}
