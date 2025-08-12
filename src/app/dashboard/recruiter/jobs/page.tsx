//src/app/dashboard/recruiter/jobs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetJobsQuery } from "../../../store/services/jobsApi";
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
} from "lucide-react";
import { format } from "date-fns";
import { IJob } from "@/app/models/Job";
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

export default function RecruiterJobs() {
  const router = useRouter();
  const { data: jobs, isLoading, refetch } = useGetJobsQuery();

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

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
    return job.commission.type === "fixed"
      ? "Fixed"
      : "Percentage";
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
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Active Jobs
            </h1>

            {/* Search and filter section */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                {/* Search bar */}
                <div className="relative col-span-1 md:col-span-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search by job title or job code"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>

                {/* Location dropdown */}
                <div>
                  <select
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
                </div>

                {/* Country dropdown */}
                <div>
                  <select
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
                </div>

                {/* Client dropdown */}
                <div>
                  <select
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
                </div>
              </div>

              {/* Filter actions */}
              <div className="flex justify-between items-center mt-4">
                <div>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option.toString()}>
                          {option} per page
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Jobs listing */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Available Jobs
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
                  {totalItems} jobs
                </p>
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-2">
                                <Briefcase className="h-6 w-6 text-indigo-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-indigo-600">
                                  {job.jobCode}
                                </div>
                                <div className="text-lg font-semibold text-gray-900 truncate">
                                  {job.title}
                                </div>
                              </div>
                            </div>
                            <div>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/recruiter/jobs/${job._id}`
                                  )
                                }
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/recruiter/submissions?jobId=${job._id}`
                                  )
                                }
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                View Submissions
                              </button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-y-1">
                              <div className="flex items-center text-sm text-gray-500 mr-4">
                                <Building className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                {job.postedByName || "Company"}
                              </div>
                              <div className="flex items-center text-sm text-gray-500 mr-4">
                                <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                {job.location}, {job.country}
                              </div>
                              <div className="flex items-center text-sm text-gray-500 mr-4">
                                <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                Posted{" "}
                                {format(
                                  new Date(job.postedDate),
                                  "MMM dd, yyyy"
                                )}
                              </div>
                              <div className="flex items-center text-sm font-medium text-gray-800">
                                {formatSalary(job)}
                              </div>
                            </div>

                            {/* Tags and info */}
                            <div className="flex flex-wrap gap-2 mt-2">
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
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {/* Page numbers */}
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        const isCurrentPage = pageNumber === currentPage;

                        // Show first page, last page, current page, and pages around current page
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 &&
                            pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNumber)}
                                isActive={isCurrentPage}
                                className="cursor-pointer"
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }

                        // Show ellipsis
                        if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }

                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}
