"use client";

import { useState, useRef, FormEvent, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetJobByIdQuery } from "../../../../../store/services/jobsApi";
import {
  useUploadResumeMutation,
  useValidateCandidateMutation,
} from "../../../../../store/services/resumesApi";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import {
  Loader2,
  ArrowLeft,
  FileUp,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Download,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Validation types
interface ValidationError {
  field: string;
  message: string;
  details?: any;
}

interface ValidationWarning {
  field: string;
  message: string;
  count?: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export default function ApplyForJobPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: job, isLoading } = useGetJobByIdQuery(id);
  const [uploadResume, { isLoading: isUploading }] = useUploadResumeMutation();
  const [validateCandidate, { isLoading: isValidating }] =
    useValidateCandidateMutation();

  // Form states
  const [candidateName, setCandidateName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alternativePhone, setAlternativePhone] = useState("");
  const [country, setCountry] = useState("");
  const [location, setLocation] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentDesignation, setCurrentDesignation] = useState("");
  const [totalExperience, setTotalExperience] = useState("");
  const [relevantExperience, setRelevantExperience] = useState("");
  const [currentCTC, setCurrentCTC] = useState("");
  const [expectedCTC, setExpectedCTC] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [qualification, setQualification] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFilesRef = useRef<HTMLInputElement>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Validation states
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [validationTimeout, setValidationTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [hasValidated, setHasValidated] = useState(false);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // State for storing answers to screening questions
  const [screeningAnswers, setScreeningAnswers] = useState<{
    [key: string]: string;
  }>({});

  // Remove all warnings - only show errors for same job applications
  const filterValidationResult = (
    result: ValidationResult
  ): ValidationResult => {
    return {
      ...result,
      warnings: [], // Remove all warnings completely
    };
  };

  // Debounced validation function
  const validateCandidateData = useCallback(
    async (emailValue: string, phoneValue: string) => {
      if (!emailValue.trim() || !phoneValue.trim() || !id) {
        setValidationResult(null);
        setHasValidated(false);
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        return; // Don't validate if email format is invalid
      }

      try {
        const result = await validateCandidate({
          email: emailValue,
          phone: phoneValue,
          jobId: id,
        }).unwrap();

        // Remove all warnings - only keep errors for same job applications
        const filteredResult = filterValidationResult(result);
        setValidationResult(filteredResult);
        setHasValidated(true);

        // Show validation details only if there are errors
        if (filteredResult.errors.length > 0) {
          setShowValidationDetails(true);
        }
      } catch (error) {
        console.error("Validation error:", error);
        setValidationResult(null);
        setHasValidated(false);
      }
    },
    [validateCandidate, id]
  );

  // Handle email change with validation
  const handleEmailChange = (value: string) => {
    setEmail(value);

    // Clear existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // Set new timeout for validation
    const newTimeout = setTimeout(() => {
      validateCandidateData(value, phone);
    }, 500); // 500ms debounce

    setValidationTimeout(newTimeout);
  };

  // Handle phone change with validation
  const handlePhoneChange = (value: string) => {
    setPhone(value);

    // Clear existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // Set new timeout for validation
    const newTimeout = setTimeout(() => {
      validateCandidateData(email, value);
    }, 500); // 500ms debounce

    setValidationTimeout(newTimeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle additional files selection
  const handleAdditionalFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAdditionalFiles((prev) => [...prev, ...filesArray]);
    }
  };

  // Remove additional file
  const removeAdditionalFile = (index: number) => {
    setAdditionalFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle answer change for screening questions
  const handleAnswerChange = (questionId: string, value: string) => {
    setScreeningAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Check if form can be submitted
  const canSubmit = () => {
    if (!hasValidated || !validationResult) return false;
    if (validationResult.errors.length > 0) return false;
    return true;
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a resume file to upload");
      return;
    }

    if (!canSubmit()) {
      toast.error("Please resolve validation issues before submitting");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("jobId", (params.id ?? "").toString());
      formData.append("candidateName", candidateName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("alternativePhone", alternativePhone);
      formData.append("country", country);
      formData.append("location", location);
      formData.append("currentCompany", currentCompany);
      formData.append("currentDesignation", currentDesignation);
      formData.append("totalExperience", totalExperience);
      formData.append("relevantExperience", relevantExperience);
      formData.append("currentCTC", currentCTC);
      formData.append("expectedCTC", expectedCTC);
      formData.append("noticePeriod", noticePeriod);
      formData.append("qualification", qualification);
      formData.append("remarks", remarks);
      formData.append("resumeFile", selectedFile);

      // Add additional documents to form data
      additionalFiles.forEach((file) => {
        formData.append("additionalDocuments", file);
      });

      // Add screening answers to form data
      if (job?.screeningQuestions && job.screeningQuestions.length > 0) {
        (
          job.screeningQuestions as unknown as {
            _id: string;
            question: string;
          }[]
        ).forEach((question) => {
          const answer = screeningAnswers[question._id] || "";
          formData.append(`screeningAnswer_${question._id}`, answer);
        });
      }

      uploadResume(formData).unwrap();
      toast.success("Resume uploaded successfully");
      setSubmitSuccess(true);

      // Reset form
      setCandidateName("");
      setEmail("");
      setPhone("");
      setAlternativePhone("");
      setCountry("");
      setLocation("");
      setCurrentCompany("");
      setCurrentDesignation("");
      setTotalExperience("");
      setRelevantExperience("");
      setCurrentCTC("");
      setExpectedCTC("");
      setNoticePeriod("");
      setQualification("");
      setRemarks("");
      setSelectedFile(null);
      setAdditionalFiles([]);
      setScreeningAnswers({});
      setValidationResult(null);
      setHasValidated(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (additionalFilesRef.current) {
        additionalFilesRef.current.value = "";
      }

      // After 3 seconds, hide the success message
      setTimeout(() => {
        setSubmitSuccess(false);
        router.push("/dashboard/recruiter/jobs");
      }, 3000);
    } catch (error) {
      console.error("Resume upload error:", error);
      toast.error("Failed to upload resume. Please try again.");
    }
  };

  // Render validation status
  const renderValidationStatus = () => {
    if (isValidating) {
      return (
        <div className="mt-2 flex items-center text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Validating candidate...
        </div>
      );
    }

    if (!hasValidated || !validationResult) {
      return null;
    }

    const { isValid, errors } = validationResult;

    return (
      <div className="mt-2 space-y-2">
        {errors.length > 0 && (
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-600">
              <div className="font-medium">Validation Errors:</div>
              {errors.map((error, index) => (
                <div key={index} className="mt-1">
                  • {error.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {isValid && errors.length === 0 && (
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">
              Candidate validation passed
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <ProtectedLayout allowedRoles={["RECRUITER"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <button
                onClick={() =>
                  router.push(`/dashboard/recruiter/jobs/${params.id}`)
                }
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Job Details
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : job ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Apply for: {job.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Complete all required fields below
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  {submitSuccess ? (
                    <div className="rounded-md bg-green-50 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Check className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">
                            Resume submitted successfully
                          </h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>
                              Your candidate resume has been submitted for this
                              job position.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Validation Summary - Only show if there are errors */}
                  {hasValidated &&
                    validationResult &&
                    validationResult.errors.length > 0 && (
                      <div className="rounded-md bg-red-50 p-4 mb-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                              Candidate Validation Error
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                              <p>
                                ⚠️ This candidate cannot be submitted due to
                                validation errors.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Candidate Information Section */}
                    <div className="border-b border-gray-200 pb-6 mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">
                        Candidate Information
                      </h4>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                          {/* Candidate Name */}
                          <div>
                            <label
                              htmlFor="candidateName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Candidate Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="candidateName"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                              value={candidateName}
                              onChange={(e) => setCandidateName(e.target.value)}
                            />
                          </div>

                          {/* Phone with validation */}
                          <div>
                            <label
                              htmlFor="phone"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm ${
                                hasValidated &&
                                validationResult?.errors.some(
                                  (e) => e.field === "phone"
                                )
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-gray-300 focus:border-indigo-500"
                              }`}
                              required
                              value={phone}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                            />
                          </div>

                          {/* Country */}
                          <div>
                            <label
                              htmlFor="country"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Country <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="country"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                          {/* Email with validation */}
                          <div>
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Email <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              id="email"
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm ${
                                hasValidated &&
                                validationResult?.errors.some(
                                  (e) => e.field === "email"
                                )
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-gray-300 focus:border-indigo-500"
                              }`}
                              required
                              value={email}
                              onChange={(e) => handleEmailChange(e.target.value)}
                            />
                            {renderValidationStatus()}
                          </div>

                          {/* Alternative Phone */}
                          <div>
                            <label
                              htmlFor="alternativePhone"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Alternative Phone
                            </label>
                            <input
                              type="tel"
                              id="alternativePhone"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={alternativePhone}
                              onChange={(e) => setAlternativePhone(e.target.value)}
                            />
                          </div>

                          {/* Location */}
                          <div>
                            <label
                              htmlFor="location"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Location <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="location"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Professional Information Section */}
                    <div className="border-b border-gray-200 pb-6 mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">
                        Professional Information
                      </h4>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                          {/* Current Company */}
                          <div>
                            <label
                              htmlFor="currentCompany"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Current Company{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="currentCompany"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                              value={currentCompany}
                              onChange={(e) => setCurrentCompany(e.target.value)}
                            />
                          </div>

                          {/* Total Experience */}
                          <div>
                            <label
                              htmlFor="totalExperience"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Total Experience{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="totalExperience"
                              placeholder="e.g., 5 years"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                              value={totalExperience}
                              onChange={(e) => setTotalExperience(e.target.value)}
                            />
                          </div>

                          {/* Current CTC */}
                          <div>
                            <label
                              htmlFor="currentCTC"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Current Annual CTC{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="currentCTC"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                              value={currentCTC}
                              onChange={(e) => setCurrentCTC(e.target.value)}
                            />
                          </div>

                          {/* Qualification */}
                          <div>
                            <label
                              htmlFor="qualification"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Qualification <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="qualification"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                              value={qualification}
                              onChange={(e) => setQualification(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                          {/* Current Designation */}
                          <div>
                            <label
                              htmlFor="currentDesignation"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Current Designation{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="currentDesignation"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                              value={currentDesignation}
                              onChange={(e) =>
                                setCurrentDesignation(e.target.value)
                              }
                            />
                          </div>

                          {/* Relevant Experience */}
                          <div>
                            <label
                              htmlFor="relevantExperience"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Relevant Experience{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="relevantExperience"
                              placeholder="e.g., 3 years"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                              value={relevantExperience}
                              onChange={(e) =>
                                setRelevantExperience(e.target.value)
                              }
                            />
                          </div>

                          {/* Expected CTC */}
                          <div>
                            <label
                              htmlFor="expectedCTC"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Expected Annual CTC{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="expectedCTC"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                              value={expectedCTC}
                              onChange={(e) => setExpectedCTC(e.target.value)}
                            />
                          </div>

                          {/* Notice Period */}
                          <div>
                            <label
                              htmlFor="noticePeriod"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Notice Period <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="noticePeriod"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                              value={noticePeriod}
                              onChange={(e) => setNoticePeriod(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Remarks - Full Width */}
                      <div className="mt-4">
                        <label
                          htmlFor="remarks"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Remarks
                        </label>
                        <textarea
                          id="remarks"
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="border-b border-gray-200 pb-6 mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">
                        Document Upload
                      </h4>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Resume Upload */}
                        <div>
                          <label
                            htmlFor="resume"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Resume <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="file"
                            id="resume"
                            accept=".pdf,.doc,.docx"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                          />
                          {selectedFile && (
                            <p className="mt-2 text-sm text-gray-500">
                              Selected: {selectedFile.name}
                            </p>
                          )}
                        </div>

                        {/* Additional Documents Upload */}
                        <div>
                          <label
                            htmlFor="additionalDocuments"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Additional Documents
                          </label>
                          <input
                            type="file"
                            id="additionalDocuments"
                            multiple
                            ref={additionalFilesRef}
                            onChange={handleAdditionalFilesChange}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Certificates, portfolio, cover letter, etc. (Optional)
                          </p>
                        </div>
                      </div>

                      {/* Display selected additional files */}
                      {additionalFiles.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Selected Files ({additionalFiles.length}):
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {additionalFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                              >
                                <div className="flex items-center">
                                  <FileUp className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-700 truncate">
                                    {file.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeAdditionalFile(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Screening Questions Section */}
                    {job.screeningQuestions &&
                      job.screeningQuestions.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-md font-medium text-gray-900 mb-4">
                            Screening Questions
                          </h4>
                          <div className="space-y-6">
                            {(
                              job.screeningQuestions as unknown as {
                                _id: string;
                                question: string;
                                questionType: string;
                                required: boolean;
                              }[]
                            ).map((question, index) => (
                              <div
                                key={String(question._id)}
                                className="space-y-2"
                              >
                                <label className="block text-sm font-medium text-gray-700">
                                  {index + 1}. {question.question}
                                  {question.required && (
                                    <span className="text-red-500">*</span>
                                  )}
                                </label>

                                {/* Render different input types based on questionType */}
                                {question.questionType === "YES_NO" ? (
                                  <div className="mt-2">
                                    <div className="flex space-x-4">
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`question_${question._id}`}
                                          value="Yes"
                                          checked={
                                            screeningAnswers[question._id] ===
                                            "Yes"
                                          }
                                          onChange={(e) =>
                                            handleAnswerChange(
                                              question._id,
                                              e.target.value
                                            )
                                          }
                                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                          required={question.required}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                          Yes
                                        </span>
                                      </label>
                                      <label className="flex items-center">
                                        <input
                                          type="radio"
                                          name={`question_${question._id}`}
                                          value="No"
                                          checked={
                                            screeningAnswers[question._id] ===
                                            "No"
                                          }
                                          onChange={(e) =>
                                            handleAnswerChange(
                                              question._id,
                                              e.target.value
                                            )
                                          }
                                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                          required={question.required}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                          No
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                ) : question.questionType === "NUMERIC" ? (
                                  <input
                                    type="number"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={screeningAnswers[question._id] || ""}
                                    onChange={(e) =>
                                      handleAnswerChange(
                                        question._id,
                                        e.target.value
                                      )
                                    }
                                    required={question.required}
                                    placeholder="Enter a number"
                                  />
                                ) : (
                                  // Default to TEXT type
                                  <textarea
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={screeningAnswers[question._id] || ""}
                                    onChange={(e) =>
                                      handleAnswerChange(
                                        question._id,
                                        e.target.value
                                      )
                                    }
                                    required={question.required}
                                    placeholder="Enter your answer"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Submit Button */}
                    <div className="mt-6">
                      <button
                        type="submit"
                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          isUploading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FileUp className="mr-2 h-4 w-4" />
                            Submit Resume
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="ml-2 text-lg text-gray-700">Job not found</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
