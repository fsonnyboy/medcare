import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';
import { 
  MedicineByCategoryParams, 
  MedicineByCategoryResponse 
} from '@/types/medicine-queries';

export const getMedicinesByCategory = async (
  axiosInstance: AxiosInstance,
  params: MedicineByCategoryParams
): Promise<MedicineByCategoryResponse> => {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.inStock !== undefined) searchParams.append('inStock', params.inStock.toString());
    if (params.recommended !== undefined) searchParams.append('recommended', params.recommended.toString());
    if (params.type) searchParams.append('type', params.type);

    const response = await axiosInstance.get(`${BASE_URL}/medicine/category/${params.categoryId}?${searchParams.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching medicines by category:', error);
    
    // Handle specific error responses
    if (error.response?.data) {
      const errorData = error.response.data;
      throw new Error(errorData.error || 'Failed to fetch medicines by category');
    }
    
    throw error;
  }
}; 