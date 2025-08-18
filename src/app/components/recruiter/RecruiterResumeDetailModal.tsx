import React, { useState, useEffect } from "react";
import { X, Paperclip, Download, Loader2, Eye, FileText } from "lucide-react";
import { useGetResumeByIdQuery } from "@/app/store/services/resumesApi";
import ResumeStatusBadge from "../company/ResumeStatusBadge";
import ResumeStatusHistory from "../company/ResumeStatusHistory";
import { ResumeStatus } from "@/app/models/Resume";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";

interface RecruiterResumeDetailModalProps {
  resumeId: string;
  onClose: () => void;
}

const RecruiterResumeDetailModal: React.FC<RecruiterResumeDetailModalProps> = ({
  resumeId,
  onClose,
}) => {
  const {
    data: resume,
    isLoading,
    isError,
    error,
  } = useGetResumeByIdQuery(resumeId);

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

  const handleDocumentDownload = async (
    filename: string,
    originalName: string
  ) => {
    try {
      const downloadUrl = `/api/resumes/download/${filename}?download=true`;

      // Fetch the file with authentication headers
      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }

      // Get the file blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Document download failed:", error);
      alert("Failed to download document. Please try again.");
    }
  };

  const canPreviewFile = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    return ["pdf", "jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(
      extension || ""
    );
  };

  const getQuestionText = (questionId: any) => {
    if (typeof questionId === "object" && questionId !== null) {
      if ("question" in questionId) {
        // Ensure we return a string, not an object
        return String(questionId.question || "Question");
      }
    }
    return "Question";
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
          {/* Compact Layout: Two sections - Info grid and full-width resume */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
            {/* Left section: Basic and Career Info (spans 2 columns) */}
            <div className="lg:col-span-2 space-y-3">
              {/* Basic Information - Compact */}
              <div className="compact-section">
                <h3>Basic Information</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-medium text-gray-900">Email:</span>
                    <p className="text-gray-600">{resume.email || "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Phone:</span>
                    <p className="text-gray-600">{resume.phone || "N/A"}</p>
                  </div>
                  {resume.alternativePhone && (
                    <div>
                      <span className="font-medium text-gray-900">
                        Alt Phone:
                      </span>
                      <p className="text-gray-600">{resume.alternativePhone}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-900">Location:</span>
                    <p className="text-gray-600">
                      {resume.location || "N/A"}
                      {resume.country && `, ${resume.country}`}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Notice Period:</span>
                    <p className="text-gray-600">
                      {resume.noticePeriod || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Career Information - Compact */}
              <div className="compact-section">
                <h3>Career Information</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-medium text-gray-900">
                      Current CTC:
                    </span>
                    <p className="text-gray-600">
                      {resume.currentCTC || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">
                      Expected CTC:
                    </span>
                    <p className="text-gray-600">
                      {resume.expectedCTC || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">
                      Education:
                    </span>
                    <p className="text-gray-600">
                      {resume.qualification || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Screening Questions - Compact */}
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

            {/* Right section: Documents and Status History (spans 1 column) */}
            <div className="lg:col-span-1 space-y-3 flex flex-col">
              {/* Additional Documents Row */}
              {resume.additionalDocuments &&
                resume.additionalDocuments.length > 0 && (
                  <div className="compact-section">
                    <h3 className="flex items-center">
                      <Paperclip className="mr-2 h-4 w-4 text-gray-500" />
                      Additional Documents ({resume.additionalDocuments.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3 mt-3">
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
                )}

              {/* Notes History (Read-only) */}
              {resume.notes && resume.notes.length > 0 && (
                <div className="compact-section flex-1 flex flex-col">
                  <h3>Notes History</h3>
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {resume.notes.map((note, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-2 rounded-md border border-gray-200"
                      >
                        <p className="text-xs text-gray-700">{note.note}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">
                            {typeof note.userId === "object" &&
                            note.userId &&
                            "name" in note.userId
                              ? note.userId.name ||
                                note.userId.email ||
                                "Unknown User"
                              : "Unknown User"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {note.createdAt
                              ? new Date(note.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )
                              : "Unknown date"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status History */}
              <div className="compact-section">
                <h3>Status History</h3>
                <ResumeStatusHistory resume={resume} />
              </div>
            </div>
          </div>

          {/* Full-width Resume Preview Section */}
          <div className="mt-4">
            <div className="compact-section">
              <h3>Resume File</h3>
              {resume.resumeFile ? (
                <div className="w-full h-[80vh] border border-gray-300 rounded-md overflow-hidden">
                  <iframe
                    src={`/api/resumes/download/${resume.resumeFile}`}
                    className="w-full h-full"
                    title="Resume Preview"
                    onError={() => setFileLoadError("Failed to load file")}
                  />
                  {fileLoadError && (
                    <div className="flex items-center justify-center h-32 bg-gray-100">
                      <div className="text-center">
                        <FileText className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-1 text-xs text-gray-500">
                          {fileLoadError}
                        </p>
                        <button
                          onClick={() =>
                            handleDocumentDownload(
                              resume.resumeFile,
                              resume.candidateName + "_resume"
                            )
                          }
                          className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-[70vh] border border-gray-300 rounded-md flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <FileText className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-1 text-xs text-gray-500">
                      No resume file available
                    </p>
                  </div>
                </div>
              )}
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
                <div className="w-full h-[70vh] border border-gray-300 rounded-md overflow-hidden">
                  <iframe
                    src={`/api/resumes/download/${
                      previewDocument.filename
                    }?token=${encodeURIComponent(
                      localStorage.getItem("token") || ""
                    )}`}
                    className="w-full h-full"
                    title="Document Preview"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .compact-section {
          @apply bg-white p-3 rounded-md border border-gray-200;
        }
        .compact-section h3 {
          @apply text-sm font-semibold text-gray-900 mb-2;
        }
        .compact-scroll {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db #f9fafb;
        }
        .compact-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .compact-scroll::-webkit-scrollbar-track {
          background: #f9fafb;
        }
        .compact-scroll::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 3px;
        }
        .resume-modal-compact {
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default RecruiterResumeDetailModal;
