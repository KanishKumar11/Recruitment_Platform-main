//src/app/dashboard/recruiter/submissions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetRecruiterSubmissionsQuery } from "../../../store/services/resumesApi";
import ResumeStatusBadge from "@/app/components/company/ResumeStatusBadge";
import ResumeDetailModal from "@/app/components/company/ResumeDetailModal";
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
  Award,
  FileQuestion,
  MessageCircle,
  UserCheck,
  HandHeart,
  XCircle,
  Copy,
} from "lucide-react";
import ErrorAlert from "@/app/components/ui/ErrorAlert";
import { Suspense } from "react";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";

import { ResumeStatus } from "@/app/models/Resume";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import SubmitterInfo from "@/app/components/SubmitterInfo";

function RecruiterSubmissionsPageContent() {
  // Get URL parameters
  const searchParams = useSearchParams();
  const jobIdFromUrl = searchParams.get("jobId");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [jobFilter, setJobFilter] = useState<string>(jobIdFromUrl || "");
  const [recruiterFilter, setRecruiterFilter] = useState<string>("");
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get user data from auth state to check isPrimary status
  const user = useSelector((state: RootState) => state.auth.user);
  const isPrimary = user?.isPrimary;

  const {
    data: resumes,
    isLoading,
    isError,
    error,
  } = useGetRecruiterSubmissionsQuery();

  // Effect to handle URL parameters (job filter from URL)
  useEffect(() => {
    if (jobIdFromUrl) {
      setJobFilter(jobIdFromUrl);
    }
  }, [jobIdFromUrl]);

  const router = useRouter();

  const handleViewResume = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResumeId(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setJobFilter("");
    setRecruiterFilter("");
  };

  // Get unique job IDs and titles from resumes
  const uniqueJobs = resumes
    ? [...new Set(resumes.map((resume) => resume.jobId))].map((jobId) => {
        const resume = resumes.find((r) => r.jobId === jobId);
        return {
          id: jobId.toString(),
          title: resume?.jobTitle || "Unknown Job",
        };
      })
    : [];

  // Get unique recruiters (only necessary for primary users)
  const uniqueRecruiters =
    isPrimary && resumes
      ? [...new Set(resumes.map((resume) => resume.submittedBy))].map(
          (recruiterId) => {
            const resume = resumes.find((r) => r.submittedBy === recruiterId);
            return {
              id: recruiterId ? recruiterId.toString() : "",
              name: resume?.submittedBy || "Unknown Recruiter",
            };
          }
        )
      : [];

  // Filter resumes based on search term, status filter, job filter, and recruiter filter
  const filteredResumes = resumes
    ? resumes
        .filter((resume) => {
          const matchesSearch =
            searchTerm === "" ||
            resume.candidateName
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            resume.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resume.qualification
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            resume.email?.toLowerCase().includes(searchTerm.toLowerCase());

          const matchesStatus =
            statusFilter === "" || resume.status === statusFilter;

          const matchesJob =
            jobFilter === "" || resume.jobId.toString() === jobFilter;

          const matchesRecruiter =
            !isPrimary ||
            recruiterFilter === "" ||
            resume.submittedBy?.toString() === recruiterFilter;

          return (
            matchesSearch && matchesStatus && matchesJob && matchesRecruiter
          );
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    : [];

  // Stats calculation - now based on filtered resumes to match table display
  const getStatusCount = (status: ResumeStatus) => {
    return filteredResumes
      ? filteredResumes.filter((resume) => resume.status === status).length
      : 0;
  };

  const CompactStatCard = ({
    icon,
    bgColor,
    title,
    count,
  }: {
    icon: React.ReactNode;
    bgColor: string;
    title: string;
    count: number;
  }) => (
    <div className="flex items-center space-x-2 px-3 py-2 bg-white rounded-md shadow-sm border border-gray-200">
      <div className={`${bgColor} rounded p-1`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-sm font-semibold text-gray-900">{count}</p>
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
    <ProtectedLayout allowedRoles={["RECRUITER"]}>
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">
            {isPrimary ? "All Team Submissions" : "My Submissions"}
          </h1>

          {/* Primary Account Info Banner */}
          {isPrimary && (
            <div className="bg-blue-50 p-4 border-b border-blue-100 mb-6 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FileQuestion className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    As a primary account holder, you can see all submissions
                    from your team members.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ultra Compact Stats */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Quick Stats</h3>
              <span className="text-base text-gray-500">
                Total Resume: {filteredResumes?.length || 0}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              <CompactStatCard
                icon={<Send className="h-3 w-3 text-blue-600" />}
                bgColor="bg-blue-50"
                title="Submitted"
                count={getStatusCount(ResumeStatus.SUBMITTED)}
              />
              <CompactStatCard
                icon={<Clock className="h-3 w-3 text-purple-600" />}
                bgColor="bg-purple-50"
                title="Reviewed"
                count={getStatusCount(ResumeStatus.REVIEWED)}
              />
              <CompactStatCard
                icon={<ThumbsUp className="h-3 w-3 text-green-600" />}
                bgColor="bg-green-50"
                title="Shortlisted"
                count={getStatusCount(ResumeStatus.SHORTLISTED)}
              />
              <CompactStatCard
                icon={<MessageCircle className="h-3 w-3 text-yellow-600" />}
                bgColor="bg-yellow-50"
                title="Interview"
                count={getStatusCount(ResumeStatus.INTERVIEW_IN_PROCESS)}
              />
              <CompactStatCard
                icon={<User className="h-3 w-3 text-indigo-600" />}
                bgColor="bg-indigo-50"
                title="Interviewed"
                count={getStatusCount(ResumeStatus.INTERVIEWED)}
              />
              <CompactStatCard
                icon={<HandHeart className="h-3 w-3 text-cyan-600" />}
                bgColor="bg-cyan-50"
                title="Offered"
                count={getStatusCount(ResumeStatus.OFFERED)}
              />
              <CompactStatCard
                icon={<Award className="h-3 w-3 text-emerald-600" />}
                bgColor="bg-emerald-50"
                title="Hired"
                count={getStatusCount(ResumeStatus.HIRED)}
              />
              <CompactStatCard
                icon={<XCircle className="h-3 w-3 text-red-600" />}
                bgColor="bg-red-50"
                title="Rejected"
                count={getStatusCount(ResumeStatus.REJECTED)}
              />
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                    <option value="ONHOLD">On Hold</option>
                    <option value="INTERVIEW_IN_PROCESS">
                      Interview in Process
                    </option>
                    <option value="INTERVIEWED">Interviewed</option>
                    <option value="SELECTED_IN_FINAL_INTERVIEW">
                      Selected in Final Interview
                    </option>
                    <option value="OFFERED">Offered</option>
                    <option value="OFFER_DECLINED">Offer Declined</option>
                    <option value="HIRED">Hired</option>
                    <option value="DUPLICATE">Duplicate</option>
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
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recruiter filter (only for primary users) */}
              {isPrimary && (
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
                        <option key={recruiter.id} value={recruiter.id}>
                          {recruiter.id?.toString() === user?.id?.toString()
                            ? "You"
                            : recruiter.name?.toString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Clear filters button moved to same row */}
            <div className="col-span-1 flex items-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 justify-center"
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </button>
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
                        Actions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {isPrimary && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted By
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResumes.map((resume) => (
                      <tr
                        key={resume._id as string}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              handleViewResume(resume._id as string)
                            }
                            className="text-left hover:bg-gray-50 rounded p-1 -m-1 transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                              {resume.candidateName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {resume.phone || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {resume.email || "N/A"}
                            </div>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              handleViewResume(resume._id as string)
                            }
                            className="text-left hover:bg-gray-50 rounded p-1 -m-1 transition-colors w-full"
                          >
                            <div className="text-sm text-gray-900 hover:text-indigo-600 font-medium">
                              {resume.jobTitle || "Unknown Job"}
                            </div>
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Total Experience:{" "}
                                  {resume.totalExperience || "N/A"}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  Relevant Experience:{" "}
                                  {resume.relevantExperience || "N/A"}
                                </span>
                                <span
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                  title={resume.jobCode || "N/A"}
                                >
                                  Job Code: {resume.jobCode?.replace(/^job-/i, "") || "N/A"}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                  Location: {resume.location || "N/A"}
                                </span>
                              </div>
                            </div>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() =>
                              handleViewResume(resume._id as string)
                            }
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md"
                          >
                            View Details
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ResumeStatusBadge status={resume.status} />

                          {/* Show timestamp for the latest status change */}
                          {resume.status === "HIRED" && resume.hiredAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              <Clock className="inline-block h-3 w-3 mr-1" />
                              {new Date(resume.hiredAt).toLocaleDateString()}
                            </div>
                          )}
                          {resume.status === "INTERVIEWED" &&
                            resume.interviewedAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                <Clock className="inline-block h-3 w-3 mr-1" />
                                {new Date(
                                  resume.interviewedAt
                                ).toLocaleDateString()}
                              </div>
                            )}
                          {resume.status === "REJECTED" &&
                            resume.rejectedAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                <Clock className="inline-block h-3 w-3 mr-1" />
                                {new Date(
                                  resume.rejectedAt
                                ).toLocaleDateString()}
                              </div>
                            )}
                          {resume.status === "OFFERED" && resume.offeredAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              <Clock className="inline-block h-3 w-3 mr-1" />
                              {new Date(resume.offeredAt).toLocaleDateString()}
                            </div>
                          )}
                          {resume.status === "OFFER_DECLINED" &&
                            resume.offerDeclinedAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                <Clock className="inline-block h-3 w-3 mr-1" />
                                {new Date(
                                  resume.offerDeclinedAt
                                ).toLocaleDateString()}
                              </div>
                            )}
                          {resume.status === "SELECTED_IN_FINAL_INTERVIEW" &&
                            resume.selectedInFinalInterviewAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                <Clock className="inline-block h-3 w-3 mr-1" />
                                {new Date(
                                  resume.selectedInFinalInterviewAt
                                ).toLocaleDateString()}
                              </div>
                            )}
                          {resume.status === "INTERVIEW_IN_PROCESS" &&
                            resume.interviewInProcessAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                <Clock className="inline-block h-3 w-3 mr-1" />
                                {new Date(
                                  resume.interviewInProcessAt
                                ).toLocaleDateString()}
                              </div>
                            )}
                          {resume.status === "OFFER_DECLINED" &&
                            resume.offerDeclinedAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                <Clock className="inline-block h-3 w-3 mr-1" />
                                {new Date(
                                  resume.offerDeclinedAt
                                ).toLocaleDateString()}
                              </div>
                            )}
                        </td>
                        {/* Submitted By column only for primary users */}
                        {isPrimary && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <SubmitterInfo
                              submitterId={resume.submittedBy?.toString() || ""}
                              currentUserId={user?.id?.toString()}
                              fallbackName={
                                resume.submittedByName || "Team Member"
                              }
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Resume View Modal */}
          {selectedResumeId && isModalOpen && (
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

export default function RecruiterSubmissionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RecruiterSubmissionsPageContent />
    </Suspense>
  );
}
