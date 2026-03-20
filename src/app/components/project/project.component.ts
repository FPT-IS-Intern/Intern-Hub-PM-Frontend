import { Component, signal, computed, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { CreateProjectModalComponent } from '../create-project/create-project.component';

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
  totalElements = signal(72); // Matching image
  totalPages = signal(1);
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
    const start = (this.currentPage() * this.pageSize()) + 1;
    const end = Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements());
    return `${start}-${end}`;
  });

  stats = computed(() => {
    // ... rest of stats
    // Stat values matching the image
    return [
      { label: 'TỔNG SỐ DỰ ÁN', value: 72, icon: '📄', color: 'stat-total', type: 'static' },
      { label: 'DỰ ÁN ĐANG THỰC HIỆN', value: 8, icon: '💻', color: 'stat-ongoing', type: 'static'},
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
    
    // Mocking project data (multiplying to fill the screen better)
    const baseProjects: ProjectDisplay[] = [
      { id: 1, name: 'Tên Dự Án ACB', description: 'Dự án kiểm tra UIUX của ACB', status: 'Đang thực hiện', startDate: '10/01/2026', endDate: '20/01/2026', bt: 5000, rt: 1000, memberNumber: 10 },
      { id: 2, name: 'Tên Dự Án HDB', description: 'Dự án kiểm tra UIUX của HDB', status: 'Đang thực hiện', startDate: '10/01/2026', endDate: '20/01/2026', bt: 5000, rt: 1000, memberNumber: 10 },
      { id: 3, name: 'Tên Dự Án VIB', description: 'Dự án kiểm tra UIUX của VIB', status: 'Đang thực hiện', startDate: '10/01/2026', endDate: '20/01/2026', bt: 5000, rt: 1000, memberNumber: 10 },
      { id: 4, name: 'Tên Dự Án MSB', description: 'Dự án kiểm tra UIUX của MSB', status: 'Đang thực hiện', startDate: '10/01/2026', endDate: '20/01/2026', bt: 5000, rt: 1000, memberNumber: 10 },
      { id: 5, name: 'Tên Dự Án MB', description: 'Dự án kiểm tra UIUX của MB', status: 'Đang thực hiện', startDate: '10/01/2026', endDate: '20/01/2026', bt: 5000, rt: 1000, memberNumber: 10 },
      { id: 6, name: 'Tên Dự Án TPB', description: 'Dự án kiểm tra UIUX của TPB', status: 'Đang thực hiện', startDate: '10/01/2026', endDate: '20/01/2026', bt: 5000, rt: 1000, memberNumber: 10 },
      { id: 7, name: 'Tên Dự Án VPB', description: 'Dự án kiểm tra UIUX của VPB', status: 'Đang thực hiện', startDate: '10/01/2026', endDate: '20/01/2026', bt: 5000, rt: 1000, memberNumber: 10 },
      { id: 8, name: 'Tên Dự Án OCB', description: 'Dự án kiểm tra UIUX của OCB', status: 'Đang thực hiện', startDate: '10/01/2026', endDate: '20/01/2026', bt: 5000, rt: 1000, memberNumber: 10 },
      { id: 9, name: 'Tên Dự Án VIB', description: 'Dự án kiểm tra UIUX của VIB', status: 'Đang thực hiện', startDate: '10/01/2026', endDate: '20/01/2026', bt: 5000, rt: 1000, memberNumber: 10 },
      { id: 10, name: 'Tên Dự Án HDB', description: 'Dự án kiểm tra UIUX của HDB', status: 'Đang thực hiện', startDate: '10/01/2026', endDate: '20/01/2026', bt: 5000, rt: 1000, memberNumber: 10 }
    ];

    setTimeout(() => {
      this.projects.set(baseProjects);
      this.totalElements.set(72);
      this.totalPages.set(8);
      this.isLoadingProjects.set(false);
    }, 500);
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