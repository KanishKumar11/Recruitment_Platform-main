"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import RichTextEditor from "@/app/components/RichTextEditor";

import { RootState } from "../../../../../store/index";
import {
  useGetJobByIdQuery,
  useUpdateJobMutation,
} from "../../../../../store/services/jobsApi";

import { UserRole } from "@/app/constants/userRoles";
import { JobType } from "@/app/constants/jobType";
import { JobStatus } from "@/app/constants/jobStatus";
import { toast } from "react-hot-toast";

// Commission configuration constants
const COMMISSION_CONFIG = {
  DEFAULT_REDUCTION_PERCENTAGE: 50,
  MIN_REDUCTION_PERCENTAGE: 0,
  MAX_REDUCTION_PERCENTAGE: 80,
  MIN_COMMISSION_PERCENTAGE: 1,
  MAX_COMMISSION_PERCENTAGE: 50,
};

export default function CompanyJobEditPage() {
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
      type: "percentage" as "percentage" | "fixed" | "hourly",
      originalPercentage: 0,
      recruiterPercentage: 0,
      platformFeePercentage: 0,
      reductionPercentage: COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE,
      originalAmount: 0,
      recruiterAmount: 0,
      fixedAmount: 0,
      hourlyRate: 0,
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
    if (user && user.role !== UserRole.COMPANY) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  // Populate form with job data when it loads
  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        companyName: job.companyName || user?.companyName || user?.name || "",
        country: job.country || "",
        location: job.location || "",
        jobType: job.jobType || JobType.FULL_TIME,
        positions: job.positions || 1,
        salary: {
          min: job.salary?.min || 0,
          max: job.salary?.max || 0,
          currency: job.salary?.currency || "USD",
        },
        experienceLevel: {
          min: job.experienceLevel?.min || 0,
          max: job.experienceLevel?.max || 0,
        },
        // Enhanced commission structure
        commission: {
          type:
            job.commission?.type ||
            (job.commissionPercentage > 0 ? "percentage" : "fixed"),
          originalPercentage:
            job.commission?.originalPercentage || job.commissionPercentage || 0,
          recruiterPercentage:
            job.commission?.recruiterPercentage ||
            calculateRecruiterPercentage(
              job.commission?.originalPercentage || job.commissionPercentage || 0,
              job.commission?.reductionPercentage ||
                COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE
            ),
          platformFeePercentage:
            job.commission?.platformFeePercentage ||
            calculatePlatformFeePercentage(
              job.commission?.originalPercentage || job.commissionPercentage || 0,
              job.commission?.reductionPercentage ||
                COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE
            ),
          reductionPercentage:
            job.commission?.reductionPercentage ||
            COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE,
          originalAmount:
            job.commission?.originalAmount || job.commissionAmount || 0,
          recruiterAmount: job.commission?.recruiterAmount || 0,
          fixedAmount:
            job.commission?.fixedAmount ||
            (job.commissionPercentage === 0 ? job.commissionAmount : 0),
          hourlyRate: job.commission?.hourlyRate || 0,
        },
        // Legacy fields for backward compatibility
        commissionPercentage: job.commissionPercentage || 0,
        commissionAmount: job.commissionAmount || 0,
        description: job.description || "",
        companyDescription: job.companyDescription || "",
        sourcingGuidelines: job.sourcingGuidelines || "",
        paymentTerms: job.paymentTerms || "",
        replacementTerms: job.replacementTerms || "",
        status: job.status || JobStatus.DRAFT,
      });
    }
  }, [job, user]);

  // Helper functions for commission calculations
  const calculateRecruiterPercentage = (
    originalPercentage: number,
    reductionPercentage: number
  ) => {
    return originalPercentage * (1 - reductionPercentage / 100);
  };

  const calculatePlatformFeePercentage = (
    originalPercentage: number,
    reductionPercentage: number
  ) => {
    return originalPercentage * (reductionPercentage / 100);
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle nested properties
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev: any) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: name.includes("min") || name.includes("max") || name.includes("positions")
            ? parseInt(value) || 0
            : value,
        },
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle rich text editor changes
  const handleRichTextChange = (field: string) => (content: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: content,
    }));
  };

  // Handle commission changes with automatic calculations
  const handleCommissionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value) || 0;

    if (name.includes("commission.")) {
      const field = name.split(".")[1];
      setFormData((prev: any) => {
        const newCommission = { ...prev.commission, [field]: numericValue };

        // Auto-calculate dependent values
        if (field === "originalPercentage" || field === "reductionPercentage") {
          const originalPercentage = field === "originalPercentage" ? numericValue : prev.commission.originalPercentage;
          const reductionPercentage = field === "reductionPercentage" ? numericValue : prev.commission.reductionPercentage;
          
          newCommission.recruiterPercentage = calculateRecruiterPercentage(
            originalPercentage,
            reductionPercentage
          );
          newCommission.platformFeePercentage = calculatePlatformFeePercentage(
            originalPercentage,
            reductionPercentage
          );
        }

        return {
          ...prev,
          commission: newCommission,
          // Update legacy fields for backward compatibility
          commissionPercentage: newCommission.type === "percentage" ? newCommission.originalPercentage : 0,
          commissionAmount: newCommission.type === "fixed" ? newCommission.fixedAmount : 
                           newCommission.type === "hourly" ? newCommission.hourlyRate : 
                           newCommission.originalAmount,
        };
      });
    }
  };

  // Handle commission type change
  const handleCommissionTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newType = e.target.value as "percentage" | "fixed" | "hourly";
    setFormData((prev: any) => ({
      ...prev,
      commission: {
        ...prev.commission,
        type: newType,
      },
    }));
  };

  // Calculate commission amount based on salary and percentage
  useEffect(() => {
    if (
      formData.commission.type === "percentage" &&
      formData.salary.min > 0 &&
      formData.salary.max > 0 &&
      formData.commission.originalPercentage > 0
    ) {
      const avgSalary = (formData.salary.min + formData.salary.max) / 2;
      const originalAmount = (avgSalary * formData.commission.originalPercentage) / 100;
      const recruiterAmount = (avgSalary * formData.commission.recruiterPercentage) / 100;

      setFormData((prev: any) => ({
        ...prev,
        commission: {
          ...prev.commission,
          originalAmount,
          recruiterAmount,
        },
        // Update legacy fields for backward compatibility
        commissionPercentage: prev.commission.originalPercentage,
        commissionAmount: originalAmount,
      }));
    }
  }, [
    formData.salary.min,
    formData.salary.max,
    formData.commission.originalPercentage,
    formData.commission.recruiterPercentage,
    formData.commission.type,
  ]);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await updateJob({
        id: id,
        job: formData,
      }).unwrap();

      toast.success("Job updated successfully!");
      router.push(`/dashboard/company/jobs/${id}`);
    } catch (error: any) {
      console.error("Error updating job:", error);
      toast.error(error?.data?.message || "Failed to update job");
    }
  };

  // Show loading while fetching job data
  if (isJobLoading) {
    return (
      <ProtectedLayout allowedRoles={[UserRole.COMPANY]}>
        <DashboardLayout>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <LoadingSpinner />
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  // Show error if job not found
  if (jobError || !job) {
    return (
      <ProtectedLayout allowedRoles={[UserRole.COMPANY]}>
        <DashboardLayout>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center py-10">
                <p className="text-lg font-medium text-gray-900">
                  Job not found
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  The job you are looking for does not exist or you do not have
                  permission to view it.
                </p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={[UserRole.COMPANY]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Edit Job: {job?.title}
              </h1>
              <Link
                href={`/dashboard/company/jobs/${id}`}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View Job Details
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* Job Title */}
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Job Title *
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>

                  {/* Job Type */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="jobType"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Job Type *
                    </label>
                    <div className="mt-1">
                      <select
                        id="jobType"
                        name="jobType"
                        value={formData.jobType}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      >
                        <option value={JobType.FULL_TIME}>Full Time</option>
                        <option value={JobType.PART_TIME}>Part Time</option>
                        <option value={JobType.CONTRACT}>Contract</option>
                        <option value={JobType.FREELANCE}>Freelance</option>
                        <option value={JobType.INTERNSHIP}>Internship</option>
                      </select>
                    </div>
                  </div>

                  {/* Country */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Country *
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="country"
                        id="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Location *
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="location"
                        id="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>

                  {/* Number of Positions */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="positions"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Number of Positions *
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="positions"
                        id="positions"
                        value={formData.positions}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Description */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <RichTextEditor
                  label="Company Description"
                  value={formData.companyDescription}
                  onChange={handleRichTextChange("companyDescription")}
                  placeholder="Describe your company..."
                />
              </div>
            </div>

            {/* Salary and Experience */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Salary and Experience
                </h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* Salary Range */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="salary.min"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Minimum Salary *
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="salary.min"
                        id="salary.min"
                        value={formData.salary.min}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="salary.max"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Maximum Salary *
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="salary.max"
                        id="salary.max"
                        value={formData.salary.max}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="salary.currency"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Currency *
                    </label>
                    <div className="mt-1">
                      <select
                        name="salary.currency"
                        id="salary.currency"
                        value={formData.salary.currency}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                      </select>
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="experienceLevel.min"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Minimum Experience (years) *
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="experienceLevel.min"
                        id="experienceLevel.min"
                        value={formData.experienceLevel.min}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="experienceLevel.max"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Maximum Experience (years) *
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="experienceLevel.max"
                        id="experienceLevel.max"
                        value={formData.experienceLevel.max}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission Structure */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Commission Structure
                </h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* Commission Type */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="commission.type"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Commission Type *
                    </label>
                    <div className="mt-1">
                      <select
                        name="commission.type"
                        id="commission.type"
                        value={formData.commission.type}
                        onChange={handleCommissionTypeChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                        <option value="hourly">Hourly Rate</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditional Commission Fields */}
                  {formData.commission.type === "percentage" && (
                    <>
                      <div className="sm:col-span-3">
                        <label
                          htmlFor="commission.originalPercentage"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Commission Percentage *
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="commission.originalPercentage"
                            id="commission.originalPercentage"
                            value={formData.commission.originalPercentage}
                            onChange={handleCommissionChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            min={COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE}
                            max={COMMISSION_CONFIG.MAX_COMMISSION_PERCENTAGE}
                            step="0.1"
                            required
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <label
                          htmlFor="commission.reductionPercentage"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Platform Fee Percentage *
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="commission.reductionPercentage"
                            id="commission.reductionPercentage"
                            value={formData.commission.reductionPercentage}
                            onChange={handleCommissionChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            min={COMMISSION_CONFIG.MIN_REDUCTION_PERCENTAGE}
                            max={COMMISSION_CONFIG.MAX_REDUCTION_PERCENTAGE}
                            step="0.1"
                            required
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Recruiter Percentage
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            value={formData.commission.recruiterPercentage.toFixed(2)}
                            className="shadow-sm bg-gray-50 block w-full sm:text-sm border-gray-300 rounded-md"
                            disabled
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {formData.commission.type === "fixed" && (
                    <div className="sm:col-span-3">
                      <label
                        htmlFor="commission.fixedAmount"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Fixed Commission Amount *
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="commission.fixedAmount"
                          id="commission.fixedAmount"
                          value={formData.commission.fixedAmount}
                          onChange={handleCommissionChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {formData.commission.type === "hourly" && (
                    <div className="sm:col-span-3">
                      <label
                        htmlFor="commission.hourlyRate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Hourly Commission Rate *
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="commission.hourlyRate"
                          id="commission.hourlyRate"
                          value={formData.commission.hourlyRate}
                          onChange={handleCommissionChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Payment Terms
                </h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label
                      htmlFor="paymentTerms"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Payment Terms *
                    </label>
                    <div className="mt-1">
                      <textarea
                        name="paymentTerms"
                        id="paymentTerms"
                        rows={4}
                        value={formData.paymentTerms}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Describe the payment terms for this position..."
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Replacement Terms */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Replacement Terms
                </h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label
                      htmlFor="replacementTerms"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Replacement Terms *
                    </label>
                    <div className="mt-1">
                      <textarea
                        name="replacementTerms"
                        id="replacementTerms"
                        rows={4}
                        value={formData.replacementTerms}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Describe the replacement terms for this position..."
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Description */}
             <div className="bg-white shadow sm:rounded-lg">
               <div className="px-4 py-5 sm:p-6">
                 <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                   <div className="sm:col-span-6">
                     <RichTextEditor
                       label="Job Description *"
                       value={formData.description}
                       onChange={handleRichTextChange("description")}
                       placeholder="Enter detailed job description..."
                       required
                     />
                   </div>
                 </div>
               </div>
             </div>

            {/* Sourcing Guidelines */}
             <div className="bg-white shadow sm:rounded-lg">
               <div className="px-4 py-5 sm:p-6">
                 <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                   <div className="sm:col-span-6">
                     <RichTextEditor
                       label="Sourcing Guidelines *"
                       value={formData.sourcingGuidelines}
                       onChange={handleRichTextChange("sourcingGuidelines")}
                       placeholder="Enter sourcing guidelines..."
                       required
                     />
                   </div>
                 </div>
               </div>
             </div>
            {/* Save Button */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-end">
                  <button
                     type="submit"
                     disabled={isUpdating}
                     className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isUpdating ? (
                       <>
                         <LoadingSpinner />
                         <span className="ml-2">Saving...</span>
                       </>
                     ) : (
                       "Save Job"
                     )}
                   </button>
                 </div>
               </div>
             </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
