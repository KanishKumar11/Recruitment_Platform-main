"use client";

import { Suspense } from "react";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import CreateJobForm from "@/app/components/CreateJobForm";
import { Loader2 } from "lucide-react";

export default function InternalCreateJobPage() {
  return (
    <ProtectedLayout allowedRoles={["INTERNAL", "ADMIN"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold text-gray-900">
                  Create New Job
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Fill in the details below to create a new job posting
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <a
                  href="/dashboard/internal/jobs"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Jobs
                </a>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Suspense
              fallback={
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              }
            >
              <CreateJobForm />
            </Suspense>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
