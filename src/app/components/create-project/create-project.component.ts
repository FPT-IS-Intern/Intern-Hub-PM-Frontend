import { Component, effect, input, output, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project-contract.service';
import { UserService, User } from '../../services/user.service';
import { ProjectApiService, ProjectApiRequest } from '../../services/project.service';
import { NotificationService } from '../../services/notification.service';
import { CreateProjectParams, ProjectFormData, TeamMember } from '../../models/project.types';

type ProjectFormErrors = Partial<Record<keyof ProjectFormData, string>>;

@Component({
  selector: 'app-create-project-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.scss',
})
export class CreateProjectModalComponent implements OnInit {
  readonly isOpen = input(false);
  readonly privateKey = input<string | undefined>(undefined);
  readonly currentUserId = input<string | undefined>(undefined);

  readonly closed = output<void>();
  readonly submitted = output<ProjectFormData>();

  protected readonly Number = Number;

  protected readonly positions = ['Developer', 'Designer', 'Project Manager', 'Tester', 'Business Analyst'];

  protected readonly pmUsers = signal<User[]>([]);
  protected readonly memberUsers = signal<User[]>([]);
  protected readonly isLoadingPmUsers = signal(false);
  protected readonly isLoadingMemberUsers = signal(false);
  protected readonly pmSearchKeyword = signal('');
  protected readonly memberSearchKeyword = signal('');
  private pmUsersLoaded = false;
  private memberUsersLoaded = false;

  protected readonly availableUsersForPM = computed(() => {
    const allUsers = this.pmUsers();
    const memberIds = this.teamMembers().map(m => m.userId);
    return allUsers.filter(u => !memberIds.includes(u.id));
  });

  protected readonly availableUsersForMembers = computed(() => {
    const allUsers = this.memberUsers();
    const pmId = this.formData().assigneeId || null;
    const memberIds = this.teamMembers().map(m => m.userId);
    return allUsers.filter(u => u.id !== pmId && !memberIds.includes(u.id));
  });

  protected readonly formData = signal<ProjectFormData>(this.emptyForm());
  protected readonly teamMembers = signal<TeamMember[]>([]);
  protected readonly errors = signal<ProjectFormErrors>({});
  protected readonly isSubmitting = signal(false);
  protected readonly transactionHash = signal('');

  private readonly projectService = inject(ProjectService);
  private readonly userService = inject(UserService);
  private readonly projectApiService = inject(ProjectApiService);
  private readonly notificationService = inject(NotificationService);

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.resetState();
      } else {
        if (!this.pmUsersLoaded) {
          console.debug('[CreateProjectModal.constructor] Loading Initial PM Users');
          this.loadPmUsers();
          this.pmUsersLoaded = true;
        }
        if (!this.memberUsersLoaded) {
          console.debug('[CreateProjectModal.constructor] Loading Initial Member Users');
          this.loadMemberUsers();
          this.memberUsersLoaded = true;
        }
      }
    });

    // Separate effects for each search keyword
    effect(() => {
      const keyword = this.pmSearchKeyword();
      if (this.isOpen()) {
        this.loadPmUsers(keyword);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const keyword = this.memberSearchKeyword();
      if (this.isOpen()) {
        this.loadMemberUsers(keyword);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
  }

  protected onPmSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.pmSearchKeyword.set(target.value);
  }

  protected onMemberSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.memberSearchKeyword.set(target.value);
  }

  protected loadPmUsers(keyword: string = ''): void {
    this.isLoadingPmUsers.set(true);
    this.userService.getUsers(keyword).subscribe({
      next: (response: any) => {
        this.pmUsers.set(response.data || []);
        this.isLoadingPmUsers.set(false);
      },
      error: (error: any) => {
        console.error('[CreateProjectModal.loadPmUsers] Error:', error);
        this.pmUsers.set([]);
        this.isLoadingPmUsers.set(false);
      }
    });
  }

  protected loadMemberUsers(keyword: string = ''): void {
    this.isLoadingMemberUsers.set(true);
    this.userService.getUsers(keyword).subscribe({
      next: (response: any) => {
        this.memberUsers.set(response.data || []);
        this.isLoadingMemberUsers.set(false);
      },
      error: (error: any) => {
        console.error('[CreateProjectModal.loadMemberUsers] Error:', error);
        this.memberUsers.set([]);
        this.isLoadingMemberUsers.set(false);
      }
    });
  }

  protected handleClose(): void {
    this.resetState();
    this.closed.emit();
  }

  private resetState(): void {
    this.formData.set(this.emptyForm());
    this.teamMembers.set([]);
    this.errors.set({});
    this.transactionHash.set('');
    this.isSubmitting.set(false);
    this.pmUsersLoaded = false;
    this.memberUsersLoaded = false;
  }

  private emptyForm(): ProjectFormData {
    return {
      assigneeId: '',
      name: '',
      description: '',
      role: '',
      bt: null,
      rt: null,
      position: '',
      member: '',
      startDate: '',
      endDate: '',
      files: [],
    };
  }

  protected validateForm(): boolean {
    const data = this.formData();
    const newErrors: ProjectFormErrors = {};

    if (!data.name.trim()) newErrors['name'] = 'Vui lòng nhập tên dự án';
    if (!data.description.trim()) newErrors['description'] = 'Vui lòng nhập mô tả';
    if (data.description.length > 500) newErrors['description'] = 'Mô tả không được quá 500 ký tự';
    if (!data.assigneeId) newErrors['assigneeId'] = 'Vui lòng chọn PM';
    if (data.bt === null || data.bt === undefined) newErrors['bt'] = 'Vui lòng nhập điểm ngân sách';
    else if (data.bt < 0) newErrors['bt'] = 'Token BT không được nhỏ hơn 0';
    if (data.rt === null || data.rt === undefined) newErrors['rt'] = 'Vui lòng nhập điểm thưởng';
    else if (data.rt < 0) newErrors['rt'] = 'Token RT không được nhỏ hơn 0';
    if (!data.startDate) newErrors['startDate'] = 'Vui lòng chọn ngày bắt đầu';
    if (!data.endDate) newErrors['endDate'] = 'Vui lòng chọn ngày kết thúc';
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      newErrors['endDate'] = 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    this.errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  protected async handleSubmit(): Promise<void> {
    if (!this.validateForm()) return;

    const userId = this.currentUserId();
    this.isSubmitting.set(true);

    try {
      const data = this.formData();

      const apiRequest: ProjectApiRequest = {
        assigneeId: data.assigneeId,
        name: data.name,
        description: data.description,
        budgetToken: data.bt ?? 0,
        rewardToken: data.rt ?? 0,
        startDate: (data.startDate && !data.startDate.includes('T')) ? `${data.startDate}T00:00:00` : data.startDate,
        endDate: (data.endDate && !data.endDate.includes('T')) ? `${data.endDate}T00:00:00` : data.endDate,
        memberList: this.teamMembers().map(member => ({
          userId: member.userId,
          role: member.position.toUpperCase().replace(/\s+/g, '_')
        }))
      };

      this.projectApiService.createProject(apiRequest, data.files).subscribe({
        next: (response) => {
          if (response.status.code === 'success') {
            this.notificationService.showSuccess('Thành công', response.status.message || 'Dự án đã được tạo thành công!');
            this.submitted.emit(data);
            this.handleClose();
          } else {
            this.notificationService.showError('Lỗi', response.status.message || 'Không thể tạo dự án');
          }
          this.isSubmitting.set(false);
        },
        error: (error: any) => {
          const errorMessage = error?.error?.message || error?.message || 'Vui lòng thử lại';
          this.notificationService.showError('Lỗi tạo dự án', errorMessage);
          this.isSubmitting.set(false);
        }
      });

    } catch (err: any) {
      this.notificationService.showError('Lỗi không xác định', err?.message || 'Vui lòng thử lại');
      this.isSubmitting.set(false);
    }
  }

  protected handleAddMember(): void {
    const data = this.formData();
    if (!data.position || !data.member) {
      this.notificationService.showWarning('Thiếu thông tin', 'Vui lòng chọn vị trí và thành viên');
      return;
    }

    const userId = data.member;
    const selectedUser = this.memberUsers().find((u: User) => u.id === userId);

    if (!selectedUser) {
      this.notificationService.showError('Lỗi', 'Không tìm thấy người dùng');
      return;
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: selectedUser.username,
      userId: userId,
      position: data.position,
    };

    this.teamMembers.set([...this.teamMembers(), newMember]);
    this.formData.set({ ...data, position: '', member: '' });
  }

  protected handleRemoveMember(id: string): void {
    this.teamMembers.set(this.teamMembers().filter((m) => m.id !== id));
  }

  protected onFileChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement | null;
    if (!inputEl?.files?.length) return;

    const newFiles = Array.from(inputEl.files);
    const data = this.formData();
    this.formData.set({ ...data, files: [...data.files, ...newFiles] });

    inputEl.value = '';
  }

  protected removeFile(index: number): void {
    const data = this.formData();
    const files = data.files.filter((_: File, i: number) => i !== index);
    this.formData.set({ ...data, files });
  }

  protected patchForm<K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]): void {
    const data = this.formData();
    const next = { ...data, [key]: value };
    this.formData.set(next);

    const errs = { ...this.errors() };
    if (errs[key]) {
      delete errs[key];
      this.errors.set(errs);
    }
  }

  protected handleNumberKeydown(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === 'e' || event.key === 'E' || event.key === '+') {
      event.preventDefault();
    }
  }
}