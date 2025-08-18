// src/app/hooks/useNotifications.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/index";
import { NotificationType } from "@/app/models/Notification";

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

interface UseNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialLimit?: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  // Actions
  fetchNotifications: (reset?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useNotifications = ({
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
  initialLimit = 20,
}: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [limit] = useState(initialLimit);

  // Get token from Redux store
  const token = useSelector((state: RootState) => state.auth.token);

  // Helper function to get auth headers
  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }, [token]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 1 : page;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/notifications?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (reset) {
        setNotifications(data.notifications || []);
        setPage(2); // Next page will be 2
      } else {
        setNotifications(prev => [...prev, ...(data.notifications || [])]);
        setPage(prev => prev + 1);
      }
      
      setUnreadCount(data.unreadCount || 0);
      setHasMore(data.pagination?.hasNextPage || false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, getAuthHeaders]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state and unread count atomically
      setNotifications(prev => {
        const updatedNotifications = prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        );
        
        // Update unread count based on the change
        const wasUnread = prev.find(n => n._id === notificationId && !n.isRead);
        if (wasUnread) {
          setUnreadCount(currentCount => Math.max(0, currentCount - 1));
        }
        
        return updatedNotifications;
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, [getAuthHeaders]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          markAllAsRead: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, [getAuthHeaders]);

  // Delete single notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?ids=${notificationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Update local state and unread count atomically
      setNotifications(prev => {
        const deletedNotification = prev.find(n => n._id === notificationId);
        const updatedNotifications = prev.filter(notification => notification._id !== notificationId);
        
        // Update unread count if deleted notification was unread
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(currentCount => Math.max(0, currentCount - 1));
        }
        
        return updatedNotifications;
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, [getAuthHeaders]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?deleteAll=true', {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete all notifications');
      }

      // Clear local state
      setNotifications([]);
      setUnreadCount(0);
      setPage(1);
      setHasMore(false);
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      throw err;
    }
  }, [getAuthHeaders]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchNotifications(false);
  }, [hasMore, loading, fetchNotifications]);

  // Refresh notifications (reset to first page)
  const refresh = useCallback(async () => {
    setPage(1);
    await fetchNotifications(true);
  }, [fetchNotifications]);

  // Initial load
  useEffect(() => {
    fetchNotifications(true);
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only refresh if not currently loading
      if (!loading) {
        fetchNotifications(true);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loading, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    loadMore,
    refresh,
  };
};

export default useNotifications;