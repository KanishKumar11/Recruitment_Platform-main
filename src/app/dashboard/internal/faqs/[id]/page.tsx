"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import {
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

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

export default function InternalFAQDetailPage() {
  const params = useParams();
  const [faq, setFaq] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchFAQ();
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
        setFaq(data.faq);
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
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Link
                  href="/dashboard/internal/faqs"
                  className="mr-4 text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    FAQ Details
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    View FAQ information
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                {faq.allowInternalEdit ? (
                  <Link
                    href={`/dashboard/internal/faqs/${faq._id}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                ) : (
                  <div className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-500 bg-gray-100 cursor-not-allowed">
                    <LockClosedIcon className="h-4 w-4 mr-2" />
                    Admin Only
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* FAQ Content */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {faq.question}
                </h3>
                <div className="mt-2 flex items-center space-x-4">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {faq.category}
                  </span>
                  {faq.allowInternalEdit ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      <UserGroupIcon className="h-3 w-3 mr-1" />
                      Editable
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      <LockClosedIcon className="h-3 w-3 mr-1" />
                      View Only
                    </span>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Answer
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                      />
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Category
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {faq.category}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Display Order
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {faq.order}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Edit Permission
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {faq.allowInternalEdit ? (
                        <span className="text-green-600">
                          Internal team can edit
                        </span>
                      ) : (
                        <span className="text-gray-600">Admin only</span>
                      )}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Created By
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div>{faq.createdBy.name}</div>
                      <div className="text-gray-500">{faq.createdBy.email}</div>
                      <div className="text-gray-500">
                        {new Date(faq.createdAt).toLocaleString()}
                      </div>
                    </dd>
                  </div>
                  {faq.updatedBy && (
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Last Updated By
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div>{faq.updatedBy.name}</div>
                        <div className="text-gray-500">
                          {faq.updatedBy.email}
                        </div>
                        <div className="text-gray-500">
                          {new Date(faq.updatedAt).toLocaleString()}
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Permission Notice */}
            {!faq.allowInternalEdit && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <LockClosedIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Limited Access
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        This FAQ can only be edited by administrators. If you
                        need to make changes, please contact an admin or request
                        edit permissions for this FAQ.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
