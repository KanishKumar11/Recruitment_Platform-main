// src/app/components/admin/AdminResumeView.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useGetResumeByIdQuery,
  useUpdateResumeStatusMutation,
} from "@/app/store/services/resumesApi";
import { ResumeStatus } from "@/app/models/Resume";
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
  Copy, // Added for duplicate icon
  Eye,
  X,
} from "lucide-react";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { format } from "date-fns";

export default function AdminResumeView({
  resumeId,
  onClose,
}: {
  resumeId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data: resume, isLoading, error } = useGetResumeByIdQuery(resumeId);
  const [updateResumeStatus] = useUpdateResumeStatusMutation();
  const [previewDocument, setPreviewDocument] = useState<{
    filename: string;
    originalName: string;
  } | null>(null);

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
      case "DUPLICATE":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: ResumeStatus) => {
    switch (status) {
      case "HIRED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "DUPLICATE":
        return <Copy className="h-5 w-5 text-orange-500" />;
      case "INTERVIEWED":
      case "REVIEWED":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "SUBMITTED":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string | number | Date) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (e) {
      return "Invalid Date";
    }
  };

  const handleStatusChange = async (status: ResumeStatus) => {
    try {
      await updateResumeStatus({ id: resumeId, status });
    } catch (error) {
      console.error("Error updating resume status:", error);
    }
  };

  // Helper function to check if file can be previewed
  const canPreviewFile = (filename: string) => {
    const extension = filename.toLowerCase().split(".").pop();
    return ["pdf", "jpg", "jpeg", "png", "gif", "bmp", "webp", "txt"].includes(
      extension || ""
    );
  };

  // Helper function to get preview URL for additional documents
  const getDocumentPreviewUrl = (filename: string) => {
    const token = localStorage.getItem("token") || "";
    return `/api/resumes/download/${filename}?token=${encodeURIComponent(
      token
    )}`;
  };

  // Helper function to handle additional document download
  const handleDocumentDownload = async (
    filename: string,
    originalName: string
  ) => {
    try {
      const downloadUrl = `/api/resumes/download/${filename}?download=true`;

      // Fetch the file with authentication headers
      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }

      // Get the file blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Document download failed:", error);
      alert("Failed to download document. Please try again.");
    }
  };

  if (error) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN"]}>
        <DashboardLayout>
          <div className="py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Error Loading Submission
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    The submission details could not be loaded. You may not have
                    permission to view this submission.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() =>
                        router.push("/dashboard/admin/submissions")
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
    <ProtectedLayout allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back button */}
            <button
              onClick={() => router.push("/dashboard/admin/submissions")}
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

                          {/* Additional Documents section */}
                          {resume.additionalDocuments &&
                            resume.additionalDocuments.length > 0 && (
                              <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500 flex items-center">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Additional Documents (
                                  {resume.additionalDocuments.length})
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                  <div className="space-y-2">
                                    {resume.additionalDocuments.map(
                                      (doc, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                                        >
                                          <div className="flex items-center">
                                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                                            <div>
                                              <span className="text-sm font-medium text-gray-900">
                                                {doc.originalName}
                                              </span>
                                              <p className="text-xs text-gray-500">
                                                Uploaded on{" "}
                                                {new Date(
                                                  doc.uploadedAt
                                                ).toLocaleDateString()}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex space-x-2">
                                            {canPreviewFile(doc.filename) && (
                                              <button
                                                onClick={() =>
                                                  setPreviewDocument({
                                                    filename: doc.filename,
                                                    originalName:
                                                      doc.originalName,
                                                  })
                                                }
                                                className="flex-shrink-0 font-medium text-gray-600 hover:text-gray-500"
                                              >
                                                <Eye className="h-4 w-4" />
                                              </button>
                                            )}
                                            <button
                                              onClick={() =>
                                                handleDocumentDownload(
                                                  doc.filename,
                                                  doc.originalName
                                                )
                                              }
                                              className="flex-shrink-0 font-medium text-indigo-600 hover:text-indigo-500"
                                            >
                                              <Download className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </dd>
                              </div>
                            )}
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
                        {resume.jobTitle && (
                          <dl>
                            <div className="bg-gray-50 px-4 py-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                <Briefcase className="h-4 w-4 mr-1" />
                                Job Title
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {resume.jobTitle}
                              </dd>
                            </div>
                            <div className="bg-white px-4 py-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                Posted Date
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {formatDate(resume.submittedAt)}
                              </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                <MapPin className="h-4 w-4 mr-1" />
                                Location
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {resume.location}, {resume.country}
                              </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-4 sm:px-6">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/jobs/${resume.jobId}`
                                  )
                                }
                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                View Full Job Details
                              </button>
                            </div>
                          </dl>
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
                                  {resume.status !== "REVIEWED" &&
                                    resume.status !== "DUPLICATE" && (
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
                                          ? formatDate(resume.interviewedAt)
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

                            {resume.status === "DUPLICATE" && (
                              <li>
                                <div className="relative">
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center ring-8 ring-white">
                                        <Copy className="h-5 w-5 text-white" />
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Application{" "}
                                          <span className="font-medium text-gray-900">
                                            Marked as Duplicate
                                          </span>
                                        </p>
                                      </div>
                                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        {resume.duplicateAt
                                          ? formatDate(resume.duplicateAt)
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

        {/* Document Preview Modal */}
        {previewDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
            <div className="bg-white p-4 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Preview: {previewDocument.originalName}
                </h3>
                <button
                  onClick={() => setPreviewDocument(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="w-full h-96">
                {previewDocument.filename.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={getDocumentPreviewUrl(previewDocument.filename)}
                    className="w-full h-full border border-gray-300 rounded-lg"
                    title={`Preview of ${previewDocument.originalName}`}
                  />
                ) : previewDocument.filename
                    .toLowerCase()
                    .match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                  <img
                    src={getDocumentPreviewUrl(previewDocument.filename)}
                    alt={`Preview of ${previewDocument.originalName}`}
                    className="w-full h-full object-contain border border-gray-300 rounded-lg"
                  />
                ) : previewDocument.filename.toLowerCase().endsWith(".txt") ? (
                  <iframe
                    src={getDocumentPreviewUrl(previewDocument.filename)}
                    className="w-full h-full border border-gray-300 rounded-lg"
                    title={`Preview of ${previewDocument.originalName}`}
                  />
                ) : (
                  <div className="w-full h-full border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Preview not available for this file type
                      </p>
                      <button
                        onClick={() =>
                          handleDocumentDownload(
                            previewDocument.filename,
                            previewDocument.originalName
                          )
                        }
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download File
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedLayout>
  );
}
