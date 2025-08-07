"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { ArrowLeftIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import RichTextEditor from "@/app/components/RichTextEditor";

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  order: number;
  allowInternalEdit: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function InternalEditFAQPage() {
  const params = useParams();
  const router = useRouter();
  const [faq, setFaq] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<string[]>(["General"]);

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "General",
    order: 0,
  });

  useEffect(() => {
    if (params.id) {
      fetchFAQ();
      fetchCategories();
    }
  }, [params.id]);

  const fetchFAQ = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/faqs/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        const faqData = data.faq;
        setFaq(faqData);

        // Check if user can edit this FAQ
        if (!faqData.allowInternalEdit) {
          setError("You do not have permission to edit this FAQ");
          return;
        }

        setFormData({
          question: faqData.question,
          answer: faqData.answer,
          category: faqData.category,
          order: faqData.order,
        });
      } else {
        setError(data.error || "Failed to fetch FAQ");
      }
    } catch (error) {
      console.error("Error fetching FAQ:", error);
      setError("Failed to fetch FAQ");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/faqs?admin=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        const uniqueCategories = Array.from(
          new Set(data.faqs.map((f: FAQ) => f.category))
        );
        setCategories(
          uniqueCategories.length > 0
            ? (uniqueCategories as string[])
            : ["General"]
        );
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!formData.question.trim() || !formData.answer.trim()) {
      setError("Question and answer are required");
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/faqs/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/dashboard/internal/faqs/${params.id}`);
      } else {
        setError(data.error || "Failed to update FAQ");
      }
    } catch (error) {
      console.error("Error updating FAQ:", error);
      setError("Failed to update FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const handleAnswerChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      answer: content,
    }));
  };

  if (loading) {
    return (
      <ProtectedLayout allowedRoles={["INTERNAL"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-80">
            <LoadingSpinner />
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  if (error || !faq) {
    return (
      <ProtectedLayout allowedRoles={["INTERNAL"]}>
        <DashboardLayout>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error || "FAQ not found"}</p>
              </div>
              <div className="mt-4">
                <Link
                  href="/dashboard/internal/faqs"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  ← Back to FAQs
                </Link>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  // If FAQ doesn't allow internal edit, show permission denied
  if (!faq.allowInternalEdit) {
    return (
      <ProtectedLayout allowedRoles={["INTERNAL"]}>
        <DashboardLayout>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <LockClosedIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-yellow-800">
                      Permission Denied
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        You do not have permission to edit this FAQ. This FAQ
                        can only be edited by administrators.
                      </p>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/dashboard/internal/faqs/${faq._id}`}
                        className="text-yellow-800 hover:text-yellow-600 underline"
                      >
                        View FAQ details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["INTERNAL"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-6">
              <Link
                href={`/dashboard/internal/faqs/${faq._id}`}
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Edit FAQ
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Update the FAQ information
                </p>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {/* Question */}
                <div>
                  <label
                    htmlFor="question"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Question *
                  </label>
                  <input
                    type="text"
                    id="question"
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter the FAQ question"
                  />
                </div>

                {/* Answer */}
                <div>
                  <label
                    htmlFor="answer"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Answer *
                  </label>
                  <RichTextEditor
                    label="Answer"
                    value={formData.answer}
                    onChange={handleAnswerChange}
                    placeholder="Enter the FAQ answer"
                  />
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category
                  </label>
                  <div className="mt-1 flex">
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or enter new category"
                      className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          setFormData((prev) => ({
                            ...prev,
                            category: e.target.value.trim(),
                          }));
                          e.target.value = "";
                        }
                      }}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Select an existing category or type a new one
                  </p>
                </div>

                {/* Order */}
                <div>
                  <label
                    htmlFor="order"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Display Order
                  </label>
                  <input
                    type="number"
                    id="order"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Lower numbers appear first
                  </p>
                </div>

                {/* Note about limited permissions */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Limited Edit Access
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          As an internal team member, you can edit the content
                          of this FAQ but cannot change its active status or
                          edit permissions. Contact an admin for those changes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Link
                    href={`/dashboard/internal/faqs/${faq._id}`}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Update FAQ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
