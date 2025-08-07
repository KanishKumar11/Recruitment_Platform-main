"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { RootState } from "../../../store/index";
import {
  useGetAdminFAQsQuery,
  useDeleteFAQMutation,
  useToggleFAQStatusMutation,
  FAQ,
} from "../../../store/services/faqApi";
import {
  useGetSettingsQuery,
  useUpdateSettingMutation,
} from "../../../store/services/settingsApi";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export default function AdminFAQsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // RTK Query hooks - Same pattern as other dashboard pages
  const { data: faqsData, isLoading, error, refetch } = useGetAdminFAQsQuery();
  const { data: settingsData } = useGetSettingsQuery();

  const [deleteFAQ] = useDeleteFAQMutation();
  const [toggleFAQStatus] = useToggleFAQStatusMutation();
  const [updateSetting] = useUpdateSettingMutation();

  const faqs = faqsData?.faqs || [];

  const handleDelete = async (id: string) => {
    try {
      await deleteFAQ(id).unwrap();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleFAQStatus({ id, isActive: !currentStatus }).unwrap();
    } catch (error) {
      console.error("Error updating FAQ status:", error);
    }
  };

  const toggleInternalEdit = async () => {
    try {
      const currentValue =
        settingsData?.settings?.faq_internal_edit_enabled?.value || false;
      await updateSetting({
        key: "faq_internal_edit_enabled",
        value: !currentValue,
        description: "Allow internal team members to edit all FAQs",
      }).unwrap();
    } catch (error) {
      console.error("Error updating internal edit setting:", error);
    }
  };

  // Get unique categories
  const categories = [
    "All",
    ...Array.from(new Set(faqs.map((faq) => faq.category))),
  ];

  // Filter FAQs
  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch =
      searchTerm === "" ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-80">
            <LoadingSpinner />
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  FAQ Management
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage frequently asked questions for your platform
                </p>
              </div>
              <Link
                href="/dashboard/admin/faqs/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add FAQ
              </Link>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 bg-white shadow rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search FAQs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="sm:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Global Settings */}
            <div className="mb-6 bg-white shadow rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    FAQ Settings
                  </h3>
                  <p className="text-sm text-gray-600">
                    Control global FAQ permissions and settings
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <label className="text-sm font-medium text-gray-700 mr-3">
                      Allow Internal Team to Edit FAQs
                    </label>
                    <button
                      onClick={toggleInternalEdit}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        settingsData?.settings?.faq_internal_edit_enabled?.value
                          ? "bg-indigo-600"
                          : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settingsData?.settings?.faq_internal_edit_enabled
                            ?.value
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">
                  {typeof error === "string" ? error : "Failed to load FAQs"}
                </p>
              </div>
            )}

            {/* FAQs Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Question
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFAQs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          {searchTerm || selectedCategory !== "All"
                            ? "No FAQs found matching your criteria."
                            : "No FAQs created yet."}
                        </td>
                      </tr>
                    ) : (
                      filteredFAQs
                        .sort(
                          (a, b) =>
                            a.order - b.order ||
                            new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime()
                        )
                        .map((faq) => (
                          <tr key={faq._id}>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                {faq.question}
                              </div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {faq.answer.substring(0, 100)}...
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {faq.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() =>
                                  toggleStatus(faq._id, faq.isActive)
                                }
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  faq.isActive
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : "bg-red-100 text-red-800 hover:bg-red-200"
                                }`}
                              >
                                {faq.isActive ? (
                                  <>
                                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircleIcon className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {faq.order}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>
                                {new Date(faq.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs">
                                by {faq.createdBy.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <Link
                                  href={`/dashboard/admin/faqs/${faq._id}`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Link>
                                <Link
                                  href={`/dashboard/admin/faqs/${faq._id}/edit`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => setDeleteConfirm(faq._id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-lg font-medium text-gray-900">
                        {faqs.length}
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="text-sm font-medium text-gray-500">
                        Total FAQs
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-lg font-medium text-gray-900">
                        {faqs.filter((f) => f.isActive).length}
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="text-sm font-medium text-gray-500">
                        Active FAQs
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-lg font-medium text-gray-900">
                        {categories.length - 1}
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="text-sm font-medium text-gray-500">
                        Categories
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-lg font-medium text-gray-900">
                        {settingsData?.settings?.faq_internal_edit_enabled
                          ?.value
                          ? "Yes"
                          : "No"}
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="text-sm font-medium text-gray-500">
                        Internal Edit Enabled
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete FAQ
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this FAQ? This action cannot
                    be undone.
                  </p>
                </div>
                <div className="flex justify-center space-x-4 mt-4">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedLayout>
  );
}
