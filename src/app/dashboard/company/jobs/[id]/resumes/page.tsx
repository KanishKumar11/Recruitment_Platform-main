// app/dashboard/company/jobs/[jobId]/resumes/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useGetResumesByJobIdQuery,
  useUpdateResumeStatusMutation,
} from "../../../../../store/services/resumesApi";
import { ResumeStatus } from "@/app/constants/resumeStatus";
import ResumeStatusBadge from "@/app/components/company/ResumeStatusBadge";
import ResumeDetailModal from "@/app/components/company/ResumeDetailModal";
import {
  Loader2,
  ArrowLeft,
  Edit,
  FileQuestion,
  ChevronDown,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import ErrorAlert from "@/app/components/ui/ErrorAlert";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import * as XLSX from "xlsx";

export default function JobResumesPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(
    null
  );
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState<
    string | null
  >(null);

  const {
    data: resumesData,
    isLoading,
    isError,
    error,
  } = useGetResumesByJobIdQuery(jobId);

  const [updateResumeStatus, { isLoading: isUpdatingStatus }] =
    useUpdateResumeStatusMutation();

  // Explicitly type the resumesData to match the expected API response
  type ResumesResponse =
    | { resumes: Array<any>; jobPostedBy?: string }
    | Array<any>;
  const typedResumesData = resumesData as ResumesResponse;

  // Handle both data formats - array or object with resumes property
  const resumes = Array.isArray(typedResumesData)
    ? typedResumesData
    : typedResumesData?.resumes;
  const jobPostedBy = !Array.isArray(typedResumesData)
    ? typedResumesData?.jobPostedBy
    : null;

  const handleBack = () => {
    router.back();
  };

  const handleViewResume = (resumeId: string) => {
    setSelectedResumeId(resumeId);
  };

  const handleCloseModal = () => {
    setSelectedResumeId(null);
  };

  const handleStatusUpdate = async (
    resumeId: string,
    newStatus: ResumeStatus
  ) => {
    try {
      await updateResumeStatus({ id: resumeId, status: newStatus }).unwrap();
      setStatusDropdownOpen(null);
    } catch (error) {
      console.error("Failed to update status:", error);
      // You might want to show a toast notification here
    }
  };

  const toggleStatusDropdown = (resumeId: string) => {
    setStatusDropdownOpen(statusDropdownOpen === resumeId ? null : resumeId);
  };

  const toggleDownloadDropdown = (resumeId: string) => {
    setDownloadDropdownOpen(
      downloadDropdownOpen === resumeId ? null : resumeId
    );
  };

  // Function to prepare candidate data for download
  const prepareCandidateDataForDownload = (resume: any) => {
    return {
      "Candidate Name": resume.candidateName || "",
      Email: resume.email || "",
      Phone: resume.phone || "",
      Qualification: resume.qualification || "",
      "Current Designation": resume.currentDesignation || "Not specified",
      "Current Company": resume.currentCompany || "Not specified",
      "Total Experience": resume.totalExperience || "Not specified",
      "Relevant Experience": resume.relevantExperience || "Not specified",
      "Current CTC": resume.currentCTC || "",
      "Expected CTC": resume.expectedCTC || "",
      "Notice Period": resume.noticePeriod || "",
      Status: resume.status || "",
      "Submitted By": resume.submitterName || "Unknown Recruiter",
      "Submitted On": new Date(resume.createdAt).toLocaleDateString(),
      Skills: resume.skills
        ? Array.isArray(resume.skills)
          ? resume.skills.join(", ")
          : resume.skills
        : "",
      Location: resume.location || "",
      "Preferred Location": resume.preferredLocation || "",
      "Job Code": resume.jobCode || "",
      "Additional Notes": resume.notes || "",
    };
  };

  // Function to download as CSV
  const downloadAsCSV = (resume: any) => {
    const candidateData = prepareCandidateDataForDownload(resume);

    // Convert object to CSV format
    const headers = Object.keys(candidateData);
    const values = Object.values(candidateData);

    const csvContent = [
      headers.join(","),
      values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `candidate_${resume.candidateName.replace(
        /\s+/g,
        "_"
      )}_${new Date().getTime()}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadDropdownOpen(null);
  };

  // Function to download as Excel
  const downloadAsExcel = (resume: any) => {
    const candidateData = prepareCandidateDataForDownload(resume);

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet format
    const wsData = [Object.keys(candidateData), Object.values(candidateData)];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths for better readability
    const colWidths = Object.keys(candidateData).map((key) => ({
      wch: Math.max(
        key.length,
        String(candidateData[key as keyof typeof candidateData]).length,
        15
      ),
    }));
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Candidate Details");

    // Save the file
    const fileName = `candidate_${resume.candidateName.replace(
      /\s+/g,
      "_"
    )}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);

    setDownloadDropdownOpen(null);
  };

  // Function to download all candidates as Excel
  const downloadAllCandidatesAsExcel = () => {
    if (!resumes || resumes.length === 0) return;

    const allCandidatesData = resumes.map((resume) =>
      prepareCandidateDataForDownload(resume)
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(allCandidatesData);

    // Set column widths
    const colWidths = Object.keys(allCandidatesData[0]).map((key) => ({
      wch: Math.max(key.length, 20),
    }));
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "All Candidates");

    const fileName = `all_candidates_job_${jobId}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Function to download all candidates as CSV
  const downloadAllCandidatesAsCSV = () => {
    if (!resumes || resumes.length === 0) return;

    const allCandidatesData = resumes.map((resume) =>
      prepareCandidateDataForDownload(resume)
    );

    if (allCandidatesData.length === 0) return;

    const headers = Object.keys(allCandidatesData[0]);
    const csvContent = [
      headers.join(","),
      ...allCandidatesData.map((candidate) =>
        Object.values(candidate)
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `all_candidates_job_${jobId}_${new Date().getTime()}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status options for dropdown
  const statusOptions = [
    {
      value: ResumeStatus.SUBMITTED,
      label: "Submitted",
      color: "text-blue-600",
    },
    {
      value: ResumeStatus.REVIEWED,
      label: "Reviewed",
      color: "text-indigo-600",
    },
    {
      value: ResumeStatus.SHORTLISTED,
      label: "Shortlisted",
      color: "text-green-600",
    },
    { value: ResumeStatus.ONHOLD, label: "On Hold", color: "text-yellow-600" },
    {
      value: ResumeStatus.INTERVIEW_IN_PROCESS,
      label: "Interview in Process",
      color: "text-orange-600",
    },
    {
      value: ResumeStatus.INTERVIEWED,
      label: "Interviewed",
      color: "text-purple-600",
    },
    {
      value: ResumeStatus.SELECTED_IN_FINAL_INTERVIEW,
      label: "Selected in Final Interview",
      color: "text-teal-600",
    },
    { value: ResumeStatus.OFFERED, label: "Offered", color: "text-cyan-600" },
    {
      value: ResumeStatus.OFFER_DECLINED,
      label: "Offer Declined",
      color: "text-rose-600",
    },
    { value: ResumeStatus.HIRED, label: "Hired", color: "text-emerald-600" },
    { value: ResumeStatus.REJECTED, label: "Rejected", color: "text-red-600" },
    {
      value: ResumeStatus.DUPLICATE,
      label: "Duplicate",
      color: "text-gray-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2">Loading resumes...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorAlert
        message={(error as any)?.data?.error || "Failed to load resumes"}
      />
    );
  }

  if (!resumes || resumes.length === 0) {
    return (
      <div className="p-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </button>
        <div className="text-center py-10">
          <FileQuestion className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2">No Resumes Yet</h2>
          <p className="text-gray-600">
            No resumes have been submitted for this job posting yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["COMPANY"]}>
      <DashboardLayout>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Job
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {jobPostedBy && (
                <div className="text-sm text-gray-500">
                  Job posted by:{" "}
                  <span className="font-medium">{jobPostedBy}</span>
                </div>
              )}

              {/* Bulk Download Options */}
              <div className="flex gap-2">
                <button
                  onClick={downloadAllCandidatesAsCSV}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Download All (CSV)
                </button>
                <button
                  onClick={downloadAllCandidatesAsExcel}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Download All (Excel)
                </button>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-6">
            Resumes ({resumes.length})
          </h1>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CTC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notice Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resumes.map((resume) => (
                    <tr key={resume._id as string} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {resume.candidateName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resume.qualification}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {resume.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resume.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {resume.currentDesignation || "Not specified"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resume.currentCompany || "Not specified"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Total: {resume.totalExperience || "Not specified"}
                        </div>
                        <div className="text-sm text-gray-500">
                          Relevant:{" "}
                          {resume.relevantExperience || "Not specified"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Current: {resume.currentCTC}
                        </div>
                        <div className="text-sm text-gray-500">
                          Expected: {resume.expectedCTC}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resume.noticePeriod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resume.submitterName || "Unknown Recruiter"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <button
                            onClick={() =>
                              toggleStatusDropdown(resume._id as string)
                            }
                            className="inline-flex items-center space-x-1 hover:bg-gray-100 rounded-md p-1"
                            disabled={isUpdatingStatus}
                          >
                            <ResumeStatusBadge
                              status={resume.status as ResumeStatus}
                            />
                            <ChevronDown className="h-3 w-3 text-gray-400" />
                          </button>

                          {statusDropdownOpen === resume._id && (
                            <div className="absolute top-full left-0 z-10 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                              <div className="py-1 max-h-64 overflow-y-auto">
                                {statusOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() =>
                                      handleStatusUpdate(
                                        resume._id as string,
                                        option.value
                                      )
                                    }
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                      resume.status === option.value
                                        ? "bg-gray-50 font-medium"
                                        : ""
                                    } ${option.color}`}
                                    disabled={isUpdatingStatus}
                                  >
                                    {option.label}
                                    {resume.status === option.value && (
                                      <span className="ml-2 text-gray-400">
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() =>
                              handleViewResume(resume._id as string)
                            }
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </button>

                          {/* Individual Download Dropdown */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                toggleDownloadDropdown(resume._id as string)
                              }
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Export"
                            >
                              <Download className="h-4 w-4" />
                            </button>

                            {downloadDropdownOpen === resume._id && (
                              <div className="absolute top-full right-0 z-10 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg">
                                <div className="py-1">
                                  <button
                                    onClick={() => downloadAsCSV(resume)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <FileText className="mr-2 h-4 w-4" />
                                    CSV
                                  </button>
                                  <button
                                    onClick={() => downloadAsExcel(resume)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Excel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedResumeId && (
            <ResumeDetailModal
              resumeId={selectedResumeId}
              onClose={handleCloseModal}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
