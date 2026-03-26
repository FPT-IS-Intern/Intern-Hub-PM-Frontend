import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ProjectDetailComponent } from '../project-detail/project-detail.component';
import { CreateProjectTeamComponent } from '../create-project-team/create-project-team.component';
import { ProjectMemberListComponent } from '../project-member-list/project-member-list.component';

interface Task {
  id: number;
  name: string;
  description: string;
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
  imports: [CommonModule, FormsModule, ProjectDetailComponent, CreateProjectTeamComponent, ProjectMemberListComponent],
  templateUrl: './project-view-modal.component.html',
  styleUrl: './project-view-modal.component.scss',
})
export class ProjectViewModalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected readonly projectId = signal<string | null>(null);
  protected readonly projectName = signal('Đang tải...');
  protected readonly bt = signal<number>(0);
  protected readonly rt = signal<number>(0);
  protected readonly dateRange = signal<string>('Chưa xác định');

  protected readonly activeTab = signal('tasks'); // tasks, my-tasks, members, history, details

  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal('Trạng thái');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly activeDropdownId = signal<number | null>(null);

  protected readonly createTeamModalOpen = signal(false);

  protected readonly stats = computed(() => {
    const allTasks = this.tasks();
    return [
      { label: 'TỔNG DỰ ÁN TEAM', value: 3, icon: '📄', color: 'stat-total', type: 'static' },
      { label: 'DỰ ÁN TEAM CHƯA BẮT ĐẦU', value: allTasks.filter(t => t.status === 'Chờ duyệt').length, icon: '💻', color: 'stat-ongoing', type: 'static' },
      { label: 'DỰA ÁN TEAM ĐANG THỰC HIỆN', value: allTasks.filter(t => t.status === 'Đang thực hiện').length, icon: '💻', color: 'stat-ongoing', type: 'static' },
      { label: 'DỰ ÁN TEAM HOÀN THÀNH', value: allTasks.filter(t => t.status === 'Đã duyệt').length, icon: '✅', color: 'stat-completed', type: 'static' },
      { label: 'DỰ ÁN TEAM QUÁ HẠN', value: allTasks.filter(t => t.status === 'Từ chối').length, icon: '📋', color: 'stat-overdue', type: 'static' }
    ];
  });

  protected readonly tasks = signal<Task[]>([
    { id: 1, name: 'Phân tích yêu cầu hệ thống', description: 'Mô tả phân tích yêu cầu', assignee: 'Nguyễn Văn A', startDate: '15/12/2025', endDate: '20/12/2025', status: 'Chờ duyệt', points: 150, avgPoints: 120 },
    { id: 2, name: 'Thiết kế Database Schema', description: 'Mô tả thiết kế database', assignee: 'Trần Thị B', startDate: '21/12/2025', endDate: '25/12/2025', status: 'Đang thực hiện', points: 200, avgPoints: 180 },
    { id: 3, name: 'Thiết kế giao diện (Figma)', description: 'Mô tả thiết kế Figma', assignee: 'Lê Văn C', startDate: '15/12/2025', endDate: '30/12/2025', status: 'Đã duyệt', points: 300, avgPoints: 300 },
    { id: 4, name: 'Cài đặt môi trường Dev', description: 'Mô tả cài đặt môi trường', assignee: 'Nguyễn Văn A', startDate: '12/12/2025', endDate: '14/12/2025', status: 'Đã duyệt', points: 50, avgPoints: 50 },
    { id: 5, name: 'Viết API Cơ bản', description: 'Mô tả viết API', assignee: 'Phạm Minh D', startDate: '26/12/2025', endDate: '05/01/2026', status: 'Chờ duyệt', points: 250, avgPoints: 200 },
    { id: 6, name: 'Kiểm thử Unit Test', description: 'Mô tả kiểm thử', assignee: 'Hoàng Văn E', startDate: '28/12/2025', endDate: '30/12/2025', status: 'Chờ duyệt', points: 100, avgPoints: 100 },
    { id: 7, name: 'Fix bug UI/UX', description: 'Mô tả fix bug', assignee: 'Lê Văn C', startDate: '01/01/2026', endDate: '05/01/2026', status: 'Chờ duyệt', points: 100, avgPoints: 100 },
    { id: 8, name: 'Deploy môi trường Staging', description: 'Mô tả deploy', assignee: 'Nguyễn Văn A', startDate: '06/01/2026', endDate: '08/01/2026', status: 'Chờ duyệt', points: 150, avgPoints: 150 },
    { id: 9, name: 'Viết tài liệu hướng dẫn', description: 'Mô tả viết tài liệu', assignee: 'Trần Thị B', startDate: '08/01/2026', endDate: '10/01/2026', status: 'Chờ duyệt', points: 80, avgPoints: 80 },
  ]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.projectId.set(id);

    const state = history.state as { project?: any };
    if (state && state.project) {
      const p = state.project;
      this.projectName.set(p.name || `Dự án ${id}`);
      this.bt.set(p.bt || 0);
      this.rt.set(p.rt || 0);
      this.dateRange.set(`${p.startDate || ''} - ${p.endDate || ''}`);
    } else {
      this.projectName.set(`Dự án ${id}`);
    }
  }

  protected goBack(): void {
    this.router.navigate(['/pm']);
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
    this.createTeamModalOpen.set(true);
  }

  protected closeCreateModal(): void {
    this.createTeamModalOpen.set(false);
  }

  protected onTeamSubmitted(data: any): void {
    console.log('Project Team submitted:', data);
    // TODO: Connect to backend API when available
  }

  protected resetFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('Trạng thái');
    this.dateFrom.set('');
    this.dateTo.set('');
  }
}
