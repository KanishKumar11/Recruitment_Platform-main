// src/app/store/services/jobUpdatesApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../index";

export interface JobUpdate {
  _id: string;
  jobId: string;
  title: string;
  content: string;
  postedBy: string;
  postedByName: string;
  postedByRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobUpdatesResponse {
  data: JobUpdate[];
  count: number;
}

export interface CreateJobUpdateRequest {
  jobId: string;
  title?: string;
  content: string;
}

export interface CreateJobUpdateResponse {
  message: string;
  update: JobUpdate;
}

export const jobUpdatesApi = createApi({
  reducerPath: "jobUpdatesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/jobs",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["JobUpdate"],
  endpoints: (builder) => ({
    // Get job updates
    getJobUpdates: builder.query<JobUpdatesResponse, string>({
      query: (jobId) => `/${jobId}/updates`,
      providesTags: (result, error, jobId) => [
        { type: "JobUpdate", id: jobId },
        { type: "JobUpdate", id: "LIST" },
      ],
    }),

    // Create job update
    createJobUpdate: builder.mutation<
      CreateJobUpdateResponse,
      CreateJobUpdateRequest
    >({
      query: ({ jobId, ...body }) => ({
        url: `/${jobId}/updates`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { jobId }) => [
        { type: "JobUpdate", id: jobId },
        { type: "JobUpdate", id: "LIST" },
      ],
    }),
  }),
});

export const { useGetJobUpdatesQuery, useCreateJobUpdateMutation } =
  jobUpdatesApi;