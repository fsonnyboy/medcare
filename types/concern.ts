// Concern feedback types
export interface ConcernData {
  subject: string;
  description: string;
}

export interface ConcernResponse {
  success: boolean;
  message: string;
  concernId?: string;
}

export interface ConcernError {
  error: string;
  details?: string;
}

// Concern viewing types
export interface Concern {
  id: number;
  userId: number;
  subject: string;
  description: string;
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ConcernsListResponse {
  concerns: Concern[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ConcernsListParams {
  page?: number;
  limit?: number;
  status?: string;
}
