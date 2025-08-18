// src/app/store/services/emailNotificationsApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../index";

interface EmailNotificationStats {
  overview: {
    totalNotifications: number;
    successfulNotifications: number;
    failedNotifications: number;
    pendingNotifications: number;
    successRate: number;
    totalRecipients: number;
    successfulRecipients: number;
    failedRecipients: number;
    recipientSuccessRate: number;
  };
  recentNotifications: Array<{
    _id: string;
    sentAt: string;
    recipientCount: number;
    status: "sent" | "failed" | "pending";
    jobIds: string[];
    errorMessage?: string;
    retryCount: number;
  }>;
  dailyStats: Array<{
    date: string;
    successRate: number;
    totalNotifications: number;
    totalRecipients: number;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface EmailNotificationStatsResponse {
  success: boolean;
  data: EmailNotificationStats;
}

interface EmailNotificationStatsParams {
  timeFrame?: string;
  page?: number;
  limit?: number;
}

export const emailNotificationsApi = createApi({
  reducerPath: "emailNotificationsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/admin",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["EmailNotificationStats"],
  endpoints: (builder) => ({
    getEmailNotificationStats: builder.query<
      EmailNotificationStatsResponse,
      EmailNotificationStatsParams
    >({
      query: ({ timeFrame = "all", page = 1, limit = 10 }) => ({
        url: "/email-notifications",
        params: {
          timeFrame,
          page: page.toString(),
          limit: limit.toString(),
        },
      }),
      providesTags: ["EmailNotificationStats"],
    }),
  }),
});

export const { useGetEmailNotificationStatsQuery } = emailNotificationsApi;
