// src/app/store/services/supportApi.ts
import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import { RootState } from "../index";
import { rtkQueryRetry } from "@/app/lib/retryUtils";

// Enums matching the model
export enum TicketCategory {
  TECHNICAL_ISSUE = "Technical Issue",
  ACCOUNT_ISSUE = "Account Issue",
  FEATURE_REQUEST = "Feature Request",
  GENERAL_INQUIRY = "General Inquiry",
  BUG_REPORT = "Bug Report",
}

export enum TicketPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical",
}

export enum TicketStatus {
  OPEN = "Open",
  IN_PROGRESS = "In Progress",
  RESOLVED = "Resolved",
  CLOSED = "Closed",
}

// Interface for ticket responses
export interface TicketResponse {
  _id: string;
  message: string;
  respondedBy: {
    _id: string;
    name: string;
    email: string;
  };
  isInternal: boolean;
  createdAt: string;
}

// Main support ticket interface
export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  submittedBy: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  responses: TicketResponse[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

// Request/Response interfaces
export interface CreateTicketRequest {
  subject: string;
  message: string;
  category: TicketCategory;
  priority?: TicketPriority;
}

export interface UpdateTicketRequest {
  subject?: string;
  message?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedTo?: string;
}

export interface CreateResponseRequest {
  message: string;
  isInternal?: boolean;
  notifyUser?: boolean;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedTo?: string;
  dateRange?: { start: string; end: string };
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface TicketApiResponse {
  ticket: SupportTicket;
}

export interface TicketsApiResponse {
  tickets: SupportTicket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface TicketResponsesApiResponse {
  responses: TicketResponse[];
}

export interface CreateResponseApiResponse {
  response: TicketResponse;
}

// Support Settings interfaces
export interface SupportSettings {
  support_email: string;
  support_auto_response: boolean;
  support_email_template: string;
  support_notification_enabled: boolean;
}

export interface SupportSettingsResponse {
  settings: SupportSettings;
}

export interface UpdateSupportSettingsRequest {
  settings: Partial<SupportSettings>;
}

export interface UpdateSupportSettingsResponse {
  message: string;
  settings: SupportSettings;
  updated: Partial<SupportSettings>;
}

export const supportApi = createApi({
  reducerPath: "supportApi",
  baseQuery: retry(
    fetchBaseQuery({
      baseUrl: "/api",
      prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token;
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
        return headers;
      },
    }),
    {
      maxRetries: 3,
    }
  ),
  tagTypes: [
    "SupportTicket",
    "TicketResponse",
    "UserTickets",
    "AdminTickets",
    "SupportSettings",
  ],
  endpoints: (builder) => ({
    // User endpoints - for authenticated users to manage their own tickets
    getUserTickets: builder.query<
      TicketsApiResponse,
      PaginationParams & { status?: TicketStatus }
    >({
      query: ({ page = 1, limit = 10, status }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (status) {
          params.append("status", status);
        }
        return `/support/tickets?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.tickets.map(({ _id }) => ({
                type: "SupportTicket" as const,
                id: _id,
              })),
              { type: "UserTickets", id: "LIST" },
            ]
          : [{ type: "UserTickets", id: "LIST" }],
    }),

    // Create new ticket - for authenticated users
    createTicket: builder.mutation<TicketApiResponse, CreateTicketRequest>({
      query: (ticketData) => ({
        url: "/support/tickets",
        method: "POST",
        body: ticketData,
      }),
      invalidatesTags: [
        { type: "UserTickets", id: "LIST" },
        { type: "AdminTickets", id: "LIST" },
      ],
    }),

    // Get specific ticket - for users to view their own tickets
    getUserTicket: builder.query<TicketApiResponse, string>({
      query: (ticketId) => `/support/tickets/${ticketId}`,
      providesTags: (result, error, ticketId) => [
        { type: "SupportTicket", id: ticketId },
      ],
    }),

    // Admin endpoints - for admins to manage all tickets
    getAllTickets: builder.query<
      TicketsApiResponse,
      TicketFilters & PaginationParams
    >({
      query: ({
        page = 1,
        limit = 10,
        status,
        priority,
        category,
        assignedTo,
        dateRange,
        search,
      }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          admin: "true",
        });

        if (status && status.length > 0) {
          status.forEach((s) => params.append("status", s));
        }
        if (priority && priority.length > 0) {
          priority.forEach((p) => params.append("priority", p));
        }
        if (category && category.length > 0) {
          category.forEach((c) => params.append("category", c));
        }
        if (assignedTo) {
          params.append("assignedTo", assignedTo);
        }
        if (dateRange) {
          params.append("startDate", dateRange.start);
          params.append("endDate", dateRange.end);
        }
        if (search) {
          params.append("search", search);
        }

        return `/support/tickets?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.tickets.map(({ _id }) => ({
                type: "SupportTicket" as const,
                id: _id,
              })),
              { type: "AdminTickets", id: "LIST" },
            ]
          : [{ type: "AdminTickets", id: "LIST" }],
    }),

    // Get specific ticket for admin - includes all details
    getAdminTicket: builder.query<TicketApiResponse, string>({
      query: (ticketId) => `/support/tickets/${ticketId}?admin=true`,
      providesTags: (result, error, ticketId) => [
        { type: "SupportTicket", id: ticketId },
      ],
    }),

    // Update ticket - admin only
    updateTicket: builder.mutation<
      TicketApiResponse,
      { id: string } & UpdateTicketRequest
    >({
      query: ({ id, ...ticketData }) => ({
        url: `/support/tickets/${id}`,
        method: "PUT",
        body: ticketData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "SupportTicket", id },
        { type: "UserTickets", id: "LIST" },
        { type: "AdminTickets", id: "LIST" },
      ],
    }),

    // Delete ticket - admin only
    deleteTicket: builder.mutation<{ success: boolean }, string>({
      query: (ticketId) => ({
        url: `/support/tickets/${ticketId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, ticketId) => [
        { type: "SupportTicket", id: ticketId },
        { type: "UserTickets", id: "LIST" },
        { type: "AdminTickets", id: "LIST" },
      ],
    }),

    // Response endpoints
    getTicketResponses: builder.query<TicketResponsesApiResponse, string>({
      query: (ticketId) => `/support/tickets/${ticketId}/responses`,
      providesTags: (result, error, ticketId) => [
        { type: "TicketResponse", id: ticketId },
      ],
    }),

    // Add response to ticket
    addTicketResponse: builder.mutation<
      CreateResponseApiResponse,
      { ticketId: string } & CreateResponseRequest
    >({
      query: ({ ticketId, ...responseData }) => ({
        url: `/support/tickets/${ticketId}/responses`,
        method: "POST",
        body: responseData,
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: "TicketResponse", id: ticketId },
        { type: "SupportTicket", id: ticketId },
        { type: "UserTickets", id: "LIST" },
        { type: "AdminTickets", id: "LIST" },
      ],
    }),

    // Utility endpoints for admin
    getTicketStats: builder.query<
      {
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
        closed: number;
        byPriority: Record<TicketPriority, number>;
        byCategory: Record<TicketCategory, number>;
      },
      void
    >({
      query: () => "/support/tickets/stats",
      providesTags: [{ type: "AdminTickets", id: "STATS" }],
    }),

    // Get assigned users for ticket assignment dropdown
    getAssignableUsers: builder.query<
      { users: Array<{ _id: string; name: string; email: string }> },
      void
    >({
      query: () => "/support/tickets/assignable-users",
    }),

    // Support Settings endpoints - admin only
    getSupportSettings: builder.query<SupportSettingsResponse, void>({
      query: () => "/admin/support/settings",
      providesTags: [{ type: "SupportSettings", id: "LIST" }],
    }),

    updateSupportSettings: builder.mutation<
      UpdateSupportSettingsResponse,
      UpdateSupportSettingsRequest
    >({
      query: (settingsData) => ({
        url: "/admin/support/settings",
        method: "PUT",
        body: settingsData,
      }),
      invalidatesTags: [{ type: "SupportSettings", id: "LIST" }],
    }),
  }),
});

// Export hooks for use in components
export const {
  // User hooks
  useGetUserTicketsQuery,
  useCreateTicketMutation,
  useGetUserTicketQuery,

  // Admin hooks
  useGetAllTicketsQuery,
  useGetAdminTicketQuery,
  useUpdateTicketMutation,
  useDeleteTicketMutation,

  // Response hooks
  useGetTicketResponsesQuery,
  useAddTicketResponseMutation,

  // Utility hooks
  useGetTicketStatsQuery,
  useGetAssignableUsersQuery,

  // Support Settings hooks
  useGetSupportSettingsQuery,
  useUpdateSupportSettingsMutation,

  // Lazy query hooks for conditional loading
  useLazyGetUserTicketsQuery,
  useLazyGetAllTicketsQuery,
  useLazyGetTicketStatsQuery,
  useLazyGetSupportSettingsQuery,
} = supportApi;
