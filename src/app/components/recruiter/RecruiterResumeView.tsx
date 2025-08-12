// components/recruiter/RecruiterResumeView.tsx
import React, { useState, useEffect } from "react";
import { useGetResumeByIdQuery } from "@/app/store/services/resumesApi";
import {
  Loader2,
  X,
  Paperclip,
  Download,
  Clock,
  Eye,
  AlertCircle,
  FileText,
} from "lucide-react";
import ResumeStatusBadge from "../company/ResumeStatusBadge";
import ResumeStatusHistory from "../company/ResumeStatusHistory";

interface RecruiterResumeViewProps {
  resumeId: string;
  onClose: () => void;
}

const RecruiterResumeView: React.FC<RecruiterResumeViewProps> = ({
  resumeId,
  onClose,
}) => {
  const [previewError, setPreviewError] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{
    filename: string;
    originalName: string;
  } | null>(null);

  const {
    data: resume,
    isLoading,
    isError,
    error,
  } = useGetResumeByIdQuery(resumeId);

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

  // Helper function to get authentication token
  const getAuthToken = (): string => {
    try {
      const authData = localStorage.getItem("auth");
      if (authData) {
        const parsedAuth = JSON.parse(authData);
        return parsedAuth.token || "";
      }
    } catch (error) {
      console.warn("Failed to parse auth data from localStorage:", error);
    }
    return "";
  };

  // Function to get the proper file URL with authentication
  const getFileUrl = (filePath: string) => {
    // If it's already a full URL, return as is
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }

    // Extract filename from path
    const filename = filePath.startsWith("/uploads/")
      ? filePath.replace("/uploads/", "")
      : filePath.split("/").pop() || filePath;

    return `/api/resumes/download/${filename}`
  };

  // Function to check if file is PDF
  const isPdfFile = (filePath: string) => {
    return filePath.toLowerCase().endsWith(".pdf");
  };

  // Handle iframe load error
  const handleIframeError = () => {
    setPreviewError(true);
  };

  // Helper function to check if file can be previewed
  const canPreviewFile = (filename: string) => {
    const extension = filename.toLowerCase().split(".").pop();
    return ["pdf", "jpg", "jpeg", "png", "gif", "bmp", "webp", "txt"].includes(
      extension || ""
    );
  };

  // Helper function to get preview URL for additional documents
  const getDocumentPreviewUrl = (filename: string) => {
    return `/api/resumes/download/${filename}`
  };

  // Helper function to handle additional document download
  const handleDocumentDownload = async (
    filename: string,
    originalName: string
  ) => {
    try {
      const downloadUrl = `/api/resumes/download/${filename}?download=true`;
      const response = await fetch(downloadUrl, {
        method: "GET",
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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

  const fileUrl = getFileUrl(resume.resumeFile);
  const isImageFile = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(resume.resumeFile);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{resume.candidateName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left side - Main content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Basic Information
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{resume.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{resume.phone}</dd>
                  </div>
                  {resume.alternativePhone && (
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        Alternative Phone
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {resume.alternativePhone}
                      </dd>
                    </div>
                  )}
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Country</dt>
                    <dd className="mt-1 text-sm text-gray-900">{resume.country}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {resume.location}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Qualification
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {resume.qualification}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Career Information
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Current Annual CTC
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {resume.currentCTC}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Expected Annual CTC
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {resume.expectedCTC}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Notice Period
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {resume.noticePeriod}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Remarks</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {resume.remarks || "No remarks provided"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Right side - Status and History (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Status</h3>
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <span className="mr-2 text-sm font-medium text-gray-500">
                    Current:
                  </span>
                  <ResumeStatusBadge status={resume.status} />
                </div>
                <div className="text-sm text-gray-500">
                  <Clock className="inline-block h-4 w-4 mr-1" />
                  Submitted: {new Date(resume.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {/* Resume Status History - Recruiter View */}
            <div className="bg-white border rounded-lg p-4">
              <ResumeStatusHistory resume={resume} />
            </div>
          </div>
        </div>

        {/* Resume Download Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
          <div className="flex items-center mb-2">
            <Paperclip className="mr-2 h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Resume File</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 truncate">
                {resume.resumeFile.split("/").pop()}
              </span>
            </div>
            <div className="flex space-x-2">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Eye className="mr-1 h-4 w-4" />
                Open in New Tab
              </a>
              <a
                href={fileUrl}
                download
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="mr-1 h-4 w-4" />
                Download
              </a>
            </div>
          </div>
        </div>

        {/* Additional Documents Section */}
        {resume.additionalDocuments &&
          resume.additionalDocuments.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
              <div className="flex items-center mb-2">
                <Paperclip className="mr-2 h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900">
                  Additional Documents ({resume.additionalDocuments.length})
                </h3>
              </div>
              <div className="space-y-2">
                {resume.additionalDocuments.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200"
                  >
                    <div className="flex items-center">
                      <Paperclip className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {doc.originalName}
                        </span>
                        <p className="text-xs text-gray-500">
                          Uploaded on{" "}
                          {doc.uploadedAt
                            ? new Date(doc.uploadedAt).toLocaleDateString()
                            : "Unknown date"}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {canPreviewFile(doc.filename) && (
                        <button
                          onClick={() =>
                            setPreviewDocument({
                              filename: doc.filename,
                              originalName: doc.originalName,
                            })
                          }
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Preview
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDocumentDownload(doc.filename, doc.originalName)
                        }
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Download className="mr-1 h-4 w-4" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Screening Answers */}
        {resume.screeningAnswers && resume.screeningAnswers.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Screening Questions
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              {resume.screeningAnswers.map((item, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <p className="font-medium text-gray-900">
                    {getQuestionText(item.questionId)}
                  </p>
                  <div className="mt-2 text-sm text-gray-700">
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resume Preview */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Resume Preview
          </h3>

          {previewError ? (
            <div className="w-full h-96 border border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Preview not available</p>
              <p className="text-sm text-gray-500 mb-4">
                The file cannot be displayed in preview mode.
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Eye className="mr-2 h-4 w-4" />
                Open in New Tab
              </a>
            </div>
          ) : isImageFile ? (
            <div className="w-full h-96 border border-gray-300 rounded-lg overflow-hidden">
              <img
                src={fileUrl}
                alt={`Resume for ${resume.candidateName}`}
                className="w-full h-full object-contain"
                onError={handleIframeError}
              />
            </div>
          ) : (
            <iframe
              src={
                isPdfFile(resume.resumeFile) ? `${fileUrl}#view=FitH` : fileUrl
              }
              className="w-full h-96 border border-gray-300 rounded-lg"
              title={`Resume for ${resume.candidateName}`}
              onError={handleIframeError}
              onLoad={(e) => {
                // Check if iframe loaded successfully
                try {
                  const iframe = e.target as HTMLIFrameElement;
                  iframe.contentDocument; // This will throw if blocked by CORS
                } catch (error) {
                  console.warn("Preview blocked, likely due to CORS policy");
                }
              }}
            />
          )}
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
                ) : previewDocument.filename.toLowerCase().endsWith(".txt") ? (
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
  );
};

export default RecruiterResumeView;
