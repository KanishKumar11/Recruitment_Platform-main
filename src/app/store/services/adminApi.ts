// src/app/store/services/adminApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index';
import { IUser, UserRole } from '../../models/User';

interface UsersResponse {
  users: IUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface StatsResponse {
  stats: {
    users: {
      total: number;
      byRole: {
        company: number;         // This now represents total company users
        companyPrimary: number;  // This new field will represent actual company count (primary accounts only)
        recruiter: number;
        internal: number;
        admin: number;
      };
      byType: {
        primary: number;
        teamMembers: number;
      };
    };
    // Add other stats as needed
  };
  recentUsers: IUser[];
}

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

interface UserStatusResponse {
  success: boolean;
  user: IUser;
  message: string;
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/admin',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['AdminUsers', 'AdminStats'],
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, { 
      role?: UserRole; 
      page?: number; 
      limit?: number; 
      isPrimary?: boolean;
      isActive?: boolean; // Add isActive parameter
    }>({
      query: ({ role, page = 1, limit = 10, isPrimary, isActive }) => {
        let queryString = `/users?page=${page}&limit=${limit}`;
        if (role) {
          queryString += `&role=${role}`;
        }
        if (isPrimary !== undefined) {
          queryString += `&isPrimary=${isPrimary}`;
        }
        // Add isActive parameter to query string
        if (isActive !== undefined) {
          queryString += `&isActive=${isActive}`;
        }
        return queryString;
      },
      providesTags: ['AdminUsers'],
    }),
    createInternalUser: builder.mutation<{ success: boolean; user: IUser }, CreateUserRequest>({
      query: (userData) => ({
        url: '/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),
    updateUser: builder.mutation<IUser, { id: string; userData: Partial<IUser> }>({
      query: ({ id, userData }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),
    deleteUser: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),
    // New endpoint for activating/deactivating users
    toggleUserStatus: builder.mutation<UserStatusResponse, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: { isActive },
      }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),
    getAdminStats: builder.query<StatsResponse, void>({
      query: () => '/stats',
      providesTags: ['AdminStats'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateInternalUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation, // New hook for activate/deactivate
  useGetAdminStatsQuery,
} = adminApi;