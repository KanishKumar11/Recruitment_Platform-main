"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { RootState } from "@/app/store/index";
import SupportTicketForm from "@/app/components/support/SupportTicketForm";
import UserTicketsList from "@/app/components/support/UserTicketsList";
import { useGetUserTicketsQuery } from "@/app/store/services/supportApi";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import ErrorBoundary from "@/app/components/ui/ErrorBoundary";
import { supportToasts } from "@/app/lib/toast";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";
import { Button } from "@/app/components/ui/button";
import {
  HelpCircle,
  MessageSquare,
  Clock,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

export default function HelpPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { handleError } = useErrorHandler();

  const {
    data: ticketsData,
    isLoading,
    error,
    refetch,
  } = useGetUserTicketsQuery(
    { page: 1, limit: 50 }, // Increased limit to show more tickets
    {
      skip: !user,
      // Add refresh trigger to force refetch
      refetchOnMountOrArgChange: true,
      // Enable real-time updates
      pollingInterval: 60000, // Poll every minute
      refetchOnFocus: true, // Refetch when window gains focus
    }
  );

  const handleTicketCreated = () => {
    setShowForm(false);
    setRefreshTrigger((prev) => prev + 1);
    refetch();
  };

  const handleRefresh = () => {
    try {
      refetch();
      supportToasts.autoRefresh();
    } catch (error) {
      handleError(error, { customMessage: "Failed to refresh tickets" });
    }
  };

  const stats = {
    total: ticketsData?.tickets?.length || 0,
    open: ticketsData?.tickets?.filter((t) => t.status === "Open").length || 0,
    inProgress:
      ticketsData?.tickets?.filter((t) => t.status === "In Progress").length ||
      0,
    resolved:
      ticketsData?.tickets?.filter(
        (t) => t.status === "Resolved" || t.status === "Closed"
      ).length || 0,
  };

  return (
    <ProtectedLayout
      allowedRoles={["COMPANY", "RECRUITER", "ADMIN", "INTERNAL"]}
    >
      <DashboardLayout>
        <ErrorBoundary>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                      <HelpCircle className="mr-3 h-8 w-8 text-indigo-600" />
                      Help & Support
                    </h1>
                    <p className="mt-2 text-gray-600">
                      Get help with your account, submit support requests, and
                      track your tickets.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {showForm ? "Cancel" : "New Support Ticket"}
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <MessageSquare className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Tickets
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.total}
                            </div>
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
                        <HelpCircle className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Open
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.open}
                            </div>
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
                        <Clock className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            In Progress
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.inProgress}
                            </div>
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
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Resolved
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.resolved}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Ticket Form */}
              {showForm && (
                <div className="mb-8">
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Submit a Support Request
                      </h3>
                      <SupportTicketForm
                        onSuccess={handleTicketCreated}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tickets List */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Your Support Tickets
                  </h3>

                  {isLoading ? (
                    <LoadingSpinner text="Loading your tickets..." />
                  ) : error ? (
                    <div className="text-center py-8">
                      <div className="text-red-600 mb-2">
                        Failed to load tickets
                      </div>
                      <Button
                        onClick={() => refetch()}
                        variant="link"
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium p-0 h-auto"
                      >
                        Try again
                      </Button>
                    </div>
                  ) : (
                    <UserTicketsList
                      tickets={ticketsData?.tickets || []}
                      onRefresh={handleRefresh}
                      isLoading={isLoading}
                      error={error}
                    />
                  )}
                </div>
              </div>

              {/* Help Resources */}
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Additional Resources
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <a
                    href="/faq"
                    className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center">
                      <HelpCircle className="h-5 w-5 text-indigo-600 mr-3" />
                      <span className="font-medium text-gray-900">FAQ</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Find answers to commonly asked questions
                    </p>
                  </a>

                  <div className="block p-4 bg-white rounded-lg shadow">
                    <div className="flex items-center">
                      <MessageSquare className="h-5 w-5 text-indigo-600 mr-3" />
                      <span className="font-medium text-gray-900">
                        Contact Info
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      For urgent issues, contact our support team directly
                    </p>
                  </div>

                  <div className="block p-4 bg-white rounded-lg shadow">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-indigo-600 mr-3" />
                      <span className="font-medium text-gray-900">
                        Response Time
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      We typically respond within 24 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
