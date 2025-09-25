import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, authorizeRoles } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import connectDb from "@/app/lib/db";
import EmailNotification from "@/app/models/EmailNotification";

interface EmailStat {
  type: string;
  status: string;
  count: number;
  recipients: number;
}

interface EmailTypeStats {
  sent: number;
  failed: number;
  pending: number;
  recipients: number;
}

interface DayStats {
  usageLimit: EmailTypeStats;
  eod: EmailTypeStats;
  total: EmailTypeStats;
}

// GET - Email analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    if (!authorizeRoles(request, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDb();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Daily email statistics
    const dailyStats = await EmailNotification.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            type: "$type",
            status: "$status",
          },
          count: { $sum: 1 },
          totalRecipients: { $sum: "$recipientCount" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          stats: {
            $push: {
              type: "$_id.type",
              status: "$_id.status",
              count: "$count",
              recipients: "$totalRecipients",
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Overall statistics
    const overallStats = await EmailNotification.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalEmails: { $sum: 1 },
          totalRecipients: { $sum: "$recipientCount" },
          sentEmails: {
            $sum: {
              $cond: [{ $eq: ["$status", "sent"] }, 1, 0],
            },
          },
          failedEmails: {
            $sum: {
              $cond: [{ $eq: ["$status", "failed"] }, 1, 0],
            },
          },
          pendingEmails: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
          usageLimitEmails: {
            $sum: {
              $cond: [{ $eq: ["$type", "job_batch"] }, 1, 0],
            },
          },
          eodEmails: {
            $sum: {
              $cond: [{ $eq: ["$type", "end_of_day_summary"] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Email type breakdown by day
    const emailTypeBreakdown = await EmailNotification.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            type: "$type",
          },
          count: { $sum: 1 },
          recipients: { $sum: "$recipientCount" },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
    ]);

    // Success rate by email type
    const successRateByType = await EmailNotification.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: 1 },
          successful: {
            $sum: {
              $cond: [{ $eq: ["$status", "sent"] }, 1, 0],
            },
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ["$status", "failed"] }, 1, 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
        },
      },
      {
        $addFields: {
          successRate: {
            $multiply: [{ $divide: ["$successful", "$total"] }, 100],
          },
        },
      },
    ]);

    // Recent failed emails for debugging
    const recentFailures = await EmailNotification.find({
      status: "failed",
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("type errorMessage createdAt recipientCount retryCount");

    // Format daily stats for easier consumption
    const formattedDailyStats = dailyStats.map((day) => {
      const dayStats = {
        date: day._id,
        usageLimit: { sent: 0, failed: 0, pending: 0, recipients: 0 },
        eod: { sent: 0, failed: 0, pending: 0, recipients: 0 },
        total: { sent: 0, failed: 0, pending: 0, recipients: 0 },
      };

      day.stats.forEach((stat: EmailStat) => {
        const type = stat.type === "job_batch" ? "usageLimit" : "eod";
        const statusKey = stat.status as keyof EmailTypeStats;
        if (statusKey in dayStats[type]) {
          (dayStats[type] as any)[statusKey] = stat.count;
          dayStats[type].recipients += stat.recipients;
          (dayStats.total as any)[statusKey] += stat.count;
          dayStats.total.recipients += stat.recipients;
        }
      });

      return dayStats;
    });

    return NextResponse.json({
      dailyStats: formattedDailyStats,
      overallStats: overallStats[0] || {
        totalEmails: 0,
        totalRecipients: 0,
        sentEmails: 0,
        failedEmails: 0,
        pendingEmails: 0,
        usageLimitEmails: 0,
        eodEmails: 0,
      },
      emailTypeBreakdown,
      successRateByType,
      recentFailures,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error("Error fetching email analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch email analytics" },
      { status: 500 }
    );
  }
}
