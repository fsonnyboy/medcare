// Common pagination interface used across multiple queries
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}

// Common user interface used across multiple queries
export interface User {
  id: number;
  name: string;
  username: string;
  image?: string | null;
}

// Common error interface for API responses
export interface ApiError {
  error: string;
  details?: any;
}

// Common medicine interface (extended version with all fields)
export interface MedicineExtended {
  id: number;
  name: string;
  brand: string;
  description: string;
  type: string;
  dosageForm: string;
  size: string;
  stock: number;
  recommended: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

// Common medicine interface (basic version for cart/requests)
export interface MedicineBasic {
  id: number;
  name: string;
  brand: string;
  image: string | null;
  stock: number;
}

// Common cart item interface
export interface CartItem {
  id: number;
  userId: number;
  medicineId: number;
  quantity: number;
  addedAt: string;
  updatedAt: string;
  medicine: MedicineBasic;
}

// Common medicine request item interface
export interface MedicineRequestItem {
  id: string;
  medicineId: number;
  quantity: number;
  medicine: MedicineBasic;
}

// Common stock error interface
export interface StockError {
  medicineId: number;
  medicineName: string;
  requestedQuantity: number;
  availableStock: number;
} 