export interface TeamMember {
  id: number;
  name: string;
  userId: number;
  position: string;
}

export interface ProjectFormData {
  assigneeId: string;
  name: string;
  description: string;
  role: string;
  bt: number | null;
  rt: number | null;
  position: string;
  member: string;
  startDate: string;
  endDate: string;
  files: File[];
}

export interface CreateProjectParams {
  name: string;
  description: string;
  bt: number;
  rt: number;
  startDate: string;
  endDate: string;
  userList: { id: number; role: string }[];
}

export interface ProjectListItem {
  id: number;
  projectUUID: string;
  name: string;
  description: string;
  note: string | null;
  status: string;
  budgetToken: number;
  rewardToken: number;
  creatorId: number;
  assigneeId: number;
  deliverableDescription: string | null;
  deliverableLink: string | null;
  completionComment: string | null;
  startDate: string;
  endDate: string;
  charterDocuments: {
    id: number;
    fileName: string;
    fileUrl: string;
  }[];
  createdAt: number;
  updatedAt: number;
}
