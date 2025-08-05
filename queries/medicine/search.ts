import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';
import { SearchParams, SearchResponse } from '@/types/medicine-queries';

export const searchMedicines = async (axiosInstance: AxiosInstance, params: SearchParams): Promise<SearchResponse> => {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.append('query', params.query);
    if (params.name) searchParams.append('name', params.name);
    if (params.brand) searchParams.append('brand', params.brand);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await axiosInstance.get(`${BASE_URL}/medicine/search?${searchParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error searching medicines:', error);
    throw error;
  }
};
