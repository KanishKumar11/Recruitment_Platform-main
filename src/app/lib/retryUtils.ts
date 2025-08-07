import React from "react";
import { showErrorToast, showWarningToast } from "./toast";

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: any) => void;
  shouldRetry?: (error: any) => boolean;
}

export interface RetryState {
  isRetrying: boolean;
  attempt: number;
  maxAttempts: number;
}

// Default retry configuration
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoff: true,
  onRetry: () => {},
  shouldRetry: (error: any) => {
    // Don't retry on client errors (4xx) except for 408, 429
    if (error?.status >= 400 && error?.status < 500) {
      return error?.status === 408 || error?.status === 429;
    }
    // Retry on network errors and server errors (5xx)
    return true;
  },
};

// Sleep utility
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Calculate delay with exponential backoff
const calculateDelay = (
  attempt: number,
  baseDelay: number,
  useBackoff: boolean
): number => {
  if (!useBackoff) return baseDelay;
  return baseDelay * Math.pow(2, attempt - 1);
};

// Generic retry function
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!config.shouldRetry(error)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === config.maxAttempts) {
        throw error;
      }

      // Call the retry callback
      config.onRetry(attempt, error);

      // Wait before retrying
      const delay = calculateDelay(attempt, config.delay, config.backoff);
      await sleep(delay);
    }
  }

  throw lastError;
}

// RTK Query retry function
export const rtkQueryRetry = (attempt: number, error: any) => {
  // Don't retry on client errors except for specific cases
  if (error?.status >= 400 && error?.status < 500) {
    return error?.status === 408 || error?.status === 429;
  }

  // Retry up to 3 times for server errors and network errors
  return attempt <= 3;
};

// Hook for managing retry state in components
export function useRetryState(initialMaxAttempts: number = 3) {
  const [retryState, setRetryState] = React.useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    maxAttempts: initialMaxAttempts,
  });

  const startRetry = () => {
    setRetryState((prev) => ({
      ...prev,
      isRetrying: true,
      attempt: prev.attempt + 1,
    }));
  };

  const resetRetry = () => {
    setRetryState((prev) => ({
      ...prev,
      isRetrying: false,
      attempt: 0,
    }));
  };

  const canRetry = retryState.attempt < retryState.maxAttempts;

  return {
    retryState,
    startRetry,
    resetRetry,
    canRetry,
  };
}

// Support-specific retry configurations
export const supportRetryConfigs = {
  // For creating tickets - more aggressive retry
  createTicket: {
    maxAttempts: 3,
    delay: 1000,
    backoff: true,
    onRetry: (attempt: number, error: any) => {
      if (attempt === 1) {
        showWarningToast("Retrying to create ticket...");
      }
    },
  },

  // For loading data - quick retry
  loadData: {
    maxAttempts: 2,
    delay: 500,
    backoff: false,
    onRetry: (attempt: number, error: any) => {
      console.log(`Retrying data load, attempt ${attempt}`);
    },
  },

  // For updates - moderate retry
  updateData: {
    maxAttempts: 2,
    delay: 1000,
    backoff: true,
    onRetry: (attempt: number, error: any) => {
      showWarningToast("Retrying update...");
    },
  },

  // For email operations - single retry
  emailOperation: {
    maxAttempts: 2,
    delay: 2000,
    backoff: false,
    onRetry: (attempt: number, error: any) => {
      showWarningToast("Retrying email operation...");
    },
  },
};

// Error classification utility
export function classifyError(error: any): {
  type: "network" | "server" | "client" | "validation" | "auth" | "unknown";
  isRetryable: boolean;
  userMessage: string;
} {
  // Network errors
  if (!error?.status || error?.name === "NetworkError") {
    return {
      type: "network",
      isRetryable: true,
      userMessage:
        "Network connection issue. Please check your internet connection.",
    };
  }

  // Authentication errors
  if (error?.status === 401) {
    return {
      type: "auth",
      isRetryable: false,
      userMessage: "You need to log in to perform this action.",
    };
  }

  // Authorization errors
  if (error?.status === 403) {
    return {
      type: "auth",
      isRetryable: false,
      userMessage: "You don't have permission to perform this action.",
    };
  }

  // Validation errors
  if (error?.status === 400) {
    return {
      type: "validation",
      isRetryable: false,
      userMessage:
        error?.data?.error || "Please check your input and try again.",
    };
  }

  // Rate limiting
  if (error?.status === 429) {
    return {
      type: "client",
      isRetryable: true,
      userMessage: "Too many requests. Please wait a moment and try again.",
    };
  }

  // Server errors
  if (error?.status >= 500) {
    return {
      type: "server",
      isRetryable: true,
      userMessage: "Server error. Please try again in a moment.",
    };
  }

  // Client errors
  if (error?.status >= 400 && error?.status < 500) {
    return {
      type: "client",
      isRetryable: false,
      userMessage:
        error?.data?.error || "Something went wrong. Please try again.",
    };
  }

  // Unknown errors
  return {
    type: "unknown",
    isRetryable: true,
    userMessage: "An unexpected error occurred. Please try again.",
  };
}

export default {
  withRetry,
  rtkQueryRetry,
  supportRetryConfigs,
  classifyError,
};
