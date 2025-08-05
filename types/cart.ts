import { PaginationInfo, User, MedicineBasic, CartItem } from './common';

// Cart summary interface
export interface CartSummary {
  totalItems: number;
  totalQuantity: number;
  availableItems: number;
  outOfStockItems: number;
}

// Cart item with availability status (for getCartItems response)
export interface CartItemWithAvailability extends CartItem {
  isAvailable: boolean;
  availableStock: number;
  medicine: MedicineBasic & {
    description: string;
    type: string;
    dosageForm: string;
    size: string;
    recommended: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

// Get cart items parameters
export interface GetCartItemsParams {
  userId: number;
  page?: number;
  limit?: number;
}

// Get cart items response
export interface GetCartItemsResponse {
  cartItems: CartItemWithAvailability[];
  cartSummary: CartSummary;
  pagination: PaginationInfo;
  user: User;
}

// Add to cart data
export interface AddToCartData {
  userId: number;
  medicineId: number;
  quantity: number;
}

// Add to cart response
export interface AddToCartResponse {
  message: string;
  cartItem: CartItem;
  cartCount: number;
}

// Add to cart error
export interface AddToCartError {
  error: string;
  details?: any;
  availableStock?: number;
  requestedQuantity?: number;
  currentQuantity?: number;
  totalQuantity?: number;
}

// Delete cart item data
export interface DeleteCartItemData {
  userId: number;
  cartItemId: number;
}

// Deleted cart item
export interface DeletedCartItem {
  id: string;
  medicineId: number;
  quantity: number;
  medicine: MedicineBasic;
}

// Delete cart item response
export interface DeleteCartItemResponse {
  message: string;
  deletedItem: DeletedCartItem;
  cartCount: number;
}

// Delete cart item error
export interface DeleteCartItemError {
  error: string;
  details?: any;
} 