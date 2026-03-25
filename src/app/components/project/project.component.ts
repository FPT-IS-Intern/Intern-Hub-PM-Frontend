import { Component, signal, computed, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CreateProjectModalComponent } from '../create-project/create-project.component';
import { ProjectApiService } from '../../services/project.service';
import { ProjectListItem } from '../../models/project.types';

// Mock types since services are missing
export interface ProjectDisplay {
  id: number;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  bt: number;
  rt: number;
  memberNumber: number;
}

export type NotificationType = 'success' | 'error' | 'confirm' | 'warning';
export interface NotificationAction {
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: () => void;
}

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateProjectModalComponent],
  templateUrl: './project.component.html',
  styleUrl: './project.component.scss',
})
export class ProjectComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private projectService = inject(ProjectApiService);
  private destroy$ = new Subject<void>();

  // Mock address for UI
  userAddress = '0x1234...5678';

  // Signals - State
  searchTerm = signal('');
  statusFilter = signal('Trạng thái');
  dateFrom = signal('');
  dateTo = signal('');
  currentPage = signal(0);
  pageSize = signal(10);

  // Projects data
  projects = signal<ProjectDisplay[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  isLoadingProjects = signal(false);

  // Token balances
  tokenBalances = signal({ bt: '1000', rt: '500' });
  walletAddress = signal('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
  isLoadingBalances = signal(false);

  // Modal
  createModalOpen = signal(false);

  // Dropdown state
  activeDropdownId = signal<number | null>(null);

  @HostListener('document:click')
  onDocumentClick() {
    this.activeDropdownId.set(null);
  }

  toggleDropdown(event: Event, projectId: number) {
    event.stopPropagation();
    this.activeDropdownId.update(id => id === projectId ? null : projectId);
  }

  // Notification Modal State
  notificationOpen = signal(false);
  notificationType = signal<NotificationType>('success');
  notificationTitle = signal('');
  notificationDescription = signal('');
  notificationActions = signal<NotificationAction[]>([]);

  displayRange = computed(() => {
    if (this.totalElements() === 0) return '0-0';
    const start = (this.currentPage() * this.pageSize()) + 1;
    const end = Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements());
    return `${start}-${end}`;
  });

  stats = computed(() => {
    return [
      { label: 'TỔNG SỐ DỰ ÁN', value: this.totalElements(), icon: '📄', color: 'stat-total', type: 'static' },
      { label: 'DỰ ÁN ĐANG THỰC HIỆN', value: 8, icon: '💻', color: 'stat-ongoing', type: 'static' },
      { label: 'DỰ ÁN HOÀN THÀNH', value: 10, icon: '✅', color: 'stat-completed', type: 'static' },
      { label: 'DỰ ÁN QUÁ HẠN', value: 3, icon: '📋', color: 'stat-overdue', type: 'static' }
    ];
  });

  ngOnInit() {
    this.loadProjects();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProjects() {
    this.isLoadingProjects.set(true);

    this.projectService.getProjects(this.currentPage(), this.pageSize())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.debug('[ProjectComponent.loadProjects] Response:', response);

          // Relaxed check: support both object status and numeric status
          const isSuccess = response.status?.code === 'success' ||
            response.status?.code === 'SUCCESS' ||
            response.status === 200 ||
            response.status === 'success';

          if (isSuccess && response.data) {
            const items = response.data.items || [];
            const mappedProjects = items.map((item: any) => this.mapToDisplay(item));
            this.projects.set(mappedProjects);

            // Fallback for pagination fields
            const total = response.data.totalItems ?? response.data.totalElements ?? items.length;
            this.totalElements.set(total);
            this.totalPages.set(response.data.totalPages || 1);

            console.debug('[ProjectComponent.loadProjects] Mapped:', mappedProjects.length, 'projects. Total elements:', total);
          } else {
            console.warn('[ProjectComponent.loadProjects] Response status not success or no data', response);
          }
          this.isLoadingProjects.set(false);
        },
        error: (err) => {
          console.error('[ProjectComponent.loadProjects] Error loading projects:', err);
          this.isLoadingProjects.set(false);
        }
      });
  }

  private mapToDisplay(item: ProjectListItem): ProjectDisplay {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      status: this.mapStatus(item.status),
      startDate: this.formatDate(item.startDate),
      endDate: this.formatDate(item.endDate),
      bt: item.budgetToken,
      rt: item.rewardToken,
      memberNumber: 0 // Backend doesn't provide this yet
    };
  }

  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'NOT_STARTED': 'Chưa bắt đầu',
      'IN_PROGRESS': 'Đang thực hiện',
      'COMPLETED': 'Hoàn thành',
      'OVERDUE': 'Quá hạn'
    };
    return statusMap[status] || status;
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  }

  onSearch() {
    this.currentPage.set(0);
    this.loadProjects();
  }

  setPage(page: number) {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadProjects();
    }
  }

  async fetchTokenBalances() {
    this.isLoadingBalances.set(true);
    setTimeout(() => {
      this.tokenBalances.set({ bt: '1200', rt: '600' });
      this.isLoadingBalances.set(false);
    }, 1000);
  }

  formatBalance(balance: string): string {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0';
    if (num === 0) return '0';
    if (num < 0.01) return num.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
    if (num < 1) return num.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  openCreateModal() {
    this.createModalOpen.set(true);
  }

  closeCreateModal() {
    this.createModalOpen.set(false);
  }

  async onProjectSubmitted(formData: any) {
    console.log('Project created:', formData);
    this.loadProjects();
    this.closeCreateModal();
  }

  copyProject(project: ProjectDisplay) {
    console.log('Copy project:', project);
    alert(`Sao chép dự án: ${project.name}`);
  }

  receiveProject(project: ProjectDisplay) {
    alert(`Nhận dự án: ${project.name}`);
  }

  viewProject(project: ProjectDisplay) {
    this.router.navigate(['project-view', project.id]);
  }

  editProject(project: ProjectDisplay) {
    console.log('Edit project:', project);
    alert(`Chỉnh sửa dự án: ${project.name}`);
  }

  deleteProject(project: ProjectDisplay) {
    if (confirm(`Bạn có chắc chắn muốn xóa dự án "${project.name}"?`)) {
      console.log('Delete project:', project);
      this.projects.update(list => list.filter(p => p.id !== project.id));
    }
  }

  async logout() {
    console.log('Logout clicked');
    alert('Đăng xuất thành công (Mock)');
  }
}