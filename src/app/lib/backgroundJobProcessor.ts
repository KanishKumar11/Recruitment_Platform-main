import { JobQueue } from "./jobQueue";
import {
  sendRecruiterJobNotificationEmail,
  shouldSendNotification,
  getActiveRecruiters,
  processPendingNotifications,
} from "./recruiterEmailService";
import EmailNotification from "../models/EmailNotification";
import connectDb from "./db";

// Background job processor class
class BackgroundJobProcessor {
  private static instance: BackgroundJobProcessor;
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private retryInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): BackgroundJobProcessor {
    if (!BackgroundJobProcessor.instance) {
      BackgroundJobProcessor.instance = new BackgroundJobProcessor();
    }
    return BackgroundJobProcessor.instance;
  }

  // Start the background job processor
  public start(): void {
    if (this.isProcessing) {
      console.log("Background job processor is already running");
      return;
    }

    this.isProcessing = true;
    console.log("Starting background job processor...");

    // Process jobs every 30 seconds
    this.processingInterval = setInterval(async () => {
      await this.processJobs();
    }, 30000);

    // Process pending notifications (retries) every 5 minutes
    this.retryInterval = setInterval(async () => {
      await this.processPendingRetries();
    }, 300000);

    // Process jobs immediately on start
    this.processJobs();
  }

  // Stop the background job processor
  public stop(): void {
    if (!this.isProcessing) {
      console.log("Background job processor is not running");
      return;
    }

    console.log("Stopping background job processor...");
    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  // Process all pending jobs in the queue
  private async processJobs(): Promise<void> {
    try {
      const jobQueue = JobQueue.getInstance();
      const queueStatus = jobQueue.getQueueStatus();

      if (queueStatus.pending === 0) {
        return;
      }

      console.log(
        `Queue status: ${queueStatus.pending} pending, ${queueStatus.completed} completed, ${queueStatus.failed} failed`
      );

      // JobQueue handles its own processing automatically
    } catch (error) {
      console.error("Error in processJobs:", error);
    }
  }

  // Process a single job
  private async processJob(job: any): Promise<void> {
    const jobQueue = JobQueue.getInstance();

    try {
      switch (job.type) {
        case "email_notification":
          await this.processEmailNotificationJob(job);
          break;
        case "bulk_email_notification":
          await this.processBulkEmailNotificationJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      console.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      throw error; // Let JobQueue handle the retry logic
    }
  }

  // Process email notification job for a specific recruiter
  private async processEmailNotificationJob(job: any): Promise<void> {
    const {
      recruiterId,
      recruiterName,
      recruiterEmail,
      jobIds,
      totalJobCount,
    } = job.data;

    console.log(
      `Processing email notification for recruiter: ${recruiterName}`
    );

    // Check if notification should still be sent (in case conditions changed)
    const notificationCheck = await shouldSendNotification(recruiterId);
    if (!notificationCheck.shouldSend) {
      console.log(
        `Skipping notification for ${recruiterName} - conditions no longer met`
      );
      return;
    }

    // Create or update notification record
    await connectDb();
    await EmailNotification.createOrUpdate(
      recruiterId,
      "job_notification",
      totalJobCount,
      jobIds,
      1 // recipientCount for individual recruiter
    );

    // Send the email
    const success = await sendRecruiterJobNotificationEmail(
      recruiterId,
      recruiterName,
      recruiterEmail,
      jobIds,
      totalJobCount
    );

    if (!success) {
      throw new Error("Failed to send email notification");
    }
  }

  // Process bulk email notification job for all recruiters
  private async processBulkEmailNotificationJob(job: any): Promise<void> {
    const { jobIds, totalJobCount } = job.data;

    console.log(`Processing bulk email notification for ${totalJobCount} jobs`);

    // Get all active recruiters
    const recruiters = await getActiveRecruiters();

    if (recruiters.length === 0) {
      console.log("No active recruiters found for bulk notification");
      return;
    }

    console.log(`Sending notifications to ${recruiters.length} recruiters`);

    // Process each recruiter
    const results = await Promise.allSettled(
      recruiters.map(async (recruiter: any) => {
        // Check if this recruiter should receive notification
        const notificationCheck = await shouldSendNotification(recruiter.id);
        if (!notificationCheck.shouldSend) {
          console.log(
            `Skipping notification for ${recruiter.name} - conditions not met`
          );
          return;
        }

        // Create or update notification record
        await EmailNotification.createOrUpdate(
          recruiter.id,
          "job_notification",
          totalJobCount,
          jobIds,
          1 // recipientCount for individual recruiter
        );

        // Send the email
        return await sendRecruiterJobNotificationEmail(
          recruiter.id,
          recruiter.name,
          recruiter.email,
          jobIds,
          totalJobCount
        );
      })
    );

    // Log results
    const successful = results.filter(
      (result: any) => result.status === "fulfilled" && result.value === true
    ).length;
    const failed = results.filter(
      (result: any) => result.status === "rejected" || result.value === false
    ).length;

    console.log(
      `Bulk notification completed: ${successful} successful, ${failed} failed`
    );
  }

  // Process pending notifications that need retry
  private async processPendingRetries(): Promise<void> {
    try {
      console.log("Processing pending notification retries...");
      await processPendingNotifications();
    } catch (error) {
      console.error("Error processing pending retries:", error);
    }
  }

  // Add email notification job to queue
  public async addEmailNotificationJob(
    recruiterId: string,
    recruiterName: string,
    recruiterEmail: string,
    jobIds: string[],
    totalJobCount: number
  ): Promise<string> {
    const jobQueue = JobQueue.getInstance();

    return jobQueue.addEmailNotificationJob(
      recruiterId,
      recruiterName,
      recruiterEmail,
      jobIds,
      totalJobCount
    );
  }

  // Add bulk email notification job to queue
  public async addBulkEmailNotificationJob(
    jobIds: string[],
    totalJobCount: number
  ): Promise<string[]> {
    const jobQueue = JobQueue.getInstance();
    const recruiters = await getActiveRecruiters();

    // Add individual jobs for each recruiter in bulk
    const jobPromises = recruiters.map((recruiter) =>
      jobQueue.addEmailNotificationJob(
        recruiter.id,
        recruiter.name,
        recruiter.email,
        jobIds,
        totalJobCount
      )
    );

    return Promise.all(jobPromises);
  }

  // Trigger immediate job processing (useful for testing)
  public async processJobsNow(): Promise<void> {
    if (!this.isProcessing) {
      console.log("Background job processor is not running");
      return;
    }

    await this.processJobs();
  }

  // Get processor status
  public getStatus(): {
    isProcessing: boolean;
    processingInterval: boolean;
    retryInterval: boolean;
    queueSize: number;
    completedJobs: number;
    failedJobs: number;
    activeJobs: number;
    totalJobs: number;
  } {
    const jobQueue = JobQueue.getInstance();
    const queueStatus = jobQueue.getQueueStatus();
    return {
      isProcessing: this.isProcessing,
      processingInterval: this.processingInterval ? true : false,
      retryInterval: this.retryInterval ? true : false,
      queueSize: queueStatus.pending,
      completedJobs: queueStatus.completed,
      failedJobs: queueStatus.failed,
      activeJobs: queueStatus.activeJobs,
      totalJobs: queueStatus.total,
    };
  }

  // Clean up old completed and failed jobs
  public cleanupOldJobs(olderThanHours: number = 24): void {
    const jobQueue = JobQueue.getInstance();
    jobQueue.cleanupOldJobs();
  }
}

// Export singleton instance
export const backgroundJobProcessor = BackgroundJobProcessor.getInstance();

// Helper functions for easy access
export const startBackgroundProcessor = () => {
  backgroundJobProcessor.start();
};

export const stopBackgroundProcessor = () => {
  backgroundJobProcessor.stop();
};

export const getProcessorStatus = () => {
  return backgroundJobProcessor.getStatus();
};

export const addEmailNotificationJob = async (
  recruiterId: string,
  recruiterName: string,
  recruiterEmail: string,
  jobIds: string[],
  totalJobCount: number
) => {
  return backgroundJobProcessor.addEmailNotificationJob(
    recruiterId,
    recruiterName,
    recruiterEmail,
    jobIds,
    totalJobCount
  );
};

export const addBulkEmailNotificationJob = async (
  jobIds: string[],
  totalJobCount: number
) => {
  return backgroundJobProcessor.addBulkEmailNotificationJob(
    jobIds,
    totalJobCount
  );
};

export const processJobsNow = async () => {
  return backgroundJobProcessor.processJobsNow();
};

export const cleanupOldJobs = (olderThanHours: number = 24) => {
  backgroundJobProcessor.cleanupOldJobs(olderThanHours);
};

export default BackgroundJobProcessor;
