"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

import { RootState } from "../../../../../store/index";
import {
  useGetJobByIdQuery,
  useUpdateJobMutation,
} from "../../../../../store/services/jobsApi";

import { UserRole } from "@/app/constants/userRoles";
import { JobType } from "@/app/constants/jobType";
import { JobStatus } from "@/app/constants/jobStatus";

// Commission configuration
const COMMISSION_CONFIG = {
  DEFAULT_REDUCTION_PERCENTAGE: 40,
  MIN_REDUCTION_PERCENTAGE: 0,
  MAX_REDUCTION_PERCENTAGE: 80,
  MIN_COMMISSION_PERCENTAGE: 1,
  MAX_COMMISSION_PERCENTAGE: 50,
};

export default function InternalJobEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { user } = useSelector((state: RootState) => state.auth);

  const {
    data: job,
    isLoading: isJobLoading,
    error: jobError,
  } = useGetJobByIdQuery(id);
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation();

  // Form state
  const [formData, setFormData] = useState<any>({
    title: "",
    companyName: "",
    country: "",
    location: "",
    jobType: JobType.FULL_TIME,
    positions: 1,
    salary: {
      min: 0,
      max: 0,
      currency: "USD",
    },
    experienceLevel: {
      min: 0,
      max: 0,
    },
    // Enhanced commission structure
    commission: {
      originalPercentage: 0,
      recruiterPercentage: 0,
      platformFeePercentage: 0,
      reductionPercentage: COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE,
      originalAmount: 0,
      recruiterAmount: 0,
    },
    // Legacy fields for backward compatibility
    commissionPercentage: 0,
    commissionAmount: 0,
    description: "",
    companyDescription: "",
    sourcingGuidelines: "",
    paymentTerms: "",
    replacementTerms: "",
    status: JobStatus.DRAFT,
  });

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

  // Commission calculation functions
  const calculateRecruiterCommission = (
    originalCommission: number,
    reductionPercentage: number = COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE
  ): number => {
    if (originalCommission <= 0) return 0;

    // Calculate what recruiter gets: original * (100 - reduction) / 100
    // If reduction is 40%, recruiter gets 60% of original
    const recruiterPercentage =
      (originalCommission * (100 - reductionPercentage)) / 100;

    // Ensure minimum commission
    return Math.max(
      recruiterPercentage,
      COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE
    );
  };

  const calculateCommissionAmount = (
    salary: number,
    percentage: number
  ): number => {
    return (salary * percentage) / 100;
  };

  // Populate form when job data is loaded
  useEffect(() => {
    if (job) {
      // Handle both old and new commission structure
      const originalPercentage =
        job.commission?.originalPercentage || job.commissionPercentage || 0;
      const reductionPercentage =
        job.commission?.reductionPercentage ||
        COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE;

      const recruiterPercentage = calculateRecruiterCommission(
        originalPercentage,
        reductionPercentage
      );
      const platformFeePercentage = Math.max(
        0,
        originalPercentage - recruiterPercentage
      );

      // In your useEffect where you populate form data:
      const commissionData = {
        type:
          job.commission?.type ||
          (job.commissionPercentage > 0 ? "percentage" : "fixed"),
        originalPercentage,
        recruiterPercentage,
        platformFeePercentage,
        reductionPercentage,
        originalAmount:
          job.commission?.originalAmount || job.commissionAmount || 0,
        recruiterAmount: job.commission?.recruiterAmount || 0,
        fixedAmount:
          job.commission?.fixedAmount ||
          (job.commissionPercentage === 0 ? job.commissionAmount : 0),
      };

      setFormData({
        title: job.title,
        companyName: job.companyName || "",
        country: job.country,
        location: job.location,
        jobType: job.jobType,
        positions: job.positions,
        salary: job.salary,
        experienceLevel: job.experienceLevel,
        commission: commissionData,
        commissionPercentage: commissionData.originalPercentage,
        commissionAmount: commissionData.originalAmount,
        description: job.description,
        companyDescription: job.companyDescription || "",
        sourcingGuidelines: job.sourcingGuidelines || "",
        paymentTerms: job.paymentTerms || "",
        replacementTerms: job.replacementTerms || "",
        status: job.status,
      });
    }
  }, [job]);

  // Recalculate commission amounts when salary changes
  useEffect(() => {
    if (formData.salary.max > 0) {
      const originalAmount = calculateCommissionAmount(
        formData.salary.max,
        formData.commission.originalPercentage
      );
      const recruiterAmount = calculateCommissionAmount(
        formData.salary.max,
        formData.commission.recruiterPercentage
      );

      setFormData((prev: any) => ({
        ...prev,
        commission: {
          ...prev.commission,
          originalAmount,
          recruiterAmount,
        },
        commissionAmount: originalAmount,
      }));
    }
  }, [
    formData.salary.max,
    formData.commission.originalPercentage,
    formData.commission.recruiterPercentage,
  ]);

  // Handle regular input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle nested objects
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev: { [x: string]: any }) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]:
            name === "salary.min" ||
            name === "salary.max" ||
            name === "experienceLevel.min" ||
            name === "experienceLevel.max"
              ? Number(value)
              : value,
        },
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [name]: name === "positions" ? Number(value) : value,
      }));
    }
  };

  // Handle commission percentage change (original commission set by company)
  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalPercentage = parseFloat(e.target.value) || 0;
    const recruiterPercentage = calculateRecruiterCommission(
      originalPercentage,
      formData.commission.reductionPercentage
    );
    const platformFeePercentage = Math.max(
      0,
      originalPercentage - recruiterPercentage
    );

    setFormData((prev: any) => ({
      ...prev,
      commission: {
        ...prev.commission,
        originalPercentage,
        recruiterPercentage,
        platformFeePercentage,
      },
      // Update legacy field for backward compatibility
      commissionPercentage: originalPercentage,
    }));
  };

  // Handle reduction percentage change (internal control)
  const handleReductionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reductionPercentage = Math.min(
      Math.max(
        parseFloat(e.target.value) ||
          COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE,
        COMMISSION_CONFIG.MIN_REDUCTION_PERCENTAGE
      ),
      COMMISSION_CONFIG.MAX_REDUCTION_PERCENTAGE
    );

    const recruiterPercentage = calculateRecruiterCommission(
      formData.commission.originalPercentage,
      reductionPercentage
    );
    const platformFeePercentage = Math.max(
      0,
      formData.commission.originalPercentage - recruiterPercentage
    );

    setFormData((prev: any) => ({
      ...prev,
      commission: {
        ...prev.commission,
        reductionPercentage,
        recruiterPercentage,
        platformFeePercentage,
      },
    }));
  };

  // Handle direct recruiter percentage change (alternative internal control)
  const handleRecruiterPercentageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const recruiterPercentage = Math.min(
      Math.max(
        parseFloat(e.target.value) || 0,
        COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE
      ),
      formData.commission.originalPercentage
    );

    // Calculate what reduction percentage this represents
    const originalPercentage = formData.commission.originalPercentage;
    let reductionPercentage = 0;

    if (originalPercentage > 0) {
      // If recruiter gets X% and original is Y%, then reduction = (Y - X) / Y * 100
      reductionPercentage =
        ((originalPercentage - recruiterPercentage) / originalPercentage) * 100;
    }

    const platformFeePercentage = Math.max(
      0,
      originalPercentage - recruiterPercentage
    );

    setFormData((prev: any) => ({
      ...prev,
      commission: {
        ...prev.commission,
        recruiterPercentage,
        reductionPercentage: Math.max(0, reductionPercentage),
        platformFeePercentage,
      },
    }));
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    try {
      updateJob({ id, job: formData }).unwrap();
      router.push(`/dashboard/internal/jobs/${id}`);
    } catch (error) {
      console.error("Failed to update job:", error);
      // TODO: Add error notification
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
                permission to edit it.
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard/internal/jobs"
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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Edit Job: {job?.title}
              </h1>
              <Link
                href={`/dashboard/internal/jobs/${id}`}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View Job Details
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Job Information */}
              <div className="bg-white shadow sm:rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Basic Job Information
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Job Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Company Name*
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      id="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Enter the company name for this job posting"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="jobType"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Job Type
                    </label>
                    <select
                      name="jobType"
                      id="jobType"
                      value={formData.jobType}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      {Object.values(JobType).map((type) => (
                        <option key={type} value={type}>
                          {type.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      id="country"
                      required
                      value={formData.country}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      id="location"
                      required
                      value={formData.location}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="positions"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Number of Positions
                    </label>
                    <input
                      type="number"
                      name="positions"
                      id="positions"
                      min="1"
                      required
                      value={formData.positions}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Job Status
                    </label>
                    <select
                      name="status"
                      id="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      {Object.values(JobStatus).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="companyDescription"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Company Description
                    </label>
                    <textarea
                      name="companyDescription"
                      id="companyDescription"
                      rows={4}
                      value={formData.companyDescription}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Salary & Experience */}
              <div className="bg-white shadow sm:rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Salary & Experience
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="salary.min"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Minimum Salary
                    </label>
                    <input
                      type="number"
                      name="salary.min"
                      id="salary.min"
                      min="0"
                      required
                      value={formData.salary.min}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="salary.max"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Maximum Salary
                    </label>
                    <input
                      type="number"
                      name="salary.max"
                      id="salary.max"
                      min="0"
                      required
                      value={formData.salary.max}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="experienceLevel.min"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Minimum Experience (Years)
                    </label>
                    <input
                      type="number"
                      name="experienceLevel.min"
                      id="experienceLevel.min"
                      min="0"
                      required
                      value={formData.experienceLevel.min}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="experienceLevel.max"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Maximum Experience (Years)
                    </label>
                    <input
                      type="number"
                      name="experienceLevel.max"
                      id="experienceLevel.max"
                      min="0"
                      required
                      value={formData.experienceLevel.max}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Commission Control Section */}
              <div className="bg-white shadow sm:rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Commission Management (Internal Control)
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Internal Commission Control
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          You have control over commission settings. Choose
                          between fixed amount or percentage-based commission.
                          For percentage-based, you can adjust how much
                          recruiters see based on platform fees.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Commission Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Commission Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="commissionType"
                        value="percentage"
                        checked={formData.commission.type !== "fixed"}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev: any) => ({
                              ...prev,
                              commission: {
                                ...prev.commission,
                                type: "percentage",
                              },
                            }));
                          }
                        }}
                        className="form-radio h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Percentage-based
                      </span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="commissionType"
                        value="fixed"
                        checked={formData.commission.type === "fixed"}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev: any) => ({
                              ...prev,
                              commission: {
                                ...prev.commission,
                                type: "fixed",
                                fixedAmount:
                                  prev.commission.originalAmount ||
                                  prev.commissionAmount ||
                                  0,
                              },
                            }));
                          }
                        }}
                        className="form-radio h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Fixed amount
                      </span>
                    </label>
                  </div>
                </div>

                {/* Fixed Commission Section */}
                {formData.commission.type === "fixed" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="fixedCommission"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Fixed Commission Amount ({formData.salary.currency})
                        </label>
                        <input
                          type="number"
                          id="fixedCommission"
                          value={formData.commission.fixedAmount || ""}
                          onChange={(e) => {
                            const fixedAmount = parseFloat(e.target.value) || 0;
                            setFormData((prev: any) => ({
                              ...prev,
                              commission: {
                                ...prev.commission,
                                fixedAmount,
                              },
                              // Update legacy field for backward compatibility
                              commissionAmount: fixedAmount,
                            }));
                          }}
                          min="0"
                          step="0.01"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Fixed amount paid regardless of salary
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Equivalent Percentage (Based on Max Salary)
                        </label>
                        <div className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                          {formData.salary.max > 0 &&
                          formData.commission.fixedAmount > 0
                            ? (
                                (formData.commission.fixedAmount /
                                  formData.salary.max) *
                                100
                              ).toFixed(2)
                            : "0.00"}
                          %
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Reference percentage for comparison
                        </p>
                      </div>
                    </div>

                    {/* Platform Fee Control for Fixed Commission */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="fixedReductionPercentage"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Platform Fee Reduction % (Internal Control)
                        </label>
                        <input
                          type="number"
                          id="fixedReductionPercentage"
                          value={formData.commission.reductionPercentage || ""}
                          onChange={handleReductionChange}
                          step="1"
                          placeholder="40"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-orange-50"
                        />
                        <p className="mt-1 text-sm text-orange-600">
                          Percentage to reduce from fixed commission (default:{" "}
                          {COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE}%,
                          range: {COMMISSION_CONFIG.MIN_REDUCTION_PERCENTAGE}%-
                          {COMMISSION_CONFIG.MAX_REDUCTION_PERCENTAGE}%)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Recruiter Amount ({formData.salary.currency})
                        </label>
                        <div className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                          {formData.commission.fixedAmount > 0 &&
                          formData.commission.reductionPercentage !== undefined
                            ? (
                                (formData.commission.fixedAmount *
                                  (100 -
                                    formData.commission.reductionPercentage)) /
                                100
                              ).toLocaleString()
                            : "0"}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Amount recruiters will receive after platform fee
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Percentage Commission Section */}
                {formData.commission.type !== "fixed" && (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Original Commission (Company Set) */}
                    <div>
                      <label
                        htmlFor="originalCommission"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Original Commission % (Company Set)
                      </label>
                      <input
                        type="number"
                        id="originalCommission"
                        value={formData.commission.originalPercentage || ""}
                        onChange={handleCommissionChange}
                        min="0"
                        max={COMMISSION_CONFIG.MAX_COMMISSION_PERCENTAGE}
                        step="0.1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        The commission percentage set by the company
                      </p>
                    </div>

                    {/* Internal Reduction Control */}
                    <div>
                      <label
                        htmlFor="reductionPercentage"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Platform Fee Reduction % (Internal Control)
                      </label>
                      <input
                        type="number"
                        id="reductionPercentage"
                        value={formData.commission.reductionPercentage || ""}
                        onChange={handleReductionChange}
                        step="1"
                        placeholder="40"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-orange-50"
                      />
                      <p className="mt-1 text-sm text-orange-600">
                        Percentage to reduce from original commission (default:{" "}
                        {COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE}%,
                        range: {COMMISSION_CONFIG.MIN_REDUCTION_PERCENTAGE}%-
                        {COMMISSION_CONFIG.MAX_REDUCTION_PERCENTAGE}%)
                      </p>
                    </div>

                    {/* Alternative: Direct Recruiter Commission Control */}
                    <div>
                      <label
                        htmlFor="recruiterPercentage"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Recruiter Commission % (What Recruiters See)
                      </label>
                      <input
                        type="number"
                        id="recruiterPercentage"
                        value={
                          formData.commission.recruiterPercentage?.toFixed(2) ||
                          ""
                        }
                        onChange={handleRecruiterPercentageChange}
                        min={COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE}
                        max={
                          formData.commission.originalPercentage ||
                          COMMISSION_CONFIG.MAX_COMMISSION_PERCENTAGE
                        }
                        step="0.01"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 bg-green-50"
                      />
                      <p className="mt-1 text-sm text-green-600">
                        Direct control: Set exactly what recruiters will see
                      </p>
                    </div>

                    {/* Platform Fee (Calculated) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Platform Fee % (Calculated)
                      </label>
                      <div className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {formData.commission.platformFeePercentage?.toFixed(
                          2
                        ) || "0.00"}
                        %
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Platform fee = Original Commission - Recruiter
                        Commission
                      </p>
                    </div>
                  </div>
                )}

                {/* Commission Summary */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Commission Breakdown Summary
                  </h4>

                  {formData.commission.type === "fixed" ? (
                    // Fixed Commission Summary
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-blue-100 p-3 rounded">
                        <div className="font-medium text-blue-800">
                          Total Commission (Fixed)
                        </div>
                        <div className="text-lg font-bold text-blue-900">
                          {formData.salary.currency}{" "}
                          {formData.commission.fixedAmount?.toLocaleString() ||
                            "0"}
                        </div>
                        <div className="text-blue-700">
                          Fixed amount regardless of salary
                        </div>
                      </div>
                      <div className="bg-gray-100 p-3 rounded">
                        <div className="font-medium text-gray-800">
                          Equivalent Rate
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {formData.salary.max > 0 &&
                          formData.commission.fixedAmount > 0
                            ? (
                                (formData.commission.fixedAmount /
                                  formData.salary.max) *
                                100
                              ).toFixed(2)
                            : "0.00"}
                          %
                        </div>
                        <div className="text-gray-700">
                          Based on maximum salary
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Percentage Commission Summary
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-blue-100 p-3 rounded">
                        <div className="font-medium text-blue-800">
                          Company Pays
                        </div>
                        <div className="text-lg font-bold text-blue-900">
                          {formData.commission.originalPercentage?.toFixed(2) ||
                            "0.00"}
                          %
                        </div>
                        <div className="text-blue-700">
                          {formData.salary.currency}{" "}
                          {formData.commission.originalAmount?.toLocaleString() ||
                            "0"}
                        </div>
                      </div>
                      <div className="bg-green-100 p-3 rounded">
                        <div className="font-medium text-green-800">
                          Recruiter Gets
                        </div>
                        <div className="text-lg font-bold text-green-900">
                          {formData.commission.recruiterPercentage?.toFixed(
                            2
                          ) || "0.00"}
                          %
                        </div>
                        <div className="text-green-700">
                          {formData.salary.currency}{" "}
                          {formData.commission.recruiterAmount?.toLocaleString() ||
                            "0"}
                        </div>
                      </div>
                      <div className="bg-orange-100 p-3 rounded">
                        <div className="font-medium text-orange-800">
                          Platform Fee
                        </div>
                        <div className="text-lg font-bold text-orange-900">
                          {formData.commission.platformFeePercentage?.toFixed(
                            2
                          ) || "0.00"}
                          %
                        </div>
                        <div className="text-orange-700">
                          {formData.salary.currency}{" "}
                          {(
                            (formData.commission.originalAmount || 0) -
                            (formData.commission.recruiterAmount || 0)
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description & Guidelines */}
              <div className="bg-white shadow sm:rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Job Details
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Job Description
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={6}
                      required
                      value={formData.description}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sourcingGuidelines"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Sourcing Guidelines (Optional)
                    </label>
                    <textarea
                      name="sourcingGuidelines"
                      id="sourcingGuidelines"
                      rows={4}
                      value={formData.sourcingGuidelines}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment & Replacement Terms */}
              <div className="bg-white shadow sm:rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Terms & Conditions
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="paymentTerms"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Payment Terms (Optional)
                    </label>
                    <textarea
                      name="paymentTerms"
                      id="paymentTerms"
                      rows={4}
                      value={formData.paymentTerms}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="replacementTerms"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Replacement Terms (Optional)
                    </label>
                    <textarea
                      name="replacementTerms"
                      id="replacementTerms"
                      rows={4}
                      value={formData.replacementTerms}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isUpdating ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isUpdating ? "Updating..." : "Update Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
