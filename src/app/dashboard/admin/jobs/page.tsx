//src/dashboard/admin/jobs/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { DataTable } from "@/app/components/ui/data-table";
import { createJobColumns } from "@/app/components/admin/jobs/columns";
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

function AdminJobsPageContent() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageParam = searchParams.get("page");
  const currentPage = Math.max(parseInt(pageParam ?? "1", 10) || 1, 1);
  const initialPageIndex = currentPage - 1;

  const { data: jobs, isLoading, error, refetch } = useGetJobsQuery();
  const { data: resumeCounts, isLoading: isLoadingCounts } =
    useGetResumeCountsQuery();
  const [updateJobStatus] = useUpdateJobStatusMutation();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("");

  // Pagination states
  const itemsPerPage = 10;

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

  // Create columns for DataTable
  const columns = createJobColumns({
    resumeCounts,
    isLoadingCounts,
    onStatusChange: handleStatusChange,
    onDeleteJob: openDeleteModal,
    currentPage,
  });

  const handlePageChange = (pageIndex: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (pageIndex + 1).toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };



  // Filter change handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleLocationFilterChange = (value: string) => {
    setLocationFilter(value);
  };

  const handleCompanyFilterChange = (value: string) => {
    setCompanyFilter(value);
  };

  const handleTypeFilterChange = (value: string) => {
    setJobTypeFilter(value);
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-80">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
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
                  Manage all job postings
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

            {/* Jobs DataTable */}
            <DataTable
              columns={columns}
              data={filteredJobs}
              searchKey="title"
              searchPlaceholder="Search jobs..."
              filterOptions={[
                {
                  key: "status",
                  label: "Status",
                  options: Object.values(JobStatus).map((status) => ({
                    label: status,
                    value: status,
                  })),
                },
              ]}
              pageSize={itemsPerPage}
              initialPageIndex={initialPageIndex}
              onPageChange={handlePageChange}
            />
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
                Are you sure you want to delete this job? This action cannot be
                undone and will permanently remove all associated data including
                applications.
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
      </DashboardLayout>
  );
}

export default function AdminJobsPage() {
  return (
    <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
      <Suspense
        fallback={
          <DashboardLayout>
            <div className="flex items-center justify-center h-80">
              <LoadingSpinner />
            </div>
          </DashboardLayout>
        }
      >
        <AdminJobsPageContent />
      </Suspense>
    </ProtectedLayout>
  );
}
