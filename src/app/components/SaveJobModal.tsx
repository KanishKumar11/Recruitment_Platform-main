"use client";

import { useState } from "react";
import { IJob } from "@/app/models/Job";
import { useAddJobToSavedMutation } from "@/app/store/services/jobsApi";
import { FaTimes, FaBookmark } from "react-icons/fa";

interface SaveJobModalProps {
  job: IJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (jobId: string, notes?: string) => void;
  isAlreadySaved?: boolean;
}

export default function SaveJobModal({
  job,
  isOpen,
  onClose,
  onSave,
  isAlreadySaved = false,
}: SaveJobModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveJob = async () => {
    if (!job) return;
    setIsLoading(true);
    try {
      await onSave(job._id as string);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = () => {
    if (!job) return;
    // Navigate to job details
    window.location.href = `/dashboard/recruiter/jobs/${job._id}`;
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Save Job</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">{job.title}</h4>
          <p className="text-sm text-gray-600 mb-1">{job.companyName}</p>
          <p className="text-sm text-gray-500">{job.location}</p>
        </div>

        {isAlreadySaved ? (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <FaBookmark className="text-green-500 mr-2" />
              <span className="text-sm text-green-700">
                This job is already in your saved jobs
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              Would you like to save this job to your "My Jobs" list for easy
              access?
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {!isAlreadySaved && (
            <button
              onClick={handleSaveJob}
              disabled={isLoading}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Job"}
            </button>
          )}
          <button
            onClick={handleViewDetails}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
