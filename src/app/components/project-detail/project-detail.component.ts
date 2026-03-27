// import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { Component, OnInit, inject } from '@angular/core';
import { ProjectDetailService } from '../../services/project-detail.service';
import { ProjectDetail } from '../../models/project-detail.types';
import { CommonModule } from '@angular/common';
import { Input } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
  @Input() projectId!: string;
  project: ProjectDetail | null = null;
  
  private projectService = inject(ProjectDetailService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (!this.projectId) return;

    this.projectService.getProjectDetail(this.projectId)
      .subscribe((data: ProjectDetail | null) => {
        this.project = data;
        this.cdr.markForCheck();
      });
  }

  protected formatDate(date: string | number): string {
    return this.projectService.formatDate(date);
  }

  protected formatDateTimeShort(date: string | number): string {
    return this.projectService.formatDateTimeShort(date);
  }

  protected getStatusClass(status: string): string {
    return this.projectService.getStatusClass(status);
  }

  protected mapStatus(status: string): string {
    return this.projectService.mapTaskStatus(status);
  }


}