export interface ApiResponse<T> {
  status: {
    code: string;
    message: string | null;
    errors: any[] | null;
  };
  data: T;
  metaData: {
    requestId: string;
    traceId: string;
    signature: string | null;
    timestamp: number;
  };
}

export interface PaginatedData<T> {
  items: T[];
  totalItems: number;
  totalElements?: number;
  totalPages: number;
}
