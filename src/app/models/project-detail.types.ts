export interface ProjectDetail {
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
  charterDocuments: CharterDocument[];
  createdAt: number;
  updatedAt: number;
}

export interface CharterDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  createdAt?: number;
}

export type ProjectStatus = 'CHUA_BAT_DAU' | 'DANG_THUC_HIEN' | 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI' | 'DA_XOA' | 'QUA_HAN';

export interface Task {
  id: string;
  name: string;
  assignee?: string;
  startDate: string;
  endDate: string;
  requirements: string[];
  status: string;
  score?: number;
  nameTask?: string;
  description?: string;
  BT?: number;
  RT?: number;
}

export type TaskStatus = string;

export interface TaskFilter {
  search: string;
  status: string;
  dateRange: {
    from: string;
    to: string;
  };
}

export interface Statistics {
  totalModels: number;
  totalTasksInProgress: number;
  tasksCanSubmit: number;
  tasksOverdue: number;
  pointsAvailable: number;
  pointsUsed: number;
}
