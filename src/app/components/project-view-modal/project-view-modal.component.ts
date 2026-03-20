import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

interface Task {
  id: number;
  name: string;
  assignee: string;
  startDate: string;
  endDate: string;
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối' | 'Đang thực hiện';
  points: number;
  avgPoints: number;
}

@Component({
  selector: 'app-project-view-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-view-modal.component.html',
  styleUrl: './project-view-modal.component.scss',
})
export class ProjectViewModalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected readonly projectId = signal<string | null>(null);
  protected readonly projectName = signal('Dự Án A');
  protected readonly activeTab = signal('tasks'); // tasks, my-tasks, members, history, details
  
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal('Trạng thái');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly activeDropdownId = signal<number | null>(null);

  protected readonly tasks = signal<Task[]>([
    { id: 1, name: 'Phân tích yêu cầu hệ thống', assignee: 'Nguyễn Văn A', startDate: '15/12/2025', endDate: '20/12/2025', status: 'Chờ duyệt', points: 150, avgPoints: 120 },
    { id: 2, name: 'Thiết kế Database Schema', assignee: 'Trần Thị B', startDate: '21/12/2025', endDate: '25/12/2025', status: 'Đang thực hiện', points: 200, avgPoints: 180 },
    { id: 3, name: 'Thiết kế giao diện (Figma)', assignee: 'Lê Văn C', startDate: '15/12/2025', endDate: '30/12/2025', status: 'Đã duyệt', points: 300, avgPoints: 300 },
    { id: 4, name: 'Cài đặt môi trường Dev', assignee: 'Nguyễn Văn A', startDate: '12/12/2025', endDate: '14/12/2025', status: 'Đã duyệt', points: 50, avgPoints: 50 },
    { id: 5, name: 'Viết API Cơ bản', assignee: 'Phạm Minh D', startDate: '26/12/2025', endDate: '05/01/2026', status: 'Chờ duyệt', points: 250, avgPoints: 200 },
    { id: 6, name: 'Kiểm thử Unit Test', assignee: 'Hoàng Văn E', startDate: '28/12/2025', endDate: '30/12/2025', status: 'Chờ duyệt', points: 100, avgPoints: 100 },
    { id: 7, name: 'Fix bug UI/UX', assignee: 'Lê Văn C', startDate: '01/01/2026', endDate: '05/01/2026', status: 'Chờ duyệt', points: 100, avgPoints: 100 },
    { id: 8, name: 'Deploy môi trường Staging', assignee: 'Nguyễn Văn A', startDate: '06/01/2026', endDate: '08/01/2026', status: 'Chờ duyệt', points: 150, avgPoints: 150 },
    { id: 9, name: 'Viết tài liệu hướng dẫn', assignee: 'Trần Thị B', startDate: '08/01/2026', endDate: '10/01/2026', status: 'Chờ duyệt', points: 80, avgPoints: 80 },
  ]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.projectId.set(id);
  }

  protected goBack(): void {
    this.router.navigate(['/']);
  }

  protected setTab(tab: string): void {
    this.activeTab.set(tab);
  }

  protected toggleDropdown(event: Event, id: number): void {
    event.stopPropagation();
    this.activeDropdownId.set(this.activeDropdownId() === id ? null : id);
  }

  protected viewProject(task: any): void {
    console.log('View task:', task);
  }

  protected editProject(task: any): void {
    console.log('Edit task:', task);
  }

  protected deleteProject(task: any): void {
    console.log('Delete task:', task);
  }

  protected openCreateModal(): void {
    console.log('Open Create Task Modal');
  }

  protected resetFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('Trạng thái');
    this.dateFrom.set('');
    this.dateTo.set('');
  }
}
