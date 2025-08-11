"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetJobByIdQuery,
  useUpdateJobStatusMutation,
} from "../../../../store/services/jobsApi";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { Loader2, ArrowLeft, Edit, FileQuestion } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { JobStatus } from "@/app/constants/jobStatus";
import { getCountryNameFromCode } from "@/app/utils/countryUtils";

export default function ViewJobPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { data: job, isLoading, refetch } = useGetJobByIdQuery(id);
  const [updateJobStatus, { isLoading: isUpdating }] =
    useUpdateJobStatusMutation();
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  // Status badge colors
  const statusColors = {
    DRAFT: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-green-100 text-green-800",
    PAUSED: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-red-100 text-red-800",
  };

  // Format status text
  const formatStatus = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  // Handle job status update with improved error handling
  const handleStatusChange = (status: JobStatus) => {
    try {
      console.log("Attempting to update job status:", {
        id: params.id,
        status,
      });

      const result = updateJobStatus({
        id: params.id as string,
        status,
      }).unwrap();

      console.log("Update successful:", result);
      toast.success(`Job status updated to ${formatStatus(status)}`);
      setIsStatusMenuOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Full error object:", error);
      console.error("Error details:", {
        message: error?.message,
        status: error?.status,
        data: error?.data,
        originalStatus: error?.originalStatus,
      });

      // More specific error handling
      let errorMessage = "Failed to update job status";

      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.status) {
        switch (error.status) {
          case 400:
            errorMessage = "Invalid request - please check the job status";
            break;
          case 401:
            errorMessage = "Unauthorized - please log in again";
            break;
          case 403:
            errorMessage = "You don't have permission to update this job";
            break;
          case 404:
            errorMessage = "Job not found";
            break;
          case 422:
            errorMessage = "Invalid status value provided";
            break;
          case 500:
            errorMessage = "Server error - please try again later";
            break;
          default:
            errorMessage = `Request failed with status ${error.status}`;
        }
      }

      toast.error(errorMessage);
    }
  };

  return (
    <ProtectedLayout allowedRoles={["COMPANY"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <button
                onClick={() => router.push("/dashboard/company/jobs")}
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : job ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {job.title}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Job Code: {job.jobCode}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <button
                        onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                          statusColors[
                            job.status as keyof typeof statusColors
                          ] || statusColors.DRAFT
                        }`}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          formatStatus(job.status)
                        )}
                        <svg
                          className="ml-2 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </button>
                      {isStatusMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div
                            className="py-1"
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby="options-menu"
                          >
                            {Object.values(JobStatus).map((status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  handleStatusChange(status as JobStatus)
                                }
                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                  job.status === status
                                    ? "text-indigo-600 bg-indigo-50"
                                    : "text-gray-700"
                                }`}
                                role="menuitem"
                                disabled={isUpdating}
                              >
                                {formatStatus(status)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/dashboard/company/jobs/${params.id}/edit`)
                      }
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Job
                    </button>
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/company/jobs/${params.id}/questions`
                        )
                      }
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FileQuestion className="mr-2 h-4 w-4" />
                      Screening Questions
                    </button>
                    <button
                      onClick={() => router.push(`${params.id}/resumes`)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      View Resumes
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    {/* Row 1: Posted Date & Location */}
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-12 sm:gap-4 sm:px-6">
                      <div className="sm:col-span-6 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                          Posted Date
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {format(new Date(job.postedDate), "MMMM dd, yyyy")}
                        </dd>
                      </div>
                      <div className="sm:col-span-6 sm:grid sm:grid-cols-3 sm:gap-4 mt-6 sm:mt-0">
                        <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                          Location
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {job.location}, {getCountryNameFromCode(job.country)}
                        </dd>
                      </div>
                    </div>
                    {/* Row 2: Job Type & Positions */}
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-12 sm:gap-4 sm:px-6">
                      <div className="sm:col-span-6 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                          Job Type
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {job.jobType.replace("_", " ")}
                        </dd>
                      </div>
                      <div className="sm:col-span-6 sm:grid sm:grid-cols-3 sm:gap-4 mt-6 sm:mt-0">
                        <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                          Positions
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {job.positions}
                        </dd>
                      </div>
                    </div>
                    {/* Row 3: Salary & Experience Level */}
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-12 sm:gap-4 sm:px-6">
                      <div className="sm:col-span-6 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                          Salary
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {job.salary.currency}{" "}
                          {job.salary.min.toLocaleString()} -{" "}
                          {job.salary.max.toLocaleString()}
                        </dd>
                      </div>
                      <div className="sm:col-span-6 sm:grid sm:grid-cols-3 sm:gap-4 mt-6 sm:mt-0">
                        <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                          Experience Level
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {job.experienceLevel.min} - {job.experienceLevel.max}{" "}
                          years
                        </dd>
                      </div>
                    </div>
                    {/* Compensation Details - Full width if present */}
                    {job.compensationDetails && (
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Compensation Details
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-5">
                          {job.compensationDetails}
                        </dd>
                      </div>
                    )}
                    {/* // In your ViewJobPage component, replace the Commission row
                    with this updated version: */}
                    {/* Row 4: Commission & Payment Terms */}
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-12 sm:gap-4 sm:px-6">
                      <div className="sm:col-span-6 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                          Commission
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {/* Check if commission type exists and is fixed, otherwise fall back to percentage logic */}
                          {job.commission?.type === "fixed"
                            ? // Fixed commission display
                              `${job.salary.currency} ${
                                job.commission.fixedAmount?.toLocaleString() ||
                                job.commissionAmount.toLocaleString()
                              } (Fixed)`
                            : job.commission?.type === "percentage"
                            ? // Percentage commission display
                              `${job.commission.originalPercentage}% (${
                                job.salary.currency
                              } ${
                                job.commission.originalAmount?.toLocaleString() ||
                                job.commissionAmount.toLocaleString()
                              })`
                            : // Legacy fallback - only show if commissionPercentage is greater than 0
                            job.commissionPercentage > 0
                            ? `${job.commissionPercentage}% (${
                                job.salary.currency
                              } ${job.commissionAmount.toLocaleString()})`
                            : `${
                                job.salary.currency
                              } ${job.commissionAmount.toLocaleString()} (Fixed)`}
                        </dd>
                      </div>
                      <div className="sm:col-span-6 sm:grid sm:grid-cols-3 sm:gap-4 mt-6 sm:mt-0">
                        <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                          Payment Terms
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {job.paymentTerms || "Not specified"}
                        </dd>
                      </div>
                    </div>
                    {/* Full width fields */}
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Replacement Terms
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-5">
                        {job.replacementTerms || "Not specified"}
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Company Description
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-5">
                        <div
                          className="prose prose-sm max-w-none text-left"
                          dangerouslySetInnerHTML={{
                            __html: job.companyDescription || "Not specified",
                          }}
                        />
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Description
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-5">
                        <div
                          className="prose prose-sm max-w-none text-left"
                          dangerouslySetInnerHTML={{ __html: job.description }}
                        />
                      </dd>
                    </div>
                    {job.sourcingGuidelines && (
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Sourcing Guidelines
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-5">
                          <div
                            className="prose prose-sm max-w-none text-left"
                            dangerouslySetInnerHTML={{
                              __html: job.sourcingGuidelines,
                            }}
                          />
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-lg font-medium text-gray-900">
                  Job not found
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  The job you are looking for does not exist or you do not have
                  permission to view it.
                </p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
