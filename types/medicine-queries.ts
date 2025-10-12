import { PaginationInfo, MedicineExtended } from './common';

// Search parameters
export interface SearchParams {
  query?: string;
  name?: string;
  brand?: string;
  page?: number;
  limit?: number;
}

// Search response
export interface SearchResponse {
  medicines: MedicineExtended[];
  pagination: PaginationInfo;
  searchParams: SearchParams;
}

// Recommended parameters
export interface RecommendedParams {
  page?: number;
  limit?: number;
  inStock?: boolean;
  type?: 'OTC' | 'PRESCRIPTION' | 'ALL';
  isRecommended?: boolean;
}

// Recommended filters
export interface RecommendedFilters {
  recommended: boolean;
  inStock?: boolean;
}

// Recommended response
export interface RecommendedResponse {
  medicines: MedicineExtended[];
  pagination: PaginationInfo;
  filters: RecommendedFilters;
}

// Medicine category
export interface MedicineCategory {
  id: string;
  name: string;
  medicineCount: number;
  createdAt: string;
}

// Categories response
export interface CategoriesResponse {
  categories: MedicineCategory[];
  totalCategories: number;
}

// Medicine by category parameters
export interface MedicineByCategoryParams {
  categoryId: number;
  page?: number;
  limit?: number;
  inStock?: boolean;
  recommended?: boolean;
  type?: 'OTC' | 'PRESCRIPTION';
}

// Category for medicine by category response
export interface Category {
  id: number;
  name: string;
  createdAt: string;
}

// Medicine category (for medicine details)
export interface MedicineCategoryDetail {
  id: number;
  name: string;
}

// Medicine with categories
export interface MedicineWithCategories extends MedicineExtended {
  categories: MedicineCategoryDetail[];
  isAvailable: boolean;
}

// Category filters
export interface CategoryFilters {
  inStock?: boolean;
  recommended?: boolean;
  type?: 'OTC' | 'PRESCRIPTION';
}

// Category statistics
export interface CategoryStatistics {
  totalMedicines: number;
  availableMedicines: number;
  recommendedMedicines: number;
}

// Medicine by category response
export interface MedicineByCategoryResponse {
  category: Category;
  medicines: MedicineWithCategories[];
  pagination: PaginationInfo;
  filters: CategoryFilters;
  statistics: CategoryStatistics;
} 