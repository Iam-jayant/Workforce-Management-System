// Authentication types and interfaces
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  profile: UserProfile;
  createdAt: Date;
  lastLoginAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  TECHNICIAN = 'technician'
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  employeeId?: string;
  department?: string;
  skills?: string[];
  profilePictureUrl?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  employeeId?: string;
  phoneNumber?: string;
  department?: string;
}

export interface AuthError {
  code: string;
  message: string;
}