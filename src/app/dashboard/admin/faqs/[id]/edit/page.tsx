"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import FAQForm from "@/app/components/admin/FAQForm";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

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

export default function EditFAQPage() {
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
      <ProtectedLayout allowedRoles={["ADMIN"]}>
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
      <ProtectedLayout allowedRoles={["ADMIN"]}>
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
    <ProtectedLayout allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-6">
              <Link
                href={`/dashboard/admin/faqs/${faq._id}`}
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
              <FAQForm faq={faq} isEdit={true} />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
