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
  tagTypes: ['AdminUsers', 'AdminStats', 'EmailSettings'],
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, { 
      role?: UserRole; 
      page?: number; 
      limit?: number; 
      isPrimary?: boolean;
      isActive?: boolean;
      search?: string; // Add search parameter
    }>({
      query: ({ role, page = 1, limit = 10, isPrimary, isActive, search }) => {
        let queryString = `/users?page=${page}&limit=${limit}`;
        if (role) {
          queryString += `&role=${role}`;
        }
        if (isPrimary !== undefined) {
          queryString += `&isPrimary=${isPrimary}`;
        }
        if (isActive !== undefined) {
          queryString += `&isActive=${isActive}`;
        }
        if (search) {
          queryString += `&search=${encodeURIComponent(search)}`;
        }
        return queryString;
      },
      providesTags: ['AdminUsers'],
    }),
    exportUsers: builder.query<{ users: IUser[]; total: number }, { 
      role?: UserRole; 
      isPrimary?: boolean;
      isActive?: boolean;
      search?: string;
    }>({
      query: ({ role, isPrimary, isActive, search }) => {
        let queryString = `/users?export=true`;
        if (role) {
          queryString += `&role=${role}`;
        }
        if (isPrimary !== undefined) {
          queryString += `&isPrimary=${isPrimary}`;
        }
        if (isActive !== undefined) {
          queryString += `&isActive=${isActive}`;
        }
        if (search) {
          queryString += `&search=${encodeURIComponent(search)}`;
        }
        return queryString;
      },
    }),
    getUserById: builder.query<IUser, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AdminUsers', id }],
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
    // New endpoint for admin to change user password
    changeUserPassword: builder.mutation<{ success: boolean; message: string }, { id: string; newPassword: string }>({      
      query: ({ id, newPassword }) => ({
        url: `/users/${id}/change-password`,
        method: 'PUT',
        body: { newPassword },
      }),
      invalidatesTags: ['AdminUsers'],
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
    getEmailSettings: builder.query<{ settings: Record<string, any> }, void>({
      query: () => '/email-settings',
      providesTags: ['EmailSettings'],
    }),
    updateEmailSettings: builder.mutation<{ settings: Record<string, any>; message: string }, { settings: Record<string, any> }>({
      query: ({ settings }) => ({
        url: '/email-settings',
        method: 'PUT',
        body: { settings },
      }),
      invalidatesTags: ['EmailSettings'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateInternalUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useChangeUserPasswordMutation, // New hook for password change
  useToggleUserStatusMutation, // New hook for activate/deactivate
  useLazyExportUsersQuery,
  useGetAdminStatsQuery,
  useGetEmailSettingsQuery,
  useUpdateEmailSettingsMutation,
} = adminApi;