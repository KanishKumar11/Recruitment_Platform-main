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
} from "lucide-react";
import { format } from "date-fns";
import { IJob } from "@/app/models/Job";
import { countries } from "@/lib/countries";
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
import { DataTable } from "@/app/components/ui/data-table";
import { createRecruiterJobColumns } from "@/app/components/recruiter/jobs/columns";

// Utility function to get full country name from country code
const getCountryName = (countryCode: string): string => {
  const country = countries.find(
    (c) => c.code?.toLowerCase() === countryCode?.toLowerCase()
  );
  return country?.name || countryCode; // Fallback to countryCode if not found
};

export default function RecruiterJobs() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"live" | "saved">("live");
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

  // Derived data for filter dropdowns
  const [locations, setLocations] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [clients, setClients] = useState<string[]>([]);

  // Handle save job action
  const handleSaveJob = (job: IJob) => {
    setSelectedJobForSaving(job);
    setSaveJobModalOpen(true);
  };

  // Handle remove job action
  const handleRemoveJob = async (jobId: string) => {
    try {
      await removeJobFromSaved({ jobId }).unwrap();
      toast.success("Job removed from saved jobs!");
    } catch (error) {
      toast.error("Failed to remove job");
    }
  };

  // Get saved job IDs for column actions
  const savedJobIds =
    recruiterJobs?.savedJobs?.map((job) => job._id as string) || [];

  // Create columns for DataTable
  const columns = createRecruiterJobColumns({
    onSaveJob: handleSaveJob,
    onRemoveJob: handleRemoveJob,
    savedJobIds,
    activeTab,
  });

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

  // Handle search and filter changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (
    setValue: (value: string) => void,
    value: string
  ) => {
    setValue(value);
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
                  {activeTab === "live" ? "Available Jobs" : "My Saved Jobs"}
                </h3>
              </div>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <DataTable columns={columns} data={filteredJobs || []} />
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
