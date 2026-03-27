export interface ProjectDetail {
  id: string;
  workItemUuid: string;
  name: string;
  description: string;
  creator: string;
  assignee: string;
  status: ProjectStatus;
  bt: number;
  rt: number;
  result: string;
  resultLink: string;
  note: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
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
