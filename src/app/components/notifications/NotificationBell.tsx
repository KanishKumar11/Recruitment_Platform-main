// src/app/components/notifications/NotificationBell.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import NotificationDropdown from "./NotificationDropdown";

interface NotificationBellProps {
  unreadCount?: number;
  className?: string;
  onNotificationClick?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount = 0,
  className,
  onNotificationClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate bell when new notifications arrive
  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    onNotificationClick?.();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "relative transition-all duration-200 hover:bg-gray-100",
          isAnimating && "animate-pulse",
          className
        )}
        onClick={handleBellClick}
        aria-label={`Notifications${
          unreadCount > 0 ? ` (${unreadCount} unread)` : ""
        }`}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-indigo-600" />
        ) : (
          <Bell className="h-5 w-5 text-gray-600" />
        )}

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white fade-in ">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Pulse animation for new notifications */}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <NotificationDropdown
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          className="absolute right-0 top-full mt-2 z-50"
        />
      )}
    </div>
  );
};

export default NotificationBell;
