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
  useGetResumeCountsQuery,
} from "../../../store/services/jobsApi";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/app/components/ui/pagination";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
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
import { getCountryNameFromCode } from "@/app/utils/countryUtils";

export default function AdminJobsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  const { data: jobs, isLoading, error, refetch } = useGetJobsQuery();
  const { data: resumeCounts, isLoading: isLoadingCounts } =
    useGetResumeCountsQuery();
  const [updateJobStatus] = useUpdateJobStatusMutation();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Delete modal states
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

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
  const filteredJobs =
    jobs?.filter((job) => {
      const matchesSearch =
        searchTerm === "" ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jobCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || job.status === statusFilter;
      const matchesType =
        jobTypeFilter === "all" || job.jobType === jobTypeFilter;

      // Note: We would need to add company name to the job object when fetching from API
      const matchesCompany =
        companyFilter === "" ||
        (job as any).companyName
          ?.toLowerCase()
          .includes(companyFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesType && matchesCompany;
    }) || [];

  // Calculate pagination
  const totalItems = filteredJobs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (value: string) => {
    setJobTypeFilter(value);
    setCurrentPage(1);
  };

  const handleCompanyFilterChange = (value: string) => {
    setCompanyFilter(value);
    setCurrentPage(1);
  };

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

  // Function to format commission
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div>
                  <label
                    htmlFor="search"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Search
                  </label>
                  <Input
                    type="text"
                    id="search"
                    placeholder="Job title, code, location..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Status
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={handleStatusFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.values(JobStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label
                    htmlFor="jobType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Job Type
                  </label>
                  <Select
                    value={jobTypeFilter}
                    onValueChange={handleTypeFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.values(JobType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Company
                  </label>
                  <Input
                    type="text"
                    id="company"
                    placeholder="Company name"
                    value={companyFilter}
                    onChange={(e) => handleCompanyFilterChange(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="itemsPerPage"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Items per page
                  </label>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option.toString()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    All Jobs
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
                    {totalItems} jobs
                  </p>
                </div>
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Actions</TableHead>
                      <TableHead>Job Info</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Resumes</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Salary & Experience</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentJobs && currentJobs.length > 0 ? (
                      currentJobs.map((job: IJob) => (
                        <TableRow key={job._id as string}>
                          <TableCell className="align-top">
                            <div className="flex flex-col gap-2 py-2">
                              <div className="flex flex-wrap gap-1">
                                <Link
                                  href={`/dashboard/admin/jobs/${job._id}`}
                                  className="flex items-center justify-center w-8 h-8 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                                  title="View Job"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Link>
                                <Link
                                  href={`/dashboard/admin/jobs/${job._id}/edit`}
                                  className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit Job"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Link>
                                <Link
                                  href={`/dashboard/admin/jobs/${job._id}/questions`}
                                  className="flex items-center justify-center w-8 h-8 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
                                  title="Job Questions"
                                >
                                  <QuestionMarkCircleIcon className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() =>
                                    openDeleteModal(job._id as string)
                                  }
                                  className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Job"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                              <Button
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/jobs/${job._id}/resumes`
                                  )
                                }
                                className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                                title="View Resumes"
                              >
                                <DocumentTextIcon className="h-3 w-3 mr-1" />
                                Resumes
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="py-2">
                              <div className="text-sm font-medium text-gray-900">
                                {job.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                Code: {job.jobCode}
                              </div>
                              <div className="text-sm text-gray-500">
                                Posted:{" "}
                                {new Date(job.postedDate).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="py-2">
                              <div className="text-sm text-gray-900">
                                {(job as any).postedByName || "Unknown"}
                              </div>
                              <div className="text-sm text-gray-500">
                                Positions: {job.positions}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="py-2">
                              <div className="text-sm text-gray-900">
                                {isLoadingCounts ? (
                                  <span className="text-gray-400">
                                    Loading...
                                  </span>
                                ) : (
                                  <span className="font-medium">
                                    {resumeCounts?.[job._id as string] || 0}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {(resumeCounts?.[job._id as string] || 0) === 1
                                  ? "resume"
                                  : "resumes"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="py-2">
                              <div className="text-sm text-gray-900">
                                {getCountryNameFromCode(job.country)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {job.location}
                              </div>
                              <div className="text-sm text-gray-500">
                                {job.jobType.replace("_", " ")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="py-2">
                              <div className="text-sm text-gray-900">
                                {formatSalary(job)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Exp: {formatExperience(job)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Commission: {formatCommission(job)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="py-2">
                              <select
                                value={job.status}
                                onChange={(e) =>
                                  handleStatusChange(
                                    job._id as string,
                                    e.target.value as JobStatus
                                  )
                                }
                                className={`p-1 text-xs font-medium rounded ${
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
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No jobs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {/* Page numbers */}
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        const isCurrentPage = pageNumber === currentPage;

                        // Show first page, last page, current page, and pages around current page
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 &&
                            pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNumber)}
                                isActive={isCurrentPage}
                                className="cursor-pointer"
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }

                        // Show ellipsis
                        if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }

                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
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
