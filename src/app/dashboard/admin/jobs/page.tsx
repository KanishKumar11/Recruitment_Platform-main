//src/dashboard/admin/jobs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { RootState } from "../../../store/index";
import {
  useGetJobsQuery,
  useUpdateJobStatusMutation,
  useDeleteJobMutation,
} from "../../../store/services/jobsApi";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { UserRole } from "@/app/constants/userRoles";
import { JobType } from "@/app/constants/jobType";
import { JobStatus } from "@/app/constants/jobStatus";
import { IJob } from "@/app/models/Job";
import {
  EyeIcon,
  PencilIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

export default function AdminJobsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  const { data: jobs, isLoading, error, refetch } = useGetJobsQuery();
  const [updateJobStatus] = useUpdateJobStatusMutation();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  // Delete modal states
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    try {
      await updateJobStatus({ id: jobId, status: newStatus }).unwrap();
      toast.success("Job status updated successfully");
      refetch(); // Refresh the jobs list
    } catch (error) {
      console.error("Failed to update job status:", error);
      toast.error("Failed to update job status");
    }
  };

  // Handle job deletion
  const handleDelete = async (id: string) => {
    try {
      await deleteJob(id).unwrap();
      toast.success("Job deleted successfully");
      setIsModalOpen(false);
      setJobToDelete(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete job");
      console.error("Error deleting job:", error);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (id: string) => {
    setJobToDelete(id);
    setIsModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setJobToDelete(null);
  };

  // Filter jobs based on search term and filters
  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch =
      searchTerm === "" ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "" || job.status === statusFilter;
    const matchesType = jobTypeFilter === "" || job.jobType === jobTypeFilter;

    // Note: We would need to add company name to the job object when fetching from API
    const matchesCompany =
      companyFilter === "" ||
      (job as any).companyName
        ?.toLowerCase()
        .includes(companyFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesType && matchesCompany;
  });

  // Function to format salary range
  const formatSalary = (job: IJob) => {
    return `${
      job.salary.currency
    } ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`;
  };

  // Function to format experience range
  const formatExperience = (job: IJob) => {
    return `${job.experienceLevel.min} - ${job.experienceLevel.max} years`;
  };

  // Function to format commission information
  const formatCommission = (job: IJob) => {
    if (job.commissionAmount && job.commissionAmount > 0) {
      // Fixed commission
      return `Fixed: ${
        job.salary.currency
      } ${job.commissionAmount.toLocaleString()}`;
    } else if (job.commissionPercentage > 0) {
      // Percentage commission
      return `${job.commissionPercentage}% (${
        job.salary.currency
      } ${job.commissionAmount.toLocaleString()})`;
    } else {
      return "No commission set";
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

  return (
    <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                Jobs Management
              </h1>
              {user?.role === UserRole.ADMIN && (
                <Link
                  href="/dashboard/admin/jobs/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create New Job
                </Link>
              )}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            {/* Search and Filters */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label
                    htmlFor="search"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Search
                  </label>
                  <input
                    type="text"
                    id="search"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    placeholder="Job title, code, location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    {Object.values(JobStatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="jobType"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Job Type
                  </label>
                  <select
                    id="jobType"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                  >
                    <option value="">All Types</option>
                    {Object.values(JobType).map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    placeholder="Company name"
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Jobs Grid/Cards Layout for Mobile and Small Screens */}
            <div className="block lg:hidden">
              <div className="bg-white shadow rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      All Jobs
                    </h3>
                    <p className="text-sm text-gray-500">
                      {filteredJobs?.length || 0} jobs found
                    </p>
                  </div>
                  <button
                    onClick={() => refetch()}
                    className="p-2 text-indigo-600 hover:text-indigo-500"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredJobs && filteredJobs.length > 0 ? (
                  filteredJobs.map((job: IJob) => (
                    <div
                      key={job._id as string}
                      className="bg-white shadow rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-1">
                            {job.title}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Code: {job.jobCode}
                          </p>
                          <p className="text-sm text-gray-500">
                            Posted:{" "}
                            {new Date(job.postedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <select
                          value={job.status}
                          onChange={(e) =>
                            handleStatusChange(
                              job._id as string,
                              e.target.value as JobStatus
                            )
                          }
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            job.status === JobStatus.ACTIVE
                              ? "bg-green-100 text-green-800"
                              : job.status === JobStatus.PAUSED
                              ? "bg-yellow-100 text-yellow-800"
                              : job.status === JobStatus.CLOSED
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {Object.values(JobStatus).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Company
                          </p>
                          <p className="text-sm text-gray-900">
                            {(job as any).postedByName || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Positions: {job.positions}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Location
                          </p>
                          <p className="text-sm text-gray-900">{job.country}</p>
                          <p className="text-xs text-gray-500">
                            {job.location}
                          </p>
                          <p className="text-xs text-gray-500">
                            {job.jobType.replace("_", " ")}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700">
                          Salary & Experience
                        </p>
                        <p className="text-sm text-gray-900">
                          {formatSalary(job)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Exp: {formatExperience(job)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Commission: {formatCommission(job)}
                        </p>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/dashboard/admin/jobs/${job._id}`}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                          title="View Job"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/admin/jobs/${job._id}/edit`}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                          title="Edit Job"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/admin/jobs/${job._id}/questions`}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                          title="Manage Questions"
                        >
                          <QuestionMarkCircleIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/admin/jobs/${job._id}/resumes`
                            )
                          }
                          className="p-2 bg-green-600 text-white hover:bg-green-700 rounded"
                          title="View Resumes"
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(job._id as string)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                          title="Delete Job"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white shadow rounded-lg p-8 text-center">
                    <p className="text-gray-500">No jobs found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Jobs Table for Desktop */}
            <div className="hidden lg:block bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    All Jobs
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filteredJobs?.length || 0} jobs found
                  </p>
                </div>
                <button
                  onClick={() => refetch()}
                  className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Info
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salary & Exp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobs && filteredJobs.length > 0 ? (
                      filteredJobs.map((job: IJob) => (
                        <tr
                          key={job._id as string}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {job.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                {job.jobCode}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(job.postedDate).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900 truncate max-w-xs">
                              {(job as any).postedByName || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {job.positions} positions
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">
                              {job.country}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {job.location}
                            </div>
                            <div className="text-xs text-gray-500">
                              {job.jobType.replace("_", " ")}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs text-gray-900">
                              {formatSalary(job)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatExperience(job)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={job.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  job._id as string,
                                  e.target.value as JobStatus
                                )
                              }
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                job.status === JobStatus.ACTIVE
                                  ? "bg-green-100 text-green-800"
                                  : job.status === JobStatus.PAUSED
                                  ? "bg-yellow-100 text-yellow-800"
                                  : job.status === JobStatus.CLOSED
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {Object.values(JobStatus).map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-center items-center space-x-1">
                              <Link
                                href={`/dashboard/admin/jobs/${job._id}`}
                                className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                                title="View Job"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/dashboard/admin/jobs/${job._id}/edit`}
                                className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                                title="Edit Job"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/dashboard/admin/jobs/${job._id}/questions`}
                                className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                                title="Questions"
                              >
                                <QuestionMarkCircleIcon className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/jobs/${job._id}/resumes`
                                  )
                                }
                                className="p-1 bg-green-600 text-white hover:bg-green-700 rounded"
                                title="View Resumes"
                              >
                                <DocumentTextIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(job._id as string)}
                                className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                title="Delete Job"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-sm text-gray-500"
                        >
                          No jobs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                  Delete Job
                </h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this job? This action cannot
                  be undone and will permanently remove all associated data
                  including applications.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeDeleteModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(jobToDelete!)}
                    disabled={isDeleting}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      isDeleting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}