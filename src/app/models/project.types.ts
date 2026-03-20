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
  pm: string;
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
