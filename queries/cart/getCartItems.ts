import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';
import { 
  GetCartItemsParams, 
  GetCartItemsResponse 
} from '@/types/cart';

export const getCartItems = async (
  axiosInstance: AxiosInstance,
  params: GetCartItemsParams
): Promise<GetCartItemsResponse> => {
  try {
    const searchParams = new URLSearchParams();
    
    searchParams.append('userId', params.userId.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await axiosInstance.get(`${BASE_URL}/cart/items?${searchParams.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching cart items:', error);
    
    // Handle specific error responses
    if (error.response?.data) {
      const errorData = error.response.data;
      throw new Error(errorData.error || 'Failed to fetch cart items');
    }
    
    throw error;
  }
}; 