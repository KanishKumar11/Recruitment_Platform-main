//src/app/store/services/usersApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from './../index';
import { IUser, UserRole } from '../../models/User';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/user',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<IUser[], void>({
      query: () => '/',
      providesTags: ['User'],
    }),
    getUsersByRole: builder.query<IUser[], UserRole>({
      query: (role) => `/role/${role}`,
      providesTags: ['User'],
    }),
    getUserById: builder.query<IUser, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
    getTeamMembers: builder.query<IUser[], void>({
      query: () => '/team',
      providesTags: ['User'],
    }),
    updateUser: builder.mutation<IUser, { id: string; userData: Partial<IUser> }>({
      query: ({ id, userData }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }],
    }),
    deleteUser: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUsersByRoleQuery,
  useGetUserByIdQuery,
  useGetTeamMembersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;