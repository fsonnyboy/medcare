import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';
import { 
  DeleteCartItemData, 
  DeleteCartItemResponse, 
  DeleteCartItemError 
} from '@/types/cart';

export const deleteCartItem = async (
  axiosInstance: AxiosInstance,
  data: DeleteCartItemData
): Promise<DeleteCartItemResponse> => {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/cart/delete`, {
      data: data
    });
    return response.data;
  } catch (error: any) {
    console.error('Error deleting item from cart:', error);
    
    // Handle specific error responses
    if (error.response?.data) {
      const errorData: DeleteCartItemError = error.response.data;
      
      throw new Error(errorData.error || 'Failed to remove item from cart');
    }
    
    throw error;
  }
}; 