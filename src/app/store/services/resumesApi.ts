//src/store/services/resumesApi.ts - Updated with validation
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from './../index';
import { IResume, ResumeStatus } from '../../models/Resume';

// Define a response type that can handle both formats
interface ResumesResponse {
  resumes?: IResume[];
  jobPostedBy?: string;
}

// Validation types
interface ValidationError {
  field: string;
  message: string;
  details?: any;
}

interface ValidationWarning {
  field: string;
  message: string;
  count?: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidateCandidateRequest {
  email: string;
  phone: string;
  jobId: string;
}

export const resumesApi = createApi({
  reducerPath: 'resumesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Resume'],
  endpoints: (builder) => ({
    getResumesByJobId: builder.query<IResume[] | ResumesResponse, string>({
      query: (jobId) => `/resumes/job/${jobId}`,
      providesTags: (result) => {
        // Check if result is an array or an object with resumes property
        const resumes = Array.isArray(result) ? result : result?.resumes || [];
                
        return [
          ...resumes.map(({ _id }) => ({ type: 'Resume' as const, id: _id as string })),
          { type: 'Resume', id: 'LIST' },
        ];
      },
      // Transform the response to handle both formats
      transformResponse: (response: IResume[] | ResumesResponse) => {
        return response;
      },
    }),
    getRecruiterSubmissions: builder.query<IResume[], void>({
      query: () => '/resumes/my-submissions',
      providesTags: (result) => result 
        ? [
            ...result.map(({ _id }) => ({ type: 'Resume' as const, id: _id as string })),
            { type: 'Resume', id: 'RECRUITER_SUBMISSIONS' },
          ]
        : [{ type: 'Resume', id: 'RECRUITER_SUBMISSIONS' }],
    }),
    getResumeById: builder.query<IResume, string>({
      query: (id) => `/resumes/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Resume', id }],
    }),
    
    // NEW: Validate candidate for duplicate checking
    validateCandidate: builder.mutation<ValidationResult, ValidateCandidateRequest>({
      query: (data) => ({
        url: '/validation/candidate',
        method: 'POST',
        body: data,
      }),
    }),
    
    uploadResume: builder.mutation<
      IResume,
      FormData
    >({
      query: (formData) => ({
        url: '/resumes',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [
        { type: 'Resume', id: 'LIST' }, 
        { type: 'Resume', id: 'RECRUITER_SUBMISSIONS' }
      ],
    }),
    updateResumeStatus: builder.mutation<
      IResume,
      { id: string; status: ResumeStatus }
    >({
      query: ({ id, status }) => ({
        url: `/resumes/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Resume', id },
        { type: 'Resume', id: 'LIST' },
        { type: 'Resume', id: 'RECRUITER_SUBMISSIONS' }
      ],
    }),
    getAllSubmissions: builder.query<IResume[], void>({
      query: () => '/resumes/all-submissions',
      providesTags: (result) => result 
        ? [
            ...result.map(({ _id }) => ({ type: 'Resume' as const, id: _id as string })),
            { type: 'Resume', id: 'ALL_SUBMISSIONS' },
          ]
        : [{ type: 'Resume', id: 'ALL_SUBMISSIONS' }],
    }),
    deleteResume: builder.mutation<
      { message: string },
      string
    >({
      query: (id) => ({
        url: `/resumes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Resume', id },
        { type: 'Resume', id: 'LIST' },
        { type: 'Resume', id: 'ALL_SUBMISSIONS' },
        { type: 'Resume', id: 'RECRUITER_SUBMISSIONS' }
      ],
    }),
    addResumeNote: builder.mutation<
      IResume,
      { id: string; note: string }
    >({
      query: ({ id, note }) => ({
        url: `/resumes/${id}/notes`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Resume', id }],
    }),
  }),
});

export const {
  useGetResumesByJobIdQuery,
  useGetResumeByIdQuery,
  useGetRecruiterSubmissionsQuery,
  useUploadResumeMutation,
  useUpdateResumeStatusMutation,
  useAddResumeNoteMutation,
  useGetAllSubmissionsQuery,
  useDeleteResumeMutation,
  useValidateCandidateMutation // NEW: Export the validation mutation
} = resumesApi;