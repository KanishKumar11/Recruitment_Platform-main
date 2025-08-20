"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon, PencilIcon, QuestionMarkCircleIcon, DocumentTextIcon, UserGroupIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { useGetJobByIdQuery, useUpdateJobStatusMutation } from '@/app/store/services/jobsApi';
import { useGetJobUpdatesQuery } from '@/app/store/services/jobUpdatesApi';
import { JobStatus } from '@/app/constants/jobStatus';
import { getCountryNameFromCode } from '@/app/utils/countryUtils';
import { IJob } from '@/app/models/Job';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import ProtectedLayout from '@/app/components/layout/ProtectedLayout';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import JobUpdatesModal from '@/components/JobUpdatesModal';
import Link from 'next/link';
import { format } from "date-fns";
import { toast } from "react-hot-toast";

// Helper function to get currency symbol
const getCurrencySymbol = (currencyCode: string): string => {
  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    CNY: '¥',
    SEK: 'kr',
    NZD: 'NZ$',
    MXN: '$',
    SGD: 'S$',
    HKD: 'HK$',
    NOK: 'kr',
    TRY: '₺',
    RUB: '₽',
    INR: '₹',
    BRL: 'R$',
    ZAR: 'R',
    KRW: '₩',
    PLN: 'zł',
    THB: '฿',
    IDR: 'Rp',
    MYR: 'RM',
    PHP: '₱',
    VND: '₫',
    EGP: 'E£',
    CLP: '$',
    COP: '$',
    PEN: 'S/',
    ARS: '$',
    UYU: '$U',
    BOB: 'Bs',
    PYG: '₲',
    DOP: 'RD$',
    GTQ: 'Q',
    HNL: 'L',
    NIO: 'C$',
    CRC: '₡',
    PAB: 'B/.',
    JMD: 'J$',
    TTD: 'TT$',
    BBD: 'Bds$',
    BZD: 'BZ$',
    GYD: 'G$',
    SRD: 'Sr$',
    FKP: '£',
    SHP: '£',
    GIP: '£',
    JEP: '£',
    GGP: '£',
    IMP: '£',
    TVD: '$',
    NRU: '$',
    KID: '$',
    CKD: '$',
    WST: 'WS$',
    FJD: 'FJ$',
    SBD: 'SI$',
    TOP: 'T$',
    VUV: 'VT',
    PGK: 'K',
    NCR: '₣',
    XPF: '₣'
  };
  return currencySymbols[currencyCode] || currencyCode;
};

function CompanyJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { data: job, isLoading, refetch } = useGetJobByIdQuery(id);
  const [updateJobStatus, { isLoading: isUpdating }] =
    useUpdateJobStatusMutation();
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);

  // Inline formatter functions
  const formatSalary = (job: IJob) => {
    return `${
      job.salary.currency
    } ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`;
  };

  const formatExperience = (job: IJob) => {
    return `${job.experienceLevel.min} - ${job.experienceLevel.max} years`;
  };

  const formatCommission = (job: IJob) => {
    // Check if commission type exists and is fixed
    if (job.commission?.type === "fixed") {
      const amount = job.commission.fixedAmount || job.commissionAmount;
      return `${job.salary.currency} ${amount.toLocaleString()} (Fixed)`;
    }
    // Check if commission type is percentage
    else if (job.commission?.type === "percentage") {
      const percentage =
        job.commission.originalPercentage || job.commissionPercentage;
      const amount = job.commission.originalAmount || job.commissionAmount;
      return `${percentage}% (${
        job.salary.currency
      } ${amount.toLocaleString()})`;
    }
    // Legacy fallback - determine based on commissionPercentage value
    else {
      if (job.commissionPercentage > 0) {
        return `${job.commissionPercentage}% (${
          job.salary.currency
        } ${job.commissionAmount.toLocaleString()})`;
      } else {
        return `${
          job.salary.currency
        } ${job.commissionAmount.toLocaleString()} (Fixed)`;
      }
    }
  };

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

  // Use RTK Query to fetch job updates count
  const { data: updatesData } = useGetJobUpdatesQuery(id, {
    skip: !id,
  });
  const updatesCount = updatesData?.count || 0;

  const handleStatusChange = async (newStatus: JobStatus) => {
    try {
      await updateJobStatus({ id, status: newStatus }).unwrap();
      toast.success(`Job status updated to ${newStatus}`);
    } catch (error: any) {
      console.error("Failed to update job status:", error);
      toast.error(
        error?.data?.message || "Failed to update job status. Please try again."
      );
    }
  };

  const fetchUpdatesCount = () => {
    // This will trigger a refetch of the updates count
  };

  return (
    <>
      <ProtectedLayout allowedRoles={["COMPANY"]}>
        <DashboardLayout>
          <div className="bg-gray-50 min-h-screen">
            {/* Quick Actions */}
            <div className="bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/dashboard/company/jobs"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <ArrowLeftIcon className="-ml-0.5 mr-2 h-4 w-4" />
                      Back to Jobs
                    </Link>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Link
                      href={`/dashboard/company/jobs/${id}/edit`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PencilIcon className="-ml-0.5 mr-2 h-4 w-4" />
                      Edit Job
                    </Link>
                    <Link
                      href={`/dashboard/company/jobs/${id}/questions`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <QuestionMarkCircleIcon className="-ml-0.5 mr-2 h-4 w-4" />
                      Manage Questions
                    </Link>
                    <Link
                      href={`/dashboard/company/jobs/${id}/resumes`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <DocumentTextIcon className="-ml-0.5 mr-2 h-4 w-4" />
                      View Resumes
                    </Link>
                    <button
                      onClick={() => setIsUpdatesModalOpen(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative"
                    >
                      <BriefcaseIcon className="-ml-0.5 mr-2 h-4 w-4" />
                      Job Updates
                      {updatesCount > 0 && (
                        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                          {updatesCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingSpinner />
                </div>
              ) : job ? (
                <>
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
                              <option key={status as string} value={status as string}>
                                {formatStatus(status as string)}
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
                            Posted on{" "}
                            {new Date(job.postedDate).toLocaleDateString()}
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
                            {getCurrencySymbol(job.salary.currency)}{" "}
                            {job.salary.min.toLocaleString()} -{" "}
                            {job.salary.max.toLocaleString()} ({job.salary.currency})
                            {" "}
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

                        {/* Recruitment Fee */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Recruitment Fee
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-gray-900">
                            {job.commission?.type === "fixed"
                              ? `${getCurrencySymbol(job.salary.currency)} ${
                                  job.commission.fixedAmount?.toLocaleString() ||
                                  job.commissionAmount.toLocaleString()
                                } (${job.salary.currency}) (Fixed)`
                              : job.commission?.type === "percentage"
                              ? `${job.commission.originalPercentage}% of ${
                                  job.compensationType === "HOURLY"
                                    ? "hourly"
                                    : job.compensationType === "MONTHLY"
                                    ? "monthly"
                                    : "annual"
                                } salary (${getCurrencySymbol(
                                  job.salary.currency
                                )} ${
                                  job.commission.originalAmount?.toLocaleString() ||
                                  job.commissionAmount.toLocaleString()
                                } ${job.salary.currency})`
                              : job.commissionPercentage > 0
                              ? `${job.commissionPercentage}% of ${
                                  job.compensationType === "HOURLY"
                                    ? "hourly"
                                    : job.compensationType === "MONTHLY"
                                    ? "monthly"
                                    : "annual"
                                } salary (${getCurrencySymbol(
                                  job.salary.currency
                                )} ${job.commissionAmount.toLocaleString()} ${
                                  job.salary.currency
                                })`
                              : `${getCurrencySymbol(
                                  job.salary.currency
                                )} ${job.commissionAmount.toLocaleString()} (${
                                  job.salary.currency
                                }) (Fixed)`}
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

                  {/* Screening Questions */}
                  {job.screeningQuestions && job.screeningQuestions.length > 0 && (
                    <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Screening Questions
                        </h3>
                        <Link
                          href={`/dashboard/company/jobs/${id}/questions`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Manage Questions
                        </Link>
                      </div>
                      <div className="border-t border-gray-200">
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
                 </>
               ) : (
                 <div className="text-center py-10">
                   <p className="text-gray-500">Job not found</p>
                 </div>
               )}
             </div>
           </div>
           <JobUpdatesModal
              isOpen={isUpdatesModalOpen}
              onClose={() => setIsUpdatesModalOpen(false)}
              jobId={id}
            />
        </DashboardLayout>
      </ProtectedLayout>
    </>
  );
}

export default CompanyJobDetailPage;
