import { Component, OnInit, signal, inject, input, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { AddMemberModalComponent, AddMemberResult } from '../add-member-project/add-member-project';

@Component({
  selector: 'app-project-member-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AddMemberModalComponent],
  templateUrl: './project-member-list.component.html',
  styleUrl: './project-member-list.component.scss'
})
export class ProjectMemberListComponent implements OnInit {
  projectId = input.required<string>();
  projectOwnerId = input<string | null>(null);
  
  protected readonly members = signal<User[]>([]);
  protected readonly isLoading = signal(false);
  protected searchTerm = '';
  
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalPages = signal(0);
  protected readonly totalItems = signal(0);
  
  protected readonly existingMemberIds = computed(() => 
    this.members().map(m => m.id)
  );

  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);

  constructor() {
    // Reload when projectId changes
    effect(() => {
      if (this.projectId()) {
        this.loadMembers();
      }
    });
  }

  ngOnInit() {
    this.loadMembers();
  }

  loadMembers() {
    const id = this.projectId();
    if (!id) return;

    this.isLoading.set(true);
    this.userService.searchProjectMembers(
      id, 
      this.searchTerm, 
      this.currentPage() - 1, 
      this.pageSize()
    ).subscribe({
      next: (res) => {
        const paginatedData = res.data;
        this.members.set(paginatedData?.items || []);
        this.totalItems.set(paginatedData?.totalItems || 0);
        this.totalPages.set(paginatedData?.totalPages || 0);
      },
      error: (err) => {
        console.error('Error loading members:', err);
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadMembers();
  }

  onRefresh() {
    this.searchTerm = '';
    this.currentPage.set(1);
    this.loadMembers();
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadMembers();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadMembers();
    }
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadMembers();
  }

  isAddMemberModalOpen = signal(false);

  openAddMemberModal() {
    this.isAddMemberModalOpen.set(true);
  }

  closeAddMemberModal() {
    this.isAddMemberModalOpen.set(false);
  }

  handleSaveMember(result: AddMemberResult) {
    console.log('Saved members:', result);
    this.notificationService.showSuccess('Thành công', 'Tính năng phân công đang được phát triển');
    this.isAddMemberModalOpen.set(false);
    this.loadMembers();
  }

  removeMember(memberId: string) {
    if (confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi dự án?')) {
      // Logic xóa thành viên (thường gọi qua ProjectService hoặc tương tự)
      console.log('Remove member:', memberId);
      // Giả sử có api xóa ở backend, hiện tại tôi chỉ log
      this.notificationService.showWarning('Thông báo', 'Tính năng xóa thành viên đang được phát triển');
    }
  }

  getRoleLabel(role: string | undefined): string {
    if (!role) return 'N/A';
    switch (role.toUpperCase()) {
      case 'PROJECT_MANAGER': return 'Project Manager';
      case 'BUSINESS_ANALYST': return 'BA';
      case 'DESIGNER': return 'Designer';
      case 'DEVELOPER': return 'Developer';
      case 'TESTER': return 'Tester';
      default: return role;
    }
  }

  getRoleClass(role: string | undefined): string {
    if (!role) return 'role-default';
    switch (role.toUpperCase()) {
      case 'PROJECT_MANAGER': return 'role-pm';
      case 'BUSINESS_ANALYST': return 'role-ba';
      case 'DESIGNER': return 'role-designer';
      case 'DEVELOPER': return 'role-dev';
      case 'TESTER': return 'role-tester';
      default: return 'role-default';
    }
  }
}
