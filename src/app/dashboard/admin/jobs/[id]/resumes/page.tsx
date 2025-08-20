// app/dashboard/admin/jobs/[id]/resumes/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetResumesByJobIdQuery, useDeleteResumeMutation  } from "../../../../../store/services/resumesApi";
import { ResumeStatus } from "@/app/constants/resumeStatus";
import ResumeStatusBadge from "@/app/components/company/ResumeStatusBadge";
import ResumeDetailModal from "@/app/components/company/ResumeDetailModal";
import { Loader2, ArrowLeft, FileQuestion, Trash2  } from "lucide-react";
import ErrorAlert from "@/app/components/ui/ErrorAlert";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";

export default function AdminJobResumesPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const [deleteResume, { isLoading: isDeleting }] = useDeleteResumeMutation();
const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const {
    data: resumesData,
    isLoading,
    isError,
    error,
  } = useGetResumesByJobIdQuery(jobId);

  // Explicitly type the resumesData to match the expected API response
  type ResumesResponse =
    | { resumes: Array<any>; jobPostedBy?: string; jobTitle?: string }
    | Array<any>;
  const typedResumesData = resumesData as ResumesResponse;

  // Handle both data formats - array or object with resumes property
  const resumes = Array.isArray(typedResumesData)
    ? typedResumesData
    : typedResumesData?.resumes;
  const jobPostedBy = !Array.isArray(typedResumesData)
    ? typedResumesData?.jobPostedBy
    : null;
  const jobTitle = !Array.isArray(typedResumesData)
    ? typedResumesData?.jobTitle
    : null;

  const handleBack = () => {
    router.back();
  };

  const handleViewResume = (resumeId: string) => {
    setSelectedResumeId(resumeId);
  };

  const handleCloseModal = () => {
    setSelectedResumeId(null);
  };

  const handleDeleteResume = async (resumeId: string) => {
  if (window.confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
    try {
      await deleteResume(resumeId).unwrap();
      // Success message could be added here
    } catch (error) {
      console.error('Failed to delete resume:', error);
      // Error handling could be added here
    }
  }
};

  if (isLoading) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-2">Loading resumes...</span>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  if (isError) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
        <DashboardLayout>
          <ErrorAlert
            message={(error as any)?.data?.error || "Failed to load resumes"}
          />
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  if (!resumes || resumes.length === 0) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
        <DashboardLayout>
          <div className="p-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </button>
            <div className="text-center py-10">
              <FileQuestion className="mx-auto h-12 w-12 text-gray-400" />
              <h2 className="text-2xl font-semibold mb-2">No Resumes Yet</h2>
              <p className="text-gray-600">
                No resumes have been submitted for this job posting yet.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
      <DashboardLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </button>

            <div className="text-right">
              {jobTitle && (
                <div className="text-lg font-medium text-gray-900" style={{color: 'green'}}>
                  {jobTitle}
                </div>
              )}
              {jobPostedBy && (
                <div className="text-sm text-gray-500">
                  Job posted by:{" "}
                  <span className="font-medium">{jobPostedBy}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-6" style={{color: 'green'}}>
            Showing {resumes.length} candidates
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience & CTC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notice Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resumes.map((resume) => (
                    <tr key={resume._id as string} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {resume.candidateName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resume.qualification}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {resume.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resume.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {resume.currentDesignation || "Not specified"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resume.currentCompany || "Not specified"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Total: {resume.totalExperience || "Not specified"}
                        </div>
                        <div className="text-sm text-gray-500">
                          Relevant:{" "}
                          {resume.relevantExperience || "Not specified"}
                        </div>
                        <div className="text-sm text-gray-900 mt-2">
                          Current: {resume.currentCTC}
                        </div>
                        <div className="text-sm text-gray-500">
                          Expected: {resume.expectedCTC}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resume.noticePeriod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resume.submitterName || "Unknown Recruiter"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ResumeStatusBadge
                          status={resume.status as ResumeStatus}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  <div className="flex space-x-2 justify-end">
    <div
      onClick={() => handleViewResume(resume._id as string)}
      className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
      style={{color: 'green'}}
    >
      View Details
    </div>
    <button
      onClick={() => handleDeleteResume(resume._id as string)}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Delete Resume"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedResumeId && (
            <ResumeDetailModal
              resumeId={selectedResumeId}
              onClose={handleCloseModal}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
