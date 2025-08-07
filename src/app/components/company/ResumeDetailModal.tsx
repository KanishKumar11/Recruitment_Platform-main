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

  // Helper function to get file URL through API with auth token
  const getFileUrl = (filename: string, isDownload: boolean = false) => {
    if (!filename) return "";

    // Remove any existing path prefixes if present
    const cleanFilename = filename.split("/").pop() || filename;

    // Use the resume download API endpoint
    const baseUrl = `/api/resumes/download/${cleanFilename}`;
    const token = localStorage.getItem("token") || "";

    // For iframe preview, we need to include the token in the URL since iframe can't send custom headers
    if (!isDownload && token) {
      return `${baseUrl}?token=${encodeURIComponent(token)}`;
    }

    return baseUrl;
  };

  // Helper function to handle file download with authentication
  const handleDownload = async () => {
    if (!resume?.resumeFile) return;

    try {
      // Use the resume download API endpoint
      const cleanFilename =
        resume.resumeFile.split("/").pop() || resume.resumeFile;
      const downloadUrl = `/api/resumes/download/${cleanFilename}?download=true`;

      // Fetch the file with authentication headers
      const token = localStorage.getItem("token");

      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token || ""}`,
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
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file. Please try again.");
    }
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
    const token = localStorage.getItem("token") || "";
    return `/api/resumes/download/${filename}?token=${encodeURIComponent(
      token
    )}`;
  };

  // Helper function to handle additional document download
  const handleDocumentDownload = async (
    filename: string,
    originalName: string
  ) => {
    try {
      const downloadUrl = `/api/resumes/download/${filename}?download=true`;

      // Fetch the file with authentication headers
      const token = localStorage.getItem("token");

      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token || ""}`,
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
      { value: ResumeStatus.REJECTED, label: "Rejected" },
      { value: ResumeStatus.DUPLICATE, label: "Duplicate" },
    ];
    return options;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{resume.candidateName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* New Layout: Two columns for info sections and status history */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Left section: Basic and Career Info (spans 2 columns) */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
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
                  <dd className="mt-1 text-sm text-gray-900">
                    {resume.country}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    Location
                  </dt>
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

            {/* Career Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Career Information
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    Current Company
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {resume.currentCompany}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    Current Designation
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {resume.currentDesignation}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    Total Experience
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {resume.totalExperience}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    Relevant Experience
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {resume.relevantExperience}
                  </dd>
                </div>
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
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <ResumeStatusBadge status={resume.status} />
                  </dd>
                </div>
              </dl>
            </div>

            {/* Screening Answers */}
            {resume.screeningAnswers && resume.screeningAnswers.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Screening Questions
                </h3>
                <div>
                  {resume.screeningAnswers.map((item, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <p className="font-medium text-gray-900">
                        {getQuestionText(item.questionId)}
                      </p>
                      <p className="mt-1 text-gray-700">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks Section */}
            {resume.remarks && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Remarks
                </h3>
                <p className="text-sm text-gray-600">{resume.remarks}</p>
              </div>
            )}
          </div>

          {/* Right section: Status History (spans 1 column) */}
          <div className="md:col-span-1">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Status History
              </h3>
              <ResumeStatusHistory resume={resume} />
            </div>
          </div>
        </div>

        {/* Resume Viewer - Updated to use secure API */}
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Resume Preview
          </h3>
          {resume.resumeFile ? (
            <iframe
              src={getFileUrl(resume.resumeFile)}
              className="w-full h-96 border border-gray-300 rounded-lg"
              title={`Resume for ${resume.candidateName}`}
            ></iframe>
          ) : (
            <div className="w-full h-96 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <p className="text-gray-500">No resume file available</p>
            </div>
          )}
        </div>

        {/* Resume Download Section - Updated to use secure download */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex items-center mb-2">
            <Paperclip className="mr-2 h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Resume File</h3>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 truncate flex-grow">
              {resume.resumeFile
                ? resume.resumeFile.split("/").pop()
                : "No file"}
            </span>
            {resume.resumeFile && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="mr-1 h-4 w-4" />
                Download
              </button>
            )}
          </div>
        </div>

        {/* Additional Documents Section */}
        {resume.additionalDocuments &&
          resume.additionalDocuments.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
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

        {/* Status Update and Notes Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Status Update Section - Only visible to COMPANY, ADMIN, INTERNAL */}
          {canChangeStatus() && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Update Status
              </h3>
              <div className="mt-1">
                <select
                  onChange={handleStatusChange}
                  defaultValue=""
                  disabled={isUpdating}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>
                    {isUpdating ? "Updating..." : "Select a new status"}
                  </option>
                  {getStatusOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Add a Note
            </h3>
            <form onSubmit={handleSubmitNote}>
              <div className="mt-1">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Add your note here..."
                ></textarea>
              </div>
              <div className="mt-2 flex justify-end">
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
        </div>

        {/* Notes History */}
        {resume.notes && resume.notes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Notes History
            </h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-md max-h-64 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {resume.notes.map((note, index) => (
                  <li key={index} className="px-4 py-4 sm:px-6">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {note.userId ? `User: ${note.userId}` : "User"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {note.note}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

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

export default ResumeDetailModal;
