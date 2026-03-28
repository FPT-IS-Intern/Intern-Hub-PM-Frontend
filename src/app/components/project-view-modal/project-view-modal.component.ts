import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ProjectDetailComponent } from '../project-detail/project-detail.component';
import { CreateProjectTeamComponent } from '../create-project-team/create-project-team.component';
import { ProjectMemberListComponent } from '../project-member-list/project-member-list.component';
import { TeamApiService, TeamStatistics } from '../../services/team.service';
import { Subject, takeUntil } from 'rxjs';

interface Task {
  id: string;
  name: string;
  description: string;
  assignee: string;
  leadName?: string;
  memberCount?: number;
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
  private teamService = inject(TeamApiService);
  private destroy$ = new Subject<void>();

  protected readonly projectId = signal<string | null>(null);
  protected readonly projectName = signal('Đang tải...');
  protected readonly bt = signal<number>(0);
  protected readonly rt = signal<number>(0);
  protected readonly dateRange = signal<string>('Chưa xác định');
  protected readonly projectOwnerId = signal<string | null>(null);

  protected readonly activeTab = signal('tasks'); // tasks, my-tasks, members, history, details

  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal('Trạng thái');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly activeDropdownId = signal<string | null>(null);

  protected readonly teamStats = signal<TeamStatistics | null>(null);

  protected readonly createTeamModalOpen = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly currentPage = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly totalItems = signal(0);

  protected readonly stats = computed(() => {
    const s = this.teamStats();
    return [
      { label: 'TỔNG DỰ ÁN TEAM', value: s?.totalTeams ?? 0, icon: '📄', color: 'stat-total', type: 'static' },
      { label: 'DỰ ÁN TEAM CHƯA BẮT ĐẦU', value: s?.notStartedTeams ?? 0, icon: '💻', color: 'stat-ongoing', type: 'static' },
      { label: 'DỰ ÁN TEAM ĐANG THỰC HIỆN', value: s?.inProgressTeams ?? 0, icon: '💻', color: 'stat-ongoing', type: 'static' },
      { label: 'DỰ ÁN TEAM HOÀN THÀNH', value: s?.completedTeams ?? 0, icon: '✅', color: 'stat-completed', type: 'static' },
      { label: 'DỰ ÁN TEAM QUÁ HẠN', value: s?.overdueTeams ?? 0, icon: '📋', color: 'stat-overdue', type: 'static' }
    ];
  });

  protected readonly tasks = signal<Task[]>([]);

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
      this.projectOwnerId.set(p.assigneeId || null);
    } else {
      this.projectName.set(`Dự án ${id}`);
    }

    this.loadTeams();
    this.loadTeamStats();
  }

  protected loadTeamStats(): void {
    const pid = this.projectId();
    this.teamService.getTeamStatistics(pid || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status?.code === 'success' || response.data) {
            this.teamStats.set(response.data || (response as any));
          }
        },
        error: (err) => console.error('Lỗi load thống kê team:', err)
      });
  }

  protected loadTeams(): void {
    const pid = this.projectId();
    if (!pid) return;

    this.isLoading.set(true);
    const filter = {
      projectId: pid,
      name: this.searchTerm() || undefined,
      status: this.statusFilter() !== 'Trạng thái' ? this.mapLabelToStatus(this.statusFilter()) : undefined,
      startDate: this.dateFrom() || undefined,
      endDate: this.dateTo() || undefined
    };

    this.teamService.getTeams(this.currentPage(), this.pageSize(), filter).subscribe({
      next: (response) => {
        if (response.status.code === 'success' && response.data) {
          const mappedTasks: Task[] = response.data.items.map((item: any) => ({
            id: String(item.id),
            name: item.name,
            description: item.description,
            assignee: item.leadName || `ID: ${item.assigneeId}`,
            leadName: item.leadName,
            memberCount: item.memberCount || 0,
            startDate: item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '',
            endDate: item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN') : '',
            status: this.mapStatus(item.status),
            points: item.budgetToken || 0,
            avgPoints: item.rewardToken || 0
          }));
          this.tasks.set(mappedTasks);
          this.totalItems.set(response.data.totalItems);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi load danh sách team:', err);
        this.isLoading.set(false);
      }
    });
  }

  private mapStatus(status: string): any {
    switch (status) {
      case 'NOT_STARTED': return 'Chưa bắt đầu';
      case 'IN_PROGRESS': return 'Đang thực hiện';
      case 'OVERDUE': return 'Trễ hạn';
      case 'NEEDS_REVISION': return 'Cần chỉnh sửa';
      case 'PENDING_REVIEW': return 'Chờ duyệt';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELED': return 'Đã hủy';
      default: return status;
    }
  }

  private mapLabelToStatus(label: string): string | undefined {
    switch (label) {
      case 'Chưa bắt đầu': return 'NOT_STARTED';
      case 'Đang thực hiện': return 'IN_PROGRESS';
      case 'Trễ hạn': return 'OVERDUE';
      case 'Cần chỉnh sửa': return 'NEEDS_REVISION';
      case 'Chờ duyệt': return 'PENDING_REVIEW';
      case 'Hoàn thành': return 'COMPLETED';
      case 'Đã hủy': return 'CANCELED';
      default: return undefined;
    }
  }

  protected goBack(): void {
    this.router.navigate(['/pm']);
  }

  protected setTab(tab: string): void {
    this.activeTab.set(tab);
    if (tab === 'tasks') {
      this.loadTeams();
      this.loadTeamStats();
    }
  }

  protected toggleDropdown(event: Event, id: string): void {
    event.stopPropagation();
    this.activeDropdownId.set(this.activeDropdownId() === id ? null : id);
  }

  protected viewProject(task: any): void {
    this.router.navigate(['/project-team-view', task.id]);
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
    this.loadTeams();
  }

  protected resetFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('Trạng thái');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.loadTeams();
  }

  protected onTeamSearch(value?: string): void {
    if (value !== undefined) {
      this.searchTerm.set(value);
    }
    this.currentPage.set(0);
    this.loadTeams();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
