'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import ProtectedLayout from '@/app/components/layout/ProtectedLayout';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';

import { RootState } from '../../../../../store/index';
import { useGetJobByIdQuery, useAddScreeningQuestionMutation, useUpdateScreeningQuestionMutation, useDeleteScreeningQuestionMutation } from '../../../../../store/services/jobsApi';
import { UserRole } from '@/app/constants/userRoles';

interface ScreeningQuestion {
  _id: string;
  question: string;
  questionType: string;
  required: boolean;
}

export default function AdminJobQuestionsPage() {
  const router = useRouter();
        const params = useParams();
        const id = params?.id as string;
        
        const { user } = useSelector((state: RootState) => state.auth);

  const { data: job, isLoading: isJobLoading, error: jobError } = useGetJobByIdQuery(id);
  const [addScreeningQuestion] = useAddScreeningQuestionMutation();
  const [updateScreeningQuestion] = useUpdateScreeningQuestionMutation();
  const [deleteScreeningQuestion] = useDeleteScreeningQuestionMutation();

  const [newQuestion, setNewQuestion] = useState({
    question: '',
    questionType: 'TEXT',
    required: false,
  });

  // State for managing the currently editing question
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState({
    question: '',
    questionType: '',
    required: false,
  });

  // State for delete confirmation
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.INTERNAL) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  // Handle new question form submission
  const handleAddQuestion = () => {
    if (!newQuestion.question.trim()) {
      alert('Please enter a question');
      return;
    }
    
    try {
      addScreeningQuestion({
          jobId: id,
          question: newQuestion.question,
          questionType: newQuestion.questionType,
          required: newQuestion.required
      }).unwrap();
      setNewQuestion({ question: '', questionType: 'TEXT', required: false });
    } catch (error) {
      console.error('Failed to add screening question:', error);
      alert('Failed to add question. Please try again.');
    }
  };

  // Start editing a question
  const startEditing = (question: ScreeningQuestion) => {
    setEditingQuestionId(question._id);
    setEditingQuestion({
      question: question.question,
      questionType: question.questionType,
      required: question.required
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingQuestionId(null);
  };

  // Save edited question
  const saveQuestion = (questionId: string) => {
    if (!editingQuestion.question.trim()) {
      alert('Question text cannot be empty');
      return;
    }
    
    try {
      updateScreeningQuestion({
        jobId: id,
        questionId,
        question: editingQuestion.question,
        questionType: editingQuestion.questionType,
        required: editingQuestion.required
      }).unwrap();
      setEditingQuestionId(null);
    } catch (error) {
      console.error('Failed to update screening question:', error);
      alert('Failed to update question. Please try again.');
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
  const confirmDelete = (questionId: string) => {
    try {
      deleteScreeningQuestion({
        jobId: id,
        questionId
      }).unwrap();
      setDeleteConfirmationId(null);
    } catch (error) {
      console.error('Failed to delete screening question:', error);
      alert('Failed to delete question. Please try again.');
    }
  };

  if (isJobLoading) {
    return (
      <ProtectedLayout allowedRoles={['ADMIN', 'INTERNAL']}>
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
      <ProtectedLayout allowedRoles={['ADMIN', 'INTERNAL']}>
        <DashboardLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-600">Error loading job details</h3>
              <p className="mt-2 text-sm text-gray-500">
                The job you're looking for could not be found or you don't have permission to view it.
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
    <ProtectedLayout allowedRoles={['ADMIN', 'INTERNAL']}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Manage Screening Questions for {job?.title}</h1>

            {/* Add New Question Form */}
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Question</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                    Question
                  </label>
                  <input
                    type="text"
                    id="question"
                    name="question"
                    required
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="questionType" className="block text-sm font-medium text-gray-700">
                    Question Type
                  </label>
                  <select
                    id="questionType"
                    name="questionType"
                    value={newQuestion.questionType}
                    onChange={(e) => setNewQuestion({ ...newQuestion, questionType: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="TEXT">Text</option>
                    <option value="NUMERIC">Numeric</option>
                    <option value="YES_NO">Yes/No</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    id="required"
                    type="checkbox"
                    checked={newQuestion.required}
                    onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="required" className="ml-2 block text-sm font-medium text-gray-700">
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
                <h3 className="text-lg font-medium text-gray-900">Screening Questions</h3>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {(job?.screeningQuestions as unknown as ScreeningQuestion[])?.map((question: ScreeningQuestion) => (
                    <li key={question._id} className="px-4 py-4">
                      {editingQuestionId === question._id ? (
                        // Edit mode
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label htmlFor={`edit-question-${question._id}`} className="block text-sm font-medium text-gray-700">
                              Question
                            </label>
                            <input
                              type="text"
                              id={`edit-question-${question._id}`}
                              value={editingQuestion.question}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label htmlFor={`edit-type-${question._id}`} className="block text-sm font-medium text-gray-700">
                              Question Type
                            </label>
                            <select
                              id={`edit-type-${question._id}`}
                              value={editingQuestion.questionType}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, questionType: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                              <option value="TEXT">Text</option>
                              <option value="NUMERIC">Numeric</option>
                              <option value="YES_NO">Yes/No</option>
                            </select>
                          </div>
                          <div className="flex items-center">
                            <input
                              id={`edit-required-${question._id}`}
                              type="checkbox"
                              checked={editingQuestion.required}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, required: e.target.checked })}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor={`edit-required-${question._id}`} className="ml-2 block text-sm font-medium text-gray-700">
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
                          <p className="text-sm font-medium text-red-800">Are you sure you want to delete this question?</p>
                          <p className="mt-1 text-sm text-red-700">{question.question}</p>
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
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{question.question}</p>
                            <div className="flex mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                {question.questionType}
                              </span>
                              {question.required && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditing(question)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => showDeleteConfirmation(question._id)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                  {(!job?.screeningQuestions || job.screeningQuestions.length === 0) && (
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