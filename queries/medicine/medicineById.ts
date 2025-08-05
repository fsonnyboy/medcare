import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';

export interface MedicineByIdResponse {
  medicine: {
    id: number;
    name: string;
    brand: string;
    description: string;
    type: string;
    dosageForm: string;
    size: string;
    stock: number;
    image: string;
    recommended: boolean;
    expiryDate: string;
    createdAt: string;
    updatedAt: string;
    categories: Array<{
      id: number;
      name: string;
    }>;
  };
}

export const getMedicineById = async (axiosInstance: AxiosInstance, id: number): Promise<MedicineByIdResponse> => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/medicine/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching medicine by ID:', error);
    throw error;
  }
}; 