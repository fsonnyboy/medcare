export interface SessionData {
    token: string;
    userId: string;
}

export interface Credentials {
    username: string;
    password: string;
}
// User interface for authentication responses
export interface AuthUser {
    id: number;
    username: string;
    name: string;
    middleName: string;
    lastName: string;
    image: string;
    DateOfBirth: string;
    age: number;
    address: string;
    contactNumber: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    updatedAt: string;
  }
  
  // Signin interfaces
  export interface SigninData {
    username: string;
    password: string;
  }
  
  export interface SigninResponse {
    message: string;
    user: AuthUser;
    accessToken: string;
    tokenType: string;
    expiresIn: number;
  }
  
  export interface SigninError {
    error: string;
    details?: any;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  }
  
  // Signup interfaces
export interface SignupData {
  username: string;
  password: string;
  name: string;
  middleName?: string;
  lastName?: string;
  image?: string;
  DateOfBirth: string;
  age?: string;
  address?: string;
  contactNumber?: string;
}
  
  export interface SignupResponse {
    message: string;
    user: AuthUser;
  }
  
  export interface SignupError {
    error: string;
    details?: any;
  }
  
  // Token information interface
  export interface TokenInfo {
    token: string;
    tokenType: string;
    expiresIn: number;
    expiresAt: number;
  }
  
  // Common auth error interface
  export interface AuthError {
    error: string;
    details?: any;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  } 