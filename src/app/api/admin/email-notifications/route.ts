import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import EmailNotification from "@/app/models/EmailNotification";
import User from "@/app/models/User";
import Job from "@/app/models/Job";
import Settings from "@/app/models/Settings";
import { authenticateRequest, authorizeRoles } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import {
  getAllEmailNotificationSettings,
  EMAIL_NOTIFICATION_SETTINGS,
  initializeEmailNotificationSettings,
} from "@/app/lib/emailNotificationSettings";
import { addEmailNotificationJob } from "@/app/lib/jobQueue";

// GET - Fetch email notification statistics for admin panel
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize admin access
    const authResult = authenticateRequest(request);
    console.log(authResult);

    const hasAdminAccess = authorizeRoles(request, [
      UserRole.ADMIN,
      UserRole.INTERNAL,
    ]);
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDb();

    const { searchParams } = new URL(request.url);
    const timeFrame = searchParams.get("timeFrame") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build date filter based on timeFrame
    let dateFilter: any = {};
    const now = new Date();

    switch (timeFrame) {
      case "today":
        const startOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        dateFilter = { sentAt: { $gte: startOfDay, $lt: endOfDay } };
        break;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { sentAt: { $gte: weekAgo } };
        break;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = { sentAt: { $gte: monthAgo } };
        break;
      case "all":
      default:
        // No date filter for "all"
        break;
    }

    // Get overall statistics
    const totalNotifications = await EmailNotification.countDocuments(
      dateFilter
    );
    const successfulNotifications = await EmailNotification.countDocuments({
      ...dateFilter,
      status: "sent",
    });
    const failedNotifications = await EmailNotification.countDocuments({
      ...dateFilter,
      status: "failed",
    });
    const pendingNotifications = await EmailNotification.countDocuments({
      ...dateFilter,
      status: "pending",
    });

    // Get total recipients count
    const recipientStats = await EmailNotification.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRecipients: { $sum: "$recipientCount" },
          successfulRecipients: {
            $sum: {
              $cond: [{ $eq: ["$status", "sent"] }, "$recipientCount", 0],
            },
          },
          failedRecipients: {
            $sum: {
              $cond: [{ $eq: ["$status", "failed"] }, "$recipientCount", 0],
            },
          },
        },
      },
    ]);

    const recipientData = recipientStats[0] || {
      totalRecipients: 0,
      successfulRecipients: 0,
      failedRecipients: 0,
    };

    // Get recent notifications with pagination
    const recentNotifications = await EmailNotification.find(dateFilter)
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)
      .select({
        sentAt: 1,
        recipientCount: 1,
        status: 1,
        jobIds: 1,
        errorMessage: 1,
        retryCount: 1,
      });

    // Get daily statistics for the last 30 days (for charts)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyStats = await EmailNotification.aggregate([
      {
        $match: {
          sentAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$sentAt" },
            month: { $month: "$sentAt" },
            day: { $dayOfMonth: "$sentAt" },
          },
          totalNotifications: { $sum: 1 },
          totalRecipients: { $sum: "$recipientCount" },
          successfulNotifications: {
            $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] },
          },
          failedNotifications: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    // Get success rate by day
    const successRateData = dailyStats.map((day) => ({
      date: `${day._id.year}-${String(day._id.month).padStart(2, "0")}-${String(
        day._id.day
      ).padStart(2, "0")}`,
      successRate:
        day.totalNotifications > 0
          ? Math.round(
              (day.successfulNotifications / day.totalNotifications) * 100
            )
          : 0,
      totalNotifications: day.totalNotifications,
      totalRecipients: day.totalRecipients,
    }));

    // Calculate success rate
    const successRate =
      totalNotifications > 0
        ? Math.round((successfulNotifications / totalNotifications) * 100)
        : 0;

    const recipientSuccessRate =
      recipientData.totalRecipients > 0
        ? Math.round(
            (recipientData.successfulRecipients /
              recipientData.totalRecipients) *
              100
          )
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalNotifications,
          successfulNotifications,
          failedNotifications,
          pendingNotifications,
          successRate,
          totalRecipients: recipientData.totalRecipients,
          successfulRecipients: recipientData.successfulRecipients,
          failedRecipients: recipientData.failedRecipients,
          recipientSuccessRate,
        },
        recentNotifications,
        dailyStats: successRateData,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalNotifications / limit),
          totalItems: totalNotifications,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching email notification stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch email notification statistics" },
      { status: 500 }
    );
  }
}

// POST - Manually trigger bulk email notifications to all recruiters
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize admin access
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const hasAdminAccess = authorizeRoles(request, [
      UserRole.ADMIN,
      UserRole.INTERNAL,
    ]);
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDb();

    // Get email notification settings
    const settings = await getAllEmailNotificationSettings();

    // Check if notifications are enabled
    if (!settings.NOTIFICATION_ENABLED) {
      return NextResponse.json(
        {
          error: "Email notifications are disabled in settings",
          sent: false,
        },
        { status: 400 }
      );
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    // Find jobs posted today that are active
    const todaysJobs = await Job.find({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
      status: "active",
    }).populate("company", "name");

    // Get all active recruiters
    const recruiters = await User.find({
      role: "RECRUITER",
      isActive: true,
    }).select("email name");

    if (recruiters.length === 0) {
      return NextResponse.json(
        {
          error: "No active recruiters found",
          sent: false,
        },
        { status: 400 }
      );
    }

    // Send emails immediately for manual bulk notifications
    const { sendEndOfDayNotificationEmail } = await import(
      "@/app/lib/recruiterEmailService"
    );

    const emailPromises = recruiters.map(async (recruiter) => {
      try {
        const success = await sendEndOfDayNotificationEmail(
          recruiter.email,
          recruiter.name,
          todaysJobs.map((job) => ({
            title: job.title,
            company: job.company?.name || "Unknown Company",
            location: job.location,
            type: job.type,
            postedAt: job.createdAt,
          })),
          undefined // No notification ID for manual emails
        );

        if (success) {
          // Create notification record for tracking
          await EmailNotification.create({
            recruiterId: recruiter._id,
            emailType: "JOB_NOTIFICATION",
            type: "end_of_day_summary",
            jobCount: todaysJobs.length,
            jobIds: todaysJobs.map((job) => job._id),
            sentDate: new Date(),
            emailSent: true,
            emailSentAt: new Date(),
            recipientCount: 1,
            status: "sent",
          });
        }

        return success;
      } catch (error) {
        console.error(
          `Failed to send manual email to ${recruiter.email}:`,
          error
        );
        return false;
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(Boolean).length;

    return NextResponse.json({
      message: `Manual bulk email notifications sent successfully`,
      jobCount: todaysJobs.length,
      recipientCount: recruiters.length,
      sentCount: successCount,
      failedCount: recruiters.length - successCount,
      sent: true,
      emailType: "end_of_day_summary",
    });
  } catch (error) {
    console.error("Error sending manual bulk emails:", error);
    return NextResponse.json(
      {
        error: "Failed to send manual bulk emails",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
