"use client";

import { useState, useEffect } from "react";
import {
  SupportTicket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from "@/app/store/services/supportApi";
import TicketStatusBadge from "./TicketStatusBadge";
import PriorityBadge from "./PriorityBadge";
import TicketDetailModal from "./TicketDetailModal";
import ErrorBoundary from "@/app/components/ui/ErrorBoundary";
import { TicketLoadingState } from "@/app/components/ui/LoadingState";
import { supportToasts } from "@/app/lib/toast";
import {
  MessageSquare,
  Calendar,
  User,
  Eye,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
} from "lucide-react";

interface UserTicketsListProps {
  tickets: SupportTicket[];
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: any;
}

export default function UserTicketsList({
  tickets,
  onRefresh,
  isLoading = false,
  error = null,
}: UserTicketsListProps) {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">(
    "all"
  );
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "all">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "priority">(
    "updatedAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (onRefresh) {
        onRefresh();
        setLastRefresh(new Date());
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [onRefresh]);

  // Filter and sort tickets
  const filteredAndSortedTickets = tickets
    .filter((ticket) => {
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || ticket.priority === priorityFilter;
      const matchesCategory =
        categoryFilter === "all" || ticket.category === categoryFilter;
      const matchesSearch =
        searchTerm === "" ||
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchTerm.toLowerCase());

      return (
        matchesStatus && matchesPriority && matchesCategory && matchesSearch
      );
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case "priority":
          const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      try {
        onRefresh();
        setLastRefresh(new Date());
        supportToasts.autoRefresh();
      } catch (error) {
        console.error("Failed to refresh tickets:", error);
        supportToasts.loadingFailed("Failed to refresh tickets");
      }
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getResponseCount = (ticket: SupportTicket) => {
    return ticket.responses?.filter((r) => !r.isInternal).length || 0;
  };

  return (
    <ErrorBoundary>
      <TicketLoadingState
        isLoading={isLoading}
        error={error}
        isEmpty={tickets.length === 0}
        onRetry={onRefresh}
      >
        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {showFilters ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as TicketStatus | "all")
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) =>
                      setPriorityFilter(
                        e.target.value as TicketPriority | "all"
                      )
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) =>
                      setCategoryFilter(
                        e.target.value as TicketCategory | "all"
                      )
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Account Issue">Account Issue</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Bug Report">Bug Report</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="updatedAt">Last Updated</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value as "asc" | "desc")
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}

          {/* Results Count and Last Refresh */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Showing {filteredAndSortedTickets.length} of {tickets.length}{" "}
              tickets
            </span>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Tickets List */}
          <div className="space-y-4">
            {filteredAndSortedTickets.map((ticket) => (
              <div
                key={ticket._id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-mono text-gray-500">
                          #{ticket.ticketNumber}
                        </span>
                        <TicketStatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                      </div>

                      {/* Subject */}
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {ticket.subject}
                      </h3>

                      {/* Message Preview */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {ticket.message}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Created {formatDate(ticket.createdAt)}
                        </div>

                        {ticket.updatedAt !== ticket.createdAt && (
                          <div className="flex items-center">
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Updated {formatDate(ticket.updatedAt)}
                          </div>
                        )}

                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {getResponseCount(ticket)} responses
                        </div>

                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {ticket.category}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0 ml-4">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredAndSortedTickets.length === 0 &&
            (searchTerm || statusFilter !== "all") && (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No tickets found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-2 text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}

          {/* Ticket Detail Modal */}
          {selectedTicket && (
            <TicketDetailModal
              ticket={selectedTicket}
              isOpen={!!selectedTicket}
              onClose={() => setSelectedTicket(null)}
            />
          )}
        </div>
      </TicketLoadingState>
    </ErrorBoundary>
  );
}
