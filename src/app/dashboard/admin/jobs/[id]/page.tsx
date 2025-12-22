//src/dashboard/admin/jobs/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { RootState } from "../../../../store/index";
import {
  useGetJobByIdQuery,
  useUpdateJobStatusMutation,
} from "../../../../store/services/jobsApi";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { UserRole } from "@/app/constants/userRoles";
import { JobStatus } from "@/app/constants/jobStatus";
import { getCountryNameFromCode } from "@/app/utils/countryUtils";
import JobUpdatesModal from "@/components/JobUpdatesModal";
import { MessageSquare, Users } from "lucide-react";
import { useGetJobUpdatesQuery } from "../../../../store/services/jobUpdatesApi";
import ShowRecruitersModal from "@/components/ShowRecruitersModal";
import ManageJobAccessModal from "@/components/ManageJobAccessModal";

export default function AdminJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { user } = useSelector((state: RootState) => state.auth);

  const { data: job, isLoading, error, refetch } = useGetJobByIdQuery(id);
  const [updateJobStatus] = useUpdateJobStatusMutation();
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [isRecruitersModalOpen, setIsRecruitersModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const { data: updatesData } = useGetJobUpdatesQuery(id, { skip: !id });
  const updatesCount = updatesData?.data?.length || 0;

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    if (
      user &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.INTERNAL
    ) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  // Handle job status change
  const handleStatusChange = (newStatus: JobStatus) => {
    try {
      updateJobStatus({ id, status: newStatus }).unwrap();
      refetch(); // Refresh the job details
    } catch (err) {
      console.error("Failed to update job status:", err);
      // Show error notification
    }
  };

  if (isLoading) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-80">
            <LoadingSpinner />
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  if (error || !job) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
        <DashboardLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-600">
                Error loading job details
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                The job you're looking for could not be found or you don't have
                permission to view it.
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard/admin/jobs"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Back to jobs list
                </Link>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header with Title and Actions */}
            <div className="mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Job Details
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage and view job information
                  </p>
                </div>

                {/* Actions Panel - Single Row Layout */}
                <div className="flex-shrink-0">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Quick Actions
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/dashboard/admin/jobs/${id}/edit`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        Edit Job
                      </Link>
                      <Link
                        href={`/dashboard/admin/jobs/${id}/questions`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        Manage Questions
                      </Link>
                      <div className="relative">
                        <button
                          onClick={() => setIsUpdatesModalOpen(true)}
                          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Job Updates
                        </button>
                        {updatesCount > 0 && (
                          <span className="absolute top-0 right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-green-500 rounded-full">
                            {updatesCount}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setIsAccessModalOpen(true)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        Manage Access
                      </button>
                      <button
                        onClick={() => setIsRecruitersModalOpen(true)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Show Recruiters
                      </button>
                      <Link
                        href={`/dashboard/admin/jobs/${id}/resumes`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        View Resumes
                      </Link>
                      <Link
                        href="/dashboard/admin/jobs"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        Back to Jobs
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            {/* Job Header with Status Control */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {job.title}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Job Code: {job.jobCode.replace(/^job-/i, "")}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="mr-2 text-sm font-medium text-gray-700">
                      Status:
                    </span>
                    <select
                      value={job.status}
                      onChange={(e) =>
                        handleStatusChange(e.target.value as JobStatus)
                      }
                      className={`p-2 text-sm font-medium rounded border ${
                        job.status === JobStatus.ACTIVE
                          ? "bg-green-100 text-green-800 border-green-200"
                          : job.status === JobStatus.PAUSED
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : job.status === JobStatus.CLOSED
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      }`}
                    >
                      {Object.values(JobStatus).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details - Compact Layout */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Job Information
                    </h3>
                    <p className="text-sm text-gray-500">
                      Posted on {new Date(job.postedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Job Code
                    </p>
                    <p className="text-sm text-gray-500">
                      {job.jobCode.replace(/^job-/i, "")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Compact Grid Layout */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Company */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Company
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {job.companyName ||
                        job.postedByCompany ||
                        "Company Information Not Available"}
                    </dd>
                  </div>

                  {/* Location */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Location
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {job.location}, {getCountryNameFromCode(job.country)}
                    </dd>
                  </div>

                  {/* Job Type */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Job Type
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {job.jobType.replace("_", " ")}
                    </dd>
                  </div>

                  {/* Positions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Positions
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {job.positions}
                    </dd>
                  </div>

                  {/* Salary Range */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Salary Range
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {job.salary.currency} {job.salary.min.toLocaleString()} -{" "}
                      {job.salary.max.toLocaleString()}{" "}
                      {job.compensationType === "HOURLY"
                        ? "per hour"
                        : job.compensationType === "MONTHLY"
                        ? "per month"
                        : "per year"}
                    </dd>
                  </div>

                  {/* Experience */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Experience Required
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {job.experienceLevel.min} - {job.experienceLevel.max}{" "}
                      years
                    </dd>
                  </div>

                  {/* Payment Terms */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Payment Terms
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {job.paymentTerms || "Not specified"}
                    </dd>
                  </div>

                  {/* Recruitment Fee */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Recruitment Fee
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {job.commission?.type === "fixed"
                        ? `${job.salary.currency} ${
                            job.commission.fixedAmount?.toLocaleString() ||
                            job.commissionAmount.toLocaleString()
                          } (Fixed)`
                        : job.commission?.type === "percentage"
                        ? `${job.commission.originalPercentage}% of ${
                            job.compensationType === "HOURLY"
                              ? "hourly"
                              : job.compensationType === "MONTHLY"
                              ? "monthly"
                              : "annual"
                          } salary (${job.salary.currency} ${
                            job.commission.originalAmount?.toLocaleString() ||
                            job.commissionAmount.toLocaleString()
                          })`
                        : job.commissionPercentage > 0
                        ? `${job.commissionPercentage}% of ${
                            job.compensationType === "HOURLY"
                              ? "hourly"
                              : job.compensationType === "MONTHLY"
                              ? "monthly"
                              : "annual"
                          } salary (${
                            job.salary.currency
                          } ${job.commissionAmount.toLocaleString()})`
                        : `${
                            job.salary.currency
                          } ${job.commissionAmount.toLocaleString()} (Fixed)`}
                    </dd>
                  </div>

                  {/* Replacement Terms */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Replacement Terms
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {job.replacementTerms || "Not specified"}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Descriptions Section - Full Width Layout */}
            <div className="mt-6 space-y-6">
              {/* Job Description */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Job Description
                  </h3>
                </div>
                <div className="p-4">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                </div>
              </div>

              {/* Company Description */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Company Description
                  </h3>
                </div>
                <div className="p-4">
                  {job.companyDescription ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: job.companyDescription,
                      }}
                    />
                  ) : (
                    <p className="text-gray-500 italic">Not specified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sourcing Guidelines */}
            {job.sourcingGuidelines && (
              <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sourcing Guidelines
                  </h3>
                </div>
                <div className="p-4">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.sourcingGuidelines }}
                  />
                </div>
              </div>
            )}

            {/* Screening Questions */}
            {job.screeningQuestions && job.screeningQuestions.length > 0 && (
              <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Screening Questions
                  </h3>
                  <Link
                    href={`/dashboard/admin/jobs/${id}/questions`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Manage Questions
                  </Link>
                </div>
                <div className="p-4">
                  <ul className="divide-y divide-gray-200">
                    {job.screeningQuestions.map(
                      (question: any, index: number) => (
                        <li key={question._id || index} className="px-4 py-4">
                          <div className="flex justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {question.question}
                              </p>
                              <div className="flex mt-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                  {question.questionType}
                                </span>
                                {question.required && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Required
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2">
                            {question.options &&
                              question.options.length > 0 && (
                                <ul className="list-disc pl-5">
                                  {question.options.map(
                                    (option: string, idx: number) => (
                                      <li
                                        key={idx}
                                        className="text-sm text-gray-700"
                                      >
                                        {option}
                                      </li>
                                    )
                                  )}
                                </ul>
                              )}
                            {question.answer && (
                              <p className="text-sm text-gray-700 mt-2">
                                Answer: {question.answer}
                              </p>
                            )}
                          </div>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job Updates Modal */}
        <JobUpdatesModal
          isOpen={isUpdatesModalOpen}
          onClose={() => setIsUpdatesModalOpen(false)}
          jobId={id}
        />

        <ShowRecruitersModal
          isOpen={isRecruitersModalOpen}
          onClose={() => setIsRecruitersModalOpen(false)}
          jobId={id}
          jobTitle={job?.title || ""}
        />

        <ManageJobAccessModal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
          jobId={id}
          jobTitle={job?.title || ""}
          jobCode={job?.jobCode?.replace(/^job-/i, "")}
        />
      </DashboardLayout>
    </ProtectedLayout>
  );
}
