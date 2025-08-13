"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  Plus,
  X,
  CheckCircle2,
  Type,
  Hash,
  ToggleLeft,
  CheckSquare,
  Edit3,
  Trash2,
  AlertCircle,
} from "lucide-react";

import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

import { RootState } from "../../../../../store/index";
import {
  useGetJobByIdQuery,
  useAddScreeningQuestionMutation,
  useUpdateScreeningQuestionMutation,
  useDeleteScreeningQuestionMutation,
} from "../../../../../store/services/jobsApi";
import { UserRole } from "@/app/constants/userRoles";
import {
  QuestionType,
  ScreeningQuestionInterface,
} from "@/app/types/ScreeningQuestionTypes";

interface ScreeningQuestion extends ScreeningQuestionInterface {}

export default function AdminJobQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { user } = useSelector((state: RootState) => state.auth);

  const {
    data: job,
    isLoading: isJobLoading,
    error: jobError,
  } = useGetJobByIdQuery(id);
  const [addScreeningQuestion] = useAddScreeningQuestionMutation();
  const [updateScreeningQuestion] = useUpdateScreeningQuestionMutation();
  const [deleteScreeningQuestion] = useDeleteScreeningQuestionMutation();

  const [newQuestion, setNewQuestion] = useState({
    question: "",
    questionType: "TEXT" as QuestionType,
    required: false,
    options: [""] as string[],
  });

  // State for managing the currently editing question
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [editingQuestion, setEditingQuestion] = useState({
    question: "",
    questionType: "",
    required: false,
    options: [""] as string[],
  });

  // State for delete confirmation
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);

  // Helper functions for question type display
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "TEXT":
        return <Type className="h-4 w-4" />;
      case "NUMERIC":
        return <Hash className="h-4 w-4" />;
      case "YES_NO":
        return <ToggleLeft className="h-4 w-4" />;
      case "MCQ":
        return <CheckCircle2 className="h-4 w-4" />;
      case "MULTI_SELECT":
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case "TEXT":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "NUMERIC":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "YES_NO":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "MCQ":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "MULTI_SELECT":
        return "bg-pink-50 text-pink-700 border-pink-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatQuestionType = (type: string) => {
    switch (type) {
      case "TEXT":
        return "Text Response";
      case "NUMERIC":
        return "Number";
      case "YES_NO":
        return "Yes/No";
      case "MCQ":
        return "Multiple Choice";
      case "MULTI_SELECT":
        return "Multi-Select";
      default:
        return type;
    }
  };

  // Helper function to check if question type requires options
  const requiresOptions = (questionType: QuestionType) => {
    return ["MCQ", "MULTI_SELECT"].includes(questionType);
  };

  // Functions for managing options
  const addOption = () => {
    setNewQuestion({ ...newQuestion, options: [...newQuestion.options, ""] });
  };

  const removeOption = (index: number) => {
    if (newQuestion.options.length > 1) {
      const newOptions = newQuestion.options.filter((_, i) => i !== index);
      setNewQuestion({ ...newQuestion, options: newOptions });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  // Handle question type change
  const handleQuestionTypeChange = (questionType: QuestionType) => {
    setNewQuestion({
      ...newQuestion,
      questionType,
      options: requiresOptions(questionType) ? ["", ""] : [""],
    });
  };

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    if (
      user &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.INTERNAL
    ) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  // Handle new question form submission
  const handleAddQuestion = async () => {
    if (!newQuestion.question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    // Validate options for MCQ and MULTI_SELECT
    if (requiresOptions(newQuestion.questionType)) {
      const validOptions = newQuestion.options.filter(
        (opt) => opt.trim() !== ""
      );
      if (validOptions.length < 2) {
        toast.error(
          "MCQ and Multi-select questions must have at least 2 options"
        );
        return;
      }
    }

    try {
      await addScreeningQuestion({
        jobId: id,
        question: newQuestion.question,
        questionType: newQuestion.questionType,
        required: newQuestion.required,
        ...(requiresOptions(newQuestion.questionType) && {
          options: newQuestion.options.filter((opt) => opt.trim() !== ""),
        }),
      }).unwrap();

      setNewQuestion({
        question: "",
        questionType: QuestionType.TEXT,
        required: false,
        options: [""],
      });
      toast.success("Question added successfully!");
    } catch (error) {
      console.error("Failed to add screening question:", error);
      toast.error("Failed to add question. Please try again.");
    }
  };

  // Start editing a question
  const startEditing = (question: ScreeningQuestion) => {
    setEditingQuestionId(question._id);
    setEditingQuestion({
      question: question.question,
      questionType: question.questionType,
      required: question.required,
      options: question.options || [""],
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingQuestionId(null);
  };

  // Save edited question
  const saveQuestion = async (questionId: string) => {
    if (!editingQuestion.question.trim()) {
      toast.error("Question text cannot be empty");
      return;
    }

    // Validate options for MCQ and MULTI_SELECT
    if (requiresOptions(editingQuestion.questionType as QuestionType)) {
      const validOptions = editingQuestion.options.filter(
        (opt) => opt.trim() !== ""
      );
      if (validOptions.length < 2) {
        toast.error(
          "MCQ and Multi-select questions must have at least 2 options"
        );
        return;
      }
    }

    try {
      await updateScreeningQuestion({
        jobId: id,
        questionId,
        question: editingQuestion.question,
        questionType: editingQuestion.questionType,
        required: editingQuestion.required,
        ...(requiresOptions(editingQuestion.questionType as QuestionType) && {
          options: editingQuestion.options.filter((opt) => opt.trim() !== ""),
        }),
      }).unwrap();
      setEditingQuestionId(null);
      toast.success("Question updated successfully!");
    } catch (error) {
      console.error("Failed to update screening question:", error);
      toast.error("Failed to update question. Please try again.");
    }
  };

  // Handle showing delete confirmation
  const showDeleteConfirmation = (questionId: string) => {
    setDeleteConfirmationId(questionId);
  };

  // Cancel delete confirmation
  const cancelDelete = () => {
    setDeleteConfirmationId(null);
  };

  // Confirm and perform delete
  const confirmDelete = async (questionId: string) => {
    try {
      await deleteScreeningQuestion({
        jobId: id,
        questionId,
      }).unwrap();
      setDeleteConfirmationId(null);
      toast.success("Question deleted successfully!");
    } catch (error) {
      console.error("Failed to delete screening question:", error);
      toast.error("Failed to delete question. Please try again.");
    }
  };

  if (isJobLoading) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-80">
            <LoadingSpinner />
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  if (jobError) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
        <DashboardLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-600">
                Error loading job details
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                The job you're looking for could not be found or you don't have
                permission to view it.
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard/admin/jobs"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Back to jobs list
                </Link>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["ADMIN", "INTERNAL"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Manage Screening Questions for {job?.title}
            </h1>

            {/* Add New Question Form */}
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New Question
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label
                    htmlFor="question"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Question
                  </label>
                  <input
                    type="text"
                    id="question"
                    name="question"
                    required
                    value={newQuestion.question}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        question: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="questionType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Question Type
                  </label>
                  <select
                    id="questionType"
                    name="questionType"
                    value={newQuestion.questionType}
                    onChange={(e) =>
                      handleQuestionTypeChange(e.target.value as QuestionType)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="TEXT">📝 Text Response</option>
                    <option value="NUMERIC">🔢 Number</option>
                    <option value="YES_NO">✅ Yes/No</option>
                    <option value="MCQ">
                      🔘 Multiple Choice (Single Select)
                    </option>
                    <option value="MULTI_SELECT">
                      ☑️ Multi-Select (Multiple Options)
                    </option>
                  </select>
                </div>

                {/* Options Management for MCQ and Multi-select */}
                {requiresOptions(newQuestion.questionType) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer Options
                    </label>
                    <div className="space-y-3">
                      {newQuestion.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3"
                        >
                          <div className="flex-1">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) =>
                                updateOption(index, e.target.value)
                              }
                              placeholder={`Option ${index + 1}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          {newQuestion.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption()}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    id="required"
                    type="checkbox"
                    checked={newQuestion.required}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        required: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="required"
                    className="ml-2 block text-sm font-medium text-gray-700"
                  >
                    Required
                  </label>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Question
                  </button>
                </div>
              </div>
            </div>

            {/* List of Questions */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Screening Questions
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {(
                    job?.screeningQuestions as unknown as ScreeningQuestion[]
                  )?.map((question: ScreeningQuestion) => (
                    <li key={question._id} className="px-4 py-4">
                      {editingQuestionId === question._id ? (
                        // Edit mode
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label
                              htmlFor={`edit-question-${question._id}`}
                              className="block text-sm font-medium text-gray-700"
                            >
                              Question
                            </label>
                            <input
                              type="text"
                              id={`edit-question-${question._id}`}
                              value={editingQuestion.question}
                              onChange={(e) =>
                                setEditingQuestion({
                                  ...editingQuestion,
                                  question: e.target.value,
                                })
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`edit-type-${question._id}`}
                              className="block text-sm font-medium text-gray-700"
                            >
                              Question Type
                            </label>
                            <select
                              id={`edit-type-${question._id}`}
                              value={editingQuestion.questionType}
                              onChange={(e) =>
                                setEditingQuestion({
                                  ...editingQuestion,
                                  questionType: e.target.value,
                                })
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                              <option value="TEXT">📝 Text Response</option>
                              <option value="NUMERIC">🔢 Number</option>
                              <option value="YES_NO">✅ Yes/No</option>
                              <option value="MCQ">
                                🔘 Multiple Choice (Single Select)
                              </option>
                              <option value="MULTI_SELECT">
                                ☑️ Multi-Select (Multiple Options)
                              </option>
                            </select>
                          </div>
                          <div className="flex items-center">
                            <input
                              id={`edit-required-${question._id}`}
                              type="checkbox"
                              checked={editingQuestion.required}
                              onChange={(e) =>
                                setEditingQuestion({
                                  ...editingQuestion,
                                  required: e.target.checked,
                                })
                              }
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label
                              htmlFor={`edit-required-${question._id}`}
                              className="ml-2 block text-sm font-medium text-gray-700"
                            >
                              Required
                            </label>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveQuestion(question._id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : deleteConfirmationId === question._id ? (
                        // Delete confirmation
                        <div className="bg-red-50 p-4 rounded-md">
                          <p className="text-sm font-medium text-red-800">
                            Are you sure you want to delete this question?
                          </p>
                          <p className="mt-1 text-sm text-red-700">
                            {question.question}
                          </p>
                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() => confirmDelete(question._id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Yes, delete
                            </button>
                            <button
                              onClick={cancelDelete}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              {question.question}
                            </p>

                            {/* Display options for MCQ and MULTI_SELECT questions */}
                            {requiresOptions(
                              question.questionType as QuestionType
                            ) &&
                              question.options && (
                                <div className="mb-3 pl-4 border-l-2 border-gray-200">
                                  <p className="text-xs font-medium text-gray-500 mb-2">
                                    Answer Options:
                                  </p>
                                  <ul className="space-y-1">
                                    {question.options.map(
                                      (option: string, optionIndex: number) => (
                                        <li
                                          key={optionIndex}
                                          className="text-sm text-gray-600 flex items-center"
                                        >
                                          <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 mr-2 flex-shrink-0">
                                            {optionIndex + 1}
                                          </span>
                                          {option}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}

                            <div className="flex items-center space-x-3">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getQuestionTypeColor(
                                  question.questionType
                                )}`}
                              >
                                {getQuestionTypeIcon(question.questionType)}
                                <span className="ml-1">
                                  {formatQuestionType(question.questionType)}
                                </span>
                              </span>
                              {question.required && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => startEditing(question)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                              <Edit3 className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                showDeleteConfirmation(question._id)
                              }
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                  {(!job?.screeningQuestions ||
                    job.screeningQuestions.length === 0) && (
                    <li className="px-4 py-4 text-sm text-gray-500">
                      No screening questions added yet.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
