"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { RootState } from "../../store/index";
import TeamManagement from "./TeamManagement";
import { useGetTeamMembersQuery } from "../../store/services/usersApi";
import { useGetJobsQuery } from "../../store/services/jobsApi";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getCountryNameFromCode } from "@/app/utils/countryUtils";

export default function CompanyDashboard() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activePage, setActivePage] = useState<"dashboard" | "team">(
    "dashboard"
  );
  const { data: teamMembers } = useGetTeamMembersQuery();
  const { data: jobs, isLoading: jobsLoading } = useGetJobsQuery();
  const [teamMemberCount, setTeamMemberCount] = useState(0);

  // Stats for cards
  const [activeJobCount, setActiveJobCount] = useState(0);
  const [totalJobCount, setTotalJobCount] = useState(0);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  useEffect(() => {
    if (teamMembers) {
      setTeamMemberCount(teamMembers.length);
    }
  }, [teamMembers]);

  useEffect(() => {
    if (jobs) {
      // Count active jobs
      const activeJobs = jobs.filter((job) => job.status === "ACTIVE");
      setActiveJobCount(activeJobs.length);

      // Set total job count
      setTotalJobCount(jobs.length);

      // Get recent jobs (most recent 3)
      const sortedJobs = [...jobs]
        .sort(
          (a, b) =>
            new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
        )
        .slice(0, 3);
      setRecentJobs(sortedJobs);
    }
  }, [jobs]);

  // Format status badge
  const getStatusBadge = (status: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED") => {
    const statusColors: Record<
      "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED",
      string
    > = {
      DRAFT: "bg-gray-100 text-gray-800",
      ACTIVE: "bg-green-100 text-green-800",
      PAUSED: "bg-yellow-100 text-yellow-800",
      CLOSED: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[status]}`}
      >
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  return (
    <ProtectedLayout allowedRoles={["COMPANY"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                {activePage === "dashboard"
                  ? "Company Dashboard"
                  : "Team Management"}
              </h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setActivePage("dashboard")}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    activePage === "dashboard"
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Dashboard
                </button>
                {user?.isPrimary && (
                  <button
                    onClick={() => setActivePage("team")}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activePage === "team"
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Team Management
                  </button>
                )}
              </div>
            </div>
          </div>

          {activePage === "dashboard" ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                {/* Active Jobs Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <span className="h-6 w-6 text-white">📋</span>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Active Jobs
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {jobsLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                activeJobCount
                              )}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <button
                        onClick={() => router.push("/dashboard/company/jobs")}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View all jobs
                      </button>
                    </div>
                  </div>
                </div>

                {/* Total Jobs Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <span className="h-6 w-6 text-white">📊</span>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Jobs
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {jobsLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                totalJobCount
                              )}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <button
                        onClick={() => router.push("/dashboard/company/jobs")}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View all jobs
                      </button>
                    </div>
                  </div>
                </div>

                {/* Team Members Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                        <span className="h-6 w-6 text-white">👤</span>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Team Members
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {teamMemberCount}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  {user?.isPrimary && (
                    <div className="bg-gray-50 px-5 py-3">
                      <div className="text-sm">
                        <button
                          onClick={() => setActivePage("team")}
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Manage team
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Quick Actions
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Post a new job or manage existing postings
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:space-x-4">
                    <button
                      type="button"
                      onClick={() =>
                        router.push("/dashboard/company/jobs/create")
                      }
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mb-3 sm:mb-0"
                    >
                      Post New Job
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/company/jobs")}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mb-3 sm:mb-0"
                    >
                      Edit Existing Jobs
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Set Commission Terms
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Jobs Table */}
              <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Recent Job Postings
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    A list of your recently posted jobs and their status.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  {jobsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                  ) : (
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
                            Job Code
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Location
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Posted Date
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentJobs.length > 0 ? (
                          recentJobs.map((job) => (
                            <tr key={job._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {job.title}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {job.jobCode.replace(/^job-/i, '')}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {job.location},{" "}
                                  {getCountryNameFromCode(job.country)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(job.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(
                                  new Date(job.postedDate),
                                  "MMM dd, yyyy"
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/company/jobs/${job._id}/edit`
                                    )
                                  }
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/company/jobs/${job._id}`
                                    )
                                  }
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  View Applications ({job.applicantCount || 0})
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-4 text-center text-sm text-gray-500"
                            >
                              No job postings found. Create your first job to
                              get started.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
                {!jobsLoading && recentJobs.length > 0 && (
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <button
                        onClick={() => router.push("/dashboard/company/jobs")}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View all job postings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
              <TeamManagement />
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
