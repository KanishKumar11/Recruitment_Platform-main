"use client";

import { TicketPriority } from "@/app/store/services/supportApi";

interface PriorityBadgeProps {
  priority: TicketPriority;
  size?: "sm" | "md" | "lg";
}

export default function PriorityBadge({
  priority,
  size = "md",
}: PriorityBadgeProps) {
  const getPriorityConfig = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.LOW:
        return {
          color: "bg-gray-100 text-gray-700 border-gray-200",
          icon: "⬇️",
          label: "Low",
        };
      case TicketPriority.MEDIUM:
        return {
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: "➡️",
          label: "Medium",
        };
      case TicketPriority.HIGH:
        return {
          color: "bg-orange-100 text-orange-700 border-orange-200",
          icon: "⬆️",
          label: "High",
        };
      case TicketPriority.CRITICAL:
        return {
          color: "bg-red-100 text-red-700 border-red-200",
          icon: "🔴",
          label: "Critical",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-700 border-gray-200",
          icon: "❓",
          label: priority,
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

  const config = getPriorityConfig(priority);
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
