import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';
import { 
  MedicineRequestParams, 
  MedicineRequest, 
  RequestResponse 
} from '@/types/medicine-requests';

export const getMedicineRequests = async (
  axiosInstance: AxiosInstance, 
  params: MedicineRequestParams = {}
): Promise<RequestResponse> => {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.userId) searchParams.append('userId', params.userId.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await axiosInstance.get(`${BASE_URL}/medicine/request?${searchParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching medicine requests:', error);
    throw error;
  }
}; 