"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";
import {
  EyeIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  BookmarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { IJob } from "@/app/models/Job";
import { countries } from "@/lib/countries";

// Utility functions
const getCountryNameFromCode = (countryCode: string): string => {
  const country = countries.find(
    (c) => c.code?.toLowerCase() === countryCode?.toLowerCase()
  );
  return country?.name || countryCode;
};

const formatSalary = (job: IJob): string => {
  if (job.salary?.min && job.salary?.max) {
    return `${job.salary.currency || "USD"} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`;
  }
  return "Not specified";
};

const formatExperience = (job: IJob): string => {
  if (job.experienceLevel?.min !== undefined && job.experienceLevel?.max !== undefined) {
    return `${job.experienceLevel.min}-${job.experienceLevel.max} years`;
  }
  return "Not specified";
};

const formatCommission = (job: IJob): string => {
  if (job.commission?.type === "percentage" && job.commission?.recruiterAmount) {
    return `$${job.commission.recruiterAmount.toLocaleString()}`;
  } else if (job.commission?.type === "fixed" && job.commission?.recruiterAmount) {
    return `$${job.commission.recruiterAmount.toLocaleString()}`;
  } else if (job.commission?.type === "hourly" && job.commission?.recruiterAmount) {
    return `$${job.commission.recruiterAmount.toLocaleString()}/hr`;
  }
  return "Not specified";
};

interface RecruiterJobColumnsProps {
  onSaveJob: (job: IJob) => void;
  onRemoveJob: (jobId: string) => void;
  savedJobIds: string[];
  activeTab: "live" | "saved";
}

export const createRecruiterJobColumns = ({
  onSaveJob,
  onRemoveJob,
  savedJobIds,
  activeTab,
}: RecruiterJobColumnsProps): ColumnDef<IJob>[] => [
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const job = row.original;
      const isJobSaved = savedJobIds.includes(job._id as string);
      
      return (
        <div className="flex flex-col gap-2 py-2">
          <div className="flex flex-wrap gap-1">
            <Link
              href={`/dashboard/recruiter/jobs/${job._id}`}
              className="flex items-center justify-center w-8 h-8 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
              title="View Job Details"
            >
              <EyeIcon className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/recruiter/jobs/${job._id}/apply`}
              className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
              title="Upload Resume"
            >
              <DocumentTextIcon className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/recruiter/jobs/${job._id}/screening-questions`}
              className="flex items-center justify-center w-8 h-8 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
              title="Screening Questions"
            >
              <QuestionMarkCircleIcon className="h-4 w-4" />
            </Link>
            {activeTab === "saved" || isJobSaved ? (
              <button
                onClick={() => onRemoveJob(job._id as string)}
                className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                title="Remove from Saved"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => onSaveJob(job)}
                className="flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                title="Save Job"
              >
                <BookmarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <Link href={`/dashboard/recruiter/jobs/${job._id}/resumes`}>
            <Button
              size="sm"
              className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
              title="View Submissions"
            >
              <DocumentTextIcon className="h-3 w-3 mr-1" />
              Submissions
            </Button>
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Job Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const job = row.original;
      return (
        <div className="py-2">
          <div className="text-sm font-medium text-gray-900">{job.title}</div>
          <div className="text-sm text-gray-500">
            Code: {job.jobCode.replace(/^job-/i, "")}
          </div>
          <div className="text-sm text-gray-500">
            Posted: {new Date(job.postedDate).toLocaleDateString()}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "companyName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Company
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const job = row.original;
      return (
        <div className="py-2">
          <div className="text-sm text-gray-900">{job.companyName}</div>
        </div>
      );
    },
  },
  {
    id: "location",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Location & Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const job = row.original;
      return (
        <div className="py-2">
          <div className="text-sm text-gray-900">
            {getCountryNameFromCode(job.country)}
          </div>
          <div className="text-sm text-gray-500">{job.location}</div>
          <div className="text-sm text-gray-500">
            {job.jobType.replace("_", " ")}
          </div>
        </div>
      );
    },
  },
  {
    id: "salary",
    header: "Salary & Experience",
    cell: ({ row }) => {
      const job = row.original;
      return (
        <div className="py-2">
          <div className="text-sm text-gray-900">{formatSalary(job)}</div>
          <div className="text-sm text-gray-500">Exp: {formatExperience(job)}</div>
          <div className="text-sm text-gray-500">
            Commission: {formatCommission(job)}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const job = row.original;
      const statusColors = {
        ACTIVE: "bg-green-100 text-green-800",
        DRAFT: "bg-yellow-100 text-yellow-800",
        CLOSED: "bg-red-100 text-red-800",
        PAUSED: "bg-gray-100 text-gray-800",
      };
      
      return (
        <div className="py-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              statusColors[job.status as keyof typeof statusColors] ||
              "bg-gray-100 text-gray-800"
            }`}
          >
            {job.status}
          </span>
        </div>
      );
    },
  },
];