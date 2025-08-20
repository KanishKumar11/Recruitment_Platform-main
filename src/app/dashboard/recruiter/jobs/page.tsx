//src/app/dashboard/recruiter/jobs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useGetJobsQuery,
  useGetRecruiterJobsQuery,
  useAddJobToSavedMutation,
  useRemoveJobFromSavedMutation,
} from "../../../store/services/jobsApi";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import {
  Briefcase,
  Search,
  Clock,
  MapPin,
  Building,
  Filter,
  Loader2,
  FileText,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { format } from "date-fns";
import { IJob } from "@/app/models/Job";
import { countries } from "@/lib/countries";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/app/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import SaveJobModal from "@/app/components/SaveJobModal";
import toast from "@/app/lib/toast";

// Utility function to get full country name from country code
const getCountryName = (countryCode: string): string => {
  const country = countries.find(
    (c) => c.code?.toLowerCase() === countryCode?.toLowerCase()
  );
  return country?.name || countryCode; // Fallback to countryCode if not found
};

export default function RecruiterJobs() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"live" | "saved">("saved");
  const { data: allJobs, isLoading: isLoadingAllJobs } = useGetJobsQuery();
  const { data: recruiterJobs, isLoading: isLoadingRecruiterJobs } =
    useGetRecruiterJobsQuery();
  const [addJobToSaved] = useAddJobToSavedMutation();
  const [removeJobFromSaved] = useRemoveJobFromSavedMutation();

  // Save job modal state
  const [saveJobModalOpen, setSaveJobModalOpen] = useState(false);
  const [selectedJobForSaving, setSelectedJobForSaving] = useState<IJob | null>(
    null
  );

  const jobs = activeTab === "live" ? allJobs : recruiterJobs?.savedJobs;
  const isLoading =
    activeTab === "live" ? isLoadingAllJobs : isLoadingRecruiterJobs;

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Derived data for filter dropdowns
  const [locations, setLocations] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [clients, setClients] = useState<string[]>([]);

  // Filter jobs based on current filter settings
  const filteredJobs =
    jobs?.filter((job) => {
      // Only show ACTIVE jobs for recruiters
      if (job.status !== "ACTIVE") return false;

      // Apply search filter
      if (
        searchTerm &&
        !job.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !job.jobCode.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Apply dropdown filters
      if (locationFilter && job.location !== locationFilter) return false;
      if (countryFilter && job.country !== countryFilter) return false;
      if (clientFilter && job.postedByName !== clientFilter) return false;

      return true;
    }) || [];

  // Calculate pagination
  const totalItems = filteredJobs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (
    setValue: (value: string) => void,
    value: string
  ) => {
    setValue(value);
    setCurrentPage(1);
  };

  // Extract unique values for filters
  useEffect(() => {
    if (jobs) {
      const activeJobs = jobs.filter((job) => job.status === "ACTIVE");
      setLocations([...new Set(activeJobs.map((job) => job.location))].sort());
      setCountries([...new Set(activeJobs.map((job) => job.country))].sort());
      setClients(
        [
          ...new Set(
            activeJobs
              .map((job) => job.postedByName)
              .filter((name): name is string => !!name)
          ),
        ].sort()
      );
    }
  }, [jobs]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setLocationFilter("");
    setCountryFilter("");
    setClientFilter("");
    setIndustryFilter("");
    setCurrentPage(1);
  };

  // Format salary for display
  const formatSalary = (job: IJob) => {
    return `${
      job.salary.currency
    } ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`;
  };

  // Calculate commission value based on new commission structure
  const calculateCommission = (job: IJob) => {
    if (!job.commission) {
      // Fallback to legacy commission calculation
      const commissionValue = job.salary.max * (job.commissionPercentage / 100);
      return `${job.salary.currency} ${commissionValue.toLocaleString(
        undefined,
        {
          maximumFractionDigits: 0,
        }
      )}`;
    }

    if (job.commission.type === "fixed") {
      // For fixed commission, show the recruiter amount directly
      return `${
        job.salary.currency
      } ${job.commission.recruiterAmount.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`;
    } else {
      // For percentage-based commission, calculate based on max salary
      const commissionValue =
        job.salary.max * (job.commission.recruiterPercentage / 100);
      return `${job.salary.currency} ${commissionValue.toLocaleString(
        undefined,
        {
          maximumFractionDigits: 0,
        }
      )}`;
    }
  };

  // Get commission type badge
  const getCommissionTypeBadge = (job: IJob) => {
    if (!job.commission) {
      return "Legacy";
    }
    return job.commission.type === "fixed" ? "Fixed" : "Percentage";
  };

  // Get commission badge color based on type
  const getCommissionBadgeColor = (job: IJob) => {
    if (!job.commission) {
      return "bg-gray-100 text-gray-800";
    }
    return job.commission.type === "fixed"
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-100 text-purple-800";
  };

  return (
    <ProtectedLayout allowedRoles={["RECRUITER"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Jobs</h1>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab("live")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "live"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Live Jobs
                  </button>
                  <button
                    onClick={() => setActiveTab("saved")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "saved"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    My Jobs ({recruiterJobs?.savedJobs?.length || 0})
                  </button>
                </nav>
              </div>
            </div>

            {/* Search and filter section */}
            <div className="bg-white p-3 rounded-lg shadow mb-4">
              <div className="flex flex-wrap gap-2 items-center">
                {/* Search bar */}
                <div className="relative flex-1 min-w-[200px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>

                {/* Location dropdown */}
                <select
                  className="px-3 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                  value={locationFilter}
                  onChange={(e) =>
                    handleFilterChange(setLocationFilter, e.target.value)
                  }
                >
                  <option value="">All Locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>

                {/* Country dropdown */}
                <select
                  className="px-3 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                  value={countryFilter}
                  onChange={(e) =>
                    handleFilterChange(setCountryFilter, e.target.value)
                  }
                >
                  <option value="">All Countries</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>

                {/* Client dropdown */}
                <select
                  className="px-3 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                  value={clientFilter}
                  onChange={(e) =>
                    handleFilterChange(setClientFilter, e.target.value)
                  }
                >
                  <option value="">All Clients</option>
                  {clients.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>

                {/* Clear filters button */}
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Filter className="mr-1 h-3 w-3" />
                  Clear
                </button>
              </div>
            </div>

            {/* Jobs listing */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {activeTab === "live" ? "Available Jobs" : "My Saved Jobs"}{" "}
                  (Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
                  {totalItems} jobs)
                </h3>
              </div>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : currentJobs && currentJobs.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {currentJobs.map((job) => (
                    <li key={job._id as string}>
                      <div className="block hover:bg-gray-50 transition duration-150">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 mr-4">
                              <div className="flex items-center mb-2">
                                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-2">
                                  <Briefcase className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium text-indigo-600">
                                      {job.jobCode.replace(/^job-/i, "")}
                                    </div>
                                    {(() => {
                                      const isJobSaved =
                                        recruiterJobs?.savedJobs?.some(
                                          (savedJob) => savedJob._id === job._id
                                        );

                                      if (activeTab === "saved" || isJobSaved) {
                                        return (
                                          <button
                                            onClick={async () => {
                                              try {
                                                await removeJobFromSaved({
                                                  jobId: job._id as string,
                                                }).unwrap();
                                                toast.success(
                                                  "Job removed from saved jobs!"
                                                );
                                              } catch (error) {
                                                toast.error(
                                                  "Failed to remove job"
                                                );
                                              }
                                            }}
                                            className="text-yellow-500 hover:text-yellow-600 transition-colors"
                                            title="Remove from saved jobs"
                                          >
                                            <BookmarkCheck className="h-4 w-4" />
                                          </button>
                                        );
                                      } else {
                                        return (
                                          <button
                                            onClick={() => {
                                              setSelectedJobForSaving(job);
                                              setSaveJobModalOpen(true);
                                            }}
                                            className="text-gray-400 hover:text-yellow-500 transition-colors"
                                            title="Save job"
                                          >
                                            <Bookmark className="h-4 w-4" />
                                          </button>
                                        );
                                      }
                                    })()}
                                  </div>
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/recruiter/jobs/${job._id}`
                                      )
                                    }
                                    className="text-lg font-semibold text-gray-900 hover:text-indigo-600 truncate text-left transition-colors duration-200 overflow-hidden text-ellipsis whitespace-nowrap"
                                  >
                                    {job.title}
                                  </button>
                                </div>
                              </div>

                              {/* Job details */}
                              <div className="flex flex-wrap gap-y-1 mb-2">
                                <div className="flex items-center text-sm text-gray-500 mr-4 overflow-hidden">
                                  <Building className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                  <span className="truncate">
                                    {job.postedByName || "Company"}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mr-4 overflow-hidden">
                                  <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                  <span className="truncate">
                                    {job.location},{" "}
                                    {getCountryName(job.country)}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm font-medium text-gray-800 overflow-hidden">
                                  <span className="truncate">
                                    {formatSalary(job)}
                                  </span>
                                </div>
                              </div>

                              {/* Tags and info */}
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {job.jobType.replace("_", " ")}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {job.experienceLevel.min}-
                                  {job.experienceLevel.max} Years
                                </span>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCommissionBadgeColor(
                                    job
                                  )}`}
                                >
                                  Commission: {calculateCommission(job)}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCommissionBadgeColor(
                                    job
                                  )}`}
                                >
                                  {getCommissionTypeBadge(job)}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                              <button
                                onClick={() => {
                                  if (activeTab === "live") {
                                    setSelectedJobForSaving(job);
                                    setSaveJobModalOpen(true);
                                  } else {
                                    router.push(
                                      `/dashboard/recruiter/jobs/${job._id}`
                                    );
                                  }
                                }}
                                className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                View Details
                              </button>

                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/recruiter/jobs/${job._id}/apply`
                                  )
                                }
                                className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <FileText className="mr-1.5 h-3 w-3" />
                                Upload Resume
                              </button>

                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/recruiter/jobs/${job._id}/screening-questions`
                                  )
                                }
                                className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <QuestionMarkCircleIcon className="mr-1.5 h-3 w-3" />
                                Screening Questions
                              </button>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/recruiter/jobs/${job._id}/resumes`
                                  )
                                }
                                className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                View Submissions
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No jobs found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {jobs && jobs.length > 0
                      ? "No jobs match your current filters. Try adjusting your search criteria."
                      : "There are no active jobs available at the moment."}
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-white">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {/* First page */}
                      {currentPage > 3 && (
                        <>
                          <PaginationItem>
                            <PaginationLink 
                              onClick={() => setCurrentPage(1)}
                              className="cursor-pointer"
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {currentPage > 4 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}
                      
                      {/* Page numbers around current page */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        if (pageNum < 1 || pageNum > totalPages) return null;
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {/* Last page */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink 
                              onClick={() => setCurrentPage(totalPages)}
                              className="cursor-pointer"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Job Modal */}
        <SaveJobModal
          isOpen={saveJobModalOpen}
          onClose={() => {
            setSaveJobModalOpen(false);
            setSelectedJobForSaving(null);
          }}
          job={selectedJobForSaving}
          isAlreadySaved={
            recruiterJobs?.savedJobs?.some(
              (savedJob) => savedJob._id === selectedJobForSaving?._id
            ) || false
          }
          onSave={async (jobId: string, notes?: string) => {
            try {
              await addJobToSaved({ jobId }).unwrap();
              toast.success("Job saved successfully!");
              setSaveJobModalOpen(false);
              setSelectedJobForSaving(null);
            } catch (error) {
              toast.error("Failed to save job");
            }
          }}
        />
      </DashboardLayout>
    </ProtectedLayout>
  );
}
