"use client";

import { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";
import {
  SupportTicket,
  useGetUserTicketQuery,
  useGetAdminTicketQuery,
  useUpdateTicketMutation,
  useGetAssignableUsersQuery,
  TicketStatus,
  TicketPriority,
} from "@/app/store/services/supportApi";
import TicketStatusBadge from "./TicketStatusBadge";
import PriorityBadge from "./PriorityBadge";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import TicketResponseForm from "./TicketResponseForm";
import ErrorBoundary from "@/app/components/ui/ErrorBoundary";
import { supportToasts } from "@/app/lib/toast";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";
import {
  X,
  Calendar,
  User,
  MessageSquare,
  Clock,
  Tag,
  AlertCircle,
  RefreshCw,
  Hash,
} from "lucide-react";

interface TicketDetailModalProps {
  ticket: SupportTicket;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function TicketDetailModal({
  ticket: initialTicket,
  isOpen,
  onClose,
  isAdmin = false,
}: TicketDetailModalProps) {
  // Get current user from auth state
  const { user } = useSelector((state: RootState) => state.auth);

  // Check if user can respond to tickets (admin or assigned internal user)
  const canRespond =
    isAdmin ||
    (user?.role === "INTERNAL" &&
      initialTicket.assignedTo?.toString() === user?.id);

  // Check if user should use admin endpoint (admin or assigned internal user)
  const shouldUseAdminEndpoint =
    isAdmin ||
    (user?.role === "INTERNAL" &&
      initialTicket.assignedTo?.toString() === user?.id);

  // Fetch real-time ticket data using appropriate endpoint
  const {
    data: userTicketData,
    isLoading: userLoading,
    error: userError,
    refetch: userRefetch,
  } = useGetUserTicketQuery(initialTicket._id, {
    skip: !isOpen || shouldUseAdminEndpoint,
    pollingInterval: 30000,
    refetchOnFocus: true,
  });

  const {
    data: adminTicketData,
    isLoading: adminLoading,
    error: adminError,
    refetch: adminRefetch,
  } = useGetAdminTicketQuery(initialTicket._id, {
    skip: !isOpen || !shouldUseAdminEndpoint,
    pollingInterval: 30000,
    refetchOnFocus: true,
  });

  const { data: assignableUsers } = useGetAssignableUsersQuery(undefined, {
    skip: !shouldUseAdminEndpoint,
  });

  const [updateTicket] = useUpdateTicketMutation();
  const { handleTicketError } = useErrorHandler();

  const ticketData = shouldUseAdminEndpoint ? adminTicketData : userTicketData;
  const isLoading = shouldUseAdminEndpoint ? adminLoading : userLoading;
  const error = shouldUseAdminEndpoint ? adminError : userError;
  const refetch = shouldUseAdminEndpoint ? adminRefetch : userRefetch;
  const ticket = ticketData?.ticket || initialTicket;

  // Refetch when modal opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  // Handle ticket updates with error handling
  const handleTicketUpdate = async (updates: any) => {
    try {
      await updateTicket({
        id: ticket._id,
        ...updates,
      }).unwrap();
      supportToasts.ticketUpdated();
    } catch (error) {
      handleTicketError(error, "update");
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Less than an hour ago";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }
  };

  // Filter responses based on access level
  const visibleResponses =
    isAdmin || canRespond
      ? ticket.responses || []
      : ticket.responses?.filter((response) => !response.isInternal) || [];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <ErrorBoundary>
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div>
                        <Dialog.Title
                          as="h3"
                          className="text-lg font-medium leading-6 text-gray-900 flex items-center"
                        >
                          <Hash className="h-5 w-5 mr-2 text-gray-500" />
                          {ticket.ticketNumber}
                        </Dialog.Title>
                        <div className="flex items-center space-x-2 mt-1">
                          <TicketStatusBadge status={ticket.status} />
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        title="Refresh ticket"
                      >
                        <RefreshCw
                          className={`h-5 w-5 ${
                            isLoading ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close</span>
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {isLoading && (
                      <div className="flex justify-center py-4">
                        <LoadingSpinner text="Updating ticket..." />
                      </div>
                    )}

                    {!!error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center text-red-800">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          <span>Failed to load latest ticket data</span>
                        </div>
                      </div>
                    )}
                    {/* Ticket Info */}
                    <div className="mb-6">
                      <h4 className="text-xl font-semibold text-gray-900 mb-3">
                        {ticket.subject}
                      </h4>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <div>
                            <div className="font-medium">Created</div>
                            <div>{formatDate(ticket.createdAt)}</div>
                          </div>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <div>
                            <div className="font-medium">Last Updated</div>
                            <div>{formatRelativeTime(ticket.updatedAt)}</div>
                          </div>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <Tag className="h-4 w-4 mr-2" />
                          <div>
                            <div className="font-medium">Category</div>
                            <div>{ticket.category}</div>
                          </div>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2" />
                          <div>
                            <div className="font-medium">Submitted by</div>
                            <div>
                              {ticket.submittedBy?.name ||
                                ticket.submittedBy?.email ||
                                "Unknown User"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Admin Controls */}
                      {isAdmin && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h6 className="text-sm font-medium text-gray-900 mb-3">
                            Admin Controls
                          </h6>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Status
                              </label>
                              <select
                                value={ticket.status}
                                onChange={(e) =>
                                  handleTicketUpdate({
                                    status: e.target.value as TicketStatus,
                                  })
                                }
                                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                {Object.values(TicketStatus).map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Priority
                              </label>
                              <select
                                value={ticket.priority}
                                onChange={(e) =>
                                  handleTicketUpdate({
                                    priority: e.target.value as TicketPriority,
                                  })
                                }
                                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                {Object.values(TicketPriority).map(
                                  (priority) => (
                                    <option key={priority} value={priority}>
                                      {priority}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Assign To
                              </label>
                              <select
                                value={ticket.assignedTo?._id || ""}
                                onChange={(e) =>
                                  handleTicketUpdate({
                                    assignedTo: e.target.value || undefined,
                                  })
                                }
                                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="">Unassigned</option>
                                {assignableUsers?.users.map((user) => (
                                  <option key={user._id} value={user._id}>
                                    {user.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Assignment Info */}
                      {ticket.assignedTo && (
                        <div className="bg-blue-50 rounded-lg p-3 mb-4">
                          <div className="flex items-center text-sm text-blue-800">
                            <User className="h-4 w-4 mr-2" />
                            <span className="font-medium">Assigned to:</span>
                            <span className="ml-1">
                              {ticket.assignedTo?.name ||
                                ticket.assignedTo?.email ||
                                "Unassigned"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Original Message */}
                    <div className="mb-6">
                      <h5 className="text-lg font-medium text-gray-900 mb-3">
                        Original Message
                      </h5>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {ticket.message}
                        </p>
                      </div>
                    </div>

                    {/* Responses */}
                    <div>
                      <h5 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Responses ({visibleResponses.length})
                      </h5>

                      {visibleResponses.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            No responses yet
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Our support team will respond to your ticket soon.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {visibleResponses.map((response) => (
                            <div
                              key={response._id}
                              className={`border rounded-lg p-4 ${
                                response.isInternal
                                  ? "bg-yellow-50 border-yellow-200"
                                  : "bg-white border-gray-200"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="flex-shrink-0">
                                    <div
                                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                        response.isInternal
                                          ? "bg-yellow-100"
                                          : "bg-indigo-100"
                                      }`}
                                    >
                                      <User
                                        className={`h-4 w-4 ${
                                          response.isInternal
                                            ? "text-yellow-600"
                                            : "text-indigo-600"
                                        }`}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <p className="text-sm font-medium text-gray-900">
                                        {response.respondedBy.name ||
                                          response.respondedBy.email}
                                      </p>
                                      {response.isInternal &&
                                        (isAdmin || canRespond) && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Internal
                                          </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      Support Team
                                    </p>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(response.createdAt)}
                                </div>
                              </div>
                              <div className="ml-10">
                                <p className="text-gray-700 whitespace-pre-wrap">
                                  {response.message}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Admin Response Form */}
                    {canRespond && ticket.status !== "Closed" && (
                      <div className="mt-6">
                        <TicketResponseForm
                          ticketId={ticket._id}
                          onResponseAdded={() => refetch()}
                        />
                      </div>
                    )}

                    {/* Status Information */}
                    {(ticket.status === "Resolved" ||
                      ticket.status === "Closed") && (
                      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <h6 className="text-sm font-medium text-green-800">
                              Ticket {ticket.status}
                            </h6>
                            <p className="text-sm text-green-700 mt-1">
                              {ticket.status === "Resolved"
                                ? "This ticket has been resolved. If you need further assistance, please create a new ticket."
                                : "This ticket has been closed. If you need further assistance, please create a new ticket."}
                            </p>
                            {ticket.resolvedAt && (
                              <p className="text-xs text-green-600 mt-1">
                                Resolved on {formatDate(ticket.resolvedAt)}
                              </p>
                            )}
                            {ticket.closedAt && (
                              <p className="text-xs text-green-600 mt-1">
                                Closed on {formatDate(ticket.closedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 px-6 py-3 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={onClose}
                    >
                      Close
                    </button>
                  </div>
                </ErrorBoundary>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
