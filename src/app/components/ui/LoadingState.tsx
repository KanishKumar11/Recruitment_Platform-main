"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";

interface LoadingStateProps {
  isLoading?: boolean;
  error?: any;
  isEmpty?: boolean;
  loadingText?: string;
  errorText?: string;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  onRetry?: () => void;
  showRetry?: boolean;
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingState({
  isLoading = false,
  error = null,
  isEmpty = false,
  loadingText = "Loading...",
  errorText = "Something went wrong",
  emptyText = "No data available",
  emptyIcon,
  onRetry,
  showRetry = true,
  children,
  className = "",
  size = "md",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: {
      container: "py-8",
      icon: "h-8 w-8",
      text: "text-sm",
      button: "px-3 py-1.5 text-sm",
    },
    md: {
      container: "py-12",
      icon: "h-12 w-12",
      text: "text-base",
      button: "px-4 py-2 text-sm",
    },
    lg: {
      container: "py-16",
      icon: "h-16 w-16",
      text: "text-lg",
      button: "px-6 py-3 text-base",
    },
  };

  const classes = sizeClasses[size];

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`flex flex-col items-center justify-center ${classes.container} ${className}`}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`${classes.icon} text-indigo-600 mb-4`}
        >
          <Loader2 className="w-full h-full" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-gray-600 font-medium ${classes.text}`}
        >
          {loadingText}
        </motion.p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center ${classes.container} ${className}`}
      >
        <div className={`${classes.icon} text-red-500 mb-4`}>
          <AlertCircle className="w-full h-full" />
        </div>
        <h3 className={`font-semibold text-gray-900 mb-2 ${classes.text}`}>
          {errorText}
        </h3>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          {error?.data?.error ||
            error?.message ||
            "Please try again or contact support if the problem persists."}
        </p>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className={`inline-flex items-center border border-transparent font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${classes.button}`}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div
        className={`flex flex-col items-center justify-center ${classes.container} ${className}`}
      >
        <div className={`${classes.icon} text-gray-400 mb-4`}>
          {emptyIcon || (
            <svg
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3"
              />
            </svg>
          )}
        </div>
        <h3 className={`font-medium text-gray-900 mb-2 ${classes.text}`}>
          {emptyText}
        </h3>
      </div>
    );
  }

  // Success state - render children
  return <>{children}</>;
}

// Specialized loading states for support components
export const TicketLoadingState = ({
  isLoading,
  error,
  isEmpty,
  onRetry,
  children,
}: Omit<LoadingStateProps, "loadingText" | "errorText" | "emptyText">) => (
  <LoadingState
    isLoading={isLoading}
    error={error}
    isEmpty={isEmpty}
    onRetry={onRetry}
    loadingText="Loading tickets..."
    errorText="Failed to load tickets"
    emptyText="No tickets found"
    emptyIcon={
      <svg
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    }
  >
    {children}
  </LoadingState>
);

export const ResponseLoadingState = ({
  isLoading,
  error,
  isEmpty,
  onRetry,
  children,
}: Omit<LoadingStateProps, "loadingText" | "errorText" | "emptyText">) => (
  <LoadingState
    isLoading={isLoading}
    error={error}
    isEmpty={isEmpty}
    onRetry={onRetry}
    loadingText="Loading responses..."
    errorText="Failed to load responses"
    emptyText="No responses yet"
    size="sm"
    emptyIcon={
      <svg
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z"
        />
      </svg>
    }
  >
    {children}
  </LoadingState>
);
