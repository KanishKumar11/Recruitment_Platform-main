import React, { useState, useEffect } from "react";
import { X, Paperclip, Download, Loader2, Eye, FileText, Edit, Save, Plus, Trash2, RefreshCw } from "lucide-react";
import { useGetResumeByIdQuery, useUpdateResumeMutation } from "@/app/store/services/resumesApi";
import ResumeStatusBadge from "../company/ResumeStatusBadge";
import ResumeStatusHistory from "../company/ResumeStatusHistory";
import { ResumeStatus } from "@/app/models/Resume";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";
import { validateResumeFile, validateAdditionalDocument, formatFileSize } from "@/app/lib/fileValidation";

interface RecruiterResumeDetailModalProps {
  resumeId: string;
  onClose: () => void;
}

interface EditData {
  candidateName?: string;
  email?: string;
  phone?: string;
  alternativePhone?: string;
  location?: string;
  country?: string;
  noticePeriod?: string;
  currentCompany?: string;
  currentDesignation?: string;
  totalExperience?: string;
  relevantExperience?: string;
  currentCTC?: string;
  expectedCTC?: string;
  qualification?: string;
  remarks?: string;
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
    refetch,
  } = useGetResumeByIdQuery(resumeId);

  const [updateResume, { isLoading: isUpdating }] = useUpdateResumeMutation();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<EditData>({});
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);
  const [newAdditionalFiles, setNewAdditionalFiles] = useState<File[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);
  const [replacingDocument, setReplacingDocument] = useState<string | null>(null);
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

  const getQuestionText = (questionId: string | { question?: string } | any): string => {
    if (typeof questionId === "object" && questionId !== null) {
      if ("question" in questionId) {
        // Ensure we return a string, not an object
        return String(questionId.question || "Question");
      }
    }
    return "Question";
  };

  // Initialize edit data when resume loads
  useEffect(() => {
    if (resume && !isEditMode) {
      setEditData({
        candidateName: resume.candidateName || '',
        email: resume.email || '',
        phone: resume.phone || '',
        alternativePhone: resume.alternativePhone || '',
        location: resume.location || '',
        country: resume.country || '',
        noticePeriod: resume.noticePeriod || '',
        currentCompany: resume.currentCompany || '',
        currentDesignation: resume.currentDesignation || '',
        totalExperience: resume.totalExperience || '',
        relevantExperience: resume.relevantExperience || '',
        currentCTC: resume.currentCTC || '',
        expectedCTC: resume.expectedCTC || '',
        qualification: resume.qualification || '',
        remarks: resume.remarks || '',
      });
    }
  }, [resume, isEditMode]);

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - reset data
      setEditData({});
      setNewResumeFile(null);
      setNewAdditionalFiles([]);
      setFilesToRemove([]);
    }
    setIsEditMode(!isEditMode);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewResumeFile(file);
    }
  };



  const handleAdditionalFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate each file
    const invalidFiles: string[] = [];
    const validFiles: File[] = [];
    
    files.forEach(file => {
      const validation = validateAdditionalDocument(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (invalidFiles.length > 0) {
      alert(`Some files were rejected:\n${invalidFiles.join('\n')}`);
    }
    
    setNewAdditionalFiles(prev => [...prev, ...validFiles]);
  };

  const removeAdditionalFile = (index: number) => {
    setNewAdditionalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const markFileForRemoval = (filename: string) => {
    setFilesToRemove(prev => [...prev, filename]);
  };

  // Handle immediate document removal (like in ResumeDetailModal)
  const handleRemoveDocument = async (filename: string) => {
    if (!resume || !confirm('Are you sure you want to remove this document?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/resumes/remove-document', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeId, filename }),
      });

      if (response.ok) {
        // Refetch resume data to get updated documents
        refetch();
        alert('Document removed successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to remove document: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Document removal failed:', error);
      alert('Failed to remove document. Please try again.');
    }
  };

  // Handle document replacement
  const handleReplaceDocument = async (filename: string, newFile: File) => {
    if (!resume) return;

    // Validate file
    const validation = validateAdditionalDocument(newFile);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setReplacingDocument(filename);
    try {
      const token = localStorage.getItem('token');
      // First remove the old document
      const removeResponse = await fetch('/api/resumes/remove-document', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeId, filename }),
      });

      if (!removeResponse.ok) {
        throw new Error('Failed to remove old document');
      }

      // Then add the new document
      const formData = new FormData();
      formData.append('file', newFile);
      formData.append('resumeId', resumeId);

      const addResponse = await fetch('/api/resumes/add-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (addResponse.ok) {
        refetch();
        alert('Document replaced successfully!');
      } else {
        const errorData = await addResponse.json();
        alert(`Failed to replace document: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Document replacement failed:', error);
      alert('Failed to replace document. Please try again.');
    } finally {
      setReplacingDocument(null);
    }
  };

  // Handle file input for document replacement
  const handleDocumentReplaceFileChange = (filename: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleReplaceDocument(filename, file);
    }
    // Reset the input
    event.target.value = '';
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(editData).forEach(key => {
        const typedKey = key as keyof EditData;
        if (editData[typedKey] !== undefined && editData[typedKey] !== null) {
          formData.append(key, editData[typedKey] as string);
        }
      });

      // Add new resume file if selected
      if (newResumeFile) {
        formData.append('file', newResumeFile);
      }

      // Add new additional files
      newAdditionalFiles.forEach(file => {
        formData.append('additionalDocuments', file);
      });

      // Add files to remove
      if (filesToRemove.length > 0) {
        formData.append('filesToRemove', JSON.stringify(filesToRemove));
      }

      await updateResume({ id: resumeId, formData }).unwrap();
      
      // Reset edit state
      setIsEditMode(false);
      setNewResumeFile(null);
      setNewAdditionalFiles([]);
      setFilesToRemove([]);
      
      // Refetch data
      refetch();
      
      alert('Resume updated successfully!');
    } catch (error) {
      console.error('Failed to update resume:', error);
      alert('Failed to update resume. Please try again.');
    }
  };

  // Check if editing should be enabled based on status and role
  // Allow editing when status is SUBMITTED and user has proper role
  const canEdit = (userRole === 'RECRUITER' || userRole === 'INTERNAL') && resume?.status === ResumeStatus.SUBMITTED;
  const isEditingDisabled = !canEdit;



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
                {isEditMode ? (
                  <input
                    type="text"
                    value={editData.candidateName || ''}
                    onChange={(e) => handleInputChange('candidateName', e.target.value)}
                    className="text-lg font-semibold bg-white border border-gray-300 rounded px-2 py-1"
                  />
                ) : (
                  resume.candidateName
                )}
              </h2>
              <p className="text-xs text-gray-600">
                {isEditMode ? (
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="text-xs bg-white border border-gray-300 rounded px-2 py-1 w-full"
                  />
                ) : (
                  resume.email
                )}
              </p>
            </div>
            <ResumeStatusBadge status={resume.status} />
            {isEditingDisabled && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                Editing disabled - Status: {resume.status}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <>
                {isEditMode ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isUpdating}
                      className="flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      {isUpdating ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-white rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
                    {isEditMode ? (
                      <input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full text-xs bg-white border border-gray-300 rounded px-2 py-1 mt-1"
                      />
                    ) : (
                      <p className="text-gray-600">{resume.email || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Phone:</span>
                    {isEditMode ? (
                      <input
                        type="tel"
                        value={editData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full text-xs bg-white border border-gray-300 rounded px-2 py-1 mt-1"
                      />
                    ) : (
                      <p className="text-gray-600">{resume.phone || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">
                      Alt Phone:
                    </span>
                    {isEditMode ? (
                      <input
                        type="tel"
                        value={editData.alternativePhone || ''}
                        onChange={(e) => handleInputChange('alternativePhone', e.target.value)}
                        className="w-full text-xs bg-white border border-gray-300 rounded px-2 py-1 mt-1"
                        placeholder="Optional"
                      />
                    ) : (
                      <p className="text-gray-600">{resume.alternativePhone || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Location:</span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full text-xs bg-white border border-gray-300 rounded px-2 py-1 mt-1"
                      />
                    ) : (
                      <p className="text-gray-600">
                        {resume.location || "N/A"}
                        {resume.country && `, ${resume.country}`}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Country:</span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.country || ''}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className="w-full text-xs bg-white border border-gray-300 rounded px-2 py-1 mt-1"
                      />
                    ) : (
                      <p className="text-gray-600">{resume.country || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Notice Period:</span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.noticePeriod || ''}
                        onChange={(e) => handleInputChange('noticePeriod', e.target.value)}
                        className="w-full text-xs bg-white border border-gray-300 rounded px-2 py-1 mt-1"
                      />
                    ) : (
                      <p className="text-gray-600">
                        {resume.noticePeriod || "N/A"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Career Information - Compact */}
              <div className="compact-section">
                <h3>Career Information</h3>
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Current Company:
                    </span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.currentCompany || ''}
                        onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                        className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium text-xs">
                        {resume.currentCompany || "N/A"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Current Designation:
                    </span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.currentDesignation || ''}
                        onChange={(e) => handleInputChange('currentDesignation', e.target.value)}
                        className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium text-xs">
                        {resume.currentDesignation || "N/A"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Total Experience:
                    </span>
                    {isEditMode ? (
                      <input
                        type="number"
                        value={editData.totalExperience || ''}
                        onChange={(e) => handleInputChange('totalExperience', e.target.value)}
                        className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1"
                        placeholder="Years"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium text-xs">
                        {resume.totalExperience ? `${resume.totalExperience} years` : "N/A"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Relevant Experience:
                    </span>
                    {isEditMode ? (
                      <input
                        type="number"
                        value={editData.relevantExperience || ''}
                        onChange={(e) => handleInputChange('relevantExperience', e.target.value)}
                        className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1"
                        placeholder="Years"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium text-xs">
                        {resume.relevantExperience ? `${resume.relevantExperience} years` : "N/A"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Current Salary:
                    </span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.currentCTC || ''}
                        onChange={(e) => handleInputChange('currentCTC', e.target.value)}
                        className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium text-xs">
                        {resume.currentCTC || "N/A"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Expected Salary:
                    </span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.expectedCTC || ''}
                        onChange={(e) => handleInputChange('expectedCTC', e.target.value)}
                        className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium text-xs">
                        {resume.expectedCTC || "N/A"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      Education:
                    </span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.qualification || ''}
                        onChange={(e) => handleInputChange('qualification', e.target.value)}
                        className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <span className="text-gray-900 font-medium text-xs">
                        {resume.qualification || "N/A"}
                      </span>
                    )}
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
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Remarks
                </h3>
                {isEditMode ? (
                  <textarea
                    value={editData.remarks || ''}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    className="w-full text-xs bg-white border border-gray-300 rounded px-2 py-1"
                    rows={3}
                    placeholder="Add remarks..."
                  />
                ) : (
                  <p className="text-xs text-gray-600">{resume.remarks || "No remarks"}</p>
                )}
              </div>
            </div>

            {/* Right section: Documents and Status History (spans 1 column) */}
            <div className="lg:col-span-1 space-y-3 flex flex-col">
              {/* Additional Documents Row */}
              <div className="compact-section">
                <h3 className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Paperclip className="mr-2 h-4 w-4 text-gray-500" />
                    Additional Documents ({(resume.additionalDocuments?.length || 0) + newAdditionalFiles.length})
                  </span>
                  {isEditMode && (
                    <label className="flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 cursor-pointer">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Files
                      <input
                        type="file"
                        multiple
                        onChange={handleAdditionalFilesChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      />
                    </label>
                  )}
                </h3>
                
                <div className="grid grid-cols-1 gap-3 mt-3">
                  {/* Existing Documents */}
                  {resume.additionalDocuments && resume.additionalDocuments
                    .filter(doc => !filesToRemove.includes(doc.filename))
                    .map((doc, index) => (
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
                        {isEditMode && (
                          <>
                            <label className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                              title="Replace document">
                              {replacingDocument === doc.filename ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                              <input
                                type="file"
                                onChange={(e) => handleDocumentReplaceFileChange(doc.filename, e)}
                                className="hidden"
                                disabled={replacingDocument === doc.filename}
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                              />
                            </label>
                            <button
                              onClick={() => markFileForRemoval(doc.filename)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                              title="Mark for removal on save"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleRemoveDocument(doc.filename)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                              title="Remove immediately"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* New Files to Upload */}
                  {newAdditionalFiles.map((file, index) => (
                    <div
                      key={`new-${index}`}
                      className="flex items-center justify-between bg-blue-50 p-3 rounded-md border border-blue-200"
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <Paperclip className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-blue-900 truncate block">
                            {file.name} (New)
                          </span>
                          <p className="text-xs text-blue-600 mt-1">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAdditionalFile(index)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Show message when no documents */}
                  {(!resume.additionalDocuments || resume.additionalDocuments.length === 0) && 
                   newAdditionalFiles.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-xs">
                      No additional documents
                      {isEditMode && " - Click 'Add Files' to upload documents"}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes History */}
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
              <div className="flex items-center justify-between mb-3">
                <h3>Resume File</h3>
                {isEditMode && (
                  <label className="flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 cursor-pointer">
                    <FileText className="h-3 w-3 mr-1" />
                    {newResumeFile ? 'Change Resume' : 'Upload New Resume'}
                    <input
                      type="file"
                      onChange={handleResumeFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                    />
                  </label>
                )}
              </div>
              
              {/* Show new resume file info if selected */}
              {newResumeFile && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-green-600 mr-2" />
                      <div>
                        <span className="text-sm font-medium text-green-900">
                          New Resume: {newResumeFile.name}
                        </span>
                        <p className="text-xs text-green-600">
                          {formatFileSize(newResumeFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNewResumeFile(null)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
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
                      {isEditMode && " - Upload a resume file above"}
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
