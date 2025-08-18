// import { createTransporter } from './emailService'; // Using local transporter instead
import EmailNotification from "../models/EmailNotification";
import Job from "../models/Job";
import User from "../models/User";
import connectDb from "./db";

interface JobDetails {
  title: string;
  location: string;
  commission: {
    type: "percentage" | "fixed" | "hourly";
    recruiterAmount: number;
  };
  salary: {
    min: number;
    max: number;
    currency: string;
  };
}

// Get recruiter job notification email template
const getRecruiterJobNotificationTemplate = (
  recruiterName: string,
  jobs: JobDetails[],
  totalJobCount: number
) => {
  const jobListHtml = jobs
    .map((job) => {
      let commissionText = "";
      if (job.commission.type === "percentage") {
        commissionText = `$${job.commission.recruiterAmount.toLocaleString()}`;
      } else if (job.commission.type === "fixed") {
        commissionText = `$${job.commission.recruiterAmount.toLocaleString()}`;
      } else {
        commissionText = `$${job.commission.recruiterAmount.toLocaleString()}/hr`;
      }

      const salaryRange = `${
        job.salary.currency
      } ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`;

      return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 15px; font-weight: bold; color: #333;">${job.title}</td>
        <td style="padding: 15px; color: #666;">${job.location}</td>
        <td style="padding: 15px; color: #667eea; font-weight: bold;">${commissionText}</td>
        <td style="padding: 15px; color: #666; font-size: 12px;">${salaryRange}</td>
      </tr>
    `;
    })
    .join("");

  return {
    subject: `${totalJobCount} New Job${
      totalJobCount > 1 ? "s" : ""
    } Available - Upload Candidates Now!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Jobs Available</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 700px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
          .intro { font-size: 16px; color: #666; margin-bottom: 30px; line-height: 1.6; }
          .jobs-table { width: 100%; border-collapse: collapse; margin: 30px 0; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .jobs-table th { background-color: #667eea; color: white; padding: 15px; text-align: left; font-weight: bold; }
          .jobs-table td { padding: 15px; border-bottom: 1px solid #eee; }
          .jobs-table tr:last-child td { border-bottom: none; }
          .cta-section { background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
          .cta-button { display: inline-block; padding: 15px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 10px; }
          .cta-button:hover { background-color: #5a6fd8; }
          .instructions { background-color: #e8f4fd; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .instructions h3 { color: #667eea; margin-top: 0; }
          .instructions ol { color: #666; line-height: 1.6; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Jobs Available!</h1>
          </div>
          <div class="content">
            <div class="greeting">
              Hello ${recruiterName}!
            </div>
            
            <div class="intro">
              There ${
                totalJobCount === 1 ? "is" : "are"
              } <strong>${totalJobCount}</strong> recently posted job${
      totalJobCount > 1 ? "s" : ""
    } available for you!
              <br><br>
              Please access your DASHBOARD and upload candidates to the relevant jobs. Please do not reply to this email.
            </div>

            <table class="jobs-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Location</th>
                  <th>Commission Amount</th>
                  <th>Salary Offered</th>
                </tr>
              </thead>
              <tbody>
                ${jobListHtml}
              </tbody>
            </table>

            <div class="cta-section">
              <h3 style="color: #333; margin-top: 0;">Ready to Start Earning?</h3>
              <p style="color: #666; margin-bottom: 20px;">Access your dashboard to view these opportunities and start uploading candidates.</p>
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL || "https://sourcingscreen.com"
              }/dashboard/recruiter" class="cta-button">
                🚀 Access Dashboard
              </a>
            </div>

            <div class="instructions">
              <h3>How to Get Started:</h3>
              <ol>
                <li>Log in to your account using your username and password</li>
                <li>Navigate to your dashboard and click on "Live Jobs"</li>
                <li>Review the job details and requirements</li>
                <li>Click on "Accept Job" to start working on the position</li>
                <li>Upload qualified candidates to earn your commission</li>
              </ol>
            </div>

            <div class="warning">
              <strong>⏰ Act Fast:</strong> These are active job postings. The sooner you upload quality candidates, the better your chances of earning commissions!
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from SourcingScreen.</p>
            <p><strong>Please do not reply to this email.</strong></p>
            <p>&copy; ${new Date().getFullYear()} SourcingScreen. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${recruiterName}!
      
      There ${
        totalJobCount === 1 ? "is" : "are"
      } ${totalJobCount} recently posted job${
      totalJobCount > 1 ? "s" : ""
    } available for you!
      
      Please access your DASHBOARD and upload candidates to the relevant jobs. Please do not reply to this email.
      
      JOB DETAILS:
      ${jobs
        .map((job) => {
          let commissionText = "";
          if (job.commission.type === "percentage") {
            commissionText = `$${job.commission.recruiterAmount.toLocaleString()}`;
          } else if (job.commission.type === "fixed") {
            commissionText = `$${job.commission.recruiterAmount.toLocaleString()}`;
          } else {
            commissionText = `$${job.commission.recruiterAmount.toLocaleString()}/hr`;
          }

          const salaryRange = `${
            job.salary.currency
          } ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`;

          return `• ${job.title} | ${job.location} | Commission: ${commissionText} | Salary: ${salaryRange}`;
        })
        .join("\n      ")}
      
      HOW TO GET STARTED:
      1. Log in to your account using your username and password
      2. Navigate to your dashboard and click on "Live Jobs"
      3. Review the job details and requirements
      4. Click on "Accept Job" to start working on the position
      5. Upload qualified candidates to earn your commission
      
      Dashboard URL: ${
        process.env.NEXT_PUBLIC_APP_URL || "https://sourcingscreen.com"
      }/dashboard/recruiter
      
      This is an automated notification from SourcingScreen.
      Please do not reply to this email.
    `,
  };
};

// Send recruiter job notification email
export const sendRecruiterJobNotificationEmail = async (
  recruiterId: string,
  recruiterName: string,
  recruiterEmail: string,
  jobIds: string[],
  totalJobCount: number
): Promise<boolean> => {
  try {
    await connectDb();

    // Get job details
    const jobs = await Job.find({ _id: { $in: jobIds } })
      .select("title location commission salary")
      .lean();

    if (jobs.length === 0) {
      console.error("No jobs found for notification");
      return false;
    }

    // Transform job data for template
    const jobDetails: JobDetails[] = jobs.map((job) => ({
      title: job.title,
      location: job.location,
      commission: {
        type: job.commission?.type || "percentage",
        recruiterAmount: job.commission?.recruiterAmount || 0,
      },
      salary: {
        min: job.salary?.min || 0,
        max: job.salary?.max || 0,
        currency: job.salary?.currency || "USD",
      },
    }));

    const transporter = createRecruiterTransporter();
    const emailTemplate = getRecruiterJobNotificationTemplate(
      recruiterName,
      jobDetails,
      totalJobCount
    );

    const mailOptions = {
      from: {
        name: "SourcingScreen Jobs",
        address: process.env.ZOHO_EMAIL!,
      },
      to: recruiterEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `Recruiter job notification sent successfully to ${recruiterEmail}:`,
      result.messageId
    );

    // Mark notification as sent in database
    const notification = await EmailNotification.findOne({
      recruiterId,
      emailType: "job_notification",
      sentDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    });
    if (notification) {
      await notification.markAsSent();
    }

    return true;
  } catch (error) {
    console.error("Error sending recruiter job notification:", error);

    // Mark notification as failed in database
    try {
      const notification = await EmailNotification.findOne({
        recruiterId,
        emailType: "job_notification",
        sentDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      });
      if (notification) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        await notification.markAsFailed(errorMessage);
      }
    } catch (dbError) {
      console.error("Error updating notification status:", dbError);
    }

    return false;
  }
};

// Check if recruiter should receive notification (every 5 jobs)
export const shouldSendNotification = async (
  recruiterId: string
): Promise<{ shouldSend: boolean; jobCount: number; jobIds: string[] }> => {
  try {
    await connectDb();

    // Check if email was already sent today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const emailSentToday = await EmailNotification.findOne({
      recruiterId,
      emailType: "job_notification",
      sentDate: {
        $gte: todayStart,
        $lt: tomorrowStart,
      },
      emailSent: true,
    });

    if (emailSentToday) {
      return { shouldSend: false, jobCount: 0, jobIds: [] };
    }

    // Count active jobs posted today
    const todaysJobs = await Job.find({
      status: "ACTIVE",
      createdAt: {
        $gte: todayStart,
        $lt: tomorrowStart,
      },
    })
      .select("_id")
      .lean();

    const jobCount = todaysJobs.length;
    const jobIds = todaysJobs.map((job: any) => job._id.toString());

    // Send notification every 5 jobs
    const shouldSend = jobCount > 0 && jobCount % 5 === 0;

    return { shouldSend, jobCount, jobIds };
  } catch (error) {
    console.error("Error checking notification criteria:", error);
    return { shouldSend: false, jobCount: 0, jobIds: [] };
  }
};

// Check if global notification should be sent (every 5 jobs posted today)
export const shouldSendGlobalNotification = async (): Promise<{
  shouldSend: boolean;
  jobCount: number;
  jobIds: string[];
}> => {
  try {
    await connectDb();

    // Check if email was already sent today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const emailSentToday = await EmailNotification.findOne({
      emailType: "job_notification",
      sentDate: {
        $gte: todayStart,
        $lt: tomorrowStart,
      },
      emailSent: true,
    });

    if (emailSentToday) {
      return { shouldSend: false, jobCount: 0, jobIds: [] };
    }

    // Count active jobs posted today
    const todaysJobs = await Job.find({
      status: "ACTIVE",
      createdAt: {
        $gte: todayStart,
        $lt: tomorrowStart,
      },
    })
      .select("_id")
      .lean();

    const jobCount = todaysJobs.length;
    const jobIds = todaysJobs.map((job: any) => job._id.toString());

    // Send notification every 5 jobs
    const shouldSend = jobCount > 0 && jobCount % 5 === 0;

    return { shouldSend, jobCount, jobIds };
  } catch (error) {
    console.error("Error checking global notification criteria:", error);
    return { shouldSend: false, jobCount: 0, jobIds: [] };
  }
};

// Get all active recruiters for notifications
export const getActiveRecruiters = async (): Promise<
  Array<{ id: string; name: string; email: string }>
> => {
  try {
    await connectDb();

    const recruiters = await User.find({
      role: "RECRUITER",
      isVerified: true,
    })
      .select("_id name email")
      .lean();

    return recruiters.map((recruiter: any) => ({
      id: recruiter._id.toString(),
      name: recruiter.name,
      email: recruiter.email,
    }));
  } catch (error) {
    console.error("Error fetching active recruiters:", error);
    return [];
  }
};

// Process pending email notifications (for retry mechanism)
export const processPendingNotifications = async (): Promise<void> => {
  try {
    await connectDb();

    const now = new Date();
    const pendingNotifications = await EmailNotification.find({
      emailSent: false,
      $or: [
        { nextRetryAt: { $lte: now } },
        { nextRetryAt: { $exists: false } },
      ],
      retryCount: { $lt: 5 }, // Max 5 retries
    }).populate("recruiterId", "name email");

    for (const notification of pendingNotifications) {
      const recruiter = notification.recruiterId as any;
      if (recruiter && recruiter.email) {
        console.log(
          `Retrying email notification for recruiter ${recruiter.name}`
        );

        const success = await sendRecruiterJobNotificationEmail(
          recruiter._id.toString(),
          recruiter.name,
          recruiter.email,
          notification.jobIds.map((id: any) => id.toString()),
          notification.jobCount
        );

        if (!success) {
          await notification.markAsFailed("Retry failed");
        }
      }
    }
  } catch (error) {
    console.error("Error processing pending notifications:", error);
  }
};

// Create transporter function (re-export from emailService)
const createRecruiterTransporter = () => {
  const nodemailer = require("nodemailer");
  return nodemailer.createTransporter({
    host: "smtp.zoho.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};
