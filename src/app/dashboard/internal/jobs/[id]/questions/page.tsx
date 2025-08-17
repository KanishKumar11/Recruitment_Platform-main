"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  FileText,
  Edit3,
  Trash2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import {
  useGetJobByIdQuery,
  useAddScreeningQuestionMutation,
  useUpdateScreeningQuestionMutation,
  useDeleteScreeningQuestionMutation,
} from "@/app/store/services/jobsApi";

type QuestionType = "TEXT" | "NUMERIC" | "YES_NO" | "MCQ" | "MULTI_SELECT";

interface ScreeningQuestion {
  _id: string;
  question: string;
  questionType: QuestionType;
  options: string[];
  required: boolean;
}

// Type for job with populated screening questions
interface PopulatedJob {
  _id: string;
  title: string;
  screeningQuestions: ScreeningQuestion[];
}

interface NewQuestion {
  question: string;
  questionType: QuestionType;
  options: string[];
  required: boolean;
}

export default function InternalJobQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const {
    data: jobData,
    isLoading: loading,
    error,
    refetch: refetchJob,
  } = useGetJobByIdQuery(jobId);
  
  // Cast to PopulatedJob since the API populates screeningQuestions
  const job = jobData as PopulatedJob | undefined;

  const [addScreeningQuestion] = useAddScreeningQuestionMutation();
  const [updateScreeningQuestion] = useUpdateScreeningQuestionMutation();
  const [deleteScreeningQuestion] = useDeleteScreeningQuestionMutation();
  const [isUpdating, setIsUpdating] = useState(false);

  // New question state
  const [newQuestion, setNewQuestion] = useState<NewQuestion>({
    question: "",
    questionType: "TEXT",
    options: [],
    required: false,
  });

  // Edit question state
  const [editingQuestion, setEditingQuestion] =
    useState<ScreeningQuestion | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(
    null
  );



  const handleQuestionTypeChange = (type: QuestionType) => {
    setNewQuestion({
      ...newQuestion,
      questionType: type,
      options: requiresOptions(type) ? ["", ""] : [],
    });
  };

  const requiresOptions = (type: QuestionType | undefined): boolean => {
    if (!type) return false;
    return type === "MCQ" || type === "MULTI_SELECT";
  };

  const addOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, ""],
    });
  };

  const updateOption = (index: number, value: string) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions,
    });
  };

  const removeOption = (index: number) => {
    const updatedOptions = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions,
    });
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question.trim()) {
      alert("Please enter a question");
      return;
    }

    if (
      requiresOptions(newQuestion.questionType) &&
      newQuestion.options &&
      newQuestion.options.some((opt) => !opt.trim())
    ) {
      alert("Please fill in all options");
      return;
    }

    try {
      setIsUpdating(true);
      const questionData: any = {
        jobId,
        question: newQuestion.question,
        questionType: newQuestion.questionType,
        required: newQuestion.required,
      };
      
      if (requiresOptions(newQuestion.questionType)) {
        questionData.options = newQuestion.options;
      }
      
      await addScreeningQuestion(questionData).unwrap();

      // Reset form
      setNewQuestion({
        question: "",
        questionType: "TEXT",
        options: [],
        required: false,
      });

      // Refresh job data
      await refetchJob();
    } catch (err: any) {
      alert(err?.data?.error || "Failed to add question");
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditing = (question: ScreeningQuestion) => {
    setEditingQuestion({ ...question });
  };

  const cancelEditing = () => {
    setEditingQuestion(null);
  };

  const saveQuestion = async (questionId: string) => {
    if (!editingQuestion) return;

    try {
      setIsUpdating(true);
      const updateData: any = {
        jobId,
        questionId: editingQuestion._id,
        question: editingQuestion.question,
        questionType: editingQuestion.questionType,
        required: editingQuestion.required,
      };
      
      if (requiresOptions(editingQuestion.questionType)) {
        updateData.options = editingQuestion.options;
      }
      
      await updateScreeningQuestion(updateData).unwrap();

      setEditingQuestion(null);
      await refetchJob();
    } catch (err: any) {
      alert(err?.data?.error || "Failed to update question");
    } finally {
      setIsUpdating(false);
    }
  };

  const showDeleteConfirmation = (questionId: string) => {
    setDeleteConfirmation(questionId);
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      setIsUpdating(true);
      await deleteScreeningQuestion({
        jobId,
        questionId: deleteConfirmation,
      }).unwrap();

      setDeleteConfirmation(null);
      await refetchJob();
    } catch (err: any) {
      alert(err?.data?.error || "Failed to delete question");
    } finally {
      setIsUpdating(false);
    }
  };

  const getQuestionTypeLabel = (type: QuestionType): string => {
    const labels = {
      TEXT: "Text Response",
      NUMERIC: "Numeric Response",
      YES_NO: "Yes/No",
      MCQ: "Multiple Choice (Single)",
      MULTI_SELECT: "Multiple Choice (Multi-Select)",
    };
    return labels[type];
  };

  const getQuestionTypeIcon = (type: QuestionType): string => {
    const icons = {
      TEXT: "📝",
      NUMERIC: "🔢",
      YES_NO: "✅",
      MCQ: "🔘",
      MULTI_SELECT: "☑️",
    };
    return icons[type];
  };

  if (loading) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  if (error) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
              <p className="text-gray-500">{(error as any)?.data?.error || 'Failed to load job'}</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Job Details
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Screening Questions
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Manage screening questions for:{" "}
                <span className="font-semibold">{job?.title}</span>
              </p>
            </div>
          </div>

          {/* Add New Question Form */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <Plus className="w-5 h-5 text-white" />
                <h3 className="text-lg font-semibold text-white">
                  Add New Screening Question
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Question Text */}
              <div>
                <label
                  htmlFor="question"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Question Text
                </label>
                <div className="relative">
                  <textarea
                    id="question"
                    name="question"
                    rows={4}
                    required
                    value={newQuestion.question}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        question: e.target.value,
                      })
                    }
                    placeholder="Enter your screening question here... (e.g., What is your experience with React and modern JavaScript frameworks?)"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 resize-none text-gray-700 placeholder-gray-400"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {newQuestion.question.length}/500
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Response Type */}
                <div>
                  <label
                    htmlFor="questionType"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Response Type
                  </label>
                  <div className="relative">
                    <select
                      id="questionType"
                      name="questionType"
                      value={newQuestion.questionType}
                      onChange={(e) =>
                        handleQuestionTypeChange(e.target.value as QuestionType)
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 text-gray-700 bg-white appearance-none cursor-pointer"
                    >
                      <option value="TEXT">📝 Text Response</option>
                      <option value="NUMERIC">🔢 Numeric Response</option>
                      <option value="YES_NO">✅ Yes/No</option>
                      <option value="MCQ">🔘 Multiple Choice (Single)</option>
                      <option value="MULTI_SELECT">
                        ☑️ Multiple Choice (Multi-Select)
                      </option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Required Question */}
                <div className="flex items-center">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      id="required"
                      name="required"
                      type="checkbox"
                      checked={newQuestion.required}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          required: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors duration-200">
                      ⭐ Required Question
                    </span>
                  </label>
                </div>
              </div>

              {/* Options Management for MCQ and Multi-select */}
              {requiresOptions(newQuestion.questionType) && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                      <span>📋</span>
                      <span>Answer Options</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                        {newQuestion.options?.length || 0} option(s)
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {newQuestion.options &&
                      newQuestion.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-white">
                              {index + 1}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              updateOption(index, e.target.value)
                            }
                            placeholder={`Enter option ${index + 1}...`}
                            className="flex-1 px-3 py-2 border-0 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                          />
                          {newQuestion.options &&
                            newQuestion.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOption(index)}
                                className="flex-shrink-0 w-8 h-8 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center transition-all duration-200 group border border-red-200 hover:border-red-300"
                              >
                                <X className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                              </button>
                            )}
                        </div>
                      ))}
                  </div>
                  <button
                    type="button"
                    onClick={addOption}
                    className="w-full px-4 py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center space-x-2 font-medium group"
                  >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    <span>Add Another Option</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                type="button"
                onClick={handleAddQuestion}
                disabled={isUpdating}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
              >
                {isUpdating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Adding Question...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Add Screening Question</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-white" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Screening Questions
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {job?.screeningQuestions?.length || 0} questions
                      configured
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {job?.screeningQuestions && job.screeningQuestions.length > 0 ? (
                <ul className="space-y-6">
                  {job.screeningQuestions.map(
                    (question: ScreeningQuestion, index: number) => (
                      <li
                        key={question._id}
                        className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-100 hover:border-indigo-200 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-sm font-bold text-white">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            {editingQuestion &&
                            editingQuestion._id === question._id ? (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Question Text
                                  </label>
                                  <div className="relative">
                                    <textarea
                                      rows={4}
                                      value={editingQuestion.question}
                                      onChange={(e) =>
                                        setEditingQuestion({
                                          ...editingQuestion,
                                          question: e.target.value,
                                        })
                                      }
                                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 resize-none text-gray-700 placeholder-gray-400"
                                      placeholder="Enter your screening question here..."
                                    />
                                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                                      {editingQuestion.question.length}/500
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => saveQuestion(question._id)}
                                    disabled={isUpdating}
                                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>
                                      {isUpdating
                                        ? "Saving..."
                                        : "Save Changes"}
                                    </span>
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="px-6 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 flex items-center space-x-2 font-medium"
                                  >
                                    <X className="w-4 h-4" />
                                    <span>Cancel</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-gray-900 leading-relaxed">
                                  {question.question}
                                </h4>

                                {/* Display options for MCQ and MULTI_SELECT questions */}
                                {(question.questionType === "MCQ" ||
                                  question.questionType === "MULTI_SELECT") &&
                                  question.options &&
                                  question.options.length > 0 && (
                                    <div className="mb-4">
                                      <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                                          <span>📋</span>
                                          <span>Answer Options:</span>
                                        </p>
                                        <div className="grid gap-2">
                                          {question.options.map(
                                            (
                                              option: string,
                                              optionIndex: number
                                            ) => (
                                              <div
                                                key={optionIndex}
                                                className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200"
                                              >
                                                <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                  <span className="text-xs font-bold text-white">
                                                    {optionIndex + 1}
                                                  </span>
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium">
                                                  {option}
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                                      {getQuestionTypeIcon(
                                        question.questionType
                                      )}
                                      <span className="ml-1">
                                        {getQuestionTypeLabel(
                                          question.questionType
                                        )}
                                      </span>
                                    </span>
                                    {question.required && (
                                      <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200">
                                        <span>⭐</span>
                                        <span>Required</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-3 ml-4">
                            <button
                              onClick={() => startEditing(question)}
                              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-sm"
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                showDeleteConfirmation(question._id)
                              }
                              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-sm"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <div className="text-center py-16">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No screening questions yet
                  </h3>
                  <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                    Add your first screening question to start evaluating
                    candidates effectively.
                  </p>
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full border border-indigo-200">
                    <span className="text-sm font-medium text-indigo-600">
                      💡 Tip: Start with basic qualification questions
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteConfirmation && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                    Delete Question
                  </h3>
                  <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this screening question?
                      This action cannot be undone.
                    </p>
                  </div>
                  <div className="items-center px-4 py-3">
                    <button
                      onClick={confirmDelete}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      onClick={cancelDelete}
                      className="mt-3 px-4 py-2 bg-white text-gray-500 text-base font-medium rounded-md w-full shadow-sm border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
