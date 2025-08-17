// components/company/ResumeDetailModal.tsx
import React, { useState, useEffect } from "react";
import { X, Paperclip, Download, Loader2, Eye, FileText } from "lucide-react";
import {
  useGetResumeByIdQuery,
  useUpdateResumeStatusMutation,
  useAddResumeNoteMutation,
} from "@/app/store/services/resumesApi";
import ResumeStatusBadge from "./ResumeStatusBadge";
import ResumeStatusHistory from "./ResumeStatusHistory";
import { ResumeStatus } from "@/app/models/Resume";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";

interface ResumeDetailModalProps {
  resumeId: string;
  onClose: () => void;
}

const ResumeDetailModal: React.FC<ResumeDetailModalProps> = ({
  resumeId,
  onClose,
}) => {
  const {
    data: resume,
    isLoading,
    isError,
    error,
  } = useGetResumeByIdQuery(resumeId);

  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateResumeStatusMutation();
  const [addNote, { isLoading: isAddingNote }] = useAddResumeNoteMutation();
  const [newNote, setNewNote] = useState("");
  const [previewDocument, setPreviewDocument] = useState<{
    filename: string;
    originalName: string;
  } | null>(null);
  const [fileLoadError, setFileLoadError] = useState<string | null>(null);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);

  // Close modal on escape key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  // Helper function to get file URL
  const getFileUrl = (filename: string, isDownload: boolean = false) => {
    if (!filename) return "";

    // Remove any existing path prefixes if present
    const cleanFilename = filename.split("/").pop() || filename;

    // Use the resume download API endpoint
    const baseUrl = `/api/resumes/download/${cleanFilename}`;

    if (isDownload) {
      return `${baseUrl}?download=true`;
    }

    return baseUrl;
  };

  // Helper function to handle resume file download with authentication
  const handleResumeDownload = async () => {
    if (!resume?.resumeFile) return;

    try {
      const cleanFilename =
        resume.resumeFile.split("/").pop() || resume.resumeFile;
      const downloadUrl = getFileUrl(resume.resumeFile, true);

      // Simple download using direct link
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to download file: ${errorMessage}`);
    }
  };

  // Helper function to check if file can be previewed
  const canPreviewFile = (filename: string) => {
    const extension = filename.toLowerCase().split(".").pop();
    return ["pdf", "jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(
      extension || ""
    );
  };

  // Helper function to get preview URL for additional documents
  const getDocumentPreviewUrl = (filename: string) => {
    return `/api/resumes/download/${filename}`;
  };

  // Helper function to handle additional document download
  const handleDocumentDownload = async (
    filename: string,
    originalName: string
  ) => {
    try {
      const downloadUrl = `/api/resumes/download/${filename}?download=true`;

      // Simple download using direct link
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Document download failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to download document: ${errorMessage}`);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="ml-2">Loading resume details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !resume) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-red-500">
            {(error as any)?.data?.error || "Failed to load resume details"}
          </p>
        </div>
      </div>
    );
  }

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await addNote({ id: resumeId, note: newNote }).unwrap();
      setNewNote("");
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const status = e.target.value as ResumeStatus;
    if (!status) return;

    try {
      await updateStatus({ id: resumeId, status }).unwrap();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Function to determine if user can change status
  const canChangeStatus = () => {
    return ["COMPANY", "ADMIN", "INTERNAL"].includes(userRole || "");
  };

  // Function to extract question text from questionId
  const getQuestionText = (questionId: any) => {
    if (typeof questionId === "object" && questionId !== null) {
      if ("question" in questionId) {
        // Ensure we return a string, not an object
        return String(questionId.question || "Question");
      }
    }
    return "Question";
  };

  // Format status options for dropdown
  const getStatusOptions = () => {
    const options = [
      { value: ResumeStatus.SUBMITTED, label: "Submitted" },
      { value: ResumeStatus.REVIEWED, label: "Reviewed" },
      { value: ResumeStatus.SHORTLISTED, label: "Shortlisted" },
      { value: ResumeStatus.ONHOLD, label: "On Hold" },
      {
        value: ResumeStatus.INTERVIEW_IN_PROCESS,
        label: "Interview in Process",
      },
      { value: ResumeStatus.INTERVIEWED, label: "Interviewed" },
      {
        value: ResumeStatus.SELECTED_IN_FINAL_INTERVIEW,
        label: "Selected in Final Interview",
      },
      { value: ResumeStatus.OFFERED, label: "Offered" },
      { value: ResumeStatus.HIRED, label: "Hired" },
      { value: ResumeStatus.JOINED, label: "Joined" },
      { value: ResumeStatus.TRIAL_FAILED, label: "Trial Failed" },
      { value: ResumeStatus.BACKOUT, label: "Backout" },
      { value: ResumeStatus.QUIT_AFTER_JOINED, label: "Quit After Joined" },
      { value: ResumeStatus.REJECTED, label: "Rejected" },
      { value: ResumeStatus.DUPLICATE, label: "Duplicate" },
    ];
    return options;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[98vh] overflow-hidden flex flex-col resume-modal-compact">
        {/* Ultra Compact Header */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {resume.candidateName}
              </h2>
              <p className="text-xs text-gray-600">{resume.email}</p>
            </div>
            <ResumeStatusBadge status={resume.status} />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-white rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto px-4 py-3 compact-scroll">
          {/* Compact Layout: Four columns */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
            {/* Left section: Basic and Career Info (spans 2 columns) */}
            <div className="lg:col-span-2 space-y-3">
              {/* Basic Information - Compact */}
              <div className="compact-section">
                <h3>Basic Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <span className="text-gray-500 text-xs w-20 flex-shrink-0">
                        Email:
                      </span>
                      <span className="text-gray-900 font-medium text-xs">
                        {resume.email}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-500 text-xs w-20 flex-shrink-0">
                        Phone:
                      </span>
                      <span className="text-gray-900 font-medium text-xs">
                        {resume.phone}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <span className="text-gray-500 text-xs w-20 flex-shrink-0">
                        Location:
                      </span>
                      <span className="text-gray-900 font-medium text-xs">
                        {resume.location}, {resume.country}
                      </span>
                    </div>
                    {resume.alternativePhone && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 text-xs w-20 flex-shrink-0">
                          Alt Phone:
                        </span>
                        <span className="text-gray-900 font-medium text-xs">
                          {resume.alternativePhone}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-gray-500 text-xs w-20 flex-shrink-0">
                        Education:
                      </span>
                      <span className="text-gray-900 font-medium text-xs">
                        {resume.qualification}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Career Information - Compact */}
              <div className="compact-section">
                <h3>Career Information</h3>
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Current Company:
                    </span>
                    <span className="text-gray-900 font-medium text-xs">
                      {resume.currentCompany}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Current Designation:
                    </span>
                    <span className="text-gray-900 font-medium text-xs">
                      {resume.currentDesignation}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Total Experience:
                    </span>
                    <span className="text-gray-900 font-medium text-xs">
                      {resume.totalExperience} years
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Relevant Experience:
                    </span>
                    <span className="text-gray-900 font-medium text-xs">
                      {resume.relevantExperience} years
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Current Salary:
                    </span>
                    <span className="text-gray-900 font-medium text-xs">
                      {resume.currentCTC}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Expected Salary:
                    </span>
                    <span className="text-gray-900 font-medium text-xs">
                      {resume.expectedCTC}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Notice Period:
                    </span>
                    <span className="text-gray-900 font-medium text-xs">
                      {resume.noticePeriod} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Screening Answers - Compact */}
              {resume.screeningAnswers &&
                resume.screeningAnswers.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Screening Questions
                    </h3>
                    <div className="space-y-2">
                      {resume.screeningAnswers.map((item, index) => (
                        <div key={index} className="text-xs">
                          <p className="font-medium text-gray-900">
                            {getQuestionText(item.questionId)}
                          </p>
                          <p className="text-gray-700 mt-1">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Remarks Section - Compact */}
              {resume.remarks && (
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Remarks
                  </h3>
                  <p className="text-xs text-gray-600">{resume.remarks}</p>
                </div>
              )}
            </div>

            {/* Middle section: Add Note and Notes History (spans 1 column) */}
            <div className="lg:col-span-1 space-y-3">
              {/* Add Note Section */}
              <div className="compact-section">
                <h3>Add Note</h3>
                <form onSubmit={handleSubmitNote}>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md"
                    placeholder="Add note..."
                  ></textarea>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={isAddingNote || !newNote.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                    >
                      {isAddingNote ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Add Note
                    </button>
                  </div>
                </form>
              </div>

              {/* Notes History */}

              {/* Additional Documents Row */}
              {resume.additionalDocuments &&
                resume.additionalDocuments.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <div className="compact-section">
                      <h3 className="flex items-center">
                        <Paperclip className="mr-2 h-4 w-4 text-gray-500" />
                        Additional Documents (
                        {resume.additionalDocuments.length})
                      </h3>
                      <div className="grid grid-cols-1  gap-3 mt-3 bg-red-50">
                        {resume.additionalDocuments.map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center min-w-0 flex-1">
                              <Paperclip className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-medium text-gray-900 truncate block">
                                  {doc.originalName}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  {doc.uploadedAt
                                    ? new Date(
                                        doc.uploadedAt
                                      ).toLocaleDateString()
                                    : "Unknown"}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-3">
                              {canPreviewFile(doc.filename) && (
                                <button
                                  onClick={() =>
                                    setPreviewDocument({
                                      filename: doc.filename,
                                      originalName: doc.originalName,
                                    })
                                  }
                                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                  <Eye className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  handleDocumentDownload(
                                    doc.filename,
                                    doc.originalName
                                  )
                                }
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <Download className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {resume.notes && resume.notes.length > 0 && (
                <div className="compact-section">
                  <h3>Notes History</h3>
                  <div className="bg-white shadow overflow-hidden rounded-md max-h-32 overflow-y-auto compact-scroll">
                    <ul className="divide-y divide-gray-200">
                      {resume.notes.map((note, index) => (
                        <li key={index} className="px-2 py-1.5">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-medium text-gray-900">
                              {typeof note.userId === "object" &&
                              note.userId &&
                              "name" in note.userId
                                ? note.userId.name ||
                                  note.userId.email ||
                                  "Unknown User"
                                : "Unknown User"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-gray-600">
                            {note.note}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Right section: Status History, Update Status, Add Note (spans 1 column) */}
            <div className="lg:col-span-1 space-y-3">
              {/* Status History - Compact */}
              <div className="compact-section">
                <h3>Status History</h3>
                <div className="max-h-32 overflow-y-auto compact-scroll">
                  <ResumeStatusHistory resume={resume} />
                </div>
              </div>

              {/* Status Update Section - Only visible to COMPANY, ADMIN, INTERNAL */}
              {canChangeStatus() && (
                <div className="compact-section">
                  <h3>Update Status</h3>
                  <select
                    onChange={handleStatusChange}
                    defaultValue=""
                    disabled={isUpdating}
                    className="block w-full pl-2 pr-8 py-1.5 text-xs border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>
                      {isUpdating ? "Updating..." : "Select new status"}
                    </option>
                    {getStatusOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Second Row: Resume Preview */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            {/* Resume Preview (full width) */}
            <div>
              {
                <div className="compact-section">
                  <div className="flex items-center justify-between mb-2">
                    <h3>Resume Preview</h3>
                    {resume.resumeFile && (
                      <button
                        onClick={handleResumeDownload}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </button>
                    )}
                  </div>
                  {resume.resumeFile ? (
                    <div className="relative">
                      {!fileLoadError ? (
                        <iframe
                          src={getFileUrl(resume.resumeFile)}
                          className="w-full h-[80vh] border border-gray-300 rounded-md"
                          title={`Resume for ${resume.candidateName}`}
                          onLoad={() => setFileLoadError(null)}
                          onError={() => {
                            console.error("Failed to load resume preview");
                            setFileLoadError(
                              "Preview unavailable - file may be missing or corrupted"
                            );
                          }}
                        ></iframe>
                      ) : (
                        <div className="w-full h-[80vh] border border-gray-300 rounded-md flex items-center justify-center bg-red-50">
                          <div className="text-center">
                            <FileText className="mx-auto h-8 w-8 text-red-400" />
                            <p className="mt-1 text-xs text-red-600">
                              Preview unavailable
                            </p>
                            <p className="text-xs text-red-500">
                              {fileLoadError}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-[80vh] border border-gray-300 rounded-md flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <FileText className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-1 text-xs text-gray-500">
                          No resume file available
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              }
            </div>
          </div>

          {/* Document Preview Modal */}
          {previewDocument && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
              <div className="bg-white p-4 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Preview: {previewDocument.originalName}
                  </h3>
                  <button
                    onClick={() => setPreviewDocument(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="w-full h-96">
                  {previewDocument.filename.toLowerCase().endsWith(".pdf") ? (
                    <iframe
                      src={getDocumentPreviewUrl(previewDocument.filename)}
                      className="w-full h-full border border-gray-300 rounded-lg"
                      title={`Preview of ${previewDocument.originalName}`}
                    />
                  ) : previewDocument.filename
                      .toLowerCase()
                      .match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                    <img
                      src={getDocumentPreviewUrl(previewDocument.filename)}
                      alt={`Preview of ${previewDocument.originalName}`}
                      className="w-full h-full object-contain border border-gray-300 rounded-lg"
                    />
                  ) : previewDocument.filename
                      .toLowerCase()
                      .endsWith(".txt") ? (
                    <iframe
                      src={getDocumentPreviewUrl(previewDocument.filename)}
                      className="w-full h-full border border-gray-300 rounded-lg"
                      title={`Preview of ${previewDocument.originalName}`}
                    />
                  ) : (
                    <div className="w-full h-full border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          Preview not available for this file type
                        </p>
                        <button
                          onClick={() =>
                            handleDocumentDownload(
                              previewDocument.filename,
                              previewDocument.originalName
                            )
                          }
                          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download File
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeDetailModal;
