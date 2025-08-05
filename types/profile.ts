
export interface UserProfile {
    id: number;
    username: string;
    name: string;
    middleName: string | null;
    lastName: string;
    image: string | null;
    DateOfBirth: string | null;
    age: number | null;
    address: string | null;
    contactNumber: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    isAlreadyRegisteredIn0auth: boolean;
  }
  
  export interface UserStatistics {
    cartItems: number;
    totalRequests: number;
  }
  
  export interface UserDataResponse {
    profile: UserProfile;
    statistics: UserStatistics;
  }
  
  export interface GetUserDataParams {
    userId: number;
  }

export interface UpdateProfileData {
  userId: number;
  name: string;
  middleName?: string;
  lastName?: string;
  DateOfBirth: string;
  age?: string;
  address?: string;
  contactNumber?: string;
  image?: string;
}

export interface UpdatePasswordData {
  userId: number;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileResponse {
  message: string;
  profile?: UserProfile;
}