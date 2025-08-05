import axios from 'axios';
import { BASE_URL } from '@/constants/api';
import { 
  SignupData, 
  SignupResponse, 
  SignupError
} from '@/types/auth';

export const signup = async (
  data: SignupData
): Promise<SignupResponse> => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error signing up:', error);
    
    // Handle specific error responses
    if (error.response?.data) {
      const errorData: SignupError = error.response.data;
      
      // Handle validation errors
      if (errorData.details) {
        console.error('Validation errors:', errorData.details);
      }
      
      throw new Error(errorData.error || 'Failed to sign up');
    }
    
    throw error;
  }
};

// Helper function to validate signup data before sending to API
export const validateSignupData = (data: SignupData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Username validation
  if (!data.username || data.username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  // Password validation
  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  // Date of birth validation
  if (!data.DateOfBirth) {
    errors.push('Date of birth is required');
  } else {
    // Basic date validation
    const date = new Date(data.DateOfBirth);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date of birth format');
    }
  }
  
  // Age validation (if provided)
  if (data.age) {
    const ageNum = parseInt(data.age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      errors.push('Invalid age value');
    }
  }
  
  // Contact number validation (if provided)
  if (data.contactNumber && data.contactNumber.trim().length > 0) {
    // Basic phone number validation (can be enhanced)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
    if (!phoneRegex.test(data.contactNumber)) {
      errors.push('Invalid contact number format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 