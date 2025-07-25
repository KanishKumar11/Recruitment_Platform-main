// components/company/ResumeStatusHistory.tsx
import React from "react";
import { IResume, ResumeStatus } from "@/app/models/Resume";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  UserCheck,
  Award,
  XCircle,
  PauseCircle,
} from "lucide-react";

interface ResumeStatusHistoryProps {
  resume: IResume;
}

const formatDate = (date: Date | null | undefined): string => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString();
};

const ResumeStatusHistory: React.FC<ResumeStatusHistoryProps> = ({
  resume,
}) => {
  // Define status steps with their corresponding timestamps
  const statusSteps = [
    {
      status: ResumeStatus.SUBMITTED,
      label: "Submitted",
      date: resume.submittedAt,
      icon: <Clock className="h-5 w-5 text-blue-500" />,
      active: true, // Always active since it's the first step
    },
    {
      status: ResumeStatus.REVIEWED,
      label: "Reviewed",
      date: resume.reviewedAt,
      icon: <CheckCircle className="h-5 w-5 text-indigo-500" />,
      active: !!resume.reviewedAt,
    },
    {
      status: ResumeStatus.SHORTLISTED,
      label: "Shortlisted",
      date: resume.shortlistedAt,
      icon: <Award className="h-5 w-5 text-green-500" />,
      active: !!resume.shortlistedAt,
    },
    {
      status: ResumeStatus.ONHOLD,
      label: "On Hold",
      date: resume.onholdAt,
      icon: <PauseCircle className="h-5 w-5 text-yellow-500" />,
      active: !!resume.onholdAt,
    },
    {
      status: ResumeStatus.INTERVIEWED,
      label: "Interviewed",
      date: resume.interviewedAt,
      icon: <UserCheck className="h-5 w-5 text-purple-500" />,
      active: !!resume.interviewedAt,
    },
    {
      status: ResumeStatus.HIRED,
      label: "Hired",
      date: resume.hiredAt,
      icon: <Award className="h-5 w-5 text-green-600" />,
      active: !!resume.hiredAt,
    },
    {
      status: ResumeStatus.REJECTED,
      label: "Rejected",
      date: resume.rejectedAt,
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      active: !!resume.rejectedAt,
    },
  ];

  // Only show status steps that have timestamps or are active
  const relevantSteps = statusSteps.filter((step) => step.active || step.date);

  return (
    <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Status History</h3>

      <div className="space-y-4">
        {relevantSteps.map((step, index) => (
          <div key={step.status} className="flex items-start">
            <div className="flex-shrink-0 mt-1">{step.icon}</div>
            <div className="ml-3">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-900">
                  {step.label}
                </p>
                <span
                  className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    step.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {step.active ? "Completed" : "Pending"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {formatDate(step.date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumeStatusHistory;
