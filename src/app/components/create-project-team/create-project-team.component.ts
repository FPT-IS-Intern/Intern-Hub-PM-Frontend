import { Component, effect, input, output, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { TeamApiService, TeamApiRequest } from '../../services/team.service';
import { ProjectFormData, TeamMember } from '../../models/project.types';

type TeamFormErrors = Partial<Record<keyof ProjectFormData, string>>;

@Component({
  selector: 'app-create-project-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-project-team.component.html',
  styleUrl: './create-project-team.component.scss',
})
export class CreateProjectTeamComponent implements OnInit {
  readonly isOpen = input(false);
  readonly projectId = input<string>('');

  readonly closed = output<void>();
  readonly submitted = output<ProjectFormData>();

  protected readonly Number = Number;

  protected readonly positions = ['Developer', 'Designer', 'Project Manager', 'Tester', 'Business Analyst'];

  protected readonly leaderUsers = signal<User[]>([]);
  protected readonly memberUsers = signal<User[]>([]);
  protected readonly isLoadingLeaderUsers = signal(false);
  protected readonly isLoadingMemberUsers = signal(false);
  protected readonly leaderSearchKeyword = signal('');
  protected readonly memberSearchKeyword = signal('');
  private leaderUsersLoaded = false;
  private memberUsersLoaded = false;

  protected readonly availableUsersForLeader = computed(() => {
    const allUsers = this.leaderUsers();
    const memberIds = this.teamMembers().map(m => m.userId);
    return allUsers.filter(u => !memberIds.includes(u.id));
  });

  protected readonly availableUsersForMembers = computed(() => {
    const allUsers = this.memberUsers();
    const leaderId = this.formData().assigneeId || null;
    const memberIds = this.teamMembers().map(m => m.userId);
    return allUsers.filter(u => u.id !== leaderId && !memberIds.includes(u.id));
  });

  protected readonly formData = signal<ProjectFormData>(this.emptyForm());
  protected readonly teamMembers = signal<TeamMember[]>([]);
  protected readonly errors = signal<TeamFormErrors>({});
  protected readonly isSubmitting = signal(false);

  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly teamService = inject(TeamApiService);

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.resetState();
      } else {
        if (!this.leaderUsersLoaded) {
          this.loadLeaderUsers();
          this.leaderUsersLoaded = true;
        }
        if (!this.memberUsersLoaded) {
          this.loadMemberUsers();
          this.memberUsersLoaded = true;
        }
      }
    });

    effect(() => {
      const keyword = this.leaderSearchKeyword();
      if (this.isOpen()) {
        this.loadLeaderUsers(keyword);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const keyword = this.memberSearchKeyword();
      if (this.isOpen()) {
        this.loadMemberUsers(keyword);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void { }

  private loadLeaderUsers(keyword: string = '') {
    const pId = this.projectId();
    if (!pId) return;

    this.isLoadingLeaderUsers.set(true);
    this.userService.searchProjectMembers(pId, keyword).subscribe({
      next: (response: any) => {
        this.leaderUsers.set(response.data?.items || []);
        this.isLoadingLeaderUsers.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load users for leader', error);
        this.leaderUsers.set([]);
        this.isLoadingLeaderUsers.set(false);
      }
    });
  }

  private loadMemberUsers(keyword: string = '') {
    const pId = this.projectId();
    if (!pId) return;

    this.isLoadingMemberUsers.set(true);
    this.userService.searchProjectMembers(pId, keyword).subscribe({
      next: (response: any) => {
        this.memberUsers.set(response.data?.items || []);
        this.isLoadingMemberUsers.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load users for members', error);
        this.memberUsers.set([]);
        this.isLoadingMemberUsers.set(false);
      }
    });
  }

  protected onLeaderSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.leaderSearchKeyword.set(input.value);
  }

  protected onMemberSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.memberSearchKeyword.set(input.value);
  }

  protected patchForm<K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) {
    this.formData.update(data => ({ ...data, [key]: value }));
    this.errors.update(errs => {
      const newErrs = { ...errs };
      if (newErrs[key]) {
        delete (newErrs as any)[key];
      }
      return newErrs;
    });
  }

  private validateForm(): boolean {
    const data = this.formData();
    const newErrors: TeamFormErrors = {};

    if (!data.name?.trim()) newErrors['name'] = 'Vui lòng nhập tên dự án team';
    if (!data.assigneeId) newErrors['assigneeId'] = 'Vui lòng chọn Leader';
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

    this.isSubmitting.set(true);
    try {
      const data = this.formData();
      const members = this.teamMembers();

      const apiRequest: TeamApiRequest = {
        name: data.name.trim(),
        description: data.description.trim(),
        budgetToken: Number(data.bt),
        rewardToken: Number(data.rt),
        assigneeId: data.assigneeId,
        projectId: this.projectId(),
        startDate: data.startDate ? `${data.startDate}T00:00:00` : '',
        endDate: data.endDate ? `${data.endDate}T23:59:59` : '',
        memberList: members.map(m => ({
          userId: m.userId,
          role: m.position
        }))
      };

      this.teamService.createTeam(apiRequest, data.files).subscribe({
        next: (response) => {
          if (response.status?.code === 'success') {
            this.notificationService.showSuccess('Thành công', response.status.message || 'Dự án team đã được khởi tạo');
            this.submitted.emit(data);
            this.handleClose();
          } else {
            this.notificationService.showError('Lỗi', response.status?.message || 'Không thể tạo dự án team');
          }
          this.isSubmitting.set(false);
        },
        error: (error) => {
          console.error('Failed to create team project', error);
          const errorMessage = error.error?.status?.message || 'Không thể tạo dự án team';
          this.notificationService.showError('Lỗi', errorMessage);
          this.isSubmitting.set(false);
        }
      });
    } catch (err: any) {
      this.notificationService.showError('Lỗi', 'Đã xảy ra lỗi không xác định');
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

  protected handleNumberKeydown(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === 'e' || event.key === 'E' || event.key === '+') {
      event.preventDefault();
    }
  }

  protected handleClose() {
    this.resetState();
    this.closed.emit();
  }

  private resetState() {
    this.formData.set(this.emptyForm());
    this.teamMembers.set([]);
    this.errors.set({});
    this.isSubmitting.set(false);
    this.leaderSearchKeyword.set('');
    this.memberSearchKeyword.set('');
    this.leaderUsersLoaded = false;
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
}
