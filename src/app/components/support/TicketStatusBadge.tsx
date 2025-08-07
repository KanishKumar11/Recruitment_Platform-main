"use client";

import { TicketStatus } from "@/app/store/services/supportApi";

interface TicketStatusBadgeProps {
  status: TicketStatus;
  size?: "sm" | "md" | "lg";
}

export default function TicketStatusBadge({
  status,
  size = "md",
}: TicketStatusBadgeProps) {
  const getStatusConfig = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: "🔵",
          label: "Open",
        };
      case TicketStatus.IN_PROGRESS:
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: "🟡",
          label: "In Progress",
        };
      case TicketStatus.RESOLVED:
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: "✅",
          label: "Resolved",
        };
      case TicketStatus.CLOSED:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "⚫",
          label: "Closed",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "❓",
          label: status,
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "sm":
        return "px-2 py-1 text-xs";
      case "lg":
        return "px-4 py-2 text-base";
      default:
        return "px-3 py-1 text-sm";
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.color} ${sizeClasses}`}
    >
      <span
        className="mr-1"
        style={{ fontSize: size === "sm" ? "0.75em" : "1em" }}
      >
        {config.icon}
      </span>
      {config.label}
    </span>
  );
}
