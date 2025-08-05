import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';
import { 
  CreateMedicineRequestData, 
  CreateRequestResponse, 
  CreateRequestError 
} from '@/types/medicine-requests';

export const createMedicineRequest = async (
  axiosInstance: AxiosInstance,
  data: CreateMedicineRequestData
): Promise<CreateRequestResponse> => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/medicine/request`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating medicine request:', error);
    
    // Handle specific error responses
    if (error.response?.data) {
      const errorData: CreateRequestError = error.response.data;
      
      // Handle stock errors
      if (errorData.stockErrors) {
        console.error('Stock errors:', errorData.stockErrors);
      }
      
      // Handle user status errors
      if (errorData.status) {
        console.error('User status error:', errorData.status);
      }
      
      throw new Error(errorData.error || 'Failed to create medicine request');
    }
    
    throw error;
  }
}; 