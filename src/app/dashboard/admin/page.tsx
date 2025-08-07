"use client";

import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { RootState } from "../../store/index";
import {
  useGetAdminStatsQuery,
  useGetUsersQuery,
} from "../../store/services/adminApi";
import { useGetJobsQuery } from "../../store/services/jobsApi";
import { useGetAllSubmissionsQuery } from "../../store/services/resumesApi";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { UserRole } from "@/app/constants/userRoles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Layers,
  User,
  Briefcase,
  FileText,
  Bell,
  Calendar,
} from "lucide-react";
import {
  filterDataByTime,
  filterJobStatusData,
  filterResumeStatusData,
  filterUsersByRoleData,
  getFilteredStatCards,
} from "../../utils/timeFilters";

export default function AdminDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  const { data: statsData, isLoading: statsLoading } = useGetAdminStatsQuery();
  const { data: jobs, isLoading: jobsLoading } = useGetJobsQuery();
  const { data: resumes, isLoading: resumesLoading } =
    useGetAllSubmissionsQuery();

  // Time frame state for filtering
  const [timeFrame, setTimeFrame] = useState("all");

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  // Process data for charts - use useMemo to avoid unnecessary recalculations
  const usersByRoleData = useMemo(
    () =>
      filterUsersByRoleData(statsData, statsData?.recentUsers || [], timeFrame),
    [statsData, timeFrame]
  );

  // Filter jobs by status with time filtering
  const jobStatusData = useMemo(
    () => filterJobStatusData(jobs || [], timeFrame),
    [jobs, timeFrame]
  );

  // Filter resumes by status with time filtering
  const resumeStatusData = useMemo(
    () => filterResumeStatusData(resumes || [], timeFrame),
    [resumes, timeFrame]
  );

  // Get filtered stat cards data
  const statCards = useMemo(
    () => getFilteredStatCards(statsData, jobs || [], resumes || [], timeFrame),
    [statsData, jobs, resumes, timeFrame]
  );

  // Get filtered recent users based on time frame
  const filteredRecentUsers = useMemo(() => {
    if (!statsData?.recentUsers) return [];
    return timeFrame === "all"
      ? statsData.recentUsers
      : filterDataByTime(statsData.recentUsers, timeFrame);
  }, [statsData?.recentUsers, timeFrame]);

  // Custom colors for charts
  const COLORS = ["#4F46E5", "#10B981", "#F97316", "#8B5CF6", "#EC4899"];

  // Custom tooltip for charts
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: any[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow rounded-md border border-gray-200">
          <p className="text-sm font-medium">{`${label}: ${payload[0].value}`}</p>
        </div>
      );
    }

    return null;
  };

  // Handle time frame change
  const handleTimeFrameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeFrame(e.target.value);
  };

  if (statsLoading || jobsLoading || resumesLoading) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-80">
            <LoadingSpinner />
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
              <div className="flex space-x-3">
                <Link
                  href="/dashboard/admin/internal/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Internal Team Member
                </Link>
                <div className="relative">
                  <select
                    value={timeFrame}
                    onChange={handleTimeFrameChange}
                    className="appearance-none block w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm leading-tight focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Time</option>
                    <option value="month">This Month</option>
                    <option value="week">This Week</option>
                    <option value="day">Today</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {statCards.map((card, index) => {
                // Dynamically determine the icon component
                let IconComponent;
                switch (card.icon) {
                  case "User":
                    IconComponent = User;
                    break;
                  case "Briefcase":
                    IconComponent = Briefcase;
                    break;
                  case "Layers":
                    IconComponent = Layers;
                    break;
                  case "FileText":
                    IconComponent = FileText;
                    break;
                  case "Calendar":
                    IconComponent = Calendar;
                    break;
                  default:
                    IconComponent = Briefcase;
                }

                return (
                  <Link href={card.link} key={index}>
                    <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer transition duration-150 ease-in-out hover:shadow-lg border border-gray-100">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div
                            className={`flex-shrink-0 ${card.bgColor} rounded-md p-3`}
                          >
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                {card.title}
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  {card.value}
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Charts Section */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* User Distribution Chart */}
              <div className="bg-white shadow rounded-lg p-4 border border-gray-100">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  User Distribution
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usersByRoleData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {usersByRoleData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Job Status Chart */}
              <div className="bg-white shadow rounded-lg p-4 border border-gray-100">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Job Status
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jobStatusData} barSize={30}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" name="Jobs" fill="#4F46E5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Resume Status Chart */}
              <div className="bg-white shadow rounded-lg p-4 border border-gray-100">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Resume Status
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resumeStatusData} barSize={30}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="value" name="Resumes" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-white shadow rounded-lg p-4 border border-gray-100">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Activity
                </h2>
                <div className="flow-root">
                  <ul className="divide-y divide-gray-200">
                    {filteredRecentUsers.length > 0 ? (
                      filteredRecentUsers.map((user) => (
                        <li key={user._id as string} className="py-3">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                                <User className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.isPrimary
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {user.role}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="py-4 text-center text-gray-500">
                        No recent activity found in the selected time period
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Quick Actions
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  <Link
                    href="/dashboard/admin/users"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Manage Users
                  </Link>
                  <Link
                    href="/dashboard/admin/jobs"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    Manage Jobs
                  </Link>
                  <Link
                    href="/dashboard/admin/submissions"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Resumes
                  </Link>
                  <Link
                    href="/dashboard/admin/faqs"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Manage FAQs
                  </Link>
                  <Link
                    href="/dashboard/admin/support"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Support Tickets
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Users Table */}
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Recent Users
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {timeFrame !== "all"
                      ? `Users who joined ${
                          timeFrame === "day"
                            ? "today"
                            : timeFrame === "week"
                            ? "this week"
                            : "this month"
                        }.`
                      : "A list of recent users who joined the platform."}
                  </p>
                </div>
                <Link
                  href="/dashboard/admin/users"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View all users
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Joined
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecentUsers.length > 0 ? (
                      filteredRecentUsers.map((user) => (
                        <tr key={user._id as string}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.role}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.isPrimary
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {user.isPrimary ? "Primary" : "Team Member"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              href={`/dashboard/admin/users/${user._id}`}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              View
                            </Link>
                            <Link
                              href={`/dashboard/admin/users/${user._id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No users found in the selected time period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
