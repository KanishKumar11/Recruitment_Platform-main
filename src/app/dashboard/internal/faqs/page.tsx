"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { RootState } from "../../../store/index";
import { useGetAdminFAQsQuery, FAQ } from "../../../store/services/faqApi";
import { useGetSettingsQuery } from "../../../store/services/settingsApi";
import { UserRole } from "@/app/constants/userRoles";
import {
  PencilIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

export default function InternalFAQsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // RTK Query hooks
  const { data: faqsData, isLoading, error } = useGetAdminFAQsQuery();
  const { data: settingsData } = useGetSettingsQuery();

  const faqs = faqsData?.faqs || [];

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

  // Check if internal editing is globally enabled
  const internalEditEnabled =
    settingsData?.settings?.faq_internal_edit_enabled?.value || false;

  // All FAQs are either editable or not based on global setting
  const editableFAQs = internalEditEnabled ? filteredFAQs : [];
  const nonEditableFAQs = internalEditEnabled ? [] : filteredFAQs;

  if (isLoading) {
    return (
      <ProtectedLayout allowedRoles={[UserRole.INTERNAL, UserRole.ADMIN]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-80">
            <LoadingSpinner />
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={[UserRole.INTERNAL, UserRole.ADMIN]}>
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
                  View and edit FAQs that you have permission to modify
                </p>
              </div>
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

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">
                  {typeof error === "string" ? error : "Failed to load FAQs"}
                </p>
              </div>
            )}

            {/* Editable FAQs */}
            {editableFAQs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  FAQs You Can Edit ({editableFAQs.length})
                </h2>
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
                            Last Updated
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {editableFAQs
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
                                  {faq.answer
                                    .replace(/<[^>]*>/g, "")
                                    .substring(0, 100)}
                                  ...
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {faq.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    faq.isActive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
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
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div>
                                  {new Date(faq.updatedAt).toLocaleDateString()}
                                </div>
                                <div className="text-xs">
                                  by {faq.updatedBy?.name || faq.createdBy.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <Link
                                    href={`/dashboard/internal/faqs/${faq._id}`}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </Link>
                                  <Link
                                    href={`/dashboard/internal/faqs/${faq._id}/edit`}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Non-Editable FAQs */}
            {nonEditableFAQs.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  View-Only FAQs ({nonEditableFAQs.length})
                </h2>
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
                            Created By
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {nonEditableFAQs
                          .sort(
                            (a, b) =>
                              a.order - b.order ||
                              new Date(b.createdAt).getTime() -
                                new Date(a.createdAt).getTime()
                          )
                          .map((faq) => (
                            <tr key={faq._id} className="bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-700 max-w-xs truncate">
                                  {faq.question}
                                </div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {faq.answer
                                    .replace(/<[^>]*>/g, "")
                                    .substring(0, 100)}
                                  ...
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  {faq.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    faq.isActive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
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
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div>{faq.createdBy.name}</div>
                                <div className="text-xs">
                                  {new Date(faq.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <Link
                                    href={`/dashboard/internal/faqs/${faq._id}`}
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </Link>
                                  <span
                                    className="text-gray-400"
                                    title="Admin only"
                                  >
                                    <LockClosedIcon className="h-4 w-4" />
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredFAQs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchTerm || selectedCategory !== "All"
                    ? "No FAQs found matching your criteria."
                    : "No FAQs available."}
                </p>
              </div>
            )}

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-lg font-medium text-gray-900">
                        {editableFAQs.length}
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="text-sm font-medium text-gray-500">
                        Editable FAQs
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
                        {nonEditableFAQs.length}
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="text-sm font-medium text-gray-500">
                        View-Only FAQs
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
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
