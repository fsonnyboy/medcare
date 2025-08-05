import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';
import { MedicineCategory, CategoriesResponse } from '@/types/medicine-queries';

export const getMedicineCategories = async (axiosInstance: AxiosInstance): Promise<CategoriesResponse> => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/medicine/categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching medicine categories:', error);
    throw error;
  }
}; 