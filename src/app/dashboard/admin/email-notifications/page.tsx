"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/app/store/index";
import { useGetEmailNotificationStatsQuery } from "@/app/store/services/emailNotificationsApi";
import {
  useGetEmailSettingsQuery,
  useUpdateEmailSettingsMutation,
} from "@/app/store/services/adminApi";

import DashboardLayout from "@/app/components/layout/DashboardLayout";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import {
  ChartBarIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UsersIcon,
  ArrowPathIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { toast } from "sonner";

interface EmailNotificationStats {
  overview: {
    totalNotifications: number;
    successfulNotifications: number;
    failedNotifications: number;
    pendingNotifications: number;
    successRate: number;
    totalRecipients: number;
    successfulRecipients: number;
    failedRecipients: number;
    recipientSuccessRate: number;
  };
  recentNotifications: Array<{
    _id: string;
    sentAt: string;
    recipientCount: number;
    status: "sent" | "failed" | "pending";
    jobIds: string[];
    errorMessage?: string;
    retryCount: number;
  }>;
  dailyStats: Array<{
    date: string;
    successRate: number;
    totalNotifications: number;
    totalRecipients: number;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export default function EmailNotificationsPage() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [timeFrame, setTimeFrame] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sendingManual, setSendingManual] = useState(false);
  const [sendingRecent, setSendingRecent] = useState(false);
  const [recentWindow, setRecentWindow] = useState<"1" | "3">("1");
  const [auto1d, setAuto1d] = useState(false);
  const [auto3d, setAuto3d] = useState(false);

  // RTK Query hook for fetching email notification statistics
  const {
    data: statsResponse,
    isLoading: loading,
    error,
    refetch,
    isFetching: refreshing,
  } = useGetEmailNotificationStatsQuery(
    {
      timeFrame,
      page: currentPage,
      limit: 10,
    },
    {
      pollingInterval: 10000,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const stats = statsResponse?.data || null;

  const { data: emailSettingsData } = useGetEmailSettingsQuery();
  const [updateEmailSettings, { isLoading: savingSettings }]
    = useUpdateEmailSettingsMutation();

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    if (user && user.role !== "ADMIN" && user.role !== "INTERNAL") {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  useEffect(() => {
    if (emailSettingsData?.settings) {
      setAuto1d(Boolean(emailSettingsData.settings.RECENT_JOBS_AUTO_1D));
      setAuto3d(Boolean(emailSettingsData.settings.RECENT_JOBS_AUTO_3D));
    }
  }, [emailSettingsData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleManualSend = async () => {
    if (
      !confirm(
        "Are you sure you want to send manual bulk emails to all recruiters? This will send today's job summaries to all active recruiters."
      )
    ) {
      return;
    }

    setSendingManual(true);
    try {
      const response = await fetch("/api/admin/email-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Manual emails sent successfully! Sent to ${data.recipientCount} recruiters with ${data.jobCount} jobs.`
        );
        refetch(); // Refresh the stats
      } else {
        toast.error(
          `Failed to send manual emails: ${data.error || data.message}`
        );
      }
    } catch (error) {
      console.error("Error sending manual emails:", error);
      toast.error("Failed to send manual emails. Please try again.");
    } finally {
      setSendingManual(false);
    }
  };

  const handleRecentSend = async () => {
    setSendingRecent(true);
    try {
      const response = await fetch("/api/admin/email-notifications/recent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ days: Number(recentWindow) }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Queued ${data.jobCount || 0} jobs to ${data.recipientCount || 0} recruiters (${recentWindow}-day window)`
        );
      } else {
        toast.error(data.error || "Failed to queue emails");
      }
    } catch (error) {
      console.error("Error sending recent job emails:", error);
      toast.error("Failed to queue recent job emails");
    } finally {
      setSendingRecent(false);
    }
  };

  const handleSaveToggles = async () => {
    try {
      await updateEmailSettings({
        settings: {
          recent_jobs_auto_1d: auto1d,
          recent_jobs_auto_3d: auto3d,
        },
      }).unwrap();
      toast.success("Recent job email settings saved");
    } catch (error: any) {
      console.error("Error saving email settings", error);
      toast.error(error?.data?.error || "Failed to save settings");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Sent
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Failed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      default:
        return status;
    }
  };

  if (loading && !stats) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
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
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Email Notification Statistics
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Monitor email notification performance and delivery statistics
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleManualSend}
                  disabled={sendingManual}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <EnvelopeIcon className="w-4 h-4 mr-2" />
                  {sendingManual ? "Sending..." : "Send Manual Emails"}
                </button>
                <div className="flex items-center space-x-2">
                  <select
                    value={recentWindow}
                    onChange={(e) => setRecentWindow(e.target.value as "1" | "3")}
                    className="rounded-md border-gray-300 text-sm"
                  >
                    <option value="1">Last 1 day</option>
                    <option value="3">Last 3 days</option>
                  </select>
                  <button
                    onClick={handleRecentSend}
                    disabled={sendingRecent}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {sendingRecent ? "Queuing..." : "Send Recent"}
                  </button>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <ArrowPathIcon
                    className={`w-4 h-4 mr-2 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  {refreshing ? "Syncing..." : "Refresh"}
                </button>
                <Link
                  href="/dashboard/admin"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>

            {/* Time Frame Filter */}
            <div className="mb-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                {[
                  { value: "all", label: "All Time" },
                  { value: "today", label: "Today" },
                  { value: "week", label: "Last 7 Days" },
                  { value: "month", label: "Last 30 Days" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTimeFrame(option.value);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      timeFrame === option.value
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Jobs Auto/Manual Controls */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Auto recent job emails</p>
                    <p className="text-xs text-gray-500">Send daily/3-day blasts automatically</p>
                  </div>
                  <button
                    onClick={handleSaveToggles}
                    disabled={savingSettings}
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {savingSettings ? "Saving..." : "Save"}
                  </button>
                </div>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      checked={auto1d}
                      onChange={(e) => setAuto1d(e.target.checked)}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last 1 day (daily)</p>
                      <p className="text-xs text-gray-500">Send recruiters jobs posted in the last 24 hours automatically.</p>
                    </div>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      checked={auto3d}
                      onChange={(e) => setAuto3d(e.target.checked)}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last 3 days (every run)</p>
                      <p className="text-xs text-gray-500">Send recruiters jobs posted in the last 3 days when the cron runs.</p>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500">Cron endpoint: /api/cron/recent-jobs-emails</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900 mb-2">Manual recent job blast</p>
                <p className="text-xs text-gray-500 mb-4">Send jobs posted in the chosen window with title, location, and recruiter commission.</p>
                <div className="flex items-center space-x-3">
                  <select
                    value={recentWindow}
                    onChange={(e) => setRecentWindow(e.target.value as "1" | "3")}
                    className="rounded-md border-gray-300 text-sm"
                  >
                    <option value="1">Last 1 day</option>
                    <option value="3">Last 3 days</option>
                  </select>
                  <button
                    onClick={handleRecentSend}
                    disabled={sendingRecent}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {sendingRecent ? "Queuing..." : "Send now"}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <XCircleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-1 text-sm text-red-700">
                      {"data" in error &&
                      error.data &&
                      typeof error.data === "object" &&
                      "error" in error.data
                        ? String(error.data.error)
                        : "Failed to fetch email notification statistics"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {stats && (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <EnvelopeIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total Notifications
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {stats.overview.totalNotifications}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <CheckCircleIcon className="h-6 w-6 text-green-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Success Rate
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {stats.overview.successRate}%
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <UsersIcon className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total Recipients
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {stats.overview.totalRecipients}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <XCircleIcon className="h-6 w-6 text-red-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Failed Notifications
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {stats.overview.failedNotifications}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Notification Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Successful
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {stats.overview.successfulNotifications}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Failed</span>
                        <span className="text-sm font-medium text-red-600">
                          {stats.overview.failedNotifications}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pending</span>
                        <span className="text-sm font-medium text-yellow-600">
                          {stats.overview.pendingNotifications}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Recipient Statistics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Total Recipients
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {stats.overview.totalRecipients}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Successfully Reached
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {stats.overview.successfulRecipients}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Failed to Reach
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          {stats.overview.failedRecipients}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Recipient Success Rate
                        </span>
                        <span className="text-sm font-medium text-blue-600">
                          {stats.overview.recipientSuccessRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Notifications Table */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Recent Email Notifications
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sent At
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Recipients
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Jobs Count
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Retries
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Error
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.recentNotifications.length > 0 ? (
                            stats.recentNotifications.map((notification) => (
                              <tr key={notification._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(notification.sentAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {notification.recipientCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getStatusBadge(notification.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {notification.jobIds.length}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {notification.retryCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                  {notification.errorMessage ? (
                                    <span title={notification.errorMessage}>
                                      {notification.errorMessage.length > 50
                                        ? `${notification.errorMessage.substring(
                                            0,
                                            50
                                          )}...`
                                        : notification.errorMessage}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-6 py-4 text-center text-sm text-gray-500"
                              >
                                No email notifications found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {stats.pagination.totalPages > 1 && (
                      <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Showing{" "}
                          {(stats.pagination.currentPage - 1) *
                            stats.pagination.itemsPerPage +
                            1}{" "}
                          to{" "}
                          {Math.min(
                            stats.pagination.currentPage *
                              stats.pagination.itemsPerPage,
                            stats.pagination.totalItems
                          )}{" "}
                          of {stats.pagination.totalItems} results
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handlePageChange(stats.pagination.currentPage - 1)
                            }
                            disabled={stats.pagination.currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() =>
                              handlePageChange(stats.pagination.currentPage + 1)
                            }
                            disabled={
                              stats.pagination.currentPage ===
                              stats.pagination.totalPages
                            }
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
