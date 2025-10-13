import axios, { AxiosInstance } from 'axios';
import { BASE_URL } from '@/constants/api';
import { ConcernData, ConcernResponse } from '@/types/concern';

export const submitConcern = async (
  axiosInstance: AxiosInstance,
  data: ConcernData,
  userId: string
): Promise<ConcernResponse> => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}/concern`, {
      userId: parseInt(userId),
      subject: data.subject,
      description: data.description
    });
    return response.data;
  } catch (error: any) {
    console.error('Error submitting concern:', error);
    
    if (error.response?.data) {
      const errorData = error.response.data;
      throw new Error(errorData.error || 'Failed to submit concern');
    }
    
    throw error;
  }
};

// Helper function to validate concern data
export const validateConcernData = (data: ConcernData) => {
  const errors: string[] = [];
  
  if (!data.subject || data.subject.trim().length === 0) {
    errors.push('Subject is required');
  } else if (data.subject.trim().length < 5) {
    errors.push('Subject must be at least 5 characters');
  } else if (data.subject.trim().length > 200) {
    errors.push('Subject must be 200 characters or less');
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  } else if (data.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters');
  } else if (data.description.trim().length > 1000) {
    errors.push('Description must be 1000 characters or less');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
