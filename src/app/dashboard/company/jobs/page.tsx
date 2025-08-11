"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import {
  useGetJobsQuery,
  useDeleteJobMutation,
} from "../../../store/services/jobsApi";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import {
  Loader2,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  FileQuestion,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
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

export default function JobsListPage() {
  const router = useRouter();
  const { data: jobs, isLoading, refetch } = useGetJobsQuery();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get user data from auth state to check isPrimary status
  const user = useSelector((state: RootState) => state.auth.user);
  const isPrimary = user?.isPrimary;

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

  // Status badge colors
  const statusColors = {
    DRAFT: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-green-100 text-green-800",
    PAUSED: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-red-100 text-red-800",
  };

  // Format status text
  const formatStatus = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  // Filter jobs based on search and status
  const filteredJobs =
    jobs?.filter((job) => {
      const matchesSearch =
        searchTerm === "" ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jobCode?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || job.status === statusFilter;

      return matchesSearch && matchesStatus;
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

  // Handle job deletion
  const handleDelete = async (id: string) => {
    try {
      await deleteJob(id).unwrap();
      toast.success("Job deleted successfully");
      setIsModalOpen(false);
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

  return (
    <ProtectedLayout allowedRoles={["COMPANY"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Job Listings
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {isPrimary
                    ? "Manage all job postings from your company"
                    : "Manage your job postings and applications"}
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <button
                  onClick={() => router.push("/dashboard/company/jobs/create")}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create New Job
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <>
                {/* Search and Filters */}
                <div className="bg-white shadow rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                        placeholder="Job title, code..."
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
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="PAUSED">Paused</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
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

                    <div className="flex items-end">
                      <Button
                        onClick={() => refetch()}
                        variant="outline"
                        className="w-full"
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  {isPrimary && (
                    <div className="bg-blue-50 p-4 border-b border-blue-100">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <FileQuestion className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            As a primary account holder, you can see all jobs
                            posted by your company members.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center bg-white">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Job Listings
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Showing {startIndex + 1}-
                        {Math.min(endIndex, totalItems)} of {totalItems} jobs
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Actions</TableHead>
                          <TableHead>Job Title</TableHead>
                          <TableHead>Posted Date</TableHead>
                          <TableHead>Status</TableHead>
                          {isPrimary && <TableHead>Posted By</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentJobs && currentJobs.length > 0 ? (
                          currentJobs.map((job) => (
                            <TableRow key={job._id as string}>
                              <TableCell className="align-top">
                                <div className="flex flex-col gap-2 py-2">
                                  <div className="flex flex-wrap gap-1">
                                    <button
                                      onClick={() =>
                                        router.push(
                                          `/dashboard/company/jobs/${job._id}`
                                        )
                                      }
                                      className="flex items-center justify-center w-8 h-8 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                                      title="View Job Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        router.push(
                                          `/dashboard/company/jobs/${job._id}/edit`
                                        )
                                      }
                                      className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                      title="Edit Job"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        openDeleteModal(job._id as string)
                                      }
                                      className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                      title="Delete Job"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/company/jobs/${job._id}/resumes`
                                      )
                                    }
                                    className="w-full text-xs"
                                  >
                                    View Resumes
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="py-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {job.title}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="py-2">
                                  <div className="text-sm text-gray-500">
                                    {format(
                                      new Date(job.postedDate),
                                      "MMMM dd, yyyy"
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="py-2">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      statusColors[job.status]
                                    }`}
                                  >
                                    {formatStatus(job.status)}
                                  </span>
                                </div>
                              </TableCell>
                              {isPrimary && (
                                <TableCell className="align-top">
                                  <div className="py-2">
                                    <div className="text-sm text-gray-500">
                                      {job.postedBy?.toString() === user?.id
                                        ? "You"
                                        : job.postedByName || "Team Member"}
                                    </div>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={isPrimary ? 5 : 4}
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
                    <div className="px-6 py-4 border-t border-gray-200 bg-white">
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
              </>
            )}
          </div>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                <h2 className="text-lg font-semibold mb-4">Delete Job</h2>
                <p>
                  Are you sure you want to delete this job? This action cannot
                  be undone.
                </p>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(jobToDelete!)}
                    disabled={isDeleting}
                    className={`px-4 py-2 ${
                      isDeleting ? "bg-gray-400" : "bg-red-600"
                    } text-white rounded-md`}
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
