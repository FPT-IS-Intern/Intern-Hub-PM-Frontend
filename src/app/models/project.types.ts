export interface TeamMember {
  id: string;
  name: string;
  userId: string;
  position: string;
}

export interface Task {
  id: string;
  name: string;
  userId: string;
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
  userList: { id: string; role: string }[];
}

export interface ProjectListItem {
  id: string;
  projectUUID: string;
  name: string;
  description: string;
  note: string | null;
  status: string;
  budgetToken: number;
  rewardToken: number;
  creatorId: string;
  assigneeId: string;
  deliverableDescription: string | null;
  deliverableLink: string | null;
  completionComment: string | null;
  startDate: string;
  endDate: string;
  charterDocuments: {
    id: string;
    fileName: string;
    fileUrl: string;
  }[];
  createdAt: number;
  updatedAt: number;
}
