"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/index";
import { UserRole } from "@/app/constants/userRoles";
import {
  useGetJobUpdatesQuery,
  useCreateJobUpdateMutation,
  JobUpdate,
} from "@/app/store/services/jobUpdatesApi";



interface JobUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  onUpdatePosted?: () => void;
}

const JobUpdatesModal: React.FC<JobUpdatesModalProps> = ({
  isOpen,
  onClose,
  jobId,
  onUpdatePosted,
}) => {
  // 
  // const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const { user } = useSelector((state: RootState) => state.auth);

  // RTK Query hooks
  const {
    data: updatesData,
    isLoading: loading,
    error,
    refetch,
  } = useGetJobUpdatesQuery(jobId, {
    skip: !isOpen || !jobId,
  });

  const [createJobUpdate, { isLoading: isPosting }] =
    useCreateJobUpdateMutation();

  const updates = updatesData?.data || [];

  // Check if user can post updates
  const canPost =
    user &&
    [UserRole.ADMIN, UserRole.INTERNAL, UserRole.COMPANY].includes(user.role);

  // No need for manual fetch function - RTK Query handles this automatically

  // Post new update using RTK Query
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    try {
      await createJobUpdate({
        jobId,
        title: formData.title.trim() || undefined,
        content: formData.content.trim(),
      }).unwrap();

      // Reset form and close form
      setFormData({ title: "", content: "" });
      setShowForm(false);

      // Call the callback if provided
      if (onUpdatePosted) {
        onUpdatePosted();
      }
    } catch (err: any) {
      console.error("Failed to post update:", err);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-100 text-red-800";
      case UserRole.INTERNAL:
        return "bg-blue-100 text-blue-800";
      case UserRole.COMPANY:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // RTK Query automatically handles fetching when the query parameters change

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowForm(false);
      setFormData({ title: "", content: "" });
      setError(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Job Updates
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Post Update Form */}
          {canPost && (
            <div className="border-b pb-4">
              {!showForm ? (
                <Button onClick={() => setShowForm(true)} className="w-full">
                  Post New Update
                </Button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Title
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Enter update title..."
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Content
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Enter update content..."
                      rows={4}
                      maxLength={2000}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isPosting}>
                      {isPosting ? "Posting..." : "Post Update"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {typeof error === "string" ? error : "An error occurred"}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading updates...</p>
            </div>
          )}

          {/* Updates List */}
          {!loading && (
            <div className="space-y-4">
              {updates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No updates posted yet.</p>
                  {canPost && (
                    <p className="text-sm mt-2">
                      Be the first to post an update!
                    </p>
                  )}
                </div>
              ) : (
                updates.map((update) => (
                  <div
                    key={update._id}
                    className="border rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{update.title}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          update.postedByRole
                        )}`}
                      >
                        {update.postedByRole}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                      {update.content}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>By {update.postedByName}</span>
                      <span>{formatDate(update.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobUpdatesModal;
