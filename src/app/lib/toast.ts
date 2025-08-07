import toast from "react-hot-toast";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

// Custom toast configurations
const toastConfig = {
  duration: 4000,
  position: "top-right" as const,
  style: {
    borderRadius: "8px",
    background: "#fff",
    color: "#374151",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e5e7eb",
    padding: "12px 16px",
    fontSize: "14px",
    maxWidth: "400px",
  },
};

// Success toast
export const showSuccessToast = (message: string, options?: any) => {
  return toast.success(message, {
    ...toastConfig,
    style: {
      ...toastConfig.style,
      borderLeft: "4px solid #10b981",
    },
    iconTheme: {
      primary: "#10b981",
      secondary: "#fff",
    },
    ...options,
  });
};

// Error toast
export const showErrorToast = (message: string, options?: any) => {
  return toast.error(message, {
    ...toastConfig,
    duration: 6000, // Longer duration for errors
    style: {
      ...toastConfig.style,
      borderLeft: "4px solid #ef4444",
    },
    iconTheme: {
      primary: "#ef4444",
      secondary: "#fff",
    },
    ...options,
  });
};

// Warning toast
export const showWarningToast = (message: string, options?: any) => {
  return toast(message, {
    ...toastConfig,
    icon: "⚠️",
    style: {
      ...toastConfig.style,
      borderLeft: "4px solid #f59e0b",
    },
    ...options,
  });
};

// Info toast
export const showInfoToast = (message: string, options?: any) => {
  return toast(message, {
    ...toastConfig,
    icon: "ℹ️",
    style: {
      ...toastConfig.style,
      borderLeft: "4px solid #3b82f6",
    },
    ...options,
  });
};

// Loading toast
export const showLoadingToast = (message: string, options?: any) => {
  return toast.loading(message, {
    ...toastConfig,
    style: {
      ...toastConfig.style,
      borderLeft: "4px solid #6366f1",
    },
    ...options,
  });
};

// Promise toast - automatically handles loading, success, and error states
export const showPromiseToast = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  },
  options?: any
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      ...toastConfig,
      success: {
        ...toastConfig,
        style: {
          ...toastConfig.style,
          borderLeft: "4px solid #10b981",
        },
        iconTheme: {
          primary: "#10b981",
          secondary: "#fff",
        },
      },
      error: {
        ...toastConfig,
        duration: 6000,
        style: {
          ...toastConfig.style,
          borderLeft: "4px solid #ef4444",
        },
        iconTheme: {
          primary: "#ef4444",
          secondary: "#fff",
        },
      },
      loading: {
        ...toastConfig,
        style: {
          ...toastConfig.style,
          borderLeft: "4px solid #6366f1",
        },
      },
      ...options,
    }
  );
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Dismiss specific toast
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

// Support-specific toast messages
export const supportToasts = {
  ticketCreated: (ticketNumber: string) =>
    showSuccessToast(
      `Support ticket ${ticketNumber} created successfully! We'll get back to you soon.`,
      { duration: 6000 }
    ),

  ticketUpdated: () => showSuccessToast("Ticket updated successfully"),

  ticketDeleted: () => showSuccessToast("Ticket deleted successfully"),

  responseAdded: () => showSuccessToast("Response added successfully"),

  settingsUpdated: () =>
    showSuccessToast("Support settings updated successfully"),

  emailSent: () => showSuccessToast("Email notification sent successfully"),

  // Error messages
  ticketCreateFailed: (error?: string) =>
    showErrorToast(
      error || "Failed to create support ticket. Please try again."
    ),

  ticketUpdateFailed: (error?: string) =>
    showErrorToast(error || "Failed to update ticket. Please try again."),

  ticketDeleteFailed: (error?: string) =>
    showErrorToast(error || "Failed to delete ticket. Please try again."),

  responseAddFailed: (error?: string) =>
    showErrorToast(error || "Failed to add response. Please try again."),

  settingsUpdateFailed: (error?: string) =>
    showErrorToast(error || "Failed to update settings. Please try again."),

  loadingFailed: (error?: string) =>
    showErrorToast(error || "Failed to load data. Please refresh the page."),

  networkError: () =>
    showErrorToast(
      "Network error. Please check your connection and try again."
    ),

  unauthorized: () =>
    showErrorToast("You don't have permission to perform this action."),

  rateLimited: () =>
    showWarningToast(
      "You're submitting requests too quickly. Please wait a moment and try again."
    ),

  // Info messages
  autoRefresh: () =>
    showInfoToast("Data refreshed automatically", { duration: 2000 }),

  formValidation: (message: string) => showWarningToast(message),
};

export default {
  success: showSuccessToast,
  error: showErrorToast,
  warning: showWarningToast,
  info: showInfoToast,
  loading: showLoadingToast,
  promise: showPromiseToast,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
  support: supportToasts,
};
