import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';
import { RecommendedParams, RecommendedResponse } from '@/types/medicine-queries';

export const getMedicines = async (
  axiosInstance: AxiosInstance, 
  params: RecommendedParams = {}
): Promise<RecommendedResponse> => {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.inStock !== undefined) searchParams.append('inStock', params.inStock.toString());
    if (params.type) searchParams.append('type', params.type);
    if (params.isRecommended !== undefined) searchParams.append('isRecommended', params.isRecommended.toString());

    const response = await axiosInstance.get(`${BASE_URL}/medicine/recommended?${searchParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recommended medicines:', error);
    throw error;
  }
}; 