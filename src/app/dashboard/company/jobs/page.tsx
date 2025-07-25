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

export default function JobsListPage() {
  const router = useRouter();
  const { data: jobs, isLoading, refetch } = useGetJobsQuery();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get user data from auth state to check isPrimary status
  const user = useSelector((state: RootState) => state.auth.user);
  const isPrimary = user?.isPrimary;

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
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Job Title
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Posted Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      {isPrimary && (
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Posted By
                        </th>
                      )}
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs?.map((job) => (
                      <tr key={job._id as string}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {job.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(job.postedDate), "MMMM dd, yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusColors[job.status]
                            }`}
                          >
                            {formatStatus(job.status)}
                          </span>
                        </td>
                        {isPrimary && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {job.postedBy?.toString() === user?.id
                              ? "You"
                              : job.postedByName || "Team Member"}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center space-x-3">
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/company/jobs/${job._id}`
                                )
                              }
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View Job Details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/company/jobs/${job._id}/edit`
                                )
                              }
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Job"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(job._id as string)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Job"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/company/jobs/${job._id}/resumes`
                                )
                              }
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                            >
                              View Resumes
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {jobs?.length === 0 && (
                  <div className="px-6 py-4 text-center text-gray-500">
                    No jobs found.
                  </div>
                )}
              </div>
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
