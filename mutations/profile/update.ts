import { AxiosInstance } from 'axios';
import { 
  UpdateProfileData, 
  UpdatePasswordData, 
  UpdateProfileResponse 
} from '@/types/profile';
import { BASE_URL } from '@/constants/api';

// Validation schema for profile update
const updateProfileSchema = {
  userId: (value: number) => {
    if (!value || value < 1) throw new Error('User ID is required');
    return value;
  },
  name: (value: string) => {
    if (!value || value.trim().length === 0) throw new Error('Name is required');
    if (value.length > 100) throw new Error('Name too long');
    return value;
  },
  middleName: (value?: string) => value || undefined,
  lastName: (value?: string) => value || undefined,
  DateOfBirth: (value: string) => {
    if (!value || value.trim().length === 0) throw new Error('Date of birth is required');
    return value;
  },
  age: (value?: string) => value || undefined,
  address: (value?: string) => value || undefined,
  contactNumber: (value?: string) => value || undefined,
  image: (value?: string) => value || undefined,
};

// Validation schema for password update
const updatePasswordSchema = {
  userId: (value: number) => {
    if (!value || value < 1) throw new Error('User ID is required');
    return value;
  },
  currentPassword: (value: string) => {
    if (!value || value.trim().length === 0) throw new Error('Current password is required');
    return value;
  },
  newPassword: (value: string) => {
    if (!value || value.length < 6) throw new Error('New password must be at least 6 characters');
    return value;
  },
  confirmPassword: (value: string) => {
    if (!value || value.trim().length === 0) throw new Error('Password confirmation is required');
    return value;
  },
};

// Validate profile data
const validateProfileData = (data: any): UpdateProfileData => {
  return {
    userId: updateProfileSchema.userId(data.userId),
    name: updateProfileSchema.name(data.name),
    middleName: updateProfileSchema.middleName(data.middleName),
    lastName: updateProfileSchema.lastName(data.lastName),
    DateOfBirth: updateProfileSchema.DateOfBirth(data.DateOfBirth),
    age: updateProfileSchema.age(data.age),
    address: updateProfileSchema.address(data.address),
    contactNumber: updateProfileSchema.contactNumber(data.contactNumber),
    image: updateProfileSchema.image(data.image),
  };
};

// Validate password data
const validatePasswordData = (data: any): UpdatePasswordData => {
  return {
    userId: updatePasswordSchema.userId(data.userId),
    currentPassword: updatePasswordSchema.currentPassword(data.currentPassword),
    newPassword: updatePasswordSchema.newPassword(data.newPassword),
    confirmPassword: updatePasswordSchema.confirmPassword(data.confirmPassword),
  };
};

export const updateProfile = async (
  axiosInstance: AxiosInstance,
  data: UpdateProfileData
): Promise<UpdateProfileResponse> => {
  try {
    // Validate the data
    const validatedData = validateProfileData(data);
    
    const response = await axiosInstance.put(`${BASE_URL}/profile/update-profile`, validatedData);
    return response.data;
  } catch (error: any) {
    console.error('Error updating profile:', error);
    
    // Handle validation errors
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    throw error;
  }
};

export const updatePassword = async (
  axiosInstance: AxiosInstance,
  data: UpdatePasswordData
): Promise<UpdateProfileResponse> => {
  try {
    // Validate the data
    const validatedData = validatePasswordData(data);
    
    // Check if new passwords match
    if (validatedData.newPassword !== validatedData.confirmPassword) {
      throw new Error('New passwords do not match');
    }
    
    const response = await axiosInstance.put(`${BASE_URL}/profile/update-profile`, validatedData);
    return response.data;
  } catch (error: any) {
    console.error('Error updating password:', error);
    
    // Handle validation errors
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    throw error;
  }
}; 