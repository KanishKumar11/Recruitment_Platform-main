// app/dashboard/internal/jobs/[id]/resumes/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetResumesByJobIdQuery } from "../../../../../store/services/resumesApi";
import { ResumeStatus } from "@/app/constants/resumeStatus";
import ResumeStatusBadge from "@/app/components/company/ResumeStatusBadge";
import ResumeDetailModal from "@/app/components/company/ResumeDetailModal";
import {
  Loader2,
  ArrowLeft,
  FileQuestion,
  Download,
  FileText,
  FileSpreadsheet,
  Eye,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Calendar,
  Filter,
  Search,
} from "lucide-react";
import ErrorAlert from "@/app/components/ui/ErrorAlert";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import ExcelJS from "exceljs";

export default function InternalJobResumesPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const {
    data: resumesData,
    isLoading,
    isError,
    error,
  } = useGetResumesByJobIdQuery(jobId);

  // Explicitly type the resumesData to match the expected API response
  type ResumesResponse =
    | { resumes: Array<any>; jobPostedBy?: string; jobTitle?: string }
    | Array<any>;
  const typedResumesData = resumesData as ResumesResponse;

  // Handle both data formats - array or object with resumes property
  const resumes = Array.isArray(typedResumesData)
    ? typedResumesData
    : typedResumesData?.resumes;
  const jobPostedBy = !Array.isArray(typedResumesData)
    ? typedResumesData?.jobPostedBy
    : null;
  const jobTitle = !Array.isArray(typedResumesData)
    ? typedResumesData?.jobTitle
    : null;

  // Filter and sort resumes
  const filteredAndSortedResumes = resumes
    ?.filter((resume) => {
      const matchesSearch =
        resume.candidateName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        resume.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.currentCompany
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        resume.skills?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || resume.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    ?.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.candidateName?.localeCompare(b.candidateName) || 0;
        case "status":
          return a.status?.localeCompare(b.status) || 0;
        case "experience":
          return (
            (parseFloat(b.totalExperience) || 0) -
            (parseFloat(a.totalExperience) || 0)
          );
        case "date":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  const handleBack = () => {
    router.back();
  };

  const handleViewResume = (resumeId: string) => {
    setSelectedResumeId(resumeId);
  };

  const handleCloseModal = () => {
    setSelectedResumeId(null);
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

  const downloadWorkbook = async (workbook: ExcelJS.Workbook, fileName: string) => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Function to download as Excel (using ExcelJS)
  const downloadAsExcel = async (resume: any) => {
    const candidateData = prepareCandidateDataForDownload(resume);

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Candidate Details");

    const headers = Object.keys(candidateData);
    ws.columns = headers.map((key) => ({
      header: key,
      key,
      width: Math.max(
        key.length,
        String(candidateData[key as keyof typeof candidateData]).length,
        15
      ),
    }));

    ws.addRow(candidateData);

    const fileName = `candidate_${resume.candidateName.replace(/\s+/g, "_")}_${new Date().getTime()}.xlsx`;
    await downloadWorkbook(workbook, fileName);

    setDownloadDropdownOpen(null);
  };

  // Function to download all candidates as Excel
  const downloadAllCandidatesAsExcel = async () => {
    if (!resumes || resumes.length === 0) return;

    const allCandidatesData = resumes.map((resume) =>
      prepareCandidateDataForDownload(resume)
    );

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("All Candidates");

    const headers = Object.keys(allCandidatesData[0]);
    ws.columns = headers.map((key) => ({ header: key, key, width: Math.max(key.length, 20) }));
    allCandidatesData.forEach((row) => ws.addRow(row));

    const fileName = `all_candidates_job_${jobId}_${new Date().getTime()}.xlsx`;
    await downloadWorkbook(workbook, fileName);
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

  if (isLoading) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-2">Loading resumes...</span>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  if (isError) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
        <DashboardLayout>
          <ErrorAlert
            message={(error as any)?.data?.error || "Failed to load resumes"}
          />
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  if (!resumes || resumes.length === 0) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
        <DashboardLayout>
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900 mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </button>
            <div className="text-center py-12">
              <FileQuestion className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold mb-2 text-gray-900">
                No Resumes Yet
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                No resumes have been submitted for this job posting yet. Check
                back later as applications come in.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
      <DashboardLayout>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900 mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                {jobTitle && (
                  <div className="text-lg font-medium text-gray-700 mb-1">
                    {jobTitle}
                  </div>
                )}
                {jobPostedBy && (
                  <div className="text-sm text-gray-500">
                    Job posted by:{" "}
                    <span className="font-medium">{jobPostedBy}</span>
                  </div>
                )}
              </div>

              {/* Bulk Download Options */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={downloadAllCandidatesAsCSV}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Download All (CSV)
                </button>
                <button
                  onClick={downloadAllCandidatesAsExcel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Download All (Excel)
                </button>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search candidates, email, company, skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="INTERVIEWED">Interviewed</option>
                  <option value="SELECTED">Selected</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Sort */}
              <div className="sm:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="status">Sort by Status</option>
                  <option value="experience">Sort by Experience</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600" style={{ color: 'green' }}>
              Showing {filteredAndSortedResumes?.length || 0} of{" "}
              {resumes.length} candidates
            </div>
          </div>

          {/* Resume Cards */}
          <div className="space-y-4">
            {filteredAndSortedResumes?.map((resume) => (
              <div
                key={resume._id as string}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-indigo-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-lg font-semibold text-gray-900 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => handleViewResume(resume._id as string)}
                          >
                            {resume.candidateName}
                          </h3>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{resume.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span>{resume.phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ResumeStatusBadge
                        status={resume.status as ResumeStatus}
                      />

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <div
                          onClick={() => handleViewResume(resume._id as string)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          title="View Details"
                          style={{ color: 'green' }}
                        >
                          View Details
                        </div>

                        {/* Individual Download Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              toggleDownloadDropdown(resume._id as string)
                            }
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
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
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {/* Current Role */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-gray-500 mb-1">
                        <Briefcase className="h-4 w-4" />
                        <span className="font-medium">Current Role</span>
                      </div>
                      <div
                        className={`font-medium whitespace-nowrap overflow-hidden text-ellipsis ${(resume.currentDesignation?.length || 0) > 25 ? "text-xs" : "text-gray-900"
                          }`}
                        title={resume.currentDesignation || "Not specified"}
                      >
                        {resume.currentDesignation || "Not specified"}
                      </div>
                      <div
                        className={`text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis ${(resume.currentCompany?.length || 0) > 25 ? "text-xs" : ""
                          }`}
                        title={resume.currentCompany || "Not specified"}
                      >
                        {resume.currentCompany || "Not specified"}
                      </div>
                    </div>

                    {/* Experience */}
                    <div>
                      <div className="flex items-center gap-1 text-gray-500 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Experience</span>
                      </div>
                      <div className="text-gray-900">
                        Total: {resume.totalExperience || "Not specified"}
                      </div>
                      <div className="text-gray-900">
                        Relevant: {resume.relevantExperience || "Not specified"}
                      </div>
                    </div>

                    {/* CTC */}
                    <div>
                      <div className="flex items-center gap-1 text-gray-500 mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">CTC</span>
                      </div>
                      <div className="text-gray-900">
                        Current: {resume.currentCTC || "Not specified"}
                      </div>
                      <div className="text-gray-900">
                        Expected: {resume.expectedCTC || "Not specified"}
                      </div>
                    </div>

                    {/* Notice Period */}
                    <div>
                      <div className="flex items-center gap-1 text-gray-500 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Notice Period: </span>
                        <span className="text-gray-900">
                          {resume.noticePeriod || "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      Submitted by{" "}
                      <span className="font-medium text-gray-700">
                        {resume.submitterName || "Unknown Recruiter"}
                      </span>{" "}
                      on {new Date(resume.createdAt).toLocaleDateString()}
                    </div>

                    {resume.skills && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Skills: </span>
                        <span className="truncate">
                          {Array.isArray(resume.skills)
                            ? resume.skills.join(", ")
                            : resume.skills}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredAndSortedResumes?.length === 0 && (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No matching candidates
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria to find more
                candidates.
              </p>
            </div>
          )}

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
