"use client";

import { useState } from "react";
import { useAddTicketResponseMutation } from "@/app/store/services/supportApi";
import {
  Send,
  MessageSquare,
  Eye,
  EyeOff,
  Mail,
  RefreshCw,
} from "lucide-react";
import { supportToasts } from "@/app/lib/toast";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";
import ErrorBoundary from "@/app/components/ui/ErrorBoundary";

interface TicketResponseFormProps {
  ticketId: string;
  onResponseAdded?: () => void;
  className?: string;
}

export default function TicketResponseForm({
  ticketId,
  onResponseAdded,
  className = "",
}: TicketResponseFormProps) {
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [notifyUser, setNotifyUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addResponse, { isLoading, error }] = useAddTicketResponseMutation();
  const { handleResponseError } = useErrorHandler();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      supportToasts.formValidation("Please enter a response message");
      return;
    }

    setIsSubmitting(true);

    try {
      await addResponse({
        ticketId,
        message: message.trim(),
        isInternal,
        notifyUser: !isInternal && notifyUser, // Only notify user for non-internal responses
      }).unwrap();

      // Show success toast
      supportToasts.responseAdded();

      // Reset form
      setMessage("");
      setIsInternal(false);
      setNotifyUser(true);

      // Callback to parent component
      onResponseAdded?.();
    } catch (err) {
      console.error("Failed to add response:", err);
      handleResponseError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorBoundary>
      <div
        className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center mb-3">
          <MessageSquare className="h-5 w-5 text-gray-500 mr-2" />
          <h6 className="text-sm font-medium text-gray-900">Add Response</h6>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Message Input */}
          <div>
            <label htmlFor="response-message" className="sr-only">
              Response message
            </label>
            <textarea
              id="response-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your response here..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              disabled={isLoading}
              required
            />
          </div>

          {/* Response Options */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex flex-col space-y-2">
              {/* Internal Note Toggle */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  {isInternal ? (
                    <EyeOff className="h-4 w-4 mr-1 text-yellow-600" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1 text-gray-500" />
                  )}
                  Internal note (admin only)
                </span>
              </label>

              {/* Email Notification Toggle - only show for non-internal responses */}
              {!isInternal && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifyUser}
                    onChange={(e) => setNotifyUser(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-700 flex items-center">
                    <Mail className="h-4 w-4 mr-1 text-blue-500" />
                    Email user about this response
                  </span>
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSubmitting || !message.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading || isSubmitting ? (
                <>
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Response
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {!!error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-sm text-red-800">
                {typeof error === "object" &&
                error !== null &&
                "data" in error &&
                typeof (error as any).data === "object" &&
                (error as any).data !== null &&
                "error" in (error as any).data
                  ? ((error as any).data as { error: string }).error
                  : "Failed to send response. Please try again."}
              </div>
            </div>
          )}

          {/* Helper Text */}
          <div className="text-xs text-gray-500">
            {isInternal ? (
              <p className="flex items-center">
                <EyeOff className="h-3 w-3 mr-1 text-yellow-600" />
                This internal note will only be visible to admin users and won't
                be sent to the user.
              </p>
            ) : (
              <p className="flex items-center">
                <Eye className="h-3 w-3 mr-1 text-gray-500" />
                This response will be visible to the user who submitted the
                ticket.
              </p>
            )}
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
}
