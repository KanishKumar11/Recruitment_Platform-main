"use client";

import { useState, useMemo } from "react";
import {
  useGetAllTicketsQuery,
  useGetAssignableUsersQuery,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  SupportTicket,
} from "@/app/store/services/supportApi";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import TicketStatusBadge from "@/app/components/support/TicketStatusBadge";
import PriorityBadge from "@/app/components/support/PriorityBadge";
import TicketDetailModal from "@/app/components/support/TicketDetailModal";
import ErrorBoundary from "@/app/components/ui/ErrorBoundary";
import { TicketLoadingState } from "@/app/components/ui/LoadingState";
import { supportToasts } from "@/app/lib/toast";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface TicketFilters {
  status: TicketStatus[];
  priority: TicketPriority[];
  category: TicketCategory[];
  assignedTo: string;
  dateRange: { start: string; end: string } | null;
  search: string;
}

interface SortConfig {
  key: keyof SupportTicket | "submittedBy.name" | "assignedTo.name";
  direction: "asc" | "desc";
}

export default function TicketsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "desc",
  });
  const { handleError } = useErrorHandler();

  const [filters, setFilters] = useState<TicketFilters>({
    status: [],
    priority: [],
    category: [],
    assignedTo: "",
    dateRange: null,
    search: "",
  });

  // Build query parameters
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      ...(filters.status.length > 0 && { status: filters.status }),
      ...(filters.priority.length > 0 && { priority: filters.priority }),
      ...(filters.category.length > 0 && { category: filters.category }),
      ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
      ...(filters.dateRange && { dateRange: filters.dateRange }),
      ...(filters.search && { search: filters.search }),
    }),
    [currentPage, pageSize, filters]
  );

  const {
    data: ticketsData,
    isLoading,
    error,
    refetch,
  } = useGetAllTicketsQuery(queryParams);
  const { data: assignableUsers } = useGetAssignableUsersQuery();

  // Sort tickets client-side for better UX
  const sortedTickets = useMemo(() => {
    if (!ticketsData?.tickets) return [];

    const tickets = [...ticketsData.tickets];
    return tickets.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === "submittedBy.name") {
        aValue = a.submittedBy.name;
        bValue = b.submittedBy.name;
      } else if (sortConfig.key === "assignedTo.name") {
        aValue = a.assignedTo?.name || "";
        bValue = b.assignedTo?.name || "";
      } else {
        aValue = a[sortConfig.key as keyof SupportTicket];
        bValue = b[sortConfig.key as keyof SupportTicket];
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [ticketsData?.tickets, sortConfig]);

  const handleSort = (key: SortConfig["key"]) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleFilterChange = (filterType: keyof TicketFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleMultiSelectFilter = (
    filterType: "status" | "priority" | "category",
    value: string
  ) => {
    setFilters((prev) => {
      const currentValues = prev[filterType] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [filterType]: newValues,
      };
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      category: [],
      assignedTo: "",
      dateRange: null,
      search: "",
    });
    setCurrentPage(1);
  };

  const getSortIcon = (key: SortConfig["key"]) => {
    if (sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const handleRetry = () => {
    refetch();
    supportToasts.autoRefresh();
  };

  const { tickets = [], pagination } = ticketsData || {};

  return (
    <ErrorBoundary>
      <TicketLoadingState
        isLoading={isLoading}
        error={error}
        isEmpty={tickets.length === 0}
        onRetry={handleRetry}
      >
        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search tickets, users, or content..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {(filters.status.length > 0 ||
                filters.priority.length > 0 ||
                filters.category.length > 0 ||
                filters.assignedTo) && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="space-y-2">
                    {Object.values(TicketStatus).map((status) => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status)}
                          onChange={() =>
                            handleMultiSelectFilter("status", status)
                          }
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {status}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <div className="space-y-2">
                    {Object.values(TicketPriority).map((priority) => (
                      <label key={priority} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.priority.includes(priority)}
                          onChange={() =>
                            handleMultiSelectFilter("priority", priority)
                          }
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {priority}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="space-y-2">
                    {Object.values(TicketCategory).map((category) => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.category.includes(category)}
                          onChange={() =>
                            handleMultiSelectFilter("category", category)
                          }
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {category}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Assigned To Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To
                  </label>
                  <select
                    value={filters.assignedTo}
                    onChange={(e) =>
                      handleFilterChange("assignedTo", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Users</option>
                    <option value="unassigned">Unassigned</option>
                    {assignableUsers?.users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange?.start || ""}
                    onChange={(e) =>
                      handleFilterChange("dateRange", {
                        start: e.target.value,
                        end: filters.dateRange?.end || "",
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange?.end || ""}
                    onChange={(e) =>
                      handleFilterChange("dateRange", {
                        start: filters.dateRange?.start || "",
                        end: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex justify-between items-center px-4">
            <p className="text-sm text-gray-700">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, pagination?.total || 0)} of{" "}
              {pagination?.total || 0} tickets
            </p>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Show:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("ticketNumber")}
                  >
                    Ticket # {getSortIcon("ticketNumber")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("subject")}
                  >
                    Subject {getSortIcon("subject")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("submittedBy.name")}
                  >
                    Submitted By {getSortIcon("submittedBy.name")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    Status {getSortIcon("status")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("priority")}
                  >
                    Priority {getSortIcon("priority")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("category")}
                  >
                    Category {getSortIcon("category")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("assignedTo.name")}
                  >
                    Assigned To {getSortIcon("assignedTo.name")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("createdAt")}
                  >
                    Created {getSortIcon("createdAt")}
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      {ticket.ticketNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {ticket.submittedBy.name}
                        </div>
                        <div className="text-gray-500">
                          {ticket.submittedBy.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TicketStatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.assignedTo ? (
                        <div>
                          <div className="font-medium">
                            {ticket.assignedTo.name}
                          </div>
                          <div className="text-gray-500">
                            {ticket.assignedTo.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {sortedTickets.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No tickets found matching your criteria.
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex justify-between flex-1 sm:hidden">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, pagination.pages)
                    )
                  }
                  disabled={currentPage === pagination.pages}
                  className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{" "}
                    <span className="font-medium">{pagination.pages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {/* Page Numbers */}
                    {Array.from(
                      { length: Math.min(5, pagination.pages) },
                      (_, i) => {
                        const pageNum = Math.max(
                          1,
                          Math.min(
                            currentPage - 2 + i,
                            pagination.pages - 4 + i
                          )
                        );
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}

                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, pagination.pages)
                        )
                      }
                      disabled={currentPage === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Detail Modal */}
          {selectedTicket && (
            <TicketDetailModal
              ticket={selectedTicket}
              isOpen={!!selectedTicket}
              onClose={() => setSelectedTicket(null)}
              isAdmin={true}
            />
          )}
        </div>
      </TicketLoadingState>
    </ErrorBoundary>
  );
}
