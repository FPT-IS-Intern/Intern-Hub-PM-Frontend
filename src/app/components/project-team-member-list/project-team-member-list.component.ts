import { Component, input, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskApiService } from '../../services/task.service';

export interface TeamMember {
  id: number;
  fullName: string;
  email: string;
  status: string;
}

@Component({
  selector: 'app-project-team-member-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-team-member-list.component.html',
  styleUrl: './project-team-member-list.component.scss'
})
export class ProjectTeamMemberListComponent implements OnInit {
  /** ID của team cần load thành viên */
  teamId = input.required<string | number>();

  protected readonly members = signal<TeamMember[]>([]);
  protected readonly isLoading = signal(false);
  protected searchTerm = '';

  private readonly taskService = new (class { })() as any;

  constructor(private _taskService: TaskApiService) {
    this.taskService = _taskService;
    effect(() => {
      if (this.teamId()) {
        this.loadMembers();
      }
    });
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    const id = this.teamId();
    if (!id) return;
    this.isLoading.set(true);
    this.taskService.getTeamMembers(Number(id)).subscribe({
      next: (res: TeamMember[]) => {
        const filtered = this.searchTerm
          ? res.filter(m =>
            m.fullName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            m.email?.toLowerCase().includes(this.searchTerm.toLowerCase())
          )
          : res;
        this.members.set(filtered);
      },
      error: () => this.isLoading.set(false),
      complete: () => this.isLoading.set(false)
    });
  }

  onSearch(): void {
    this.loadMembers();
  }

  onRefresh(): void {
    this.searchTerm = '';
    this.loadMembers();
  }

  getStatusLabel(status: string | undefined): string {
    const map: Record<string, string> = {
      'ACTIVE': 'Đang hoạt động',
      'INACTIVE': 'Không hoạt động',
    };
    return status ? (map[status] ?? status) : '—';
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'INACTIVE': return 'status-inactive';
      default: return 'status-default';
    }
  }
}
