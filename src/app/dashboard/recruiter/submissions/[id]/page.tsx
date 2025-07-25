//app/dashboard/recruiter/submissions/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetResumeByIdQuery } from "../../../../store/services/resumesApi";
import { useGetJobByIdQuery } from "../../../../store/services/jobsApi";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  FileText,
  Clock,
  DollarSign,
  School,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Loader2,
  MessageSquare,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import { ResumeStatus } from "@/app/models/Resume";

export default function ResumeDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  // const { user } = useSelector((state: RootState) => state.auth);
  const {
    data: resume,
    isLoading: resumeLoading,
    error: resumeError,
  } = useGetResumeByIdQuery(id);

  // Always call the hook with a fallback value when jobId might be undefined
  const jobId = resume?.jobId ? resume.jobId.toString() : "placeholder";
  const skipJobFetch = !resume?.jobId;
  const { data: job, isLoading: jobLoading } = useGetJobByIdQuery(jobId, {
    skip: skipJobFetch, // Skip the query when we don't have a jobId
  });

  const isLoading = resumeLoading || (jobLoading && !skipJobFetch);

  // Function to get status badge color
  const getStatusColor = (status: ResumeStatus) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "REVIEWED":
        return "bg-purple-100 text-purple-800";
      case "INTERVIEWED":
        return "bg-yellow-100 text-yellow-800";
      case "HIRED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get appropriate icon based on status
  const getStatusIcon = (status: ResumeStatus) => {
    switch (status) {
      case "HIRED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "INTERVIEWED":
      case "REVIEWED":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "SUBMITTED":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format dates
  const formatDate = (dateString: string | number | Date) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Helper function to format commission display
  const formatCommissionDisplay = (job: any) => {
    if (!job.commission) {
      // Fallback to legacy commission field
      return job.commissionPercentage
        ? `${job.commissionPercentage}%`
        : "Not specified";
    }

    if (job.commission.type === "fixed") {
      return `${job.salary?.currency || "USD"} ${
        job.commission.fixedAmount?.toLocaleString() || "0"
      } (Fixed)`;
    } else {
      return `${job.commission.originalPercentage || 0}%`;
    }
  };

  // Helper function to get recruiter commission display
  const getRecruiterCommissionDisplay = (job: any) => {
    if (!job.commission) {
      return "Not specified";
    }

    if (job.commission.type === "fixed") {
      return `${job.salary?.currency || "USD"} ${
        job.commission.recruiterAmount?.toLocaleString() || "0"
      }`;
    } else {
      return `${job.commission.recruiterPercentage || 0}%`;
    }
  };

  if (resumeError) {
    return (
      <ProtectedLayout allowedRoles={["RECRUITER"]}>
        <DashboardLayout>
          <div className="py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Error Loading Submission
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    The submission details could not be loaded. You may not have
                    permission to view this submission.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() =>
                        router.push("/dashboard/recruiter/submissions")
                      }
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Submissions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["RECRUITER"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back button */}
            <button
              onClick={() => router.push("/dashboard/recruiter/submissions")}
              className="mb-6 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </button>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : resume ? (
              <>
                {/* Header with status */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {resume.candidateName}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Submitted on {formatDate(resume.submittedAt)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {getStatusIcon(resume.status)}
                      <span
                        className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          resume.status
                        )}`}
                      >
                        {resume.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Candidate information */}
                  <div className="lg:col-span-2">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Candidate Information
                        </h3>
                      </div>
                      <div className="border-t border-gray-200">
                        <dl>
                          <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              Full Name
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {resume.candidateName}
                            </dd>
                          </div>
                          <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                              <Mail className="h-4 w-4 mr-2" />
                              Email
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {resume.email}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              Phone
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {resume.phone}
                            </dd>
                          </div>
                          {resume.alternativePhone && (
                            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <Phone className="h-4 w-4 mr-2" />
                                Alternative Phone
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {resume.alternativePhone}
                              </dd>
                            </div>
                          )}
                          <div
                            className={`${
                              resume.alternativePhone
                                ? "bg-gray-50"
                                : "bg-white"
                            } px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}
                          >
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              Location
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {resume.location}, {resume.country}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                              <School className="h-4 w-4 mr-2" />
                              Qualification
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {resume.qualification}
                            </dd>
                          </div>
                          <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Current Annual CTC
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {resume.currentCTC}
                            </dd>
                          </div>
                          <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Expected Annual CTC
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {resume.expectedCTC}
                            </dd>
                          </div>
                          <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              Notice Period
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {resume.noticePeriod} days
                            </dd>
                          </div>

                          {resume.remarks && (
                            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Remarks
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {resume.remarks}
                              </dd>
                            </div>
                          )}

                          {/* Resume file section */}
                          <div
                            className={`${
                              resume.remarks ? "bg-white" : "bg-gray-50"
                            } px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}
                          >
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              Resume File
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              <div className="flex items-center">
                                <div className="flex-1 truncate">
                                  {resume.resumeFile
                                    ? resume.resumeFile
                                    : "No file uploaded"}
                                </div>
                                {resume.resumeFile && (
                                  <a
                                    href={`/api/resumes/${resume._id}/download`}
                                    className="ml-4 flex-shrink-0 font-medium text-indigo-600 hover:text-indigo-500"
                                  >
                                    <Download className="h-5 w-5" />
                                  </a>
                                )}
                              </div>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {/* Screening Questions */}
                    {resume.screeningAnswers &&
                      resume.screeningAnswers.length > 0 && (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
                          <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                              Screening Questions
                            </h3>
                          </div>
                          <div className="border-t border-gray-200">
                            <dl>
                              {resume.screeningAnswers.map((answer, index) => (
                                <div
                                  key={index}
                                  className={
                                    index % 2 === 0
                                      ? "bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
                                      : "bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
                                  }
                                >
                                  <dt className="text-sm font-medium text-gray-500">
                                    {typeof answer.questionId === "object" &&
                                    "question" in answer.questionId
                                      ? (answer.questionId
                                          .question as React.ReactNode)
                                      : `Question ${index + 1}`}
                                  </dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {answer.answer || "No answer provided"}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Job Information Sidebar */}
                  <div className="lg:col-span-1">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Job Details
                        </h3>
                      </div>
                      <div className="border-t border-gray-200">
                        {job && !skipJobFetch ? (
                          <dl>
                            <div className="bg-gray-50 px-4 py-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                <Briefcase className="h-4 w-4 mr-1" />
                                Job Title
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {job.title}
                              </dd>
                            </div>
                            <div className="bg-white px-4 py-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                Posted Date
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {formatDate(job.postedDate)}
                              </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                <MapPin className="h-4 w-4 mr-1" />
                                Location
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {job.location}, {job.country}
                              </dd>
                            </div>
                            <div className="bg-white px-4 py-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                <DollarSign className="h-4 w-4 mr-1" />
                                Salary Range
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {job.salary.currency}{" "}
                                {job.salary.min.toLocaleString()} -{" "}
                                {job.salary.max.toLocaleString()}
                              </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                <Award className="h-4 w-4 mr-1" />
                                Total Commission
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {formatCommissionDisplay(job)}
                              </dd>
                            </div>
                            <div className="bg-white px-4 py-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                <Award className="h-4 w-4 mr-1" />
                                Your Commission
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {getRecruiterCommissionDisplay(job)}
                              </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                <Clock className="h-4 w-4 mr-1" />
                                Experience
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {job.experienceLevel.min} -{" "}
                                {job.experienceLevel.max} Years
                              </dd>
                            </div>
                            <div className="bg-white px-4 py-4 sm:px-6">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/recruiter/jobs/${job._id}`
                                  )
                                }
                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                View Full Job Details
                              </button>
                            </div>
                          </dl>
                        ) : (
                          <div className="px-4 py-5 sm:px-6">
                            <p className="text-sm text-gray-500">
                              Job details not available
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submission Timeline */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Submission Timeline
                        </h3>
                      </div>
                      <div className="border-t border-gray-200">
                        <div className="flow-root px-4 py-5 sm:px-6">
                          <ul role="list" className="-mb-8">
                            <li>
                              <div className="relative pb-8">
                                <span
                                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                  aria-hidden="true"
                                ></span>
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                      <FileText className="h-5 w-5 text-white" />
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Resume{" "}
                                        <span className="font-medium text-gray-900">
                                          Submitted
                                        </span>
                                      </p>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                      {formatDate(resume.submittedAt)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>

                            {resume.status !== "SUBMITTED" && (
                              <li>
                                <div className="relative pb-8">
                                  {resume.status !== "REVIEWED" && (
                                    <span
                                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                      aria-hidden="true"
                                    ></span>
                                  )}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                                        <Clock className="h-5 w-5 text-white" />
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Resume{" "}
                                          <span className="font-medium text-gray-900">
                                            Reviewed
                                          </span>
                                        </p>
                                      </div>
                                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        {resume.reviewedAt
                                          ? formatDate(resume.reviewedAt)
                                          : "Date not recorded"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            )}

                            {resume.status === "INTERVIEWED" && (
                              <li>
                                <div className="relative pb-8">
                                  <span
                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                    aria-hidden="true"
                                  ></span>
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
                                        <User className="h-5 w-5 text-white" />
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Candidate{" "}
                                          <span className="font-medium text-gray-900">
                                            Interviewed
                                          </span>
                                        </p>
                                      </div>
                                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        {resume.interviewedAt
                                          ? formatDate(
                                              resume.interviewedAt as unknown as
                                                | string
                                                | number
                                                | Date
                                            )
                                          : "Date not recorded"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            )}

                            {resume.status === "HIRED" && (
                              <li>
                                <div className="relative">
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                        <CheckCircle className="h-5 w-5 text-white" />
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Candidate{" "}
                                          <span className="font-medium text-gray-900">
                                            Hired
                                          </span>
                                        </p>
                                      </div>
                                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        {resume.hiredAt
                                          ? formatDate(resume.hiredAt)
                                          : "Date not recorded"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            )}

                            {resume.status === "REJECTED" && (
                              <li>
                                <div className="relative">
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center ring-8 ring-white">
                                        <XCircle className="h-5 w-5 text-white" />
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Application{" "}
                                          <span className="font-medium text-gray-900">
                                            Rejected
                                          </span>
                                        </p>
                                      </div>
                                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        {resume.rejectedAt
                                          ? formatDate(resume.rejectedAt)
                                          : "Date not recorded"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">
                  No submission details available.
                </p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
