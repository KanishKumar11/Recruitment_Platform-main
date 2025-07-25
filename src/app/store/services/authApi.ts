import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from './../index';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  companyName?: string;
  companySize?: string;
  designation?: string;
  recruitmentFirmName?: string;
}

interface UserResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isPrimary: boolean;
    companyName?: string;
    companySize?: string;
    designation?: string;
    recruitmentFirmName?: string; // Added this field
  };
  token: string;
}

interface OTPResponse {
  message: string;
  email: string;
  expiresIn: number;
}

interface RegisterWithOTPRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  companyName?: string;
  companySize?: string;
  designation?: string;
  recruitmentFirmName?: string;
}

interface VerifyOTPRequest {
  email: string;
  otp: string;
}

interface ResendOTPRequest {
  email: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/auth',
    prepareHeaders: (headers, { getState }) => {
      // Get token from auth state
      const token = (getState() as RootState).auth.token;
      
      // If we have a token set in state, let's assume that we should be passing it
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<UserResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<UserResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/register',
        method: 'POST',
        body: userData,
      }),
    }),
    registerWithOTP: builder.mutation<OTPResponse, RegisterWithOTPRequest>({
      query: (credentials) => ({
        url: '/register-with-otp',
        method: 'POST',
        body: credentials,
      }),
    }),
    
    verifyOTP: builder.mutation<UserResponse, VerifyOTPRequest>({
      query: (data) => ({
        url: '/verify-otp',
        method: 'POST',
        body: data,
      }),
    }),
    
    resendOTP: builder.mutation<OTPResponse, ResendOTPRequest>({
      query: (data) => ({
        url: '/resend-otp',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { 
  useLoginMutation, 
  useRegisterMutation, 
  useRegisterWithOTPMutation,
  useVerifyOTPMutation,
  useResendOTPMutation, 
} = authApi;