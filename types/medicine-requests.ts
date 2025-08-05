import { PaginationInfo, User, MedicineBasic, MedicineRequestItem, StockError } from './common';

// Medicine request parameters
export interface MedicineRequestParams {
  userId?: number;
  status?: 'REQUESTED' | 'GIVEN' | 'CANCELLED';
  page?: number;
  limit?: number;
}

// Medicine request filters
export interface RequestFilters {
  userId?: number;
  status?: 'REQUESTED' | 'GIVEN' | 'CANCELLED';
}

// Medicine request summary
export interface RequestSummary {
  total: number;
  requested: number;
  given: number;
  cancelled: number;
}

// Medicine request
export interface MedicineRequest {
  id: string;
  userId: number;
  reason: string;
  status: 'REQUESTED' | 'GIVEN' | 'CANCELLED';
  requestedAt: string | null;
  approvedAt: string | null;
  givenAt: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
  medicines: MedicineRequestItem[];
  totalMedicines: number;
  totalQuantity: number;
}

// Get medicine requests response
export interface RequestResponse {
  requests: MedicineRequest[];
  pagination: PaginationInfo;
  filters: RequestFilters;
  summary: RequestSummary;
}

// Create medicine request data
export interface CreateMedicineRequestData {
  userId: number;
  reason: string;
  medicines: {
    medicineId: number;
    quantity: number;
  }[];
}

// Created request
export interface CreatedRequest {
  id: string;
  userId: number;
  reason: string;
  status: 'REQUESTED' | 'GIVEN' | 'CANCELLED';
  requestedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Request item with medicine details
export interface RequestItem {
  id: string;
  medicineId: number;
  quantity: number;
  medicine: MedicineBasic;
}

// Create request response
export interface CreateRequestResponse {
  message: string;
  request: CreatedRequest;
  medicines: RequestItem[];
  totalRequests: number;
}

// Create request error
export interface CreateRequestError {
  error: string;
  details?: any;
  stockErrors?: StockError[];
  status?: string;
} 