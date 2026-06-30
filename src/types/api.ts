import type { RoleCode } from '@/types/rbac';

// API response and request types

export interface User {
  id: number;
  employeeId: number;
  empCode: string;
  username: string;
  role: RoleCode;
  employeeName: string;
  department: string;
  currentGrade: string;
  currentGradeTitle: string;
  targetGrade: string;
  targetGradeTitle: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface ErrorResponse {
  status: number;
  message: string;
  code: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
}
