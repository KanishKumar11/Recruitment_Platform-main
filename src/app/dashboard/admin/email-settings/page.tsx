"use client";

import React, { useState } from "react";
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
import { Loader2, Mail, Clock, Settings } from "lucide-react";

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

  React.useEffect(() => {
    if (emailSettingsData?.settings) {
      setSettings({
        JOB_NOTIFICATION_FREQUENCY:
          emailSettingsData.settings.JOB_NOTIFICATION_FREQUENCY || 5,
        END_OF_DAY_NOTIFICATIONS:
          emailSettingsData.settings.END_OF_DAY_NOTIFICATIONS || false,
        END_OF_DAY_TIME: emailSettingsData.settings.END_OF_DAY_TIME || "18:00",
        NOTIFICATION_ENABLED:
          emailSettingsData.settings.NOTIFICATION_ENABLED !== false,
      });
    }
  }, [emailSettingsData]);

  const handleSaveSettings = async () => {
    try {
      await updateEmailSettings({ settings }).unwrap();
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load email settings</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Email Notification Settings</h1>
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
              Configure global email notification settings for the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Master switch for all email notifications
                </p>
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

        {/* Job Notification Frequency */}
        <Card>
          <CardHeader>
            <CardTitle>Job Notification Frequency</CardTitle>
            <CardDescription>
              Configure how often recruiters receive email notifications about
              new job posts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">
                Send notification every X job posts
              </Label>
              <div className="flex items-center gap-2">
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
                  className="w-24"
                  disabled={!settings.NOTIFICATION_ENABLED}
                />
                <span className="text-sm text-muted-foreground">job posts</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Currently set to send notifications every{" "}
                {settings.JOB_NOTIFICATION_FREQUENCY} job posts.
                {settings.JOB_NOTIFICATION_FREQUENCY === 1 &&
                  " Recruiters will be notified for every single job post."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* End of Day Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              End-of-Day Notifications
            </CardTitle>
            <CardDescription>
              Send daily summary emails even if the frequency threshold hasn't
              been met
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">
                  Enable End-of-Day Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send emails at the end of each day, even for single job posts
                </p>
              </div>
              <Switch
                checked={settings.END_OF_DAY_NOTIFICATIONS}
                onCheckedChange={(checked) =>
                  handleInputChange("END_OF_DAY_NOTIFICATIONS", checked)
                }
                disabled={!settings.NOTIFICATION_ENABLED}
              />
            </div>

            {settings.END_OF_DAY_NOTIFICATIONS && (
              <div className="space-y-2">
                <Label htmlFor="endOfDayTime">Send time</Label>
                <Input
                  id="endOfDayTime"
                  type="time"
                  value={settings.END_OF_DAY_TIME}
                  onChange={(e) =>
                    handleInputChange("END_OF_DAY_TIME", e.target.value)
                  }
                  className="w-32"
                  disabled={!settings.NOTIFICATION_ENABLED}
                />
                <p className="text-sm text-muted-foreground">
                  Daily summary emails will be sent at{" "}
                  {settings.END_OF_DAY_TIME} if there are any job posts that
                  haven't triggered the frequency-based notifications.
                </p>
              </div>
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
  );
};

export default EmailSettingsPage;