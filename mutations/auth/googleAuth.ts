import axios from 'axios';
import { BASE_URL } from '@/constants/api';
import { 
  GoogleAuthData,
  GoogleSigninResponse,
  GoogleSignupResponse
} from '@/types/auth';

// Google Sign In
export const googleSignIn = async (
  data: GoogleAuthData
): Promise<GoogleSigninResponse> => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/google`, {
      idToken: data.idToken,
      accessToken: data.accessToken,
      user: data.user
    });
    return response.data;
  } catch (error: any) {
    console.error('Error with Google sign in:', error);
    
    if (error.response?.data) {
      const errorData = error.response.data;
      throw new Error(errorData.error || 'Google sign in failed');
    }
    
    throw error;
  }
};

// Google Sign Up
export const googleSignUp = async (
  data: GoogleAuthData
): Promise<GoogleSignupResponse> => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/google`, {
      idToken: data.idToken,
      accessToken: data.accessToken,
      user: data.user
    });
    return response.data;
  } catch (error: any) {
    console.error('Error with Google sign up:', error);
    
    if (error.response?.data) {
      const errorData = error.response.data;
      throw new Error(errorData.error || 'Google sign up failed');
    }
    
    throw error;
  }
};

// Helper function to validate Google auth data
export const validateGoogleAuthData = (data: GoogleAuthData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.idToken) {
    errors.push('ID token is required');
  }
  
  if (!data.user) {
    errors.push('User data is required');
  } else {
    if (!data.user.id) {
      errors.push('User ID is required');
    }
    if (!data.user.name) {
      errors.push('User name is required');
    }
    if (!data.user.email) {
      errors.push('User email is required');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
