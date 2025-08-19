"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EyeIcon,
  PencilIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { IJob } from "@/app/models/Job";
import { JobStatus } from "@/app/constants/jobStatus";
import { getCountryNameFromCode } from "@/app/utils/countryUtils";

// Helper functions (these should match the ones in your current page)
const formatSalary = (job: IJob) => {
  if (job.salary?.min && job.salary?.max) {
    if (job.salary.min === job.salary.max) {
      return `${job.salary.currency || "$"}${job.salary.min.toLocaleString()}`;
    } else {
      return `${
        job.salary.currency || "$"
      }${job.salary.min.toLocaleString()} - ${
        job.salary.currency || "$"
      }${job.salary.max.toLocaleString()}`;
    }
  }
  return "Not specified";
};

const formatExperience = (job: IJob) => {
  if (
    job.experienceLevel?.min !== undefined &&
    job.experienceLevel?.max !== undefined
  ) {
    if (job.experienceLevel.min === job.experienceLevel.max) {
      return `${job.experienceLevel.min} years`;
    } else {
      return `${job.experienceLevel.min}-${job.experienceLevel.max} years`;
    }
  }
  return "Any";
};

const formatCommission = (job: IJob) => {
  // Handle new commission structure
  if (job.commission) {
    if (job.commission.type === "fixed" && job.commission.fixedAmount) {
      return `$${job.commission.fixedAmount.toLocaleString()}`;
    } else if (
      job.commission.type === "percentage" &&
      job.commission.originalPercentage
    ) {
      return `${job.commission.originalPercentage}%`;
    } else if (job.commission.type === "hourly" && job.commission.hourlyRate) {
      return `$${job.commission.hourlyRate}/hr`;
    }
  }

  // Legacy fallback for backward compatibility
  if (job.commissionPercentage) {
    return `${job.commissionPercentage}%`;
  }
  if (job.commissionAmount) {
    return `$${job.commissionAmount.toLocaleString()}`;
  }

  return "Not specified";
};

interface JobColumnsProps {
  resumeCounts?: Record<string, number>;
  isLoadingCounts?: boolean;
  onStatusChange: (jobId: string, status: JobStatus) => void;
  onDeleteJob: (jobId: string) => void;
}

export const createJobColumns = ({
  resumeCounts,
  isLoadingCounts,
  onStatusChange,
  onDeleteJob,
}: JobColumnsProps): ColumnDef<IJob>[] => [
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const job = row.original;

      return (
        <div className="flex flex-col gap-2 py-2">
          <div className="flex flex-wrap gap-1">
            <Link
              href={`/dashboard/admin/jobs/${job._id}`}
              className="flex items-center justify-center w-8 h-8 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
              title="View Job"
            >
              <EyeIcon className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/admin/jobs/${job._id}/edit`}
              className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
              title="Edit Job"
            >
              <PencilIcon className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/admin/jobs/${job._id}/questions`}
              className="flex items-center justify-center w-8 h-8 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
              title="Job Questions"
            >
              <QuestionMarkCircleIcon className="h-4 w-4" />
            </Link>
            <button
              onClick={() => onDeleteJob(job._id as string)}
              className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
              title="Delete Job"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
          <Link href={`/dashboard/admin/jobs/${job._id}/resumes`}>
            <Button
              size="sm"
              className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
              title="View Resumes"
            >
              <DocumentTextIcon className="h-3 w-3 mr-1" />
              Resumes
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
    accessorKey: "postedByName",
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
          <div className="text-sm text-gray-900">
            {(job as any).postedByName || "Unknown"}
          </div>
          <div className="text-sm text-gray-500">
            Positions: {job.positions}
          </div>
        </div>
      );
    },
  },
  {
    id: "resumes",
    header: "Resumes",
    cell: ({ row }) => {
      const job = row.original;
      const count = resumeCounts?.[job._id as string] || 0;

      return (
        <div className="py-2">
          <div className="text-sm text-blue-600 font-bold text-center ">
            {isLoadingCounts ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              <span className="font-bold">{count}</span>
            )}
          </div>
          <div className="text-sm text-blue-600 text-center">
            {count === 1 ? "resume" : "resumes"}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "location",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Location
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
          <div className="text-sm text-gray-500">
            Exp: {formatExperience(job)}
          </div>
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
      return (
        <div className="py-2">
          <select
            value={job.status}
            onChange={(e) =>
              onStatusChange(job._id as string, e.target.value as JobStatus)
            }
            className={`p-1 text-xs font-medium rounded ${
              job.status === JobStatus.ACTIVE
                ? "bg-green-100 text-green-800"
                : job.status === JobStatus.PAUSED
                ? "bg-yellow-100 text-yellow-800"
                : job.status === JobStatus.CLOSED
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {Object.values(JobStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
];
