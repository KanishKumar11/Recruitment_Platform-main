"use client";

import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import FAQForm from "@/app/components/admin/FAQForm";

export default function NewFAQPage() {
  return (
    <ProtectedLayout allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Create New FAQ
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Add a new frequently asked question to help users
              </p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <FAQForm />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
