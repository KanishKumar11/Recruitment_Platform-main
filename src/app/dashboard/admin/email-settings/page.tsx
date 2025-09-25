"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  useGetEmailSettingsQuery,
  useUpdateEmailSettingsMutation,
} from "../../../store/services/adminApi";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Clock,
  Settings,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";
import DashboardLayout from "@/app/components/layout/DashboardLayout";

interface EmailSettings {
  JOB_NOTIFICATION_FREQUENCY: number;
  END_OF_DAY_NOTIFICATIONS: boolean;
  END_OF_DAY_TIME: string;
  NOTIFICATION_ENABLED: boolean;
}

const EmailSettingsPage = () => {
  const {
    data: emailSettingsData,
    isLoading,
    error,
  } = useGetEmailSettingsQuery();
  const [updateEmailSettings, { isLoading: isUpdating }] =
    useUpdateEmailSettingsMutation();

  const [settings, setSettings] = useState<EmailSettings>({
    JOB_NOTIFICATION_FREQUENCY: 5,
    END_OF_DAY_NOTIFICATIONS: false,
    END_OF_DAY_TIME: "18:00",
    NOTIFICATION_ENABLED: true,
  });

  useEffect(() => {
    if (emailSettingsData?.settings) {
      setSettings({
        JOB_NOTIFICATION_FREQUENCY:
          emailSettingsData.settings.job_notification_frequency || 5,
        END_OF_DAY_NOTIFICATIONS:
          emailSettingsData.settings.end_of_day_notifications || false,
        END_OF_DAY_TIME: emailSettingsData.settings.end_of_day_time || "18:00",
        NOTIFICATION_ENABLED:
          emailSettingsData.settings.email_notifications_enabled !== false,
      });
    }
  }, [emailSettingsData]);

  const handleSaveSettings = async () => {
    try {
      // Transform the settings keys to match API expectations
      const transformedSettings = {
        job_notification_frequency: settings.JOB_NOTIFICATION_FREQUENCY,
        end_of_day_notifications: settings.END_OF_DAY_NOTIFICATIONS,
        end_of_day_time: settings.END_OF_DAY_TIME,
        email_notifications_enabled: settings.NOTIFICATION_ENABLED,
      };

      await updateEmailSettings({ settings: transformedSettings }).unwrap();
      toast.success("Email settings updated successfully!");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update email settings");
    }
  };

  const handleInputChange = (key: keyof EmailSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  if (error) {
    return (
      <ProtectedLayout allowedRoles={["ADMIN"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-500 mb-2">Failed to load email settings</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={["ADMIN"]}>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  <h1 className="text-2xl font-bold">Email Notification Settings</h1>
                </div>
                <Link
                  href="/admin/email-analytics"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  View Analytics
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid gap-6">
                {/* General Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      General Email Settings
                    </CardTitle>
                    <CardDescription>
                      Configure global email notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Enable Email Notifications</Label>
                        <div className="text-sm text-muted-foreground">
                          Turn on/off all email notifications globally
                        </div>
                      </div>
                      <Switch
                        checked={settings.NOTIFICATION_ENABLED}
                        onCheckedChange={(checked) =>
                          handleInputChange("NOTIFICATION_ENABLED", checked)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Job Notification Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Job Notification Frequency</CardTitle>
                    <CardDescription>
                      Configure the job posting threshold that triggers usage limit
                      emails.
                      <strong> Important:</strong> If usage limit emails are sent on any
                      day, End-of-Day emails will be automatically skipped to prevent
                      duplicate notifications.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">
                        Send notification when X jobs are posted per day
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="frequency"
                          type="number"
                          min="1"
                          max="50"
                          value={settings.JOB_NOTIFICATION_FREQUENCY}
                          onChange={(e) =>
                            handleInputChange(
                              "JOB_NOTIFICATION_FREQUENCY",
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">job posts</span>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Current Setting:</strong> Notifications sent when{" "}
                          <strong>{settings.JOB_NOTIFICATION_FREQUENCY}</strong> jobs
                          are posted per day.
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {settings.JOB_NOTIFICATION_FREQUENCY === 1
                            ? "⚠️ Recruiters will be notified for every single job posting (high frequency)."
                            : `Recruiters receive one email per day maximum - either usage limit OR end-of-day summary.`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* End of Day Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      End-of-Day Notifications
                    </CardTitle>
                    <CardDescription>
                      Configure daily summary email settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Enable End-of-Day Emails</Label>
                        <div className="text-sm text-muted-foreground">
                          Send daily summary emails to recruiters
                        </div>
                      </div>
                      <Switch
                        checked={settings.END_OF_DAY_NOTIFICATIONS}
                        onCheckedChange={(checked) =>
                          handleInputChange("END_OF_DAY_NOTIFICATIONS", checked)
                        }
                      />
                    </div>

                    {settings.END_OF_DAY_NOTIFICATIONS && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <Label htmlFor="eod-time">Send Time</Label>
                          <Input
                            id="eod-time"
                            type="time"
                            value={settings.END_OF_DAY_TIME}
                            onChange={(e) =>
                              handleInputChange("END_OF_DAY_TIME", e.target.value)
                            }
                            className="w-32"
                          />
                          <p className="text-xs text-muted-foreground">
                            Time when end-of-day emails will be sent (24-hour format)
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isUpdating}
                    className="min-w-[120px]"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedLayout>
  );
};

export default EmailSettingsPage;
