// src/app/store/services/settingsApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../index";

interface Setting {
  value: any;
  description?: string;
  updatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedAt: string;
}

interface SettingsResponse {
  settings: Record<string, Setting>;
}

interface UpdateSettingRequest {
  key: string;
  value: any;
  description?: string;
}

interface UpdateSettingResponse {
  setting: {
    key: string;
    value: any;
    description?: string;
    updatedBy: {
      _id: string;
      name: string;
      email: string;
    };
    updatedAt: string;
  };
}

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/admin/settings",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Settings"],
  endpoints: (builder) => ({
    // Get all settings
    getSettings: builder.query<SettingsResponse, void>({
      query: () => "",
      providesTags: ["Settings"],
    }),

    // Update a setting
    updateSetting: builder.mutation<
      UpdateSettingResponse,
      UpdateSettingRequest
    >({
      query: (settingData) => ({
        url: "",
        method: "PUT",
        body: settingData,
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingMutation } = settingsApi;
