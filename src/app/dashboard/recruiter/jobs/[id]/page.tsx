"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useGetJobByIdQuery } from "../../../../store/services/jobsApi";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import {
  Loader2,
  ArrowLeft,
  Building,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { IJob } from "@/app/models/Job";
import { getCountryNameFromCode } from "@/app/utils/countryUtils";
import JobUpdatesModal from "@/components/JobUpdatesModal";
import { MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { useGetJobUpdatesQuery } from "../../../../store/services/jobUpdatesApi";

export default function RecruiterJobDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const fromTab = searchParams.get('from') || 'saved';

  // const { user } = useSelector((state: RootState) => state.auth);
  const { data: job, isLoading } = useGetJobByIdQuery(id);

  // Job updates modal state
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);

  // Use RTK Query to fetch job updates
  const { data: updatesData } = useGetJobUpdatesQuery(id, {
    skip: !id,
  });

  const updatesCount = updatesData?.data?.length || 0;

  // Format job type for display
  const formatJobType = (jobType: string) => {
    return jobType.replace("_", " ");
  };

  // Format compensation type for display
  const formatCompensationType = (compensationType: string) => {
    switch (compensationType) {
      case "HOURLY":
        return "Per Hour";
      case "MONTHLY":
        return "Per Month";
      case "ANNUALLY":
        return "Per Year";
      default:
        return "Per Year"; // Default fallback
    }
  };

  // Calculate commission value based on new commission structure
  const getCommissionValue = (job: IJob) => {
    if (!job.commission) {
      // Fallback to legacy commission calculation if new structure is not available
      const recruiterPercentage = job.commissionPercentage
        ? job.commissionPercentage * 0.6
        : 0;
      const minCommission = (job.salary.min * recruiterPercentage) / 100;
      const maxCommission = (job.salary.max * recruiterPercentage) / 100;

      return `${job.salary.currency} ${minCommission.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })} - ${maxCommission.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`;
    }

    if (job.commission.type === "fixed") {
      // For fixed commission, show the recruiter amount directly
      return `${
        job.salary.currency
      } ${job.commission.recruiterAmount.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`;
    } else {
      // For percentage-based commission, calculate range based on salary range
      const minCommission =
        (job.salary.min * job.commission.recruiterPercentage) / 100;
      const maxCommission =
        (job.salary.max * job.commission.recruiterPercentage) / 100;

      return `${job.salary.currency} ${minCommission.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })} - ${maxCommission.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`;
    }
  };

  // Get commission display text with type indicator
  // (Removed unused getCommissionDisplayText and getRecruiterCommissionPercentage functions)
  // Format salary for display (matching the listing page)
  const formatSalary = (job: IJob) => {
    return `${
      job.salary.currency
    } ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`;
  };

  // Format salary with compensation frequency
  const formatSalaryWithFrequency = (job: IJob) => {
    const salaryRange = formatSalary(job);
    const frequency = formatCompensationType(
      job.compensationType || "ANNUALLY"
    );
    return `${salaryRange} ${frequency}`;
  };

  return (
    <>
      <ProtectedLayout allowedRoles={["RECRUITER"]}>
        <DashboardLayout>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-6">
                <button
                  onClick={() =>
                    router.push(`/dashboard/recruiter/jobs?active=${fromTab}`)
                  }
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
                <div>
                  {/* Job Details - Compact Layout */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Job Code: {job.jobCode.replace(/^job-/i, "")}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/recruiter/jobs/${params.id}/resumes?from=${fromTab}`
                              )
                            }
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <Users className="mr-2 h-4 w-4" />
                            View Submissions
                          </button>

                          <div className="relative">
                            <button
                              onClick={() => setIsUpdatesModalOpen(true)}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                            onClick={() =>
                              router.push(
                                `/dashboard/recruiter/jobs/${params.id}/apply?from=${fromTab}`
                              )
                            }
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Upload Resume
                          </button>
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
                              "Company"}
                          </dd>
                        </div>

                        {/* Location */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Location
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-gray-900">
                            {job.location},{" "}
                            {getCountryNameFromCode(job.country)}
                          </dd>
                        </div>

                        {/* Posted Date */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Posted Date
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-gray-900">
                            {format(new Date(job.postedDate), "MMMM dd, yyyy")}
                          </dd>
                        </div>

                        {/* Experience */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Experience Required
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-gray-900">
                            {job.experienceLevel.min} -{" "}
                            {job.experienceLevel.max} years
                          </dd>
                        </div>

                        {/* Job Type */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Job Type
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-gray-900">
                            {formatJobType(job.jobType)}
                          </dd>
                        </div>

                        {/* Salary Range */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Salary Range
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-gray-900">
                            {formatSalaryWithFrequency(job)}
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

                        {/* Commission */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Recruitment Fee
                          </dt>
                          <dd className="mt-1 text-sm font-bold text-green-600">
                            {getCommissionValue(job)}
                          </dd>
                        </div>

                        {/* Commission Type */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Recruitment Fee Type
                          </dt>
                          <dd className="mt-1">
                            {job.commission ? (
                              job.commission.type === "fixed" ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Fixed Amount
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {job.commission.recruiterPercentage.toFixed(
                                    2
                                  )}
                                  % of{" "}
                                  {job.compensationType === "HOURLY"
                                    ? "hourly"
                                    : job.compensationType === "MONTHLY"
                                    ? "monthly"
                                    : "annual"}{" "}
                                  salary
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Legacy Structure
                              </span>
                            )}
                          </dd>
                        </div>

                        {/* Compensation Details */}
                        {job.compensationDetails && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Compensation Details
                            </dt>
                            <dd className="mt-1 text-sm font-medium text-gray-900">
                              {job.compensationDetails}
                            </dd>
                          </div>
                        )}

                        {/* Payment Terms */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Payment Terms
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-gray-900">
                            {job.paymentTerms || "Not specified"}
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
                          dangerouslySetInnerHTML={{
                            __html: job.sourcingGuidelines,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <p className="ml-2 text-lg text-gray-700">Job not found</p>
                </div>
              )}
            </div>
          </div>

          {/* Job Updates Modal */}
          <JobUpdatesModal
            isOpen={isUpdatesModalOpen}
            onClose={() => {
              setIsUpdatesModalOpen(false);
            }}
            jobId={id}
          />
        </DashboardLayout>
      </ProtectedLayout>
    </>
  );
}
