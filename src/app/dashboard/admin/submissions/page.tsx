"use client";

import { useState } from "react";
import {
  useGetAllSubmissionsQuery,
  useUpdateResumeStatusMutation,
  useDeleteResumeMutation,
} from "../../../store/services/resumesApi";
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
  FileQuestion,
  CheckCircle,
  AlertCircle,
  Copy,
  Trash2,
  X,
} from "lucide-react";
import ErrorAlert from "@/app/components/ui/ErrorAlert";
import ResumeDetailModal from "@/app/components/company/ResumeDetailModal";
import SubmitterInfo from "@/app/components/SubmitterInfo";

import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { ResumeStatus } from "@/app/constants/resumeStatus";
import { useRouter } from "next/navigation";

export default function AdminSubmissionsPage() {
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [jobFilter, setJobFilter] = useState<string>("");
  const [recruiterFilter, setRecruiterFilter] = useState<string>("");
  const [updateStatusLoading, setUpdateStatusLoading] = useState<
    Record<string, boolean>
  >({});
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(
    null
  );
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResumeForModal, setSelectedResumeForModal] = useState<
    string | null
  >(null);

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<{
    id: string;
    candidateName: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const router = useRouter();

  const {
    data: resumes,
    isLoading,
    isError,
    error,
  } = useGetAllSubmissionsQuery();

  const [updateResumeStatus] = useUpdateResumeStatusMutation();
  const [deleteResume] = useDeleteResumeMutation();

  const handleStatusChange = async (
    resumeId: string,
    newStatus: ResumeStatus
  ) => {
    setUpdateStatusLoading((prev) => ({ ...prev, [resumeId]: true }));
    setStatusUpdateSuccess(null);
    setStatusUpdateError(null);

    try {
      await updateResumeStatus({ id: resumeId, status: newStatus }).unwrap();
      setStatusUpdateSuccess(
        `Resume status updated successfully to ${newStatus}`
      );

      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatusUpdateSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Failed to update status:", err);
      setStatusUpdateError("Failed to update status. Please try again.");

      // Clear error message after 3 seconds
      setTimeout(() => {
        setStatusUpdateError(null);
      }, 3000);
    } finally {
      setUpdateStatusLoading((prev) => ({ ...prev, [resumeId]: false }));
    }
  };

  // Delete functions
  const handleDeleteClick = (resumeId: string, candidateName: string) => {
    setResumeToDelete({ id: resumeId, candidateName });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resumeToDelete) return;

    setDeleteLoading(true);
    setDeleteSuccess(null);
    setDeleteError(null);

    try {
      await deleteResume(resumeToDelete.id).unwrap();
      setDeleteSuccess(
        `Resume for ${resumeToDelete.candidateName} deleted successfully`
      );
      setShowDeleteConfirm(false);
      setResumeToDelete(null);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setDeleteSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Failed to delete resume:", err);
      setDeleteError("Failed to delete resume. Please try again.");

      // Clear error message after 3 seconds
      setTimeout(() => {
        setDeleteError(null);
      }, 3000);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setResumeToDelete(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setJobFilter("");
    setRecruiterFilter("");
  };

  // Get unique job IDs and titles from resumes
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
    <ProtectedLayout allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">All Submissions</h1>

          {/* Status update notifications */}
          {statusUpdateSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {statusUpdateSuccess}
            </div>
          )}

          {statusUpdateError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {statusUpdateError}
            </div>
          )}

          {/* Delete notifications */}
          {deleteSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {deleteSuccess}
            </div>
          )}

          {deleteError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {deleteError}
            </div>
          )}

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
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {resume.candidateName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {resume.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            {typeof resume.jobId === "object" &&
                            "title" in (resume.jobId ?? {})
                              ? (resume.jobId as { title?: string }).title ||
                                "Unknown Job"
                              : "Unknown Job"}
                            <Eye
                              className="ml-2 h-4 w-4 text-indigo-500 cursor-pointer hover:text-indigo-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(resume._id as string);
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <div className="flex flex-wrap gap-2">
                              <span className="bg-blue-50 px-2 py-1 rounded text-xs">
                                CTC: {resume.currentCTC || "N/A"}
                              </span>
                              <span className="bg-green-50 px-2 py-1 rounded text-xs">
                                Notice: {resume.noticePeriod || "N/A"}
                              </span>
                              <span className="bg-yellow-50 px-2 py-1 rounded text-xs">
                                Total Exp: {resume.totalExperience || "N/A"}
                              </span>
                              <span className="bg-purple-50 px-2 py-1 rounded text-xs">
                                Rel Exp: {resume.relevantExperience || "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && resumeToDelete && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-2">
                  Delete Resume for {resumeToDelete.candidateName}?
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Are you sure you want to delete this resume? This action
                  cannot be undone.
                </p>
                <div className="mt-4">
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleteLoading}
                    className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {deleteLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </button>
                  <button
                    onClick={handleDeleteCancel}
                    className="ml-3 inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Resume Detail Modal */}
        {isModalOpen && selectedResumeForModal && (
          <ResumeDetailModal
            resumeId={selectedResumeForModal}
            onClose={handleCloseModal}
          />
        )}
      </DashboardLayout>
    </ProtectedLayout>
  );
}
