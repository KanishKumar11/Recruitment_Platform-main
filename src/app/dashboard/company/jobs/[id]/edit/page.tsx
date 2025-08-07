"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetJobByIdQuery,
  useUpdateJobMutation,
} from "../../../../../store/services/jobsApi";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { JobType } from "../../../../../models/Job";
import RichTextEditor from "@/app/components/RichTextEditor";
import { useSelector } from "react-redux";

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: job, isLoading } = useGetJobByIdQuery(id);
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation();

  // Track if data has been loaded to prevent premature rich text editor initialization
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Get user data for company name
  const user = useSelector((state: any) => state.auth?.user);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    companyName: "",
    country: "",
    location: "",
    salary: {
      min: 0,
      max: 0,
      currency: "USD",
    },
    paymentTerms: "",
    positions: 1,
    jobType: "FULL_TIME" as JobType,
    experienceLevel: {
      min: 0,
      max: 0,
    },
    compensationDetails: "",
    replacementTerms: "",
    // Legacy fields for backward compatibility
    commissionPercentage: 0,
    commissionAmount: 0,
    // New commission structure
    commission: {
      type: "percentage" as "percentage" | "fixed",
      originalPercentage: 0,
      recruiterPercentage: 0,
      platformFeePercentage: 0,
      reductionPercentage: 0,
      originalAmount: 0,
      recruiterAmount: 0,
      fixedAmount: 0,
    },
    description: "",
    companyDescription: "",
    sourcingGuidelines: "",
  });

  // Populate form with job data when it loads
  useEffect(() => {
    if (job && !isDataLoaded) {
      console.log("Loading job data:", job); // Debug log

      const newFormData = {
        title: job.title || "",
        companyName: job.companyName || user?.companyName || user?.name || "",
        country: job.country || "",
        location: job.location || "",
        salary: {
          min: job.salary?.min || 0,
          max: job.salary?.max || 0,
          currency: job.salary?.currency || "USD",
        },
        paymentTerms: job.paymentTerms || "",
        positions: job.positions || 1,
        jobType: job.jobType || "FULL_TIME",
        experienceLevel: {
          min: job.experienceLevel?.min || 0,
          max: job.experienceLevel?.max || 0,
        },
        compensationDetails: job.compensationDetails || "",
        replacementTerms: job.replacementTerms || "",
        // Handle legacy commission fields
        commissionPercentage: job.commissionPercentage || 0,
        commissionAmount: job.commissionAmount || 0,
        // Handle new commission structure
        commission: {
          type:
            job.commission?.type ||
            (job.commissionPercentage > 0 ? "percentage" : "fixed"),
          originalPercentage:
            job.commission?.originalPercentage || job.commissionPercentage || 0,
          recruiterPercentage: job.commission?.recruiterPercentage || 0,
          platformFeePercentage: job.commission?.platformFeePercentage || 0,
          reductionPercentage: job.commission?.reductionPercentage || 0,
          originalAmount:
            job.commission?.originalAmount || job.commissionAmount || 0,
          recruiterAmount: job.commission?.recruiterAmount || 0,
          fixedAmount:
            job.commission?.fixedAmount ||
            (job.commissionPercentage === 0 ? job.commissionAmount : 0),
        },
        description: job.description || "",
        companyDescription: job.companyDescription || "",
        sourcingGuidelines: job.sourcingGuidelines || "",
      };

      console.log("Setting form data:", newFormData); // Debug log
      setFormData(newFormData);
      setIsDataLoaded(true);
    }
  }, [job, isDataLoaded]);

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
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(typeof (prev as any)[parent] === "object" &&
          (prev as any)[parent] !== null
            ? (prev as any)[parent]
            : ({} as Record<string, any>)),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Handle nested properties
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(typeof (prev as any)[parent] === "object" &&
          (prev as any)[parent] !== null
            ? (prev as any)[parent]
            : ({} as Record<string, any>)),
          [child]: parseFloat(value) || 0,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    }
  };

  // Handle rich text editor changes
  const handleEditorChange = (content: string, field: string) => {
    console.log(`Updating ${field} with content:`, content); // Debug log
    setFormData((prev) => ({
      ...prev,
      [field]: content,
    }));
  };

  // Handle commission type change
  const handleCommissionTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newType = e.target.value as "percentage" | "fixed";
    setFormData((prev) => ({
      ...prev,
      commission: {
        ...prev.commission,
        type: newType,
      },
    }));
  };

  // Calculate commission amount based on type
  useEffect(() => {
    if (
      formData.commission.type === "percentage" &&
      formData.salary.min > 0 &&
      formData.salary.max > 0 &&
      formData.commission.originalPercentage > 0
    ) {
      const avgSalary = (formData.salary.min + formData.salary.max) / 2;
      const commission =
        (avgSalary * formData.commission.originalPercentage) / 100;

      setFormData((prev) => ({
        ...prev,
        commission: {
          ...prev.commission,
          originalAmount: commission,
        },
        // Update legacy fields for backward compatibility
        commissionPercentage: prev.commission.originalPercentage,
        commissionAmount: commission,
      }));
    } else if (formData.commission.type === "fixed") {
      // For fixed commission, update legacy fields
      setFormData((prev) => ({
        ...prev,
        commissionPercentage: 0,
        commissionAmount: prev.commission.fixedAmount,
      }));
    }
  }, [
    formData.salary.min,
    formData.salary.max,
    formData.commission.originalPercentage,
    formData.commission.type,
    formData.commission.fixedAmount,
  ]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log("Submitting form data:", formData); // Debug log

      await updateJob({
        id: params.id as string,
        job: formData,
      }).unwrap();

      toast.success("Job updated successfully");
      router.push(`/dashboard/company/jobs/${params.id}`);
    } catch (error) {
      toast.error("Failed to update job");
      console.error("Error updating job:", error);
    }
  };

  // Show loading while fetching job data
  if (isLoading) {
    return (
      <ProtectedLayout allowedRoles={["COMPANY"]}>
        <DashboardLayout>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  // Show error if job not found
  if (!job) {
    return (
      <ProtectedLayout allowedRoles={["COMPANY"]}>
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
    <ProtectedLayout allowedRoles={["COMPANY"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <button
                onClick={() =>
                  router.push(`/dashboard/company/jobs/${params.id}`)
                }
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Job Details
              </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Edit Job
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Update the information for this job posting.
                </p>
              </div>

              <div className="border-t border-gray-200">
                <form onSubmit={handleSubmit}>
                  <div className="px-4 py-5 bg-white sm:p-6">
                    <div className="grid grid-cols-6 gap-6">
                      {/* Job Title */}
                      <div className="col-span-6 sm:col-span-4">
                        <label
                          htmlFor="title"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Job Title*
                        </label>
                        <input
                          type="text"
                          name="title"
                          id="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Company Description with Rich Text Editor - Only render when data is loaded */}
                      {isDataLoaded && (
                        <div className="col-span-6">
                          <RichTextEditor
                            key={`company-${formData.companyDescription.substring(
                              0,
                              50
                            )}`} // Force re-render when content changes
                            value={formData.companyDescription}
                            onChange={(content) =>
                              handleEditorChange(content, "companyDescription")
                            }
                            label="Company Description"
                            required={true}
                            placeholder="Enter detailed information about the company, its culture, values, and what makes it unique..."
                          />
                        </div>
                      )}

                      {/* Country */}
                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="country"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Country*
                        </label>
                        <input
                          type="text"
                          name="country"
                          id="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Location */}
                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="location"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Location*
                        </label>
                        <input
                          type="text"
                          name="location"
                          id="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Salary Min */}
                      <div className="col-span-6 sm:col-span-2">
                        <label
                          htmlFor="salary.min"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Min Salary*
                        </label>
                        <input
                          type="number"
                          name="salary.min"
                          id="salary.min"
                          value={formData.salary.min}
                          onChange={handleNumberChange}
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Salary Max */}
                      <div className="col-span-6 sm:col-span-2">
                        <label
                          htmlFor="salary.max"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Max Salary*
                        </label>
                        <input
                          type="number"
                          name="salary.max"
                          id="salary.max"
                          value={formData.salary.max}
                          onChange={handleNumberChange}
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Currency */}
                      <div className="col-span-6 sm:col-span-2">
                        <label
                          htmlFor="salary.currency"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Currency*
                        </label>
                        <select
                          id="salary.currency"
                          name="salary.currency"
                          value={formData.salary.currency}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                          <option value="AUD">AUD - Australian Dollar</option>
                          <option value="SGD">SGD - Singapore Dollar</option>
                        </select>
                      </div>

                      {/* Positions */}
                      <div className="col-span-6 sm:col-span-2">
                        <label
                          htmlFor="positions"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Number of Positions*
                        </label>
                        <input
                          type="number"
                          name="positions"
                          id="positions"
                          value={formData.positions}
                          onChange={handleNumberChange}
                          required
                          min="1"
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Job Type */}
                      <div className="col-span-6 sm:col-span-2">
                        <label
                          htmlFor="jobType"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Job Type*
                        </label>
                        <select
                          id="jobType"
                          name="jobType"
                          value={formData.jobType}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="FULL_TIME">Full Time</option>
                          <option value="PART_TIME">Part Time</option>
                          <option value="CONTRACT">Contract</option>
                          <option value="FREELANCE">Freelance</option>
                          <option value="INTERNSHIP">Internship</option>
                        </select>
                      </div>

                      {/* Experience Min */}
                      <div className="col-span-6 sm:col-span-2">
                        <label
                          htmlFor="experienceLevel.min"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Min Experience (years)*
                        </label>
                        <input
                          type="number"
                          name="experienceLevel.min"
                          id="experienceLevel.min"
                          value={formData.experienceLevel.min}
                          onChange={handleNumberChange}
                          required
                          min="0"
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Experience Max */}
                      <div className="col-span-6 sm:col-span-2">
                        <label
                          htmlFor="experienceLevel.max"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Max Experience (years)*
                        </label>
                        <input
                          type="number"
                          name="experienceLevel.max"
                          id="experienceLevel.max"
                          value={formData.experienceLevel.max}
                          onChange={handleNumberChange}
                          required
                          min="0"
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Commission Type */}
                      <div className="col-span-6 sm:col-span-2">
                        <label
                          htmlFor="commission.type"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Commission Type*
                        </label>
                        <select
                          id="commission.type"
                          name="commission.type"
                          value={formData.commission.type}
                          onChange={handleCommissionTypeChange}
                          required
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>

                      {/* Commission Input - Conditional based on type */}
                      {formData.commission.type === "percentage" ? (
                        <>
                          {/* Commission Percentage */}
                          <div className="col-span-6 sm:col-span-2">
                            <label
                              htmlFor="commission.originalPercentage"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Commission Percentage*
                            </label>
                            <input
                              type="number"
                              name="commission.originalPercentage"
                              id="commission.originalPercentage"
                              value={formData.commission.originalPercentage}
                              onChange={handleNumberChange}
                              required
                              step="0.01"
                              min="0"
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          {/* Commission Amount (Auto-calculated) */}
                          <div className="col-span-6 sm:col-span-2">
                            <label
                              htmlFor="commission.originalAmount"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Commission Amount
                            </label>
                            <input
                              type="number"
                              name="commission.originalAmount"
                              id="commission.originalAmount"
                              value={formData.commission.originalAmount}
                              readOnly
                              className="mt-1 bg-gray-100 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Fixed Commission Amount */}
                          <div className="col-span-6 sm:col-span-2">
                            <label
                              htmlFor="commission.fixedAmount"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Fixed Commission Amount*
                            </label>
                            <input
                              type="number"
                              name="commission.fixedAmount"
                              id="commission.fixedAmount"
                              value={formData.commission.fixedAmount}
                              onChange={handleNumberChange}
                              required
                              min="0"
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>

                          {/* Empty column for alignment */}
                          <div className="col-span-6 sm:col-span-2"></div>
                        </>
                      )}

                      {/* Payment Terms */}
                      <div className="col-span-6">
                        <label
                          htmlFor="paymentTerms"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Payment Terms
                        </label>
                        <textarea
                          name="paymentTerms"
                          id="paymentTerms"
                          value={formData.paymentTerms}
                          onChange={handleInputChange}
                          rows={3}
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Replacement Terms */}
                      <div className="col-span-6">
                        <label
                          htmlFor="replacementTerms"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Replacement Terms
                        </label>
                        <textarea
                          name="replacementTerms"
                          id="replacementTerms"
                          value={formData.replacementTerms}
                          onChange={handleInputChange}
                          rows={3}
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      {/* Job Description with Rich Text Editor - Only render when data is loaded */}
                      {isDataLoaded && (
                        <div className="col-span-6">
                          <RichTextEditor
                            key={`description-${formData.description.substring(
                              0,
                              50
                            )}`} // Force re-render when content changes
                            value={formData.description}
                            onChange={(content) =>
                              handleEditorChange(content, "description")
                            }
                            label="Job Description"
                            required={true}
                            placeholder="Enter the job description with all requirements, responsibilities, and details..."
                          />
                        </div>
                      )}

                      {/* Sourcing Guidelines with Rich Text Editor - Only render when data is loaded */}
                      {isDataLoaded && (
                        <div className="col-span-6">
                          <RichTextEditor
                            key={`sourcing-${formData.sourcingGuidelines.substring(
                              0,
                              50
                            )}`} // Force re-render when content changes
                            value={formData.sourcingGuidelines}
                            onChange={(content) =>
                              handleEditorChange(content, "sourcingGuidelines")
                            }
                            label="Sourcing Guidelines"
                            placeholder="Provide specific guidelines for recruiters on how to source candidates for this role..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
