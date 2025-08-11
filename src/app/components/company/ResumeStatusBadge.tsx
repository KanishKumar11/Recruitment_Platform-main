// components/company/ResumeStatusBadge.tsx
import { ResumeStatus } from "../../constants/resumeStatus";

interface ResumeStatusBadgeProps {
  status: ResumeStatus;
}

const ResumeStatusBadge: React.FC<ResumeStatusBadgeProps> = ({ status }) => {
  // Status badge colors
  const statusColors = {
    SUBMITTED: "bg-blue-100 text-blue-800",
    REVIEWED: "bg-indigo-100 text-indigo-800",
    SHORTLISTED: "bg-green-100 text-green-800",
    ONHOLD: "bg-yellow-100 text-yellow-800",
    INTERVIEW_IN_PROCESS: "bg-orange-100 text-orange-800",
    INTERVIEWED: "bg-purple-100 text-purple-800",
    SELECTED_IN_FINAL_INTERVIEW: "bg-teal-100 text-teal-800",
    OFFERED: "bg-cyan-100 text-cyan-800",
    OFFER_DECLINED: "bg-rose-100 text-rose-800",
    HIRED: "bg-emerald-100 text-emerald-800",
    JOINED: "bg-emerald-200 text-emerald-900",
    TRIAL_FAILED: "bg-red-200 text-red-900",
    BACKOUT: "bg-orange-200 text-orange-900",
    QUIT_AFTER_JOINED: "bg-red-300 text-red-900",
    REJECTED: "bg-red-100 text-red-800",
    DUPLICATE: "bg-gray-100 text-gray-800",
  };

  // Format status text for display
  const formatStatus = (status: string) => {
    switch (status) {
      case "INTERVIEW_IN_PROCESS":
        return "Interview in Process";
      case "SELECTED_IN_FINAL_INTERVIEW":
        return "Selected in Final Interview";
      case "OFFER_DECLINED":
        return "Offer Declined";
      case "TRIAL_FAILED":
        return "Trial Failed";
      case "QUIT_AFTER_JOINED":
        return "Quit After Joined";
      case "DUPLICATE":
        return "Duplicate";
      default:
        return status.charAt(0) + status.slice(1).toLowerCase();
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
};

export default ResumeStatusBadge;
