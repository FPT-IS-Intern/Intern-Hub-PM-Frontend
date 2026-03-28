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
  selectedMemberId: string;
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

  memberOptions: { id: string, name: string, email: string }[] = [];
  
  private userService = inject(UserService);
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  isSearching = false;

  // ── Form Data ────────────────────────────────────────────────────────────────
  formData: AddMemberFormData = {
    projectName: '',
    description: '',
    selectedPosition: '',
    selectedMemberId: '',
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

    // Load initial users
    this.performSearch('');
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
        const addedMemberIds = this.addedMembers.map(m => m.id);
        
        this.memberOptions = users
          .filter((user: any) => {
            const userIdStr = String(user.id);
            const isExisting = this.existingMemberIds.includes(userIdStr);
            const isOwner = userIdStr === String(this.projectOwnerId);
            const isAlreadyAdded = addedMemberIds.includes(userIdStr);
            return !isExisting && !isOwner && !isAlreadyAdded;
          })
          .map((user: any) => ({
            id: String(user.id),
            name: user.username,
            email: user.email || ''
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
  get selectedMemberName(): string {
    return this.memberOptions.find(m => m.id === this.formData.selectedMemberId)?.name ?? '';
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

  selectMember(member: { id: string, name: string, email: string }, event: Event): void {
    event.stopPropagation();
    this.formData.selectedMemberId = member.id;
    this.memberDropdownOpen = false;
  }

  isMemberSelected(id: string): boolean {
    return this.formData.selectedMemberId === id;
  }

  // ── Add Members to Table ──────────────────────────────────────────────────────
  addMembers(): void {
    if (!this.formData.selectedPosition) {
      alert('Vui lòng chọn vị trí!');
      return;
    }
    if (!this.formData.selectedMemberId) {
      alert('Vui lòng chọn thành viên!');
      return;
    }

    const memberId = this.formData.selectedMemberId;
    const isAlreadyAdded = this.addedMembers.some(m => m.id === memberId && m.position === this.formData.selectedPosition);
    
    if (isAlreadyAdded) {
      alert('Thành viên này đã có trong danh sách với vị trí đã chọn!');
      return;
    }

    const member = this.memberOptions.find(m => m.id === memberId);
    if (member) {
      const newEntry: AddedMember = {
        id: member.id,
        name: member.name,
        position: this.formData.selectedPosition,
      };
      this.addedMembers = [...this.addedMembers, newEntry];
    }

    // Reset member selection ONLY, keep position
    this.formData.selectedMemberId = '';
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