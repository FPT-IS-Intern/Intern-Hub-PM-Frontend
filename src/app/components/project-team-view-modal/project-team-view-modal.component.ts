import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TaskApiService, TaskResponse, TaskStatistics } from '../../services/task.service';
import { TeamApiService } from '../../services/team.service';
import { NotificationService } from '../../services/notification.service';
import { ProjectTeamDetailComponent } from '../project-team-detail/project-team-detail.component';

interface TaskTableItem {
  id: number;
  name: string;
  description: string;
  assigneeId: number;
  leadName?: string;
  status: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-project-team-view-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectTeamDetailComponent],
  templateUrl: './project-team-view-modal.component.html',
  styleUrl: './project-team-view-modal.component.scss'
})
export class ProjectTeamViewModalComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskService = inject(TaskApiService);
  private teamService = inject(TeamApiService);
  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  // Signals for state
  protected readonly teamId = signal<string | null>(null);
  protected readonly projectId = signal<string | null>(null);
  protected readonly teamName = signal('Đang tải...');
  protected readonly budgetToken = signal(0);
  protected readonly rewardToken = signal(0);
  protected readonly dateRange = signal('Chưa xác định');

  protected readonly activeTab = signal('tasks');
  protected readonly taskList = signal<TaskTableItem[]>([]);
  protected readonly taskStats = signal<TaskStatistics | null>(null);
  protected readonly teamMembers = signal<any[]>([]);
  protected readonly teamData = signal<any>(null);

  // Filters & Pagination
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal('Trạng thái');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly isLoading = signal(false);
  protected readonly currentPage = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly totalItems = signal(0);
  protected readonly activeDropdownId = signal<number | null>(null);

  protected readonly stats = computed(() => {
    const s = this.taskStats();
    return [
      { label: 'TỔNG CÔNG VIỆC', value: s?.totalTasks ?? 0, color: 'stat-total' },
      { label: 'TASK ĐANG THỰC HIỆN', value: s?.inProgressTasks ?? 0, color: 'stat-ongoing' },
      { label: 'TASK CHỜ DUYỆT', value: s?.pendingReviewTasks ?? 0, color: 'stat-ongoing' },
      { label: 'TASK HOÀN THÀNH', value: s?.completedTasks ?? 0, color: 'stat-completed' },
      { label: 'TASK TRỄ HẠN', value: s?.overdueTasks ?? 0, color: 'stat-overdue' }
    ];
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.teamId.set(id);
        this.loadTeamDetails(id);
        this.loadTasks();
        this.loadTaskStats();
      }
    });
  }

  protected loadTeamDetails(id: string): void {
    this.teamService.getTeams(0, 1, { teamId: id }).subscribe({
      next: (res) => {
        // Fallback since getTeams is paginated, usually we'd have a getTeamById
        // But for display we can find it
        if (res.data && res.data.items.length > 0) {
          const team = res.data.items[0];
          this.teamData.set(team);
          this.teamName.set(team.name);
          this.budgetToken.set(team.budgetToken);
          this.rewardToken.set(team.rewardToken);
          this.projectId.set(team.projectId);
          this.dateRange.set(`${new Date(team.startDate).toLocaleDateString('vi-VN')} - ${new Date(team.endDate).toLocaleDateString('vi-VN')}`);
        }
      }
    });
  }

  protected loadTeamMembers(): void {
    const tid = this.teamId();
    if (!tid) return;
    this.isLoading.set(true);
    // Assuming we added getTeamMembers to TaskApiService or a dedicated TeamService
    // I'll add it to TaskApiService for now to keep it combined for this modal
    this.taskService.getTeamMembers(Number(tid)).subscribe({
      next: (res) => {
        this.teamMembers.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  protected loadTasks(): void {
    const tid = this.teamId();
    if (!tid) return;

    this.isLoading.set(true);
    const filter = {
      name: this.searchTerm() || undefined,
      status: this.statusFilter() !== 'Trạng thái' ? this.mapLabelToStatus(this.statusFilter()) : undefined,
      startDate: this.dateFrom() || undefined,
      endDate: this.dateTo() || undefined
    };

    this.taskService.getTasks(tid, this.currentPage(), this.pageSize(), filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.taskList.set(res.data.items.map(t => ({
              id: t.id,
              name: t.name,
              description: t.description,
              assigneeId: t.assigneeId,
              status: t.status,
              startDate: t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : '',
              endDate: t.endDate ? new Date(t.endDate).toLocaleDateString('vi-VN') : ''
            })));
            this.totalItems.set(res.data.totalItems);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }

  protected loadTaskStats(): void {
    const tid = this.teamId();
    if (!tid) return;
    this.taskService.getTaskStatistics(tid).subscribe(res => {
      if (res.data) this.taskStats.set(res.data);
    });
  }

  protected mapStatus(status: string): string {
    const map: any = {
      'NOT_STARTED': 'Chưa bắt đầu',
      'IN_PROGRESS': 'Đang thực hiện',
      'PENDING_REVIEW': 'Chờ duyệt',
      'COMPLETED': 'Hoàn thành',
      'OVERDUE': 'Trễ hạn',
      'NEEDS_REVISION': 'Cần chỉnh sửa',
      'CANCELED': 'Đã hủy'
    };
    return map[status] || status;
  }

  protected getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING_REVIEW': return 'pending';
      case 'COMPLETED': return 'completed';
      case 'OVERDUE': return 'overdue';
      default: return '';
    }
  }

  private mapLabelToStatus(label: string): string | undefined {
    const map: any = {
      'Chưa bắt đầu': 'NOT_STARTED',
      'Đang thực hiện': 'IN_PROGRESS',
      'Chờ duyệt': 'PENDING_REVIEW',
      'Hoàn thành': 'COMPLETED',
      'Trễ hạn': 'OVERDUE',
      'Cần chỉnh sửa': 'NEEDS_REVISION'
    };
    return map[label];
  }

  protected onSearch(val?: string): void {
    if (val !== undefined) this.searchTerm.set(val);
    this.currentPage.set(0);
    this.loadTasks();
  }

  protected resetFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('Trạng thái');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.loadTasks();
  }

  protected changePage(page: number): void {
    this.currentPage.set(page);
    this.loadTasks();
  }

  protected toggleDropdown(event: Event, id: number): void {
    event.stopPropagation();
    this.activeDropdownId.set(this.activeDropdownId() === id ? null : id);
  }

  protected setTab(tab: string): void {
    this.activeTab.set(tab);
    if (tab === 'members') {
      this.loadTeamMembers();
    }
  }

  protected goBack(): void {
    const basePath = window.location.pathname.startsWith('/pm') ? '/pm' : '';
    const pid = this.projectId();
    if (pid) {
      this.router.navigate([`${basePath}/project-view`, pid]);
    } else {
      this.router.navigate([basePath || '/']);
    }
  }

  // Task Actions
  protected viewTask(task: TaskTableItem): void {
    console.log('View task:', task);
  }

  protected editTask(task: TaskTableItem): void {
    console.log('Edit task:', task);
  }

  protected deleteTask(task: TaskTableItem): void {
    console.log('Delete task:', task);
  }

  protected submitTaskAction(task: TaskTableItem): void {
    this.taskService.submitTask(task.id, 'http://example.com/result').subscribe(res => {
        if (res.status.code === 'success') {
            this.notificationService.showSuccess('Thành công', 'Nộp bài thành công!');
            this.loadTasks();
        }
    });
  }

  protected approveTaskAction(task: TaskTableItem): void {
    this.taskService.approveTask(task.id, 'Excellent work!').subscribe(res => {
        if (res.status.code === 'success') {
            this.notificationService.showSuccess('Thành công', 'Đã duyệt task thành công!');
            this.loadTasks();
            this.loadTaskStats();
        }
    });
  }

  protected refuseTaskAction(task: TaskTableItem): void {
    this.taskService.refuseTask(task.id, 'Please fix the formatting.').subscribe(res => {
        if (res.status.code === 'success') {
            this.notificationService.showWarning('Thông tin', 'Đã yêu cầu chỉnh sửa lại.');
            this.loadTasks();
        }
    });
  }

  protected canApprove(task: TaskTableItem): boolean {
    return task.status === 'PENDING_REVIEW';
  }

  protected openCreateModal(): void {
    // Placeholder for Create Task Modal
    this.notificationService.showWarning('Thông báo', 'Tính năng tạo task đang được phát triển.');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
