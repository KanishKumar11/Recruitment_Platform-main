// src/app/store/services/jobsApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "./../index";
import { IJob, JobStatus } from "../../models/Job";

// Updated interface to match the new commission structure
interface JobFormData {
  title: string;
  jobCode: string;
  companyName: string;
  country: string;
  location: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  paymentTerms: string;
  positions: number;
  jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE" | "INTERNSHIP";
  experienceLevel: {
    min: number;
    max: number;
  };
  compensationDetails: string;
  replacementTerms: string;
  commission: {
    type: "percentage" | "fixed"; // New field to track commission type
    originalPercentage: number;
    fixedAmount: number; // New field for fixed commission amount
    recruiterPercentage: number;
    platformFeePercentage: number;
    reductionPercentage: number;
    originalAmount: number;
    recruiterAmount: number;
  };
  // Legacy fields for backward compatibility
  commissionPercentage: number;
  commissionAmount: number;
  description: string;
  companyDescription: string;
  sourcingGuidelines: string;
}

export const jobsApi = createApi({
  reducerPath: "jobsApi",
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
  tagTypes: ["Job"],
  endpoints: (builder) => ({
    getJobs: builder.query<IJob[], void>({
      query: () => "/",
      providesTags: ["Job"],
    }),
    getJobById: builder.query<IJob, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Job", id }],
    }),
    createJob: builder.mutation<IJob, Partial<JobFormData>>({
      query: (job) => ({
        url: "/",
        method: "POST",
        body: job,
      }),
      invalidatesTags: ["Job"],
    }),
    updateJob: builder.mutation<
      IJob,
      { id: string; job: Partial<JobFormData> }
    >({
      query: ({ id, job }) => ({
        url: `/${id}`,
        method: "PUT",
        body: job,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Job", id }],
    }),
    deleteJob: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Job"],
    }),
    addScreeningQuestion: builder.mutation<
      { success: boolean },
      {
        jobId: string;
        question: string;
        questionType: string;
        required: boolean;
      }
    >({
      query: ({ jobId, ...rest }) => ({
        url: `/${jobId}/questions`,
        method: "POST",
        body: rest,
      }),
      invalidatesTags: (_result, _error, { jobId }) => [
        { type: "Job", id: jobId },
      ],
    }),
    updateScreeningQuestion: builder.mutation<
      { success: boolean },
      {
        jobId: string;
        questionId: string;
        question: string;
        questionType: string;
        required: boolean;
      }
    >({
      query: ({ jobId, questionId, ...rest }) => ({
        url: `/${jobId}/questions`,
        method: "PUT",
        body: { questionId, ...rest },
      }),
      invalidatesTags: (_result, _error, { jobId }) => [
        { type: "Job", id: jobId },
      ],
    }),
    deleteScreeningQuestion: builder.mutation<
      { success: boolean },
      { jobId: string; questionId: string }
    >({
      query: ({ jobId, questionId }) => ({
        url: `/${jobId}/questions`,
        method: "DELETE",
        params: { questionId },
      }),
      invalidatesTags: (_result, _error, { jobId }) => [
        { type: "Job", id: jobId },
      ],
    }),
    updateJobStatus: builder.mutation<IJob, { id: string; status: JobStatus }>({
      query: ({ id, status }) => ({
        url: `/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Job", id }],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobByIdQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useAddScreeningQuestionMutation,
  useUpdateScreeningQuestionMutation,
  useDeleteScreeningQuestionMutation,
  useUpdateJobStatusMutation,
} = jobsApi;
