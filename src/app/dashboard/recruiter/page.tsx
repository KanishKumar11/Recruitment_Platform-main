"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { RootState } from "./../../store/index";
import { useGetTeamMembersQuery } from "../../store/services/usersApi";
import { useGetRecruiterSubmissionsQuery } from "../../store/services/resumesApi";
import { useGetJobsQuery } from "../../store/services/jobsApi";
import TeamManagement from "./TeamManagement";
import { ResumeStatus } from "@/app/constants/resumeStatus";

export default function RecruiterDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activePage, setActivePage] = useState<"dashboard" | "team">(
    "dashboard"
  );
  const { data: teamMembers } = useGetTeamMembersQuery();
  const [teamMemberCount, setTeamMemberCount] = useState(0);
  const { data: jobs } = useGetJobsQuery();
  const {
    data: resumes,
    isLoading,
    isError,
    error,
  } = useGetRecruiterSubmissionsQuery();

  const getStatusCount = (status: ResumeStatus) => {
    return resumes
      ? resumes.filter((resume) => resume.status === status).length
      : 0;
  };

  useEffect(() => {
    if (teamMembers) {
      setTeamMemberCount(teamMembers.length);
    }
  }, [teamMembers]);

  return (
    <ProtectedLayout allowedRoles={["RECRUITER"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                {activePage === "dashboard"
                  ? "Recruiter Dashboard"
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
                              {jobs
                                ? jobs.filter((job) => job.status === "ACTIVE")
                                    .length
                                : 0}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <a
                        href="#"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View all jobs
                      </a>
                    </div>
                  </div>
                </div>

                {/* Submissions Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <span className="h-6 w-6 text-white">👥</span>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Submissions
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {resumes ? resumes.length : 0}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <a
                        href="#"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View all submissions
                      </a>
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
                    Browse jobs and manage submissions
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:space-x-4">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mb-3 sm:mb-0"
                      onClick={() =>
                        (window.location.href = "/dashboard/recruiter/jobs")
                      }
                    >
                      Browse All Jobs
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mb-3 sm:mb-0"
                      onClick={() =>
                        (window.location.href =
                          "/dashboard/recruiter/submissions")
                      }
                    >
                      View My Submissions
                    </button>
                    {/* <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Upload Resume
                    </button> */}
                  </div>
                </div>
              </div>

              {/* Recent Submissions Table */}
              <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Recent Submissions
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your recently submitted candidates and their status.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Candidate Name
                        </th>
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
                          Company
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
                          Submission Date
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resumes && resumes.length > 0 ? (
                        resumes.slice(0, 5).map((resume) => (
                          <tr key={resume._id as string}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {resume.candidateName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {(resume as any).jobTitle || "Unknown Job"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {(resume as any).companyName ||
                                  "Unknown Company"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  resume.status === ResumeStatus.SUBMITTED
                                    ? "bg-blue-100 text-blue-800"
                                    : resume.status === ResumeStatus.REVIEWED
                                    ? "bg-indigo-100 text-indigo-800"
                                    : resume.status === ResumeStatus.SHORTLISTED
                                    ? "bg-green-100 text-green-800"
                                    : resume.status ===
                                      ResumeStatus.INTERVIEW_IN_PROCESS
                                    ? "bg-purple-100 text-purple-800"
                                    : resume.status === ResumeStatus.INTERVIEWED
                                    ? "bg-indigo-100 text-indigo-800"
                                    : resume.status === ResumeStatus.OFFERED
                                    ? "bg-cyan-100 text-cyan-800"
                                    : resume.status === ResumeStatus.HIRED
                                    ? "bg-emerald-100 text-emerald-800"
                                    : resume.status === ResumeStatus.REJECTED
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {resume.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(resume.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            No recent submissions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
