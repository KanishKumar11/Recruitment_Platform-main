import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import { getAllEmailNotificationSettings, EMAIL_NOTIFICATION_SETTINGS } from "@/app/lib/emailNotificationSettings";
import Job, { JobStatus } from "@/app/models/Job";
import User, { UserRole } from "@/app/models/User";
import { transformJobForUser } from "@/app/lib/jobUtils";
import EmailNotification from "@/app/models/EmailNotification";

const runRecentJobBlast = async (days: number) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const jobs = await Job.find({
    createdAt: { $gte: since },
    status: { $in: [JobStatus.ACTIVE, JobStatus.PAUSED] },
  })
    .select("title location commission salary createdAt")
    .lean();

  if (jobs.length === 0) {
    return { sent: false, jobCount: 0, recipientCount: 0 };
  }

  const recruiters = await User.find({ role: UserRole.RECRUITER, isActive: true })
    .select("_id name email")
    .lean();

  if (recruiters.length === 0) {
    return { sent: false, jobCount: jobs.length, recipientCount: 0 };
  }

  const jobPayloads = jobs.map((job) => {
    const recruiterView = transformJobForUser(job, UserRole.RECRUITER);
    const amount = recruiterView.commission?.recruiterAmount;
    const commissionText =
      typeof amount === "number" && amount > 0
        ? `$${amount.toLocaleString()}`
        : undefined;

    return {
      title: recruiterView.title,
      company: recruiterView.companyName || recruiterView.postedByCompany || "Company",
      location: recruiterView.location,
      type: recruiterView.jobType || "",
      postedAt: recruiterView.createdAt || new Date(),
      commission: commissionText,
    };
  });

  const notificationType = "end_of_day_summary";
  const { sendEndOfDayNotificationEmail } = await import("@/app/lib/recruiterEmailService");

  let sentCount = 0;
  let failCount = 0;
  const jobIds = jobs.map((job) => job._id);

  await Promise.all(
    recruiters.map(async (recruiter) => {
      try {
        const success = await sendEndOfDayNotificationEmail(
          recruiter.email,
          recruiter.name,
          jobPayloads,
          undefined
        );

        if (success) {
          sentCount += 1;
          await EmailNotification.create({
            recruiterId: recruiter._id,
            emailType: "JOB_NOTIFICATION",
            type: notificationType,
            jobCount: jobPayloads.length,
            jobIds,
            sentDate: new Date(),
            emailSent: true,
            emailSentAt: new Date(),
            sentAt: new Date(),
            recipientCount: 1,
            status: "sent",
          });
        } else {
          failCount += 1;
        }
      } catch (err) {
        console.error("Failed to send recent jobs cron email", err);
        failCount += 1;
      }
    })
  );

  return { sent: sentCount > 0, jobCount: jobPayloads.length, recipientCount: recruiters.length, failedCount: failCount };
};

export async function POST(_request: NextRequest) {
  try {
    await connectDb();
    const settings = await getAllEmailNotificationSettings();

    if (!settings.NOTIFICATION_ENABLED) {
      return NextResponse.json({ message: "Email notifications disabled", sent: false });
    }

    const results: Array<{ window: string; sent: boolean; jobCount: number; recipientCount: number }> = [];

    if (settings[EMAIL_NOTIFICATION_SETTINGS.RECENT_JOBS_AUTO_1D]) {
      const res = await runRecentJobBlast(1);
      results.push({ window: "1d", ...res });
    }

    if (settings[EMAIL_NOTIFICATION_SETTINGS.RECENT_JOBS_AUTO_3D]) {
      const res = await runRecentJobBlast(3);
      results.push({ window: "3d", ...res });
    }

    return NextResponse.json({
      message: "Recent job email cron completed",
      results,
    });
  } catch (error) {
    console.error("Error running recent jobs email cron:", error);
    return NextResponse.json({ error: "Failed to run recent jobs email cron" }, { status: 500 });
  }
}
