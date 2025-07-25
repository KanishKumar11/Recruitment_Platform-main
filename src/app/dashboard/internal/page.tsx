"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RootState } from "../../store/index";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { UserRole } from "@/app/constants/userRoles";
import { useGetAdminStatsQuery } from "../../store/services/adminApi";
import { useGetJobsQuery } from "../../store/services/jobsApi";

export default function InternalDashboardPage() {
  const { user, isAuthenticated, loading } = useSelector(
    (state: RootState) => state.auth
  );
  const router = useRouter();
  const { data: statsData, isLoading: isLoadingStats } =
    useGetAdminStatsQuery();
  const { data: jobsData, isLoading: isLoadingJobs } = useGetJobsQuery();

  // Redirect if not internal or admin
  useEffect(() => {
    if (
      !loading &&
      isAuthenticated &&
      user &&
      user.role !== UserRole.INTERNAL &&
      user.role !== UserRole.ADMIN
    ) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, isAuthenticated, loading, router]);

  if (loading || isLoadingStats) {
    return (
      <ProtectedLayout allowedRoles={[UserRole.INTERNAL, UserRole.ADMIN]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-80">
            <LoadingSpinner />
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  const stats = statsData?.stats;

  // Get the 5 most recent jobs
  const recentJobs = jobsData
    ? [...jobsData]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)
    : [];

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "CLOSED":
        return "bg-red-100 text-red-800";
      case "PAUSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <ProtectedLayout allowedRoles={[UserRole.INTERNAL, UserRole.ADMIN]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Internal Team Dashboard
                </h2>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                {/* Only show this button if user is an admin */}
                {user?.role === UserRole.ADMIN && (
                  <Link
                    href="/dashboard/admin/internal/new"
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Internal Team Member
                  </Link>
                )}
              </div>
            </div>

            {/* Stats Overview */}
            <div className="mt-8">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Overview
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Users */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <svg
                          className="h-6 w-6 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Users
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.users.total || 0}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Companies */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <svg
                          className="h-6 w-6 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Companies
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.users.byRole.companyPrimary || 0}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recruiters */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg
                          className="h-6 w-6 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Recruiters
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.users.byRole.recruiter || 0}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Internal Team */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <svg
                          className="h-6 w-6 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Internal Team
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.users.byRole.internal || 0}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access */}
            <div className="mt-8">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quick Access
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Manage Job Listings
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      View, edit, and manage all job postings from companies.
                    </p>
                    <div className="mt-4">
                      <Link
                        href="/dashboard/internal/jobs"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View All Jobs
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Review Applications
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Review and manage candidate applications and submissions.
                    </p>
                    <div className="mt-4">
                      <Link
                        href="/dashboard/internal/submissions"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View Applications
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Jobs */}
            {!isLoadingJobs && recentJobs && recentJobs.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Recent Job Postings
                  </h3>
                  <Link
                    href="/dashboard/internal/jobs"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    View all jobs
                  </Link>
                </div>
                <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-lg">
                  <ul className="divide-y divide-gray-200">
                    {recentJobs.map((job) => (
                      <li key={job._id as string}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <svg
                                    className="h-6 w-6 text-indigo-600"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V4a2 2 0 00-2-2H6a2 2 0 00-2 2v2m12 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6h12z"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {job.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {job.company || "Unknown Company"} •{" "}
                                  {job.location}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Job Code: {job.jobCode}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                  job.status
                                )}`}
                              >
                                {job.status}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex sm:space-x-4">
                              <div className="flex items-center text-sm text-gray-500">
                                <svg
                                  className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.581.814L10 14.229l-4.419 2.585A1 1 0 014 16V4zm2-1a1 1 0 00-1 1v11.586l3.419-1.999a1 1 0 011.162 0L13 15.586V4a1 1 0 00-1-1H6z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {job.jobType}
                              </div>
                              {job.salary && (
                                <div className="flex items-center text-sm text-gray-500 mt-2 sm:mt-0">
                                  <svg
                                    className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M8.433 1.87l1.567 3.138 3.467.506a1 1 0 01.554 1.703l-2.51 2.447.591 3.464a1 1 0 01-1.45 1.054L10 13.347l-3.102 1.631a1 1 0 01-1.45-1.054l.592-3.464-2.51-2.447a1 1 0 01.554-1.703l3.467-.506L8.433 1.87z" />
                                  </svg>
                                  ${job.salary.min?.toLocaleString()} - $
                                  {job.salary.max?.toLocaleString()}
                                </div>
                              )}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <svg
                                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>
                                Posted on{" "}
                                <time
                                  dateTime={new Date(
                                    job.createdAt
                                  ).toISOString()}
                                >
                                  {new Date(job.createdAt).toLocaleDateString()}
                                </time>
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
