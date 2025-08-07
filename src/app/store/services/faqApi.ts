// src/app/store/services/faqApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../index";

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  order: number;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface FAQsResponse {
  faqs: FAQ[];
}

interface CreateFAQRequest {
  question: string;
  answer: string;
  category?: string;
  isActive?: boolean;
  order?: number;
}

interface UpdateFAQRequest {
  id: string;
  question: string;
  answer: string;
  category?: string;
  isActive?: boolean;
  order?: number;
}

interface FAQResponse {
  faq: FAQ;
}

export const faqApi = createApi({
  reducerPath: "faqApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/faqs",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["FAQ", "PublicFAQ"],
  endpoints: (builder) => ({
    // Get public FAQs (active only)
    getPublicFAQs: builder.query<FAQsResponse, { category?: string }>({
      query: ({ category }) => {
        let queryString = "";
        if (category) {
          queryString = `?category=${category}`;
        }
        return queryString;
      },
      providesTags: ["PublicFAQ"],
    }),

    // Get all FAQs for admin
    getAdminFAQs: builder.query<FAQsResponse, void>({
      query: () => "?admin=true",
      providesTags: ["FAQ"],
    }),

    // Get single FAQ
    getFAQ: builder.query<FAQResponse, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "FAQ", id }],
    }),

    // Create FAQ (Admin only)
    createFAQ: builder.mutation<FAQResponse, CreateFAQRequest>({
      query: (faqData) => ({
        url: "",
        method: "POST",
        body: faqData,
      }),
      invalidatesTags: ["FAQ", "PublicFAQ"],
    }),

    // Update FAQ (Admin + Internal with permission)
    updateFAQ: builder.mutation<FAQResponse, UpdateFAQRequest>({
      query: ({ id, ...faqData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: faqData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "FAQ", id },
        "FAQ",
        "PublicFAQ",
      ],
    }),

    // Delete FAQ (Admin only)
    deleteFAQ: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FAQ", "PublicFAQ"],
    }),

    // Toggle FAQ status (Admin only)
    toggleFAQStatus: builder.mutation<
      FAQResponse,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => {
        return {
          url: `/${id}`,
          method: "PUT",
          body: { isActive },
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "FAQ", id },
        "FAQ",
        "PublicFAQ",
      ],
    }),
  }),
});

export const {
  useGetPublicFAQsQuery,
  useGetAdminFAQsQuery,
  useGetFAQQuery,
  useCreateFAQMutation,
  useUpdateFAQMutation,
  useDeleteFAQMutation,
  useToggleFAQStatusMutation,
} = faqApi;
