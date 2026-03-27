import { Component, OnInit, signal, inject, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-project-member-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-member-list.component.html',
  styleUrl: './project-member-list.component.scss'
})
export class ProjectMemberListComponent implements OnInit {
  projectId = input.required<string | number>();
  
  protected readonly members = signal<User[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly searchTerm = signal('');
  
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalPages = signal(0);
  protected readonly totalItems = signal(0);

  private readonly userService = inject(UserService);

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
      this.searchTerm(), 
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
    this.searchTerm.set('');
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

  openAddMemberModal() {
    console.log('Open add member modal');
    // Implementation for later
  }
}
