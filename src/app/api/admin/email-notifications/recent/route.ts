import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import { authenticateRequest, authorizeRoles } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import Job, { JobStatus } from "@/app/models/Job";
import User from "@/app/models/User";
import { addEmailNotificationJob } from "@/app/lib/jobQueue";
import {
  getAllEmailNotificationSettings,
  EMAIL_NOTIFICATION_SETTINGS,
} from "@/app/lib/emailNotificationSettings";
import { transformJobForUser } from "@/app/lib/jobUtils";

const DAYS_OPTIONS = [1, 3];

const buildJobPayload = (job: any) => {
  let commissionText = "";
  const amount = job.commission?.recruiterAmount;
  if (typeof amount === "number" && amount > 0) {
    commissionText = `$${amount.toLocaleString()}`;
  }

  return {
    title: job.title,
    company: job.companyName || job.postedByCompany || "Company",
    location: job.location,
    type: job.jobType || "",
    postedAt: job.createdAt || new Date(),
    commission: commissionText || undefined,
  };
};

export async function POST(request: NextRequest) {
  try {
    const userData = authenticateRequest(request);
    if (!userData) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!authorizeRoles(request, [UserRole.ADMIN, UserRole.INTERNAL])) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectDb();

    const body = await request.json();
    const days = Number(body?.days || 1);

    if (!DAYS_OPTIONS.includes(days)) {
      return NextResponse.json({ error: "days must be 1 or 3" }, { status: 400 });
    }

    const settings = await getAllEmailNotificationSettings();
    if (!settings.NOTIFICATION_ENABLED) {
      return NextResponse.json({ error: "Email notifications are disabled" }, { status: 400 });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const jobs = await Job.find({
      createdAt: { $gte: since },
      status: { $in: [JobStatus.ACTIVE, JobStatus.PAUSED] },
    })
      .select("title location commission salary createdAt")
      .lean();

    if (jobs.length === 0) {
      return NextResponse.json({ message: "No recent jobs found", sent: false, days });
    }

    // Fetch all active recruiters
    const recruiters = await User.find({ role: UserRole.RECRUITER, isActive: true })
      .select("_id name email")
      .lean();

    if (recruiters.length === 0) {
      return NextResponse.json({ error: "No active recruiters found", sent: false }, { status: 400 });
    }

    // Prepare jobs with recruiter-facing commission values
    const jobPayloads = jobs.map((job) => {
      const recruiterView = transformJobForUser(job, UserRole.RECRUITER);
      return buildJobPayload(recruiterView);
    });

    const notificationType = "end_of_day_summary";

    const jobsToSend = jobPayloads;

    const emailPromises = recruiters.map((recruiter) =>
      addEmailNotificationJob({
        type: notificationType,
        recipientEmail: recruiter.email,
        recipientName: recruiter.name,
        jobs: jobsToSend,
        notificationId: undefined,
      })
    );

    await Promise.all(emailPromises);

    return NextResponse.json({
      message: `Queued ${jobsToSend.length} jobs to ${recruiters.length} recruiters`,
      sent: true,
      days,
      jobCount: jobsToSend.length,
      recipientCount: recruiters.length,
    });
  } catch (error) {
    console.error("Error sending recent jobs emails:", error);
    return NextResponse.json({ error: "Failed to send recent jobs emails" }, { status: 500 });
  }
}
