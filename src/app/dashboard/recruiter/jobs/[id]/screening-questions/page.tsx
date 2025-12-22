"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useGetJobByIdQuery } from "../../../../../store/services/jobsApi";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { Loader2, ArrowLeft, FileCheck, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ScreeningQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const fromTab = searchParams.get('from') || 'live';

  // const { user } = useSelector((state: RootState) => state.auth);
  const { data: job, isLoading } = useGetJobByIdQuery(id);

  // State for storing answers to screening questions
  const [screeningAnswers, setScreeningAnswers] = useState<{
    [key: string]: string;
  }>({});

  // State for storing candidate form data from previous page
  const [candidateFormData, setCandidateFormData] = useState<any>(null);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState<boolean>(false);

  // Load candidate form data from sessionStorage if it exists
  useEffect(() => {
    const fetchData = () => {
      const savedFormData = sessionStorage.getItem("candidateFormData");
      if (savedFormData) {
        setCandidateFormData(JSON.parse(savedFormData));
        setIsViewOnlyMode(false);
      } else {
        // If no form data exists, enable view-only mode
        setIsViewOnlyMode(true);
      }

      // Load any previously saved screening answers
      const savedAnswers = sessionStorage.getItem("screeningAnswers");
      if (savedAnswers) {
        setScreeningAnswers(JSON.parse(savedAnswers));
      }
    };
    fetchData();
  }, [params.id, router]);

  // Handle answer change
  const handleAnswerChange = (questionId: string, value: string) => {
    setScreeningAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isViewOnlyMode) {
      // In view-only mode, just navigate back without saving
      router.push(`/dashboard/recruiter/jobs/${params.id}?from=${fromTab}`);
      return;
    }

    // Store screening answers in sessionStorage
    sessionStorage.setItem(
      "screeningAnswers",
      JSON.stringify(screeningAnswers)
    );

    // Navigate back to the job details page
    toast.success("Screening questions saved");
    router.push(`/dashboard/recruiter/jobs/${params.id}?from=${fromTab}`);
  };

  return (
    <ProtectedLayout allowedRoles={["RECRUITER"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <button
                onClick={() =>
                  router.push(`/dashboard/recruiter/jobs/${params.id}?from=${fromTab}`)
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
            ) : job &&
              job.screeningQuestions &&
              job.screeningQuestions.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Screening Questions
                    {isViewOnlyMode && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        View Only
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isViewOnlyMode
                      ? "These are the screening questions that candidates will need to answer when applying for this job."
                      : `Please answer all the screening questions below for ${
                          candidateFormData?.candidateName || "the candidate"
                        }`}
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {(
                      job.screeningQuestions as unknown as {
                        _id: string;
                        question: string;
                        questionType?: string;
                        options?: string[];
                      }[]
                    ).map((question, index) => (
                      <div key={String(question._id)} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {index + 1}. {question.question}
                          {question.questionType &&
                            question.questionType !== "TEXT" && (
                              <span className="ml-2 text-xs text-gray-500 font-normal">
                                (
                                {question.questionType === "MCQ"
                                  ? "Multiple Choice"
                                  : question.questionType === "YES_NO"
                                  ? "Yes/No"
                                  : question.questionType === "NUMERIC"
                                  ? "Numeric"
                                  : question.questionType === "MULTI_SELECT"
                                  ? "Multi Select"
                                  : question.questionType}
                                )
                              </span>
                            )}
                        </label>

                        {isViewOnlyMode ? (
                          <div className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-sm text-gray-600">
                            {question.questionType === "MCQ" ||
                            question.questionType === "MULTI_SELECT" ? (
                              question.options &&
                              question.options.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="text-gray-500 text-xs mb-2">
                                    Available options:
                                  </div>
                                  {question.options.map((option, optIndex) => (
                                    <div
                                      key={optIndex}
                                      className="text-gray-700"
                                    >
                                      • {option}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="italic">
                                  Options will be configured by admin
                                </span>
                              )
                            ) : question.questionType === "YES_NO" ? (
                              <span className="italic">
                                Candidates will select Yes or No
                              </span>
                            ) : question.questionType === "NUMERIC" ? (
                              <span className="italic">
                                Candidates will enter a numeric value
                              </span>
                            ) : (
                              <span className="italic">
                                Candidates will provide a text response
                              </span>
                            )}
                          </div>
                        ) : (
                          <textarea
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={screeningAnswers[question._id] || ""}
                            onChange={(e) =>
                              handleAnswerChange(question._id, e.target.value)
                            }
                            required
                          />
                        )}
                      </div>
                    ))}

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() =>
                      router.push(`/dashboard/recruiter/jobs/${params.id}?from=${fromTab}`)
                    }
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {isViewOnlyMode ? "Back to Job Details" : "Cancel"}
                      </button>

                      {!isViewOnlyMode && (
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <FileCheck className="mr-2 h-4 w-4" />
                          Save Answers & Continue
                        </button>
                      )}

                      {isViewOnlyMode && (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/recruiter/jobs/${params.id}`
                            )
                          }
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Close Preview
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="ml-2 text-lg text-gray-700">
                  No screening questions found
                </p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
