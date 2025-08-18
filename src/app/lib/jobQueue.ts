// Simple in-memory job queue system for background processing

interface QueueJob {
  id: string;
  type: "EMAIL_NOTIFICATION";
  data: any;
  priority: "high" | "medium" | "low";
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledAt?: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

interface EmailNotificationJobData {
  recruiterId: string;
  recruiterName: string;
  recruiterEmail: string;
  jobIds: string[];
  totalJobCount: number;
}

class JobQueue {
  private queue: QueueJob[] = [];
  private processing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly PROCESSING_INTERVAL = 5000; // 5 seconds
  private readonly MAX_CONCURRENT_JOBS = 3;
  private activeJobs = 0;

  constructor() {
    this.startProcessing();
  }

  // Add a job to the queue
  addJob(
    type: "EMAIL_NOTIFICATION",
    data: EmailNotificationJobData,
    priority: "high" | "medium" | "low" = "medium",
    scheduledAt?: Date
  ): string {
    const job: QueueJob = {
      id: this.generateJobId(),
      type,
      data,
      priority,
      attempts: 0,
      maxAttempts: 5,
      createdAt: new Date(),
      scheduledAt,
    };

    this.queue.push(job);
    this.sortQueue();

    console.log(`Job ${job.id} added to queue (${type})`);
    return job.id;
  }

  // Add email notification job
  addEmailNotificationJob(
    recruiterId: string,
    recruiterName: string,
    recruiterEmail: string,
    jobIds: string[],
    totalJobCount: number,
    scheduledAt?: Date
  ): string {
    return this.addJob(
      "EMAIL_NOTIFICATION",
      {
        recruiterId,
        recruiterName,
        recruiterEmail,
        jobIds,
        totalJobCount,
      },
      "high",
      scheduledAt
    );
  }

  // Get queue status
  getQueueStatus() {
    const pending = this.queue.filter(
      (job) => !job.completedAt && !job.failedAt
    ).length;
    const completed = this.queue.filter((job) => job.completedAt).length;
    const failed = this.queue.filter((job) => job.failedAt).length;

    return {
      total: this.queue.length,
      pending,
      completed,
      failed,
      activeJobs: this.activeJobs,
      processing: this.processing,
    };
  }

  // Get job by ID
  getJob(jobId: string): QueueJob | undefined {
    return this.queue.find((job) => job.id === jobId);
  }

  // Remove completed jobs older than 24 hours
  cleanupOldJobs(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const initialLength = this.queue.length;

    this.queue = this.queue.filter((job) => {
      const isOld = job.createdAt < oneDayAgo;
      const isCompleted = job.completedAt || job.failedAt;
      return !(isOld && isCompleted);
    });

    const removedCount = initialLength - this.queue.length;
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old jobs from queue`);
    }
  }

  // Start processing jobs
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.processing = true;
    this.processingInterval = setInterval(() => {
      this.processJobs();
      this.cleanupOldJobs();
    }, this.PROCESSING_INTERVAL);

    console.log("Job queue processing started");
  }

  // Stop processing jobs
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.processing = false;
    console.log("Job queue processing stopped");
  }

  // Process jobs in the queue
  private async processJobs(): Promise<void> {
    if (this.activeJobs >= this.MAX_CONCURRENT_JOBS) {
      return;
    }

    const availableSlots = this.MAX_CONCURRENT_JOBS - this.activeJobs;
    const jobsToProcess = this.getNextJobs(availableSlots);

    for (const job of jobsToProcess) {
      this.processJob(job);
    }
  }

  // Get next jobs to process
  private getNextJobs(count: number): QueueJob[] {
    const now = new Date();

    return this.queue
      .filter((job) => {
        // Skip completed or failed jobs
        if (job.completedAt || job.failedAt) return false;

        // Skip jobs that are currently processing
        if (job.processingStartedAt && !job.completedAt && !job.failedAt)
          return false;

        // Skip jobs that are scheduled for later
        if (job.scheduledAt && job.scheduledAt > now) return false;

        // Skip jobs that have exceeded max attempts
        if (job.attempts >= job.maxAttempts) return false;

        return true;
      })
      .slice(0, count);
  }

  // Process a single job
  private async processJob(job: QueueJob): Promise<void> {
    this.activeJobs++;
    job.processingStartedAt = new Date();
    job.attempts++;

    console.log(
      `Processing job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`
    );

    try {
      switch (job.type) {
        case "EMAIL_NOTIFICATION":
          await this.processEmailNotificationJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      job.completedAt = new Date();
      console.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      job.error = errorMessage;

      console.error(
        `Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}):`,
        errorMessage
      );

      if (job.attempts >= job.maxAttempts) {
        job.failedAt = new Date();
        console.error(
          `Job ${job.id} permanently failed after ${job.maxAttempts} attempts`
        );
      } else {
        // Schedule retry with exponential backoff
        const retryDelay = Math.min(
          1000 * Math.pow(2, job.attempts - 1),
          300000
        ); // Max 5 minutes
        job.scheduledAt = new Date(Date.now() + retryDelay);
        job.processingStartedAt = undefined;
        console.log(
          `Job ${job.id} scheduled for retry in ${retryDelay / 1000} seconds`
        );
      }
    } finally {
      this.activeJobs--;
    }
  }

  // Process email notification job
  private async processEmailNotificationJob(job: QueueJob): Promise<void> {
    const {
      recruiterId,
      recruiterName,
      recruiterEmail,
      jobIds,
      totalJobCount,
    } = job.data as EmailNotificationJobData;

    // Import here to avoid circular dependencies
    const { sendRecruiterJobNotificationEmail } = await import(
      "./recruiterEmailService"
    );

    const success = await sendRecruiterJobNotificationEmail(
      recruiterId,
      recruiterName,
      recruiterEmail,
      jobIds,
      totalJobCount
    );

    if (!success) {
      throw new Error("Failed to send recruiter job notification email");
    }
  }

  // Sort queue by priority and creation time
  private sortQueue(): void {
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    this.queue.sort((a, b) => {
      // First sort by priority
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by creation time (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  // Generate unique job ID
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton implementation
class JobQueueSingleton {
  private static instance: JobQueue;

  static getInstance(): JobQueue {
    if (!JobQueueSingleton.instance) {
      JobQueueSingleton.instance = new JobQueue();
    }
    return JobQueueSingleton.instance;
  }
}

// Extend JobQueue class with getInstance method
class ExtendedJobQueue extends JobQueue {
  static getInstance(): JobQueue {
    return JobQueueSingleton.getInstance();
  }
}

const jobQueueInstance = new JobQueue();

export const getJobQueue = (): JobQueue => {
  return jobQueueInstance;
};

export default jobQueueInstance;
export { ExtendedJobQueue as JobQueue };
export type { QueueJob, EmailNotificationJobData };
