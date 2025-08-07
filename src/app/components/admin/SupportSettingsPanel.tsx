"use client";

import { useState, useEffect } from "react";
import {
  useGetSupportSettingsQuery,
  useUpdateSupportSettingsMutation,
} from "@/app/store/services/supportApi";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

export default function SupportSettingsPanel() {
  const { data: settingsData, isLoading, error } = useGetSupportSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] =
    useUpdateSupportSettingsMutation();

  const [formData, setFormData] = useState({
    support_email: "",
    support_auto_response: true,
    support_notification_enabled: true,
    support_email_template: "",
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [successMessage, setSuccessMessage] = useState("");

  // Update form data when settings are loaded
  useEffect(() => {
    if (settingsData?.settings) {
      setFormData({
        support_email: settingsData.settings.support_email || "",
        support_auto_response:
          settingsData.settings.support_auto_response ?? true,
        support_notification_enabled:
          settingsData.settings.support_notification_enabled ?? true,
        support_email_template:
          settingsData.settings.support_email_template || "",
      });
    }
  }, [settingsData]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setSuccessMessage("");

    // Validate form
    const errors: Record<string, string> = {};

    if (!formData.support_email.trim()) {
      errors.support_email = "Support email is required";
    } else if (!validateEmail(formData.support_email)) {
      errors.support_email = "Invalid email format";
    }

    if (!formData.support_email_template.trim()) {
      errors.support_email_template = "Email template is required";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const result = await updateSettings({
        settings: formData,
      }).unwrap();

      setSuccessMessage("Support settings updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Error updating support settings:", error);

      if (error.data?.details) {
        setValidationErrors(error.data.details);
      } else {
        setValidationErrors({
          general: error.data?.error || "Failed to update settings",
        });
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-red-600">
          <p>Error loading support settings</p>
          <p className="text-sm mt-1">
            {(error as any)?.data?.error || "Unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Support Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure email notifications and support system settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* General Error */}
        {validationErrors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {validationErrors.general}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Support Email */}
        <div>
          <label
            htmlFor="support_email"
            className="block text-sm font-medium text-gray-700"
          >
            Support Email Address
          </label>
          <div className="mt-1">
            <input
              type="email"
              name="support_email"
              id="support_email"
              value={formData.support_email}
              onChange={handleInputChange}
              className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                validationErrors.support_email
                  ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                  : ""
              }`}
              placeholder="support@yourcompany.com"
            />
          </div>
          {validationErrors.support_email && (
            <p className="mt-2 text-sm text-red-600">
              {validationErrors.support_email}
            </p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Email address where new support ticket notifications will be sent
          </p>
        </div>

        {/* Notification Settings */}
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="support_notification_enabled"
                name="support_notification_enabled"
                type="checkbox"
                checked={formData.support_notification_enabled}
                onChange={handleInputChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor="support_notification_enabled"
                className="font-medium text-gray-700"
              >
                Enable Email Notifications
              </label>
              <p className="text-gray-500">
                Send email notifications when new support tickets are submitted
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="support_auto_response"
                name="support_auto_response"
                type="checkbox"
                checked={formData.support_auto_response}
                onChange={handleInputChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor="support_auto_response"
                className="font-medium text-gray-700"
              >
                Send Auto-Response to Users
              </label>
              <p className="text-gray-500">
                Automatically send confirmation emails to users when they submit
                tickets
              </p>
            </div>
          </div>
        </div>

        {/* Email Template */}
        <div>
          <label
            htmlFor="support_email_template"
            className="block text-sm font-medium text-gray-700"
          >
            Email Notification Template
          </label>
          <div className="mt-1">
            <textarea
              name="support_email_template"
              id="support_email_template"
              rows={8}
              value={formData.support_email_template}
              onChange={handleInputChange}
              className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                validationErrors.support_email_template
                  ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                  : ""
              }`}
              placeholder="Enter your email template here..."
            />
          </div>
          {validationErrors.support_email_template && (
            <p className="mt-2 text-sm text-red-600">
              {validationErrors.support_email_template}
            </p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            HTML template for support ticket notification emails. Available
            variables: ticketNumber, subject, category, priority, userName,
            userEmail, message, createdAt
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Updating...</span>
              </>
            ) : (
              "Update Settings"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
