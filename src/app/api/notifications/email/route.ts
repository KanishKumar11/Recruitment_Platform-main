import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import {
  shouldSendGlobalNotification,
  shouldSendNotification,
  getActiveRecruiters,
  sendRecruiterJobNotificationEmail,
} from "@/app/lib/recruiterEmailService";
import {
  addBulkEmailNotificationJob,
  addEmailNotificationJob,
  getProcessorStatus,
  processJobsNow,
  backgroundJobProcessor,
} from "@/app/lib/backgroundJobProcessor";
import EmailNotification from "@/app/models/EmailNotification";
import connectDb from "@/app/lib/db";

// GET - Check notification status and queue status
export async function GET(request: NextRequest) {
  try {
    // Start background processor if not already running
    backgroundJobProcessor.start();

    // Authenticate request
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin and internal users to check notification status
    if (
      authResult.role !== UserRole.ADMIN &&
      authResult.role !== UserRole.INTERNAL
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDb();

    // Get processor status
    const processorStatus = getProcessorStatus();

    // Check global notification criteria
    const globalNotificationCheck = await shouldSendGlobalNotification();

    // Get recent notifications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentNotifications = await EmailNotification.find({
      sentDate: { $gte: sevenDaysAgo },
    })
      .populate("recruiterId", "name email")
      .sort({ sentDate: -1 })
      .limit(50)
      .lean();

    // Get today's notifications
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysNotifications = await EmailNotification.find({
      sentDate: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate("recruiterId", "name email")
      .lean();

    // Get active recruiters count
    const activeRecruiters = await getActiveRecruiters();

    return NextResponse.json({
      processorStatus,
      globalNotificationCheck,
      statistics: {
        activeRecruitersCount: activeRecruiters.length,
        todaysNotificationsCount: todaysNotifications.length,
        recentNotificationsCount: recentNotifications.length,
      },
      recentNotifications: recentNotifications.map((notification) => ({
        id: notification._id,
        recruiter: {
          id: (notification.recruiterId as any)?._id,
          name: (notification.recruiterId as any)?.name,
          email: (notification.recruiterId as any)?.email,
        },
        emailType: notification.emailType,
        sentDate: notification.sentDate,
        jobCount: notification.jobCount,
        emailSent: notification.emailSent,
        retryCount: notification.retryCount,
        lastError: notification.lastError,
      })),
      todaysNotifications: todaysNotifications.map((notification) => ({
        id: notification._id,
        recruiter: {
          id: (notification.recruiterId as any)?._id,
          name: (notification.recruiterId as any)?.name,
          email: (notification.recruiterId as any)?.email,
        },
        emailType: notification.emailType,
        sentDate: notification.sentDate,
        jobCount: notification.jobCount,
        emailSent: notification.emailSent,
        retryCount: notification.retryCount,
        lastError: notification.lastError,
      })),
    });
  } catch (error) {
    console.error("Error fetching notification status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Manually trigger email notifications
export async function POST(request: NextRequest) {
  try {
    // Start background processor if not already running
    backgroundJobProcessor.start();

    // Authenticate request
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin and internal users to trigger notifications
    if (
      authResult.role !== UserRole.ADMIN &&
      authResult.role !== UserRole.INTERNAL
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, recruiterId, force = false } = body;

    await connectDb();

    switch (action) {
      case "trigger_bulk":
        // Trigger bulk notification for all recruiters
        const globalCheck = await shouldSendGlobalNotification();

        if (!globalCheck.shouldSend && !force) {
          return NextResponse.json({
            message: "No bulk notification needed at this time",
            jobCount: globalCheck.jobCount,
            shouldSend: globalCheck.shouldSend,
          });
        }

        const jobId = await addBulkEmailNotificationJob(
          globalCheck.jobIds,
          globalCheck.jobCount
        );

        return NextResponse.json({
          message: "Bulk email notification job added to queue",
          jobId,
          jobCount: globalCheck.jobCount,
          jobIds: globalCheck.jobIds,
        });

      case "trigger_individual":
        // Trigger notification for specific recruiter
        if (!recruiterId) {
          return NextResponse.json(
            { error: "recruiterId is required for individual notifications" },
            { status: 400 }
          );
        }

        const recruiterCheck = await shouldSendNotification(recruiterId);

        if (!recruiterCheck.shouldSend && !force) {
          return NextResponse.json({
            message: "No notification needed for this recruiter at this time",
            recruiterId,
            jobCount: recruiterCheck.jobCount,
            shouldSend: recruiterCheck.shouldSend,
          });
        }

        // Get recruiter details
        const recruiters = await getActiveRecruiters();
        const recruiter = recruiters.find((r) => r.id === recruiterId);

        if (!recruiter) {
          return NextResponse.json(
            { error: "Recruiter not found or not active" },
            { status: 404 }
          );
        }

        const individualJobId = await addEmailNotificationJob(
          recruiter.id,
          recruiter.name,
          recruiter.email,
          recruiterCheck.jobIds,
          recruiterCheck.jobCount
        );

        return NextResponse.json({
          message: "Individual email notification job added to queue",
          jobId: individualJobId,
          recruiterId,
          recruiterName: recruiter.name,
          jobCount: recruiterCheck.jobCount,
        });

      case "process_now":
        // Process pending jobs immediately
        await processJobsNow();

        return NextResponse.json({
          message: "Background job processing triggered successfully",
        });

      case "test_email":
        // Send test email to specific recruiter
        if (!recruiterId) {
          return NextResponse.json(
            { error: "recruiterId is required for test emails" },
            { status: 400 }
          );
        }

        const testRecruiters = await getActiveRecruiters();
        const testRecruiter = testRecruiters.find((r) => r.id === recruiterId);

        if (!testRecruiter) {
          return NextResponse.json(
            { error: "Recruiter not found or not active" },
            { status: 404 }
          );
        }

        // Get some sample job IDs for testing
        const testGlobalCheck = await shouldSendGlobalNotification();
        const testJobIds = testGlobalCheck.jobIds.slice(0, 3); // Use up to 3 jobs for testing

        if (testJobIds.length === 0) {
          return NextResponse.json(
            { error: "No active jobs available for test email" },
            { status: 400 }
          );
        }

        const testSuccess = await sendRecruiterJobNotificationEmail(
          testRecruiter.id,
          testRecruiter.name,
          testRecruiter.email,
          testJobIds,
          testJobIds.length
        );

        return NextResponse.json({
          message: testSuccess
            ? "Test email sent successfully"
            : "Test email failed to send",
          success: testSuccess,
          recruiterId,
          recruiterName: testRecruiter.name,
          recruiterEmail: testRecruiter.email,
          jobCount: testJobIds.length,
        });

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Supported actions: trigger_bulk, trigger_individual, process_now, test_email",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error processing notification request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Clear old notifications
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin users to delete notifications
    if (authResult.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get("daysOld") || "30");

    await connectDb();

    // Delete notifications older than specified days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deleteResult = await EmailNotification.deleteMany({
      sentDate: { $lt: cutoffDate },
    });

    return NextResponse.json({
      message: `Deleted ${deleteResult.deletedCount} old notifications`,
      deletedCount: deleteResult.deletedCount,
      cutoffDate,
    });
  } catch (error) {
    console.error("Error deleting old notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
