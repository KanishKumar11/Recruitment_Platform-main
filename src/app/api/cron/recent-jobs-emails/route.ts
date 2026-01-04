import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import { getAllEmailNotificationSettings, EMAIL_NOTIFICATION_SETTINGS } from "@/app/lib/emailNotificationSettings";
import Job, { JobStatus } from "@/app/models/Job";
import User, { UserRole } from "@/app/models/User";
import { transformJobForUser } from "@/app/lib/jobUtils";
import EmailNotification from "@/app/models/EmailNotification";

const runRecentJobBlast = async (days: number) => {
  const now = Date.now();
  const since = new Date(now - days * 24 * 60 * 60 * 1000);
  
  console.log(`\n========== RECENT JOBS EMAIL DEBUG - ${days} DAYS ==========`);
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
    console.log(`❌ No jobs found. Exiting.\n`);
    return { sent: false, jobCount: 0, recipientCount: 0 };
  }

  const recruiters = await User.find({ role: UserRole.RECRUITER, isActive: true })
    .select("_id name email")
    .lean();
  
  console.log(`[Recent Jobs Email] Found ${recruiters.length} active recruiters`);

  if (recruiters.length === 0) {
    console.log(`[Recent Jobs Email] No active recruiters found. Exiting.`);
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

  console.log(`[Recent Jobs Email] Prepared ${jobPayloads.length} job payloads`);
  console.log(`[Recent Jobs Email] Sending emails to ${recruiters.length} recruiters...`);

  let sentCount = 0;
  let failCount = 0;
  const jobIds = jobs.map((job) => job._id);

  await Promise.all(
    recruiters.map(async (recruiter, idx) => {
      try {
        console.log(`[Recent Jobs Email] Sending to recruiter ${idx + 1}/${recruiters.length}: ${recruiter.email} with ${jobPayloads.length} jobs`);
        const success = await sendEndOfDayNotificationEmail(
          recruiter.email,
          recruiter.name,
          jobPayloads,
          undefined
        );

        if (success) {
          console.log(`[Recent Jobs Email] ✓ Successfully sent to ${recruiter.email}`);
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
        console.error(`[Recent Jobs Email] ✗ Failed to send to ${recruiter.email}:`, err);
        failCount += 1;
      }
    })
  );
  
  console.log(`[Recent Jobs Email] Email blast complete for ${days} days:`);
  console.log(`  - Jobs found: ${jobPayloads.length}`);
  console.log(`  - Recruiters targeted: ${recruiters.length}`);
  console.log(`  - Successfully sent: ${sentCount}`);
  console.log(`  - Failed: ${failCount}`);

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
