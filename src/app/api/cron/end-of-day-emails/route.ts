import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/app/lib/db';
import Job from '@/app/models/Job';
import User from '@/app/models/User';
import EmailNotification from '@/app/models/EmailNotification';
import { getAllEmailNotificationSettings } from '@/app/lib/emailNotificationSettings';
import { addEmailNotificationJob } from '@/app/lib/jobQueue';

// This endpoint should be called by a cron job or scheduled task
// to send end-of-day email notifications
export async function POST(request: NextRequest) {
  try {
    await connectDb();

    // Get email notification settings
    const settings = await getAllEmailNotificationSettings();
    
    // Check if notifications are enabled and end-of-day notifications are enabled
    if (!settings.NOTIFICATION_ENABLED || !settings.END_OF_DAY_NOTIFICATIONS) {
      return NextResponse.json({ 
        message: 'End-of-day notifications are disabled',
        sent: false 
      });
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Find jobs posted today that haven't triggered frequency-based notifications
    const todaysJobs = await Job.find({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      status: 'active'
    }).populate('company', 'name');

    if (todaysJobs.length === 0) {
      return NextResponse.json({ 
        message: 'No jobs posted today',
        sent: false 
      });
    }

    // Check if we've already sent end-of-day notifications today
    const existingEndOfDayNotification = await EmailNotification.findOne({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      type: 'end_of_day_summary'
    });

    if (existingEndOfDayNotification) {
      return NextResponse.json({ 
        message: 'End-of-day notification already sent today',
        sent: false 
      });
    }

    // Get the count of jobs that have already triggered frequency-based notifications today
    const frequencyBasedNotifications = await EmailNotification.find({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      type: 'job_batch'
    });

    // Calculate how many jobs have already been included in frequency-based notifications
    const jobsAlreadyNotified = frequencyBasedNotifications.reduce((total, notification) => {
      return total + (notification.jobIds?.length || 0);
    }, 0);

    // Get jobs that haven't been included in frequency-based notifications
    const remainingJobs = todaysJobs.slice(jobsAlreadyNotified);

    if (remainingJobs.length === 0) {
      return NextResponse.json({ 
        message: 'All jobs have already been included in frequency-based notifications',
        sent: false 
      });
    }

    // Get all active recruiters
    const recruiters = await User.find({
      role: 'RECRUITER',
      isActive: true
    }).select('email name');

    if (recruiters.length === 0) {
      return NextResponse.json({ 
        message: 'No active recruiters found',
        sent: false 
      });
    }

    // Create email notification record
    const emailNotification = new EmailNotification({
      type: 'end_of_day_summary',
      jobIds: remainingJobs.map(job => job._id),
      recipientCount: recruiters.length,
      status: 'pending'
    });
    await emailNotification.save();

    // Add email job to queue for each recruiter
    const emailPromises = recruiters.map(recruiter => 
      addEmailNotificationJob({
        type: 'end_of_day_summary',
        recipientEmail: recruiter.email,
        recipientName: recruiter.name,
        jobs: remainingJobs.map(job => ({
          title: job.title,
          company: job.company?.name || 'Unknown Company',
          location: job.location,
          type: job.type,
          postedAt: job.createdAt
        })),
        notificationId: emailNotification._id.toString()
      })
    );

    await Promise.all(emailPromises);

    // Update notification status
    emailNotification.status = 'sent';
    emailNotification.sentAt = new Date();
    await emailNotification.save();

    return NextResponse.json({
      message: `End-of-day email notifications sent successfully`,
      jobCount: remainingJobs.length,
      recipientCount: recruiters.length,
      sent: true
    });

  } catch (error) {
    console.error('Error sending end-of-day emails:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send end-of-day emails',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint to check the status or schedule
export async function GET(request: NextRequest) {
  try {
    await connectDb();
    
    const settings = await getAllEmailNotificationSettings();
    
    return NextResponse.json({
      endOfDayNotificationsEnabled: settings.END_OF_DAY_NOTIFICATIONS,
      notificationsEnabled: settings.NOTIFICATION_ENABLED,
      endOfDayTime: settings.END_OF_DAY_TIME,
      message: 'End-of-day email service status'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get end-of-day email status' },
      { status: 500 }
    );
  }
}