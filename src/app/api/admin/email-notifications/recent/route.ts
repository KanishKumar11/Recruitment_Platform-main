import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import { authenticateRequest, authorizeRoles } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import Job, { JobStatus } from "@/app/models/Job";
import User from "@/app/models/User";
import EmailNotification from "@/app/models/EmailNotification";
import { getAllEmailNotificationSettings } from "@/app/lib/emailNotificationSettings";
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

    const now = Date.now();
    const since = new Date(now - days * 24 * 60 * 60 * 1000);
    
    console.log(`\n========== MANUAL RECENT JOBS EMAIL - ${days} DAYS ==========`);
    console.log(`Current timestamp (ms): ${now}`);
    console.log(`Current time: ${new Date(now).toISOString()}`);
    console.log(`Current time (local): ${new Date(now).toString()}`);
    console.log(`\nCalculating since date:`);
    console.log(`  ${days} days = ${days * 24} hours = ${days * 24 * 60} minutes = ${days * 24 * 60 * 60} seconds = ${days * 24 * 60 * 60 * 1000} milliseconds`);
    console.log(`Since timestamp (ms): ${since.getTime()}`);
    console.log(`Since date: ${since.toISOString()}`);
    console.log(`Since date (local): ${since.toString()}`);
    console.log(`\nQuery: createdAt >= ${since.toISOString()}`);
    console.log(`Query: status in [ACTIVE, PAUSED]`);
    
    // First, let's see ALL jobs in the database with their dates
    const allJobs = await Job.find()
      .select('title createdAt status')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean() as any[];
    
    console.log(`\n=== ALL JOBS IN DATABASE (most recent 10) ===`);
    if (allJobs.length === 0) {
      console.log('❌ NO JOBS FOUND IN DATABASE!');
    } else {
      allJobs.forEach((job, idx) => {
        const jobDate = new Date(job.createdAt);
        const isWithinRange = jobDate >= since;
        const daysDiff = (now - jobDate.getTime()) / (1000 * 60 * 60 * 24);
        console.log(`${idx + 1}. "${job.title}"`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Created: ${jobDate.toISOString()} (${daysDiff.toFixed(2)} days ago)`);
        console.log(`   Within range: ${isWithinRange ? '✓ YES' : '✗ NO'}`);
      });
    }
    
    console.log(`\n=== RUNNING FILTERED QUERY ===`);
    const jobs = await Job.find({
      createdAt: { $gte: since },
      status: { $in: [JobStatus.ACTIVE, JobStatus.PAUSED] },
    })
      .select("title location commission salary createdAt status")
      .lean() as any[];
    
    console.log(`\n✓ Query returned ${jobs.length} jobs`);
    if (jobs.length > 0) {
      console.log(`\n=== MATCHED JOBS ===`);
      jobs.forEach((job, idx) => {
        const jobDate = new Date(job.createdAt);
        const daysDiff = (now - jobDate.getTime()) / (1000 * 60 * 60 * 24);
        console.log(`${idx + 1}. "${job.title}" - ${jobDate.toISOString()} (${daysDiff.toFixed(2)} days ago) - Status: ${job.status}`);
      });
    }
    console.log(`========================================\n`);

    if (jobs.length === 0) {
      console.log(`❌ No jobs found. Returning error.\n`);
      return NextResponse.json({ message: "No recent jobs found", sent: false, days });
    }

    // Fetch all active recruiters
    const recruiters = await User.find({ role: UserRole.RECRUITER, isActive: true })
      .select("_id name email")
      .lean();
    
    console.log(`Found ${recruiters.length} active recruiters\n`);

    if (recruiters.length === 0) {
      return NextResponse.json({ error: "No active recruiters found", sent: false }, { status: 400 });
    }

    // Prepare jobs with recruiter-facing commission values
    const jobPayloads = jobs.map((job) => {
      const recruiterView = transformJobForUser(job, UserRole.RECRUITER);
      return buildJobPayload(recruiterView);
    });
    
    console.log(`[Manual Recent Jobs] Prepared ${jobPayloads.length} job payloads`);
    console.log(`[Manual Recent Jobs] Sending emails to ${recruiters.length} recruiters...`);

    const notificationType = "end_of_day_summary";
    const { sendEndOfDayNotificationEmail } = await import("@/app/lib/recruiterEmailService");

    const jobsToSend = jobPayloads;
    const jobIds = jobs.map((job) => job._id);

    let sentCount = 0;
    let failCount = 0;

    await Promise.all(
      recruiters.map(async (recruiter) => {
        try {
          const success = await sendEndOfDayNotificationEmail(
            recruiter.email,
            recruiter.name,
            jobsToSend,
            undefined
          );

          if (success) {
            sentCount += 1;
            await EmailNotification.create({
              recruiterId: recruiter._id,
              emailType: "JOB_NOTIFICATION",
              type: notificationType,
              jobCount: jobsToSend.length,
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
          console.error("Failed to send recent jobs email", err);
          failCount += 1;
        }
      })
    );

    return NextResponse.json({
      message: `Sent ${sentCount} of ${recruiters.length} recruiters`,
      sent: sentCount > 0,
      days,
      jobCount: jobsToSend.length,
      recipientCount: recruiters.length,
      failedCount: failCount,
    });
  } catch (error) {
    console.error("Error sending recent jobs emails:", error);
    return NextResponse.json({ error: "Failed to send recent jobs emails" }, { status: 500 });
  }
}
