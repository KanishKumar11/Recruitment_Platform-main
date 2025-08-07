"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/index";
import {
  useCreateTicketMutation,
  TicketCategory,
  TicketPriority,
} from "@/app/store/services/supportApi";
import { AlertCircle, CheckCircle, Send, RefreshCw } from "lucide-react";
import { supportToasts } from "@/app/lib/toast";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";
import ErrorBoundary from "@/app/components/ui/ErrorBoundary";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

interface SupportTicketFormProps {
  onSuccess?: () => void;
}

interface FormData {
  subject: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
}

interface FormErrors {
  subject?: string;
  message?: string;
  category?: string;
  general?: string;
}

export default function SupportTicketForm({
  onSuccess,
}: SupportTicketFormProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [createTicket, { isLoading, error: mutationError }] =
    useCreateTicketMutation();
  const { handleTicketError } = useErrorHandler();

  const [formData, setFormData] = useState<FormData>({
    subject: "",
    message: "",
    category: TicketCategory.GENERAL_INQUIRY,
    priority: TicketPriority.MEDIUM,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions = [
    { value: TicketCategory.TECHNICAL_ISSUE, label: "Technical Issue" },
    { value: TicketCategory.ACCOUNT_ISSUE, label: "Account Issue" },
    { value: TicketCategory.FEATURE_REQUEST, label: "Feature Request" },
    { value: TicketCategory.GENERAL_INQUIRY, label: "General Inquiry" },
    { value: TicketCategory.BUG_REPORT, label: "Bug Report" },
  ];

  const priorityOptions = [
    {
      value: TicketPriority.LOW,
      label: "Low",
      description: "General questions or minor issues",
    },
    {
      value: TicketPriority.MEDIUM,
      label: "Medium",
      description: "Standard support requests",
    },
    {
      value: TicketPriority.HIGH,
      label: "High",
      description: "Important issues affecting work",
    },
    {
      value: TicketPriority.CRITICAL,
      label: "Critical",
      description: "Urgent issues blocking work",
    },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = "Subject must be at least 5 characters long";
    } else if (formData.subject.trim().length > 200) {
      newErrors.subject = "Subject must be less than 200 characters";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long";
    } else if (formData.message.trim().length > 5000) {
      newErrors.message = "Message must be less than 5000 characters";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await createTicket({
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        category: formData.category,
        priority: formData.priority,
      }).unwrap();

      // Show success toast
      supportToasts.ticketCreated(result.ticket.ticketNumber);

      setSuccessMessage(
        `Support ticket created successfully! Your ticket number is ${result.ticket.ticketNumber}. We'll get back to you soon.`
      );

      // Reset form
      setFormData({
        subject: "",
        message: "",
        category: TicketCategory.GENERAL_INQUIRY,
        priority: TicketPriority.MEDIUM,
      });

      // Call success callback after a short delay to show the success message
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      console.error("Failed to create ticket:", error);

      // Use error handler for consistent error handling
      const errorInfo = handleTicketError(error, "create");

      // Set form-specific error for display
      setErrors({
        general: errorInfo.userMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | TicketCategory | TicketPriority
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (successMessage) {
    return (
      <div className="rounded-md bg-green-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">
              {successMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Info Display */}
        <div className="bg-gray-50 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Contact Information
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <span className="text-sm text-gray-600">Name: </span>
              <span className="text-sm font-medium text-gray-900">
                {user?.name || "Not provided"}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Email: </span>
              <span className="text-sm font-medium text-gray-900">
                {user?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="subject">
            Subject <span className="text-red-500">*</span>
          </Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => handleInputChange("subject", e.target.value)}
            placeholder="Brief description of your issue or question"
            maxLength={200}
            className={
              errors.subject ? "border-red-500 focus-visible:ring-red-500" : ""
            }
          />
          <div className="flex justify-between">
            {errors.subject && (
              <p className="text-sm text-red-600">{errors.subject}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {formData.subject.length}/200 characters
            </p>
          </div>
        </div>

        {/* Category and Priority Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                handleInputChange("category", value as TicketCategory)
              }
            >
              <SelectTrigger
                className={
                  errors.category ? "border-red-500 focus:ring-red-500" : ""
                }
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                handleInputChange("priority", value as TicketPriority)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {
                priorityOptions.find((p) => p.value === formData.priority)
                  ?.description
              }
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message">
            Message <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="message"
            rows={6}
            value={formData.message}
            onChange={(e) => handleInputChange("message", e.target.value)}
            placeholder="Please provide detailed information about your issue or question. Include any relevant steps you've taken or error messages you've encountered."
            maxLength={5000}
            className={
              errors.message ? "border-red-500 focus-visible:ring-red-500" : ""
            }
          />
          <div className="flex justify-between">
            {errors.message && (
              <p className="text-sm text-red-600">{errors.message}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {formData.message.length}/5000 characters
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading || isSubmitting ? (
              <>
                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Support Request
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                Tips for better support
              </h4>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Be specific about the issue you're experiencing</li>
                  <li>Include any error messages you've encountered</li>
                  <li>Mention the steps you've already tried</li>
                  <li>
                    For technical issues, include your browser and device
                    information
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
    </ErrorBoundary>
  );
}
