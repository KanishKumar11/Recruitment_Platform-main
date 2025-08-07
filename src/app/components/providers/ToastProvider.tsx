"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          background: "#fff",
          color: "#374151",
          borderRadius: "8px",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e5e7eb",
          padding: "12px 16px",
          fontSize: "14px",
          maxWidth: "400px",
        },
        // Styling for different toast types
        success: {
          duration: 4000,
          style: {
            borderLeft: "4px solid #10b981",
          },
          iconTheme: {
            primary: "#10b981",
            secondary: "#fff",
          },
        },
        error: {
          duration: 6000,
          style: {
            borderLeft: "4px solid #ef4444",
          },
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
        loading: {
          style: {
            borderLeft: "4px solid #6366f1",
          },
        },
      }}
    />
  );
}
