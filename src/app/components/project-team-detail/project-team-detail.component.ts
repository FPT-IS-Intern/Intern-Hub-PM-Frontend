import { Component, Input, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamApiService, TeamDetail, TeamCharterDocument } from '../../services/team.service';

@Component({
  selector: 'app-project-team-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-team-detail.component.html',
  styleUrl: './project-team-detail.component.scss'
})
export class ProjectTeamDetailComponent implements OnInit {
  @Input() teamId!: string | number;

  team: TeamDetail | null = null;

  private teamService = inject(TeamApiService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (!this.teamId) return;
    this.teamService.getTeamById(this.teamId).subscribe({
      next: (res) => {
        this.team = res.data ?? null;
        this.cdr.markForCheck();
      }
    });
  }

  protected formatDateTimeShort(value: string | number | null | undefined): string {
    if (!value) return 'N/A';
    const d = new Date(
      typeof value === 'number' ? value : value
    );
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  protected getStatusClass(status: string | null | undefined): string {
    switch (status) {
      case 'NOT_STARTED':  return 'not_started';
      case 'IN_PROGRESS':  return 'in_progress';
      case 'COMPLETED':    return 'completed';
      case 'OVERDUE':      return 'overdue';
      default:             return '';
    }
  }

  protected mapStatus(status: string | null | undefined): string {
    const map: Record<string, string> = {
      'NOT_STARTED': 'Chưa bắt đầu',
      'IN_PROGRESS': 'Đang thực hiện',
      'COMPLETED':   'Hoàn thành',
      'OVERDUE':     'Trễ hạn',
    };
    return status ? (map[status] ?? status) : '—';
  }

  protected getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':  return 'pdf';
      case 'doc':
      case 'docx': return 'word';
      case 'xls':
      case 'xlsx': return 'excel';
      case 'ppt':
      case 'pptx': return 'powerpoint';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':  return 'image';
      default:     return 'file';
    }
  }

  protected getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() || 'FILE';
  }

  protected downloadDocument(doc: TeamCharterDocument): void {
    if (!doc.fileUrl) return;
    window.open(doc.fileUrl, '_blank');
  }
}
