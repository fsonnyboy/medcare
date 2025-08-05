import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';
import { 
  AddToCartData, 
  AddToCartResponse, 
  AddToCartError 
} from '@/types/cart';

export const addToCart = async (
  axiosInstance: AxiosInstance,
  data: AddToCartData
): Promise<AddToCartResponse> => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/cart/add`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error adding item to cart:', error);
    
    // Handle specific error responses
    if (error.response?.data) {
      const errorData: AddToCartError = error.response.data;
      
      // Handle stock errors
      if (errorData.availableStock !== undefined) {
        console.error('Stock error:', {
          availableStock: errorData.availableStock,
          requestedQuantity: errorData.requestedQuantity,
          currentQuantity: errorData.currentQuantity,
          totalQuantity: errorData.totalQuantity
        });
      }
      
      throw new Error(errorData.error || 'Failed to add item to cart');
    }
    
    throw error;
  }
}; 