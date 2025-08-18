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
      icon: <Clock className="h-3 w-3 text-blue-500" />,
    },
    {
      status: ResumeStatus.REVIEWED,
      label: "Reviewed",
      date: resume.reviewedAt,
      icon: <CheckCircle className="h-3 w-3 text-indigo-500" />,
    },
    {
      status: ResumeStatus.SHORTLISTED,
      label: "Shortlisted",
      date: resume.shortlistedAt,
      icon: <Award className="h-3 w-3 text-green-500" />,
    },
    {
      status: ResumeStatus.ONHOLD,
      label: "On Hold",
      date: resume.onholdAt,
      icon: <PauseCircle className="h-3 w-3 text-yellow-500" />,
    },
    {
      status: ResumeStatus.INTERVIEW_IN_PROCESS,
      label: "Interview In Process",
      date: resume.interviewInProcessAt,
      icon: <Clock className="h-3 w-3 text-orange-500" />,
    },
    {
      status: ResumeStatus.INTERVIEWED,
      label: "Interviewed",
      date: resume.interviewedAt,
      icon: <UserCheck className="h-3 w-3 text-purple-500" />,
    },
    {
      status: ResumeStatus.SELECTED_IN_FINAL_INTERVIEW,
      label: "Selected in Final Interview",
      date: resume.selectedInFinalInterviewAt,
      icon: <Award className="h-3 w-3 text-blue-600" />,
    },
    {
      status: ResumeStatus.OFFERED,
      label: "Offered",
      date: resume.offeredAt,
      icon: <CheckCircle className="h-3 w-3 text-green-500" />,
    },
    {
      status: ResumeStatus.OFFER_DECLINED,
      label: "Offer Declined",
      date: resume.offerDeclinedAt,
      icon: <XCircle className="h-3 w-3 text-red-400" />,
    },
    {
      status: ResumeStatus.HIRED,
      label: "Hired",
      date: resume.hiredAt,
      icon: <Award className="h-3 w-3 text-green-600" />,
    },
    {
      status: ResumeStatus.JOINED,
      label: "Joined",
      date: resume.joinedAt,
      icon: <CheckCircle className="h-3 w-3 text-green-700" />,
    },
    {
      status: ResumeStatus.TRIAL_FAILED,
      label: "Trial Failed",
      date: resume.trialFailedAt,
      icon: <XCircle className="h-3 w-3 text-orange-500" />,
    },
    {
      status: ResumeStatus.BACKOUT,
      label: "Backout",
      date: resume.backoutAt,
      icon: <AlertCircle className="h-3 w-3 text-yellow-600" />,
    },
    {
      status: ResumeStatus.QUIT_AFTER_JOINED,
      label: "Quit After Joined",
      date: resume.quitAfterJoinedAt,
      icon: <XCircle className="h-3 w-3 text-red-600" />,
    },
    {
      status: ResumeStatus.REJECTED,
      label: "Rejected",
      date: resume.rejectedAt,
      icon: <XCircle className="h-3 w-3 text-red-500" />,
    },
    {
      status: ResumeStatus.DUPLICATE,
      label: "Duplicate",
      date: resume.duplicateAt,
      icon: <AlertCircle className="h-3 w-3 text-gray-500" />,
    },
  ];

  // Only show status steps that have timestamps (dates)
  const relevantSteps = statusSteps
    .filter((step) => step.date)
    .sort((a, b) => {
      // Sort by date chronologically - oldest first, newest last
      const dateA = new Date(a.date!);
      const dateB = new Date(b.date!);
      
      // Ensure we're comparing valid dates
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0;
      }
      
      return dateA.getTime() - dateB.getTime();
    });

  return (
    <div className="space-y-2">
      {relevantSteps.map((step, index) => (
        <div key={step.status} className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">{step.icon}</div>
          <div className="ml-2">
            <p className="text-xs font-medium text-gray-900">{step.label}</p>
            <p className="text-xs text-gray-500">{formatDate(step.date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResumeStatusHistory;
