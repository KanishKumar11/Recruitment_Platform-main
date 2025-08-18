// src/app/components/notifications/NotificationItem.tsx
"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import {
  UserCheck,
  FileEdit,
  MessageSquare,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import { NotificationType } from "@/app/models/Notification";
import Link from "next/link";

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string | Date;
  jobId?: string;
  resumeId?: string;
  candidateName?: string;
  jobTitle?: string;
  metadata?: Record<string, any>;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  type,
  title,
  message,
  isRead,
  createdAt,
  jobId,
  resumeId,
  candidateName,
  jobTitle,
  metadata,
  onMarkAsRead,
  onDelete,
  className,
}) => {
  const getNotificationIcon = () => {
    switch (type) {
      case NotificationType.CANDIDATE_STATUS_CHANGE:
        return <UserCheck className="h-5 w-5 text-blue-500" />;
      case NotificationType.JOB_MODIFICATION:
        return <FileEdit className="h-5 w-5 text-orange-500" />;
      case NotificationType.NEW_NOTE_COMMENT:
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationLink = () => {
    // Ensure jobId is a string, handle cases where it might be an object
    const jobIdString =
      typeof jobId === "object" && jobId !== null
        ? (jobId as any)._id || (jobId as any).id || String(jobId)
        : String(jobId || "");

    if (resumeId && jobIdString) {
      return `/dashboard/recruiter/jobs/${jobIdString}/resumes`;
    }
    if (jobIdString) {
      return `/dashboard/recruiter/jobs/${jobIdString}`;
    }
    return null;
  };

  const formatTime = (date: string | Date) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isRead && onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  const notificationLink = getNotificationLink();

  const NotificationContent = () => (
    <div
      className={cn(
        "flex items-start gap-3 p-4 border-b border-gray-100 transition-all duration-200 hover:bg-gray-50",
        !isRead && "bg-blue-50 border-l-4 border-l-blue-500",
        className
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">{getNotificationIcon()}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4
              className={cn(
                "text-sm font-medium text-gray-900 mb-1",
                !isRead && "font-semibold"
              )}
            >
              {title}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>

            {/* Additional info */}
          </div>
          <div className="flex flex-col">
            {/* Actions */}
            <div className="flex items-center gap-1 ml-2">
              {notificationLink && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-gray-600"
                  asChild
                >
                  <Link href={notificationLink}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              )}

              {!isRead && onMarkAsRead && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-green-600"
                  onClick={handleMarkAsRead}
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-600"
                  onClick={handleDelete}
                  title="Delete notification"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>{formatTime(createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unread indicator */}
      {!isRead && (
        <div className="flex-shrink-0 mt-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
        </div>
      )}
    </div>
  );

  // If there's a link, wrap in Link component
  if (notificationLink) {
    return (
      <Link href={notificationLink} className="block">
        <NotificationContent />
      </Link>
    );
  }

  return <NotificationContent />;
};

export default NotificationItem;
