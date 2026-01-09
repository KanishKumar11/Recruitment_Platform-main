"use client";

import { useState } from "react";
import { useGetAllSubmissionsQuery } from "../../../store/services/resumesApi";
import ResumeStatusBadge from "@/app/components/company/ResumeStatusBadge";
import {
  Loader2,
  Filter,
  Search,
  Clock,
  CalendarClock,
  FileText,
  Send,
  ThumbsUp,
  PauseCircle,
  User,
  Eye,
  Award,
  Copy,
} from "lucide-react";
import ErrorAlert from "@/app/components/ui/ErrorAlert";
import ResumeDetailModal from "@/app/components/company/ResumeDetailModal";
import SubmitterInfo from "@/app/components/SubmitterInfo";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { ResumeStatus } from "@/app/constants/resumeStatus";
import { UserRole } from "@/app/constants/userRoles";

export default function InternalSubmissionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [jobFilter, setJobFilter] = useState<string>("");
  const [recruiterFilter, setRecruiterFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResumeForModal, setSelectedResumeForModal] = useState<
    string | null
  >(null);

  const {
    data: resumes,
    isLoading,
    isError,
    error,
  } = useGetAllSubmissionsQuery();

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setJobFilter("");
    setRecruiterFilter("");
  };

  // Get unique job IDs and titles from resumes - Fixed to handle object structure
  const uniqueJobs = resumes
    ? [...new Set(resumes.map((resume) => resume.jobId?._id || ""))]
      .filter((id) => id)
      .map((jobId) => {
        const resume = resumes.find((r) => r.jobId?._id === jobId);
        return {
          id: jobId,
          title:
            typeof resume?.jobId === "object" &&
              "title" in (resume?.jobId ?? {})
              ? (resume.jobId as { title?: string }).title || "Unknown Job"
              : "Unknown Job",
        };
      })
    : [];

  // Get unique recruiters - Fixed to properly handle null/undefined values
  const uniqueRecruiters = resumes
    ? [...new Set(resumes.map((resume) => resume.submittedBy?._id || ""))]
      .filter((id) => id)
      .map((recruiterId) => {
        const resume = resumes.find(
          (r) => r.submittedBy?._id === recruiterId
        );
        return {
          id: recruiterId,
          name:
            typeof resume?.submittedBy === "object" &&
              "name" in (resume?.submittedBy ?? {})
              ? (resume.submittedBy as { name?: string }).name ||
              "Unknown Recruiter"
              : "Unknown Recruiter",
        };
      })
    : [];

  const handleOpenModal = (resumeId: string) => {
    setSelectedResumeForModal(resumeId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResumeForModal(null);
  };

  // Filter resumes based on search term, status filter, job filter, and recruiter filter
  const filteredResumes = resumes
    ? resumes
      .filter((resume) => {
        const matchesSearch =
          searchTerm === "" ||
          resume.candidateName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (typeof resume.jobId === "object" &&
            "title" in (resume.jobId ?? {}) &&
            (resume.jobId as { title?: string }).title
            ? ((resume.jobId as { title?: string }).title as string)
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
            : false) ||
          resume.qualification
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (resume.email || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "" || resume.status === statusFilter;

        const matchesJob =
          jobFilter === "" ||
          (resume.jobId?._id?.toString() || "") === jobFilter;

        const matchesRecruiter =
          recruiterFilter === "" ||
          (resume.submittedBy?._id?.toString() || "") === recruiterFilter;

        return (
          matchesSearch && matchesStatus && matchesJob && matchesRecruiter
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];

  // Stats calculation
  const getStatusCount = (status: ResumeStatus) => {
    return resumes
      ? resumes.filter((resume) => resume.status === status).length
      : 0;
  };

  const StatCard = (props: {
    icon: React.ReactNode;
    bgColor: string;
    title: string;
    count: number;
  }) => (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${props.bgColor} rounded-md p-2`}>
          {props.icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{props.title}</p>
          <p className="text-lg font-semibold text-gray-900">{props.count}</p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2">Loading submissions...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorAlert
        message={(error as any)?.data?.error || "Failed to load submissions"}
      />
    );
  }

  return (
    <ProtectedLayout allowedRoles={[UserRole.INTERNAL, UserRole.ADMIN]}>
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">All Submissions</h1>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
            {/* Total submissions */}
            <StatCard
              icon={<FileText className="h-6 w-6 text-indigo-600" />}
              bgColor="bg-indigo-100"
              title="Total Submissions"
              count={resumes?.length || 0}
            />

            {/* Submitted */}
            <StatCard
              icon={<Send className="h-6 w-6 text-blue-600" />}
              bgColor="bg-blue-100"
              title="Submitted"
              count={getStatusCount(ResumeStatus.SUBMITTED)}
            />

            {/* Reviewed */}
            <StatCard
              icon={<Clock className="h-6 w-6 text-purple-600" />}
              bgColor="bg-purple-100"
              title="Reviewed"
              count={getStatusCount(ResumeStatus.REVIEWED)}
            />

            {/* Shortlisted */}
            <StatCard
              icon={<ThumbsUp className="h-6 w-6 text-indigo-600" />}
              bgColor="bg-indigo-100"
              title="Shortlisted"
              count={getStatusCount(ResumeStatus.SHORTLISTED)}
            />

            {/* Duplicate */}
            <StatCard
              icon={<Copy className="h-6 w-6 text-amber-600" />}
              bgColor="bg-amber-100"
              title="Duplicate"
              count={getStatusCount(ResumeStatus.DUPLICATE)}
            />

            {/* On Hold */}
            <StatCard
              icon={<PauseCircle className="h-6 w-6 text-orange-600" />}
              bgColor="bg-orange-100"
              title="On Hold"
              count={getStatusCount(ResumeStatus.ONHOLD)}
            />

            {/* Interviewed */}
            <StatCard
              icon={<User className="h-6 w-6 text-yellow-600" />}
              bgColor="bg-yellow-100"
              title="Interviewed"
              count={getStatusCount(ResumeStatus.INTERVIEWED)}
            />

            {/* Hired */}
            <StatCard
              icon={<Award className="h-6 w-6 text-green-600" />}
              bgColor="bg-green-100"
              title="Hired"
              count={getStatusCount(ResumeStatus.HIRED)}
            />

            {/* Rejected */}
            <StatCard
              icon={<User className="h-6 w-6 text-red-600" />}
              bgColor="bg-red-100"
              title="Rejected"
              count={getStatusCount(ResumeStatus.REJECTED)}
            />
          </div>

          {/* Search and Filter Controls */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, job, qualification or email"
                    className="pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">All Statuses</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="DUPLICATE">Duplicate</option>
                    <option value="ONHOLD">On Hold</option>
                    <option value="INTERVIEWED">Interviewed</option>
                    <option value="HIRED">Hired</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Job
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={jobFilter}
                    onChange={(e) => setJobFilter(e.target.value)}
                    className="pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">All Jobs</option>
                    {uniqueJobs.map((job) => (
                      <option
                        key={job.id?.toString()}
                        value={job.id?.toString()}
                      >
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Recruiter
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={recruiterFilter}
                    onChange={(e) => setRecruiterFilter(e.target.value)}
                    className="pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">All Recruiters</option>
                    {uniqueRecruiters.map((recruiter) => (
                      <option
                        key={recruiter.id?.toString()}
                        value={recruiter.id?.toString()}
                      >
                        {recruiter.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-span-1 flex items-end">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full justify-center"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              {filteredResumes.length === 0 ? (
                <div className="text-center py-10">
                  <CalendarClock className="mx-auto h-12 w-12 text-gray-400" />
                  <h2 className="text-xl font-semibold mt-2">
                    No submissions found
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {resumes && resumes.length > 0
                      ? "Try adjusting your search filters"
                      : "No resumes have been submitted yet"}
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[130px]">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[350px]">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                        Submitted By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResumes.map((resume) => (
                      <tr
                        key={resume._id as string}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleOpenModal(resume._id as string)}
                      >
                        <td className="px-6 py-4 w-[130px]">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[130px]" title={resume.candidateName}>
                            {resume.candidateName}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-[130px]">
                            {resume.phone || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 w-[350px]">
                          <div className="text-sm text-gray-900 flex items-center">
                            <span className="truncate max-w-[280px]" title={typeof resume.jobId === "object" &&
                              "title" in (resume.jobId ?? {})
                              ? (resume.jobId as { title?: string }).title ||
                              "Unknown Job"
                              : "Unknown Job"}>
                              {typeof resume.jobId === "object" &&
                                "title" in (resume.jobId ?? {})
                                ? (resume.jobId as { title?: string }).title ||
                                "Unknown Job"
                                : "Unknown Job"}
                            </span>
                            <Eye
                              className="ml-2 h-4 w-4 text-indigo-500 cursor-pointer hover:text-indigo-700 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(resume._id as string);
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <div className="flex flex-wrap gap-2">
                              <span className="bg-blue-50 px-2 py-1 rounded text-xs">
                                {typeof resume.jobId === "object" && "jobCode" in (resume.jobId ?? {})
                                  ? (resume.jobId as { jobCode?: string }).jobCode || "N/A"
                                  : "N/A"}
                              </span>
                              <span className="bg-green-50 px-2 py-1 rounded text-xs truncate max-w-[140px]">
                                Location: {typeof resume.jobId === "object" && "location" in (resume.jobId ?? {})
                                  ? (resume.jobId as { location?: string }).location || "N/A"
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 w-[200px] text-sm text-gray-500">
                          <div className="truncate">
                            <SubmitterInfo
                              submitterId={
                                typeof resume.submittedBy === "object" &&
                                  resume.submittedBy &&
                                  "_id" in resume.submittedBy
                                  ? (resume.submittedBy as any)._id?.toString() ||
                                  (resume.submittedBy as any)._id
                                  : (resume.submittedBy as string)?.toString() ||
                                  resume.submittedBy
                              }
                              fallbackName={
                                typeof resume.submittedBy === "object" &&
                                  resume.submittedBy &&
                                  "name" in resume.submittedBy
                                  ? (resume.submittedBy as { name?: string }).name
                                  : undefined
                              }
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 w-[100px]">
                          <ResumeStatusBadge status={resume.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>

      {/* Resume Detail Modal */}
      {isModalOpen && selectedResumeForModal && (
        <ResumeDetailModal
          resumeId={selectedResumeForModal}
          onClose={handleCloseModal}
        />
      )}
    </ProtectedLayout>
  );
}
