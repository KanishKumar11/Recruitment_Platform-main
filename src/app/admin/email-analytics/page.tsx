"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Mail,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { RootState } from "@/app/store/index";
import { UserRole } from "@/app/constants/userRoles";
import ProtectedLayout from "@/app/components/layout/ProtectedLayout";

interface EmailAnalytics {
  dailyStats: Array<{
    date: string;
    usageLimit: {
      sent: number;
      failed: number;
      pending: number;
      recipients: number;
    };
    eod: { sent: number; failed: number; pending: number; recipients: number };
    total: {
      sent: number;
      failed: number;
      pending: number;
      recipients: number;
    };
  }>;
  overallStats: {
    totalEmails: number;
    totalRecipients: number;
    sentEmails: number;
    failedEmails: number;
    pendingEmails: number;
    usageLimitEmails: number;
    eodEmails: number;
  };
  emailTypeBreakdown: Array<{
    _id: { date: string; type: string };
    count: number;
    recipients: number;
  }>;
  successRateByType: Array<{
    _id: string;
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: number;
  }>;
  recentFailures: Array<{
    _id: string;
    type: string;
    errorMessage?: string;
    createdAt: string;
    recipientCount: number;
    retryCount: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

export default function EmailAnalyticsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState("30");

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  const fetchAnalytics = async (days: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/email-analytics?days=${days}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      fetchAnalytics(selectedDays);
    }
  }, [user, selectedDays]);

  const handleDaysChange = (days: string) => {
    setSelectedDays(days);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Error Loading Analytics
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchAnalytics(selectedDays)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { overallStats, successRateByType, recentFailures, dailyStats } =
    analytics;
  const successRate =
    overallStats.totalEmails > 0
      ? ((overallStats.sentEmails / overallStats.totalEmails) * 100).toFixed(1)
      : "0";

  return (
    <ProtectedLayout allowedRoles={["ADMIN"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Email Analytics Dashboard</h1>
          <div className="flex items-center gap-4">
            <Select value={selectedDays} onValueChange={handleDaysChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => fetchAnalytics(selectedDays)}
              variant="outline"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Emails
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallStats.totalEmails}
              </div>
              <p className="text-xs text-muted-foreground">
                {overallStats.totalRecipients} recipients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {successRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                {overallStats.sentEmails} sent successfully
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usage Limit Emails
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {overallStats.usageLimitEmails}
              </div>
              <p className="text-xs text-muted-foreground">
                Triggered by job applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">EOD Emails</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {overallStats.eodEmails}
              </div>
              <p className="text-xs text-muted-foreground">
                End-of-day summaries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Email Type Success Rates */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Success Rate by Email Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {successRateByType.map((type) => (
                <div
                  key={type._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">
                      {type._id === "job_batch"
                        ? "Usage Limit Emails"
                        : "End-of-Day Emails"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {type.total} total emails
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {type.successRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {type.successful} sent, {type.failed} failed,{" "}
                        {type.pending} pending
                      </div>
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${type.successRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Failures */}
        {recentFailures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Recent Failures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentFailures.map((failure) => (
                  <div
                    key={failure._id}
                    className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">
                          {failure.type === "job_batch" ? "Usage Limit" : "EOD"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(failure.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">
                        {failure.recipientCount} recipients •{" "}
                        {failure.retryCount} retries
                      </p>
                      {failure.errorMessage && (
                        <p className="text-xs text-red-600 mt-1 font-mono">
                          {failure.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedLayout>
  );
}
