import axios from 'axios';
import { BASE_URL } from '@/constants/api';
import { 
  SigninData, 
  SigninResponse, 
  TokenInfo
} from '@/types/auth';

export const signin = async (
  data: SigninData
): Promise<SigninResponse> => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/signin`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error signing in:', error);
    
    throw error;
  }
};

// Helper function to extract token information from signin response
export const extractTokenInfo = (response: SigninResponse): TokenInfo => {
  return {
    token: response.accessToken,
    tokenType: response.tokenType,
    expiresIn: response.expiresIn,
    expiresAt: Date.now() + (response.expiresIn * 1000), // Convert seconds to milliseconds
  };
}; 