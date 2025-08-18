// src/app/dashboard/recruiter/notifications/page.tsx
"use client";

import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/index";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import NotificationList from "@/app/components/notifications/NotificationList";
import { useNotifications } from "@/app/hooks/useNotifications";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft, Settings, Trash2, CheckCheck } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh,
  } = useNotifications({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    initialLimit: 50,
  });

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      try {
        await deleteAllNotifications();
      } catch (error) {
        console.error('Failed to delete all notifications:', error);
      }
    }
  };

  if (error) {
    return (
      <ProtectedLayout allowedRoles={["RECRUITER"]}>
        <DashboardLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Notifications</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={refresh} className="mr-4">
                Try Again
              </Button>
              <Link href="/dashboard/recruiter">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["RECRUITER"]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard/recruiter">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Notifications
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Stay updated with candidate status changes, job modifications, and new comments
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Quick Actions */}
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <Button
                        onClick={handleMarkAllAsRead}
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                      >
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Mark All Read ({unreadCount})
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleDeleteAll}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </>
                )}
                
                {/* Settings placeholder for future notification preferences */}
                <Button variant="ghost" size="icon" title="Notification Settings (Coming Soon)">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">{notifications.length}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Notifications</p>
                  <p className="text-2xl font-semibold text-gray-900">{notifications.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-semibold text-sm">{unreadCount}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unread</p>
                  <p className="text-2xl font-semibold text-gray-900">{unreadCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">{notifications.length - unreadCount}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Read</p>
                  <p className="text-2xl font-semibold text-gray-900">{notifications.length - unreadCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-lg shadow">
            <NotificationList
              notifications={notifications}
              loading={loading}
              unreadCount={unreadCount}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDelete={handleDelete}
              onDeleteAll={handleDeleteAll}
              onRefresh={refresh}
              className="border-0 shadow-none"
            />
          </div>

          {/* Help Section */}
          {notifications.length === 0 && !loading && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                📬 About Notifications
              </h3>
              <p className="text-blue-800 mb-4">
                You'll receive notifications here when:
              </p>
              <ul className="list-disc list-inside text-blue-800 space-y-1 mb-4">
                <li>A candidate's status changes for resumes you submitted</li>
                <li>Job postings you're working on are modified</li>
                <li>New notes or comments are added to your candidates</li>
              </ul>
              <p className="text-sm text-blue-700">
                Notifications are updated in real-time and you can manage them using the controls above.
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
}