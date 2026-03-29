import {
  Component, OnInit, signal, inject, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskApiService, TaskResponse } from '../../../services/task.service';
import { NotificationService } from '../../../services/notification.service';

interface SubmitFormData {
  deliverableDescription: string;
  deliverableLink: string;
  files: File[];
}

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
})
export class TaskDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskService = inject(TaskApiService);
  private notificationService = inject(NotificationService);

  protected readonly task = signal<TaskResponse | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly submitForm = signal<SubmitFormData>({
    deliverableDescription: '',
    deliverableLink: '',
    files: [],
  });

  // Alias for HTML compatibility (uses "team" binding)
  protected get team() { return this.task(); }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.taskService.getTask(Number(id)).subscribe({
        next: (res) => {
          if (res.status?.code === 'success') this.task.set(res.data);
        },
        error: () => this.notificationService.showError('Lỗi', 'Không thể tải chi tiết task'),
      });
    }
  }

  protected goBack(): void {
    this.router.navigate(['/']);
  }

  // ── Submit form helpers ──────────────────────────────────────────────────────
  protected patchSubmit<K extends keyof SubmitFormData>(key: K, value: SubmitFormData[K]): void {
    this.submitForm.update(f => ({ ...f, [key]: value }));
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input?.files?.length) return;
    const newFiles = Array.from(input.files);
    this.submitForm.update(f => ({ ...f, files: [...f.files, ...newFiles] }));
    input.value = '';
  }

  protected removeFile(index: number): void {
    this.submitForm.update(f => ({
      ...f,
      files: f.files.filter((_, i) => i !== index),
    }));
  }

  protected canSubmit(): boolean {
    const t = this.task();
    if (!t) return false;
    return t.status === 'NOT_STARTED' || t.status === 'IN_PROGRESS' || t.status === 'NEEDS_REVISION';
  }

  protected handleSubmit(): void {
    const t = this.task();
    if (!t) return;

    const f = this.submitForm();
    const hasContent = f.deliverableDescription.trim() || f.deliverableLink.trim() || f.files.length > 0;
    if (!hasContent) {
      this.notificationService.showError('Lỗi', 'Vui lòng điền mô tả, link kết quả hoặc đính kèm file');
      return;
    }

    this.isSubmitting.set(true);
    this.taskService.submitTask(t.id, f.deliverableDescription.trim() || undefined, f.deliverableLink.trim() || undefined, f.files)
      .subscribe({
        next: (res) => {
          if (res.status?.code === 'success') {
            this.notificationService.showSuccess('Thành công', 'Nộp bài thành công! Task đang chờ duyệt.');
            this.task.set(res.data);
            this.submitForm.set({ deliverableDescription: '', deliverableLink: '', files: [] });
          } else {
            this.notificationService.showError('Lỗi', res.status?.message || 'Không thể nộp bài');
          }
          this.isSubmitting.set(false);
        },
        error: (err) => {
          const msg = err.error?.status?.message || 'Không thể nộp bài';
          this.notificationService.showError('Lỗi', msg);
          this.isSubmitting.set(false);
        },
      });
  }

  // ── UI helpers ────────────────────────────────────────────────────────────────
  protected getStatusClass(status: string): string {
    const map: Record<string, string> = {
      NOT_STARTED: 'status-not-started',
      IN_PROGRESS: 'status-in-progress',
      PENDING_REVIEW: 'status-pending',
      COMPLETED: 'status-completed',
      OVERDUE: 'status-overdue',
      NEEDS_REVISION: 'status-revision',
      CANCELED: 'status-canceled',
    };
    return map[status] ?? '';
  }

  protected mapStatus(status: string): string {
    const map: Record<string, string> = {
      NOT_STARTED: 'Chưa bắt đầu',
      IN_PROGRESS: 'Đang thực hiện',
      PENDING_REVIEW: 'Chờ duyệt',
      COMPLETED: 'Hoàn thành',
      OVERDUE: 'Trễ hạn',
      NEEDS_REVISION: 'Cần chỉnh sửa',
      CANCELED: 'Đã hủy',
    };
    return map[status] ?? status;
  }

  protected formatDateTimeShort(dt?: string | null): string {
    if (!dt) return 'N/A';
    const d = new Date(dt);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  protected getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() ?? 'FILE';
  }

  protected getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    const iconMap: Record<string, string> = {
      pdf: 'icon-pdf', doc: 'icon-doc', docx: 'icon-doc',
      xls: 'icon-xls', xlsx: 'icon-xls', png: 'icon-img',
      jpg: 'icon-img', jpeg: 'icon-img', zip: 'icon-zip',
    };
    return iconMap[ext] ?? 'icon-file';
  }

  protected downloadDocument(doc: any): void {
    if (doc?.fileUrl) window.open(doc.fileUrl, '_blank');
  }
}
