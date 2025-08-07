"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetJobByIdQuery } from "../../../../store/services/jobsApi";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import {
  Loader2,
  ArrowLeft,
  Building,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { IJob } from "@/app/models/Job";

export default function RecruiterJobDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  // const { user } = useSelector((state: RootState) => state.auth);
  const { data: job, isLoading } = useGetJobByIdQuery(id);

  // Format job type for display
  const formatJobType = (jobType: string) => {
    return jobType.replace("_", " ");
  };

  // Calculate commission value based on new commission structure
  const getCommissionValue = (job: IJob) => {
    if (!job.commission) {
      // Fallback to legacy commission calculation if new structure is not available
      const recruiterPercentage = job.commissionPercentage
        ? job.commissionPercentage * 0.6
        : 0;
      const minCommission = (job.salary.min * recruiterPercentage) / 100;
      const maxCommission = (job.salary.max * recruiterPercentage) / 100;

      return `${job.salary.currency} ${minCommission.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })} - ${maxCommission.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`;
    }

    if (job.commission.type === "fixed") {
      // For fixed commission, show the recruiter amount directly
      return `${
        job.salary.currency
      } ${job.commission.recruiterAmount.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`;
    } else {
      // For percentage-based commission, calculate range based on salary range
      const minCommission =
        (job.salary.min * job.commission.recruiterPercentage) / 100;
      const maxCommission =
        (job.salary.max * job.commission.recruiterPercentage) / 100;

      return `${job.salary.currency} ${minCommission.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })} - ${maxCommission.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`;
    }
  };

  // Get commission display text with type indicator
  // (Removed unused getCommissionDisplayText and getRecruiterCommissionPercentage functions)
  // Format salary for display (matching the listing page)
  const formatSalary = (job: IJob) => {
    return `${
      job.salary.currency
    } ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`;
  };

  return (
    <ProtectedLayout allowedRoles={["RECRUITER"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <button
                onClick={() => router.push("/dashboard/recruiter/jobs")}
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : job ? (
              <div>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {job.title}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Job Code: {job.jobCode}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/recruiter/jobs/${params.id}/apply`
                          )
                        }
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Apply Now
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-gray-200">
                    <dl>
                      {/* First Line - Company */}
                      <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center sm:col-span-1">
                          <Building className="mr-2 h-4 w-4 text-gray-400" />
                          Company
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {job.postedByCompany || "Company"}
                        </dd>
                      </div>

                      {/* Second Line - Location and Posted Date */}
                      <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center sm:col-span-1">
                          <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                          Location
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {job.location}, {job.country}
                        </dd>
                        <dt className="text-sm font-medium text-gray-500 flex items-center sm:col-span-1">
                          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                          Posted Date
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {format(new Date(job.postedDate), "MMMM dd, yyyy")}
                        </dd>
                      </div>

                      {/* Third Line - Experience and Job Type */}
                      <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center sm:col-span-1">
                          <Clock className="mr-2 h-4 w-4 text-gray-400" />
                          Experience
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {job.experienceLevel.min} - {job.experienceLevel.max}{" "}
                          years
                        </dd>
                        <dt className="text-sm font-medium text-gray-500 flex items-center sm:col-span-1">
                          Job Type
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {formatJobType(job.jobType)}
                        </dd>
                      </div>

                      {/* Fourth Line - Salary and Positions */}
                      <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center sm:col-span-1">
                          <DollarSign className="mr-2 h-4 w-4 text-gray-400" />
                          Salary Range
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {formatSalary(job)}
                        </dd>
                        <dt className="text-sm font-medium text-gray-500 flex items-center sm:col-span-1">
                          <Users className="mr-2 h-4 w-4 text-gray-400" />
                          Positions
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {job.positions}
                        </dd>
                      </div>

                      {/* Fifth Line - Commission and Commission Type */}
                      <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center sm:col-span-1">
                          <DollarSign className="mr-2 h-4 w-4 text-gray-400" />
                          Commission
                        </dt>
                        <dd className="mt-1 text-sm font-bold text-green-600 sm:mt-0 sm:col-span-2">
                          {getCommissionValue(job)}
                        </dd>
                        <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                          Commission Type
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {job.commission ? (
                            job.commission.type === "fixed" ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Fixed Amount
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {job.commission.recruiterPercentage}% of Salary
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Legacy Structure
                            </span>
                          )}
                        </dd>
                      </div>

                      {/* Compensation Details */}
                      {job.compensationDetails && (
                        <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500 flex items-center sm:col-span-1">
                            <DollarSign className="mr-2 h-4 w-4 text-gray-400" />
                            Compensation Details
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-5">
                            {job.compensationDetails}
                          </dd>
                        </div>
                      )}

                      {/* Sixth Line - Payment Terms */}
                      <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                          Payment Terms
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-5">
                          {job.paymentTerms || "Not specified"}
                        </dd>
                      </div>

                      {/* Seventh Line - Replacement Terms */}
                      <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                          Replacement Terms
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-5">
                          {job.replacementTerms || "Not specified"}
                        </dd>
                      </div>

                      <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                          Company Description
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-5">
                          <div
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: job.companyDescription || "Not specified",
                            }}
                          />
                        </dd>
                      </div>

                      {/* Description */}
                      <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                          Description
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-5">
                          <div
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: job.description,
                            }}
                          />
                        </dd>
                      </div>

                      {/* Sourcing Guidelines */}
                      {job.sourcingGuidelines && (
                        <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
                            Sourcing Guidelines
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-5">
                            <div
                              className="prose max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: job.sourcingGuidelines,
                              }}
                            />
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
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
