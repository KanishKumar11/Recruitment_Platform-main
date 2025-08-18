// src/app/components/notifications/NotificationList.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCheck,
  Trash2,
  Filter,
  RefreshCw,
  Bell,
  BellOff,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { cn } from "@/app/lib/utils";
import { NotificationType } from "@/app/models/Notification";
import NotificationItem from "./NotificationItem";

interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  jobId?: string;
  resumeId?: string;
  candidateName?: string;
  jobTitle?: string;
  metadata?: Record<string, any>;
}

interface NotificationListProps {
  notifications: Notification[];
  loading?: boolean;
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  onDeleteAll?: () => void;
  onRefresh?: () => void;
  className?: string;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading = false,
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll,
  onRefresh,
  className,
}) => {
  const [filter, setFilter] = useState<"all" | "unread" | NotificationType>(
    "all"
  );

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.isRead;
    return notification.type === filter;
  });

  const getFilterLabel = (filterType: string) => {
    switch (filterType) {
      case "all":
        return "All";
      case "unread":
        return "Unread";
      case NotificationType.CANDIDATE_STATUS_CHANGE:
        return "Status Changes";
      case NotificationType.JOB_MODIFICATION:
        return "Job Updates";
      case NotificationType.NEW_NOTE_COMMENT:
        return "New Notes";
      default:
        return filterType;
    }
  };

  if (loading) {
    return (
      <div className={cn("flex justify-center items-center py-8", className)}>
        <LoadingSpinner size="md" text="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className={cn("bg-white", className)}>
      {/* Filters */}
      <div className="flex items-center gap-2 p-4 bg-gray-50 border-b border-gray-200">
        <Filter className="h-4 w-4 text-gray-500" />
        <div className="flex flex-wrap gap-2">
          {[
            "all",
            "unread",
            NotificationType.CANDIDATE_STATUS_CHANGE,
            NotificationType.JOB_MODIFICATION,
            NotificationType.NEW_NOTE_COMMENT,
          ].map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filterType as any)}
              className="text-xs"
            >
              {getFilterLabel(filterType)}
            </Button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            {filter === "unread" ? (
              <>
                <BellOff className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">
                  No unread notifications
                </p>
                <p className="text-sm">You're all caught up!</p>
              </>
            ) : (
              <>
                <Bell className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No notifications</p>
                <p className="text-sm">New notifications will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div>
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                id={notification._id}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                isRead={notification.isRead}
                createdAt={notification.createdAt}
                jobId={notification.jobId}
                resumeId={notification.resumeId}
                candidateName={notification.candidateName}
                jobTitle={notification.jobTitle}
                metadata={notification.metadata}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;
