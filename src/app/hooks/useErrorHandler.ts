import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { showNotification as showReduxNotification } from "@/app/store/slices/uiSlice";
import { supportToasts } from "@/app/lib/toast";
import { classifyError } from "@/app/lib/retryUtils";

export interface ErrorHandlerOptions {
  showToast?: boolean;
  showNotification?: boolean;
  logError?: boolean;
  customMessage?: string;
  onError?: (error: any) => void;
}

export function useErrorHandler() {
  const dispatch = useDispatch();

  const handleError = useCallback(
    (error: any, options: ErrorHandlerOptions = {}) => {
      const {
        showToast = true,
        showNotification = false,
        logError = true,
        customMessage,
        onError,
      } = options;

      // Classify the error
      const errorInfo = classifyError(error);
      const message = customMessage || errorInfo.userMessage;

      // Log error in development
      if (logError && process.env.NODE_ENV === "development") {
        console.error("Error handled:", error, errorInfo);
      }

      // Show toast notification
      if (showToast) {
        switch (errorInfo.type) {
          case "network":
            supportToasts.networkError();
            break;
          case "auth":
            supportToasts.unauthorized();
            break;
          case "validation":
            supportToasts.formValidation(message);
            break;
          case "client":
            if (error?.status === 429) {
              supportToasts.rateLimited();
            } else {
              supportToasts.loadingFailed(message);
            }
            break;
          default:
            supportToasts.loadingFailed(message);
        }
      }

      // Show Redux notification
      if (showNotification) {
        dispatch(
          showReduxNotification({
            type: "error",
            message,
          })
        );
      }

      // Call custom error handler
      if (onError) {
        onError(error);
      }

      return errorInfo;
    },
    [dispatch]
  );

  // Specific handlers for common support operations
  const handleTicketError = useCallback(
    (error: any, operation: "create" | "update" | "delete" | "load") => {
      const errorInfo = classifyError(error);

      switch (operation) {
        case "create":
          supportToasts.ticketCreateFailed(errorInfo.userMessage);
          break;
        case "update":
          supportToasts.ticketUpdateFailed(errorInfo.userMessage);
          break;
        case "delete":
          supportToasts.ticketDeleteFailed(errorInfo.userMessage);
          break;
        case "load":
          supportToasts.loadingFailed(errorInfo.userMessage);
          break;
      }

      return errorInfo;
    },
    []
  );

  const handleResponseError = useCallback((error: any) => {
    const errorInfo = classifyError(error);
    supportToasts.responseAddFailed(errorInfo.userMessage);
    return errorInfo;
  }, []);

  const handleSettingsError = useCallback((error: any) => {
    const errorInfo = classifyError(error);
    supportToasts.settingsUpdateFailed(errorInfo.userMessage);
    return errorInfo;
  }, []);

  return {
    handleError,
    handleTicketError,
    handleResponseError,
    handleSettingsError,
  };
}

export default useErrorHandler;
