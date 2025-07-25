"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetJobByIdQuery,
  useAddScreeningQuestionMutation,
  useUpdateScreeningQuestionMutation,
  useDeleteScreeningQuestionMutation,
} from "../../../../../store/services/jobsApi";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Plus, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Type, 
  Hash, 
  ToggleLeft,
  CheckCircle2 
} from "lucide-react";
import { toast } from "react-hot-toast";
import { QuestionType } from "./../../../../../types/ScreeningQuestionTypes";
import { ObjectId } from "mongoose";

interface ScreeningQuestion {
  _id: ObjectId | string;
  question: string;
  questionType: string;
  required: boolean;
}

export default function JobQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { data: job, isLoading, refetch } = useGetJobByIdQuery(id);
  const [addQuestion, { isLoading: isAdding }] =
    useAddScreeningQuestionMutation();
  const [updateScreeningQuestion, { isLoading: isUpdating }] = useUpdateScreeningQuestionMutation();
  const [deleteScreeningQuestion, { isLoading: isDeleting }] = useDeleteScreeningQuestionMutation();

  // Form state
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    questionType: "TEXT" as QuestionType,
    required: true,
  });

  // State for managing the currently editing question
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState({
    question: "",
    questionType: "",
    required: false,
  });

  // State for delete confirmation
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Helper functions for question type display
  const getQuestionTypeIcon = (type: string) => {
    switch(type) {
      case 'TEXT': return <Type className="h-4 w-4" />;
      case 'NUMERIC': return <Hash className="h-4 w-4" />;
      case 'YES_NO': return <ToggleLeft className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch(type) {
      case 'TEXT': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'NUMERIC': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'YES_NO': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatQuestionType = (type: string) => {
    switch(type) {
      case 'TEXT': return 'Text Response';
      case 'NUMERIC': return 'Number';
      case 'YES_NO': return 'Yes/No';
      default: return type;
    }
  };

  // Handle new question form submission
  const handleAddQuestion = async () => {
    if (!newQuestion.question.trim()) {
      toast.error('Please enter a question');
      return;
    }
    
    try {
      await addQuestion({
        jobId: id,
        question: newQuestion.question,
        questionType: newQuestion.questionType,
        required: newQuestion.required
      }).unwrap();
      
      toast.success("Question added successfully");
      setNewQuestion({ question: '', questionType: 'TEXT' as QuestionType, required: true });
      refetch();
    } catch (error) {
      console.error('Failed to add screening question:', error);
      toast.error('Failed to add question. Please try again.');
    }
  };

  // Start editing a question
  const startEditing = (question: ScreeningQuestion) => {
    setEditingQuestionId(question._id?.toString() || "");
    setEditingQuestion({
      question: question.question,
      questionType: question.questionType,
      required: question.required,
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

    try {
      await updateScreeningQuestion({
        jobId: id,
        questionId,
        question: editingQuestion.question,
        questionType: editingQuestion.questionType,
        required: editingQuestion.required,
      }).unwrap();
      setEditingQuestionId(null);
      toast.success("Question updated successfully");
      refetch();
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
      toast.success("Question deleted successfully");
      refetch();
    } catch (error) {
      console.error("Failed to delete screening question:", error);
      toast.error("Failed to delete question. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <ProtectedLayout allowedRoles={["COMPANY"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  if (!job) {
    return (
      <ProtectedLayout allowedRoles={["COMPANY"]}>
        <DashboardLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-600">Error loading job details</h3>
              <p className="mt-2 text-sm text-gray-500">
                The job you're looking for could not be found or you don't have permission to view it.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => router.push("/dashboard/company/jobs")}
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Back to jobs list
                </button>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["COMPANY"]}>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={() => router.push(`/dashboard/company/jobs/${id}`)}
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Job Details
              </button>
            </div>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Screening Questions</h1>
                  <p className="text-gray-600">{job?.title}</p>
                </div>
              </div>
            </div>

            {/* Add New Question Form */}
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <Plus className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">Add New Question</h3>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="question" className="block text-sm font-semibold text-gray-700 mb-2">
                    Question Text
                  </label>
                  <div className="relative">
                    <textarea
                      id="question"
                      name="question"
                      rows={4}
                      required
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                      placeholder="Enter your screening question here... (e.g., What is your experience with React and modern JavaScript frameworks?)"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 resize-none text-gray-700 placeholder-gray-400"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {newQuestion.question.length}/500
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="questionType" className="block text-sm font-semibold text-gray-700 mb-2">
                      Response Type
                    </label>
                    <div className="relative">
                      <select
                        id="questionType"
                        name="questionType"
                        value={newQuestion.questionType}
                        onChange={(e) => setNewQuestion({ ...newQuestion, questionType: e.target.value as QuestionType })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 bg-white text-gray-700 appearance-none"
                      >
                        <option value="TEXT">📝 Text Response</option>
                        <option value="NUMERIC">🔢 Number</option>
                        <option value="YES_NO">✅ Yes/No</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          id="required"
                          type="checkbox"
                          checked={newQuestion.required}
                          onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                          newQuestion.required 
                            ? 'bg-indigo-500 border-indigo-500' 
                            : 'border-gray-300 group-hover:border-indigo-300'
                        }`}>
                          {newQuestion.required && (
                            <CheckCircle2 className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                        Required Question
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    disabled={isAdding || !newQuestion.question.trim()}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isAdding ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding Question...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* List of Questions */}
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Current Questions</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {job?.screeningQuestions?.length || 0} question{(job?.screeningQuestions?.length || 0) !== 1 ? 's' : ''} configured
                </p>
              </div>
              
              <div className="divide-y divide-gray-100">
                {(job?.screeningQuestions as unknown as ScreeningQuestion[])?.map((question: ScreeningQuestion, index: number) => {
                  const questionId = question._id?.toString() || "";
                  return (
                    <div key={questionId || index} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                      {editingQuestionId === questionId ? (
                        // Edit mode
                        <div className="space-y-4">
                          <div>
                            <label htmlFor={`edit-question-${questionId}`} className="block text-sm font-semibold text-gray-700 mb-2">
                              Question Text
                            </label>
                            <textarea
                              id={`edit-question-${questionId}`}
                              rows={3}
                              value={editingQuestion.question}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 resize-none"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor={`edit-type-${questionId}`} className="block text-sm font-semibold text-gray-700 mb-2">
                                Response Type
                              </label>
                              <select
                                id={`edit-type-${questionId}`}
                                value={editingQuestion.questionType}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, questionType: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                              >
                                <option value="TEXT">📝 Text Response</option>
                                <option value="NUMERIC">🔢 Number</option>
                                <option value="YES_NO">✅ Yes/No</option>
                              </select>
                            </div>
                            
                            <div className="flex items-center">
                              <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  id={`edit-required-${questionId}`}
                                  type="checkbox"
                                  checked={editingQuestion.required}
                                  onChange={(e) => setEditingQuestion({ ...editingQuestion, required: e.target.checked })}
                                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Required</span>
                              </label>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3 pt-4">
                            <button
                              onClick={() => saveQuestion(questionId)}
                              disabled={isUpdating}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {isUpdating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : deleteConfirmationId === questionId ? (
                        // Delete confirmation
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                          <div className="flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-red-800">Confirm Deletion</p>
                              <p className="mt-1 text-sm text-red-700">"{question.question}"</p>
                              <div className="mt-4 flex space-x-3">
                                <button
                                  onClick={() => confirmDelete(questionId)}
                                  disabled={isDeleting}
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                                <button
                                  onClick={cancelDelete}
                                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 leading-relaxed mb-3">
                                {question.question}
                              </p>
                              <div className="flex items-center space-x-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getQuestionTypeColor(question.questionType)}`}>
                                  {getQuestionTypeIcon(question.questionType)}
                                  <span className="ml-1">{formatQuestionType(question.questionType)}</span>
                                </span>
                                {question.required && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Required
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => startEditing(question)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                              <Edit3 className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => showDeleteConfirmation(questionId)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {(!job?.screeningQuestions || job.screeningQuestions.length === 0) && (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      Add screening questions to help filter and evaluate candidates during the application process.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}