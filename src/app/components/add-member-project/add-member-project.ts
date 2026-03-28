import { Component, EventEmitter, Input, OnInit, Output, HostListener, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface MemberOption {
  id: number;
  name: string;
}

export interface AddedMember {
  id: string;
  name: string;
  position: string;
}

export interface AddMemberFormData {
  projectName: string;
  description: string;
  selectedPosition: string;
  selectedMemberIds: string[];
}

export interface AddMemberResult {
  projectName: string;
  description: string;
  members: AddedMember[];
}

import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-add-member-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-member-project.html',
  styleUrls: ['./add-member-project.scss'],
})
export class AddMemberModalComponent implements OnInit {
  /** Pre-fill project name from parent */
  @Input() initialProjectName: string = 'Dự Án A';

  /** Project ID for context */
  @Input() projectId: string = '';

  /** List of existing member IDs to filter out */
  @Input() existingMemberIds: string[] = [];

  /** Project Owner ID to filter out */
  @Input() projectOwnerId: string | null = null;

  /** Emit when user clicks Lưu */
  @Output() saved = new EventEmitter<AddMemberResult>();

  /** Emit when modal should close */
  @Output() closed = new EventEmitter<void>();

  // ── Dropdown state ──────────────────────────────────────────────────────────
  positionDropdownOpen = false;
  memberDropdownOpen = false;

  // ── Options ─────────────────────────────────────────────────────────────────
  positionOptions: string[] = [
    'Developer',
    'Designer',
    'Project Manager',
    'Tester',
    'Business Analyst',
  ];

  memberOptions: { id: string, name: string }[] = [];
  
  private userService = inject(UserService);
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  isSearching = false;

  // ── Form Data ────────────────────────────────────────────────────────────────
  formData: AddMemberFormData = {
    projectName: '',
    description: '',
    selectedPosition: '',
    selectedMemberIds: [],
  };

  // ── Added Members Table ──────────────────────────────────────────────────────
  addedMembers: AddedMember[] = [];

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.formData.projectName = this.initialProjectName;
    
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(keyword => {
      this.performSearch(keyword);
    });
  }

  isSubmitting() {
    return false; // Will be handled if needed
  }

  onMemberSearchChange(event: Event): void {
    const keyword = (event.target as HTMLInputElement).value;
    this.searchSubject.next(keyword);
    if (!this.memberDropdownOpen && keyword.trim().length > 0) {
      this.memberDropdownOpen = true;
    }
  }

  private performSearch(keyword: string): void {
    this.isSearching = true;
    this.userService.getUsers(keyword, 0, 50).subscribe({
      next: (res: any) => {
        const users: any[] = res.data?.items || [];
        this.memberOptions = users
          .filter((user: any) => {
            const isExisting = this.existingMemberIds.includes(String(user.id));
            const isOwner = String(user.id) === String(this.projectOwnerId);
            return !isExisting && !isOwner;
          })
          .map((user: any) => ({
            id: String(user.id),
            name: user.username
          }));
        this.isSearching = false;
      },
      error: (err: any) => {
        console.error('Lỗi tìm kiếm thành viên:', err);
        this.isSearching = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Computed ─────────────────────────────────────────────────────────────────
  get selectedMemberNames(): string[] {
    return this.memberOptions
      .filter(m => this.formData.selectedMemberIds.includes(m.id))
      .map(m => m.name);
  }

  // ── Dropdown Toggles ─────────────────────────────────────────────────────────
  togglePositionDropdown(): void {
    this.positionDropdownOpen = !this.positionDropdownOpen;
    if (this.positionDropdownOpen) this.memberDropdownOpen = false;
  }

  toggleMemberDropdown(): void {
    this.memberDropdownOpen = !this.memberDropdownOpen;
    if (this.memberDropdownOpen) this.positionDropdownOpen = false;
  }

  selectPosition(pos: string, event: Event): void {
    event.stopPropagation();
    this.formData.selectedPosition = pos;
    this.positionDropdownOpen = false;
  }

  toggleMemberSelection(member: { id: string, name: string }, event: Event): void {
    event.stopPropagation();
    const idx = this.formData.selectedMemberIds.indexOf(member.id);
    if (idx === -1) {
      this.formData.selectedMemberIds = [...this.formData.selectedMemberIds, member.id];
    } else {
      this.formData.selectedMemberIds = this.formData.selectedMemberIds.filter(id => id !== member.id);
    }
  }

  isMemberSelected(id: string): boolean {
    return this.formData.selectedMemberIds.includes(id);
  }

  // ── Add Members to Table ──────────────────────────────────────────────────────
  addMembers(): void {
    if (!this.formData.selectedPosition) {
      alert('Vui lòng chọn vị trí!');
      return;
    }
    if (this.formData.selectedMemberIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thành viên!');
      return;
    }

    const newEntries: AddedMember[] = this.formData.selectedMemberIds
      .filter(id => !this.addedMembers.some(m => m.id === id && m.position === this.formData.selectedPosition))
      .map(id => ({
        id,
        name: this.memberOptions.find(m => m.id === id)?.name ?? '',
        position: this.formData.selectedPosition,
      }));

    this.addedMembers = [...this.addedMembers, ...newEntries];

    // Reset selections
    this.formData.selectedPosition = '';
    this.formData.selectedMemberIds = [];
  }

  // ── Remove from Table ─────────────────────────────────────────────────────────
  removeMember(index: number): void {
    this.addedMembers = this.addedMembers.filter((_, i) => i !== index);
  }

  // ── Textarea Counter ──────────────────────────────────────────────────────────
  onDescriptionInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    if (target.value.length > 255) {
      this.formData.description = target.value.slice(0, 255);
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  onSave(): void {
    if (!this.formData.projectName.trim()) {
      alert('Vui lòng nhập tên dự án!');
      return;
    }

    const result: AddMemberResult = {
      projectName: this.formData.projectName,
      description: this.formData.description,
      members: this.addedMembers,
    };

    this.saved.emit(result);
  }

  onClose(): void {
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }

  // ── Close dropdowns on outside click ─────────────────────────────────────────
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.positionDropdownOpen || this.memberDropdownOpen) {
      this.positionDropdownOpen = false;
      this.memberDropdownOpen = false;
    } else {
      this.onClose();
    }
  }
}