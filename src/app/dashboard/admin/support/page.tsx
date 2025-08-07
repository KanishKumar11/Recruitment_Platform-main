"use client";

import { useState } from "react";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import TicketsTable from "@/app/components/admin/TicketsTable";
import SupportSettingsPanel from "@/app/components/admin/SupportSettingsPanel";
import { useGetTicketStatsQuery } from "@/app/store/services/supportApi";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import ErrorBoundary from "@/app/components/ui/ErrorBoundary";
import LoadingState from "@/app/components/ui/LoadingState";
import { supportToasts } from "@/app/lib/toast";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";
import {
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from "@/app/store/services/supportApi";

export default function AdminSupportDashboard() {
  const [activeTab, setActiveTab] = useState<"tickets" | "settings">("tickets");
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useGetTicketStatsQuery();
  const { handleError } = useErrorHandler();

  const handleStatsRetry = () => {
    refetchStats();
    supportToasts.autoRefresh();
  };

  return (
    <ProtectedLayout allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <ErrorBoundary>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Support Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage support tickets and configure system settings
                </p>
              </div>

              {/* Tab Navigation */}
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab("tickets")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "tickets"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Support Tickets
                    </button>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "settings"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Settings
                    </button>
                  </nav>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "tickets" && (
                <>
                  {/* Stats Cards */}
                  <LoadingState
                    isLoading={statsLoading}
                    error={statsError}
                    isEmpty={!stats}
                    onRetry={handleStatsRetry}
                    loadingText="Loading statistics..."
                    errorText="Failed to load statistics"
                    size="sm"
                  >
                    {stats && (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                          <div className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    📊
                                  </span>
                                </div>
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-gray-500 truncate">
                                    Total Tickets
                                  </dt>
                                  <dd className="text-lg font-medium text-gray-900">
                                    {stats.total}
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
                                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    🟢
                                  </span>
                                </div>
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-gray-500 truncate">
                                    Open
                                  </dt>
                                  <dd className="text-lg font-medium text-gray-900">
                                    {stats.open}
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
                                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    🟡
                                  </span>
                                </div>
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-gray-500 truncate">
                                    In Progress
                                  </dt>
                                  <dd className="text-lg font-medium text-gray-900">
                                    {stats.inProgress}
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
                                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    ✅
                                  </span>
                                </div>
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-gray-500 truncate">
                                    Resolved
                                  </dt>
                                  <dd className="text-lg font-medium text-gray-900">
                                    {stats.resolved}
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
                                <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">
                                    🔒
                                  </span>
                                </div>
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-gray-500 truncate">
                                    Closed
                                  </dt>
                                  <dd className="text-lg font-medium text-gray-900">
                                    {stats.closed}
                                  </dd>
                                </dl>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </LoadingState>

                  {/* Tickets Table */}
                  <div className="bg-white shadow rounded-lg">
                    <TicketsTable />
                  </div>
                </>
              )}

              {activeTab === "settings" && <SupportSettingsPanel />}
            </div>
          </div>
        </ErrorBoundary>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
