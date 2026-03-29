import { Component, input, output, signal, inject, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskApiService } from '../../../services/task.service';
import { NotificationService } from '../../../services/notification.service';

export interface TaskFormData {
  name: string;
  description: string;
  assigneeId: string;
  rt: number | null;
  startDate: string;
  endDate: string;
  files: File[];
}

type TaskFormErrors = Partial<Record<keyof TaskFormData, string>>;

export interface TeamMemberUser {
  id: string;
  username: string;
  email: string;
}

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-task.component.html',
  styleUrl: './create-task.component.scss',
})
export class CreateTaskComponent implements OnInit {
  /** Truyền vào để component tự load danh sách thành viên & tạo task */
  readonly isOpen = input(false);
  readonly teamId = input<string>('');

  readonly closed = output<void>();
  readonly submitted = output<void>();

  protected readonly Number = Number;

  protected readonly leaderUsers = signal<TeamMemberUser[]>([]);
  protected readonly isLoadingLeaderUsers = signal(false);
  protected readonly formData = signal<TaskFormData>(this.emptyForm());
  protected readonly errors = signal<TaskFormErrors>({});
  protected readonly isSubmitting = signal(false);

  private readonly taskService = inject(TaskApiService);
  private readonly notificationService = inject(NotificationService);

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const tid = this.teamId();
      if (open && tid) {
        this.loadTeamMembers(tid);
      }
      if (!open) {
        this.resetState();
      }
    });
  }

  ngOnInit(): void {}

  // ── Data Loading ────────────────────────────────────────────────────────────
  private loadTeamMembers(teamId: string): void {
    this.isLoadingLeaderUsers.set(true);
    this.taskService.getTeamMembers(Number(teamId)).subscribe({
      next: (res: any[]) => {
        this.leaderUsers.set(
          res.map((m: any) => ({
            id: String(m.userId ?? m.id),
            username: m.fullName ?? m.username ?? 'N/A',
            email: m.email ?? '',
          }))
        );
        this.isLoadingLeaderUsers.set(false);
      },
      error: () => {
        this.leaderUsers.set([]);
        this.isLoadingLeaderUsers.set(false);
      },
    });
  }

  // ── Search filter (client-side) ──────────────────────────────────────────────
  private leaderSearchKeyword = '';

  protected onLeaderSearchChange(event: Event): void {
    this.leaderSearchKeyword = (event.target as HTMLInputElement).value.toLowerCase();
  }

  protected get filteredLeaderUsers(): TeamMemberUser[] {
    const kw = this.leaderSearchKeyword;
    if (!kw) return this.leaderUsers();
    return this.leaderUsers().filter(
      (u) =>
        u.username.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw)
    );
  }

  // ── Form helpers ─────────────────────────────────────────────────────────────
  protected patchForm<K extends keyof TaskFormData>(key: K, value: TaskFormData[K]): void {
    this.formData.update((d) => ({ ...d, [key]: value }));
    this.errors.update((e) => {
      const ne = { ...e };
      delete (ne as any)[key];
      return ne;
    });
  }

  private validateForm(): boolean {
    const d = this.formData();
    const errs: TaskFormErrors = {};

    if (!d.name?.trim()) errs['name'] = 'Vui lòng nhập tên task';
    if (!d.assigneeId) errs['assigneeId'] = 'Vui lòng chọn người nhận';
    if (d.rt === null || d.rt === undefined) errs['rt'] = 'Vui lòng nhập điểm thưởng';
    else if (d.rt < 0) errs['rt'] = 'Điểm thưởng không được nhỏ hơn 0';
    if (!d.startDate) errs['startDate'] = 'Vui lòng chọn ngày bắt đầu';
    if (!d.endDate) errs['endDate'] = 'Vui lòng chọn ngày kết thúc';
    if (d.startDate && d.endDate && d.startDate > d.endDate)
      errs['endDate'] = 'Ngày kết thúc phải sau ngày bắt đầu';

    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  protected handleSubmit(): void {
    if (!this.validateForm()) return;

    const tid = this.teamId();
    if (!tid) {
      this.notificationService.showError('Lỗi', 'Không tìm thấy team ID');
      return;
    }

    this.isSubmitting.set(true);
    const d = this.formData();

    this.taskService
      .createTask(tid, {
        name: d.name.trim(),
        description: d.description.trim(),
        assigneeId: d.assigneeId,
        rewardToken: Number(d.rt),
        startDate: d.startDate ? `${d.startDate}T00:00:00` : '',
        endDate: d.endDate ? `${d.endDate}T23:59:59` : '',
      }, d.files)
      .subscribe({
        next: (res) => {
          if (res.status?.code === 'success') {
            this.notificationService.showSuccess('Thành công', 'Task đã được tạo thành công!');
            this.submitted.emit();
            this.handleClose();
          } else {
            this.notificationService.showError('Lỗi', res.status?.message || 'Không thể tạo task');
          }
          this.isSubmitting.set(false);
        },
        error: (err) => {
          const msg = err.error?.status?.message || 'Không thể tạo task';
          this.notificationService.showError('Lỗi', msg);
          this.isSubmitting.set(false);
        },
      });
  }

  // ── File handling ─────────────────────────────────────────────────────────────
  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input?.files?.length) return;
    const newFiles = Array.from(input.files);
    this.formData.update((d) => ({ ...d, files: [...d.files, ...newFiles] }));
    input.value = '';
  }

  protected removeFile(index: number): void {
    this.formData.update((d) => ({
      ...d,
      files: d.files.filter((_, i) => i !== index),
    }));
  }

  protected handleNumberKeydown(event: KeyboardEvent): void {
    if (['-', 'e', 'E', '+'].includes(event.key)) event.preventDefault();
  }

  // ── Open / Close ──────────────────────────────────────────────────────────────
  protected handleClose(): void {
    this.resetState();
    this.closed.emit();
  }

  private resetState(): void {
    this.formData.set(this.emptyForm());
    this.errors.set({});
    this.isSubmitting.set(false);
    this.leaderSearchKeyword = '';
  }

  private emptyForm(): TaskFormData {
    return {
      name: '',
      description: '',
      assigneeId: '',
      rt: null,
      startDate: '',
      endDate: '',
      files: [],
    };
  }
}
