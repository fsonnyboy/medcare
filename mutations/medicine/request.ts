import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';
import { 
  CreateMedicineRequestData, 
  CreateRequestResponse, 
  CreateRequestError 
} from '@/types/medicine-requests';

// Enhanced response type to match the Next.js API
interface EnhancedCreateRequestResponse {
  message: string;
  requests: Array<{
    id: string;
    userId: number;
    reason: string;
    status: 'REQUESTED' | 'GIVEN' | 'CANCELLED';
    requestedAt: string | null;
    createdAt: string;
    updatedAt: string;
    medicines: Array<{
      id: string;
      medicineId: number;
      quantity: number;
      medicine: {
        id: number;
        name: string;
        brand: string;
        image: string;
        stock: number;
      };
    }>;
  }>;
  userRequestCounts: Array<{
    userId: number;
    totalRequests: number;
  }>;
  totalRequestsCreated: number;
  totalMedicinesRequested: number;
}

export const createMedicineRequest = async (
  axiosInstance: AxiosInstance,
  data: CreateMedicineRequestData
): Promise<CreateRequestResponse> => {
  try {
    const response = await axiosInstance.post<EnhancedCreateRequestResponse>(`${BASE_URL}/medicine/request`, data);
    const responseData = response.data;
    
    // Transform the enhanced response to match the existing CreateRequestResponse type
    // Since we're sending single user data, we'll take the first request from the response
    const firstRequest = responseData.requests[0];
    
    return {
      message: responseData.message,
      request: {
        id: firstRequest.id,
        userId: firstRequest.userId,
        reason: firstRequest.reason,
        status: firstRequest.status,
        requestedAt: firstRequest.requestedAt,
        createdAt: firstRequest.createdAt,
        updatedAt: firstRequest.updatedAt,
      },
      medicines: firstRequest.medicines.map(item => ({
        id: item.id,
        medicineId: item.medicineId,
        quantity: item.quantity,
        medicine: {
          id: item.medicine.id,
          name: item.medicine.name,
          brand: item.medicine.brand,
          image: item.medicine.image,
          stock: item.medicine.stock,
        },
      })),
      totalRequests: responseData.userRequestCounts.find(count => count.userId === data.userId)?.totalRequests || 0,
    };
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

// New function for bulk medicine requests (multiple users)
export const createBulkMedicineRequests = async (
  axiosInstance: AxiosInstance,
  requests: CreateMedicineRequestData[]
): Promise<EnhancedCreateRequestResponse> => {
  try {
    const response = await axiosInstance.post<EnhancedCreateRequestResponse>(`${BASE_URL}/medicine/request`, {
      requests
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating bulk medicine requests:', error);
    
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Handle stock errors
      if (errorData.stockErrors) {
        console.error('Stock errors:', errorData.stockErrors);
      }
      
      // Handle user status errors
      if (errorData.unapprovedUsers) {
        console.error('Unapproved users:', errorData.unapprovedUsers);
      }
      
      throw new Error(errorData.error || 'Failed to create bulk medicine requests');
    }
    
    throw error;
  }
}; 