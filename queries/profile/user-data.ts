import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';
import { GetUserDataParams, UserDataResponse } from '@/types/profile';


export const getUserData = async (
  axiosInstance: AxiosInstance,
  params: GetUserDataParams
): Promise<UserDataResponse> => {
  try {
    const searchParams = new URLSearchParams();
    searchParams.append('userId', params.userId.toString());

    const response = await axiosInstance.get(`${BASE_URL}/profile/get-profile?${searchParams.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user data:', error);
    
    // Handle specific error responses
    if (error.response?.data) {
      const errorData = error.response.data;
      throw new Error(errorData.error || 'Failed to fetch user data');
    }
    
    throw error;
  }
}; 