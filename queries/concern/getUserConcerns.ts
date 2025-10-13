import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';
import { ConcernsListParams, ConcernsListResponse } from '@/types/concern';

export const getUserConcerns = async (
  axiosInstance: AxiosInstance,
  userId: string,
  params: ConcernsListParams = {}
): Promise<ConcernsListResponse> => {
  try {
    const searchParams = new URLSearchParams();
    
    // Add userId as required parameter
    searchParams.append('userId', userId);
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);

    const response = await axiosInstance.get(`${BASE_URL}/concern?${searchParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user concerns:', error);
    throw error;
  }
};
