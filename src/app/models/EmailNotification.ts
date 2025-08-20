import mongoose, { Schema, Document } from "mongoose";

export interface IEmailNotification extends Document {
  recruiterId?: mongoose.Types.ObjectId;
  emailType?: "JOB_NOTIFICATION";
  type?: "job_batch" | "end_of_day_summary";
  sentDate?: Date;
  jobCount?: number;
  jobIds?: mongoose.Types.ObjectId[];
  emailSent?: boolean;
  emailSentAt?: Date;
  sentAt?: Date; // For admin statistics compatibility
  status: "pending" | "sent" | "failed"; // For admin statistics
  recipientCount: number; // Number of recipients for this notification
  errorMessage?: string;
  retryCount?: number;
  nextRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailNotificationSchema = new Schema<IEmailNotification>(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    emailType: {
      type: String,
      enum: ["JOB_NOTIFICATION"],
      default: "JOB_NOTIFICATION",
      required: false,
    },
    type: {
      type: String,
      enum: ["job_batch", "end_of_day_summary"],
      required: false,
      index: true,
    },
    sentDate: {
      type: Date,
      required: false,
      index: true,
    },
    jobCount: {
      type: Number,
      required: false,
      min: 1,
    },
    jobIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: false,
      },
    ],
    emailSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailSentAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      index: true,
    },
    recipientCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    errorMessage: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextRetryAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate notifications per day per recruiter
EmailNotificationSchema.index(
  { recruiterId: 1, sentDate: 1, emailType: 1 },
  { unique: true }
);

// Index for finding pending emails to retry
EmailNotificationSchema.index(
  { emailSent: 1, nextRetryAt: 1 },
  { sparse: true }
);

// Static method to check if email was already sent today
EmailNotificationSchema.statics.wasEmailSentToday = async function (
  recruiterId: string,
  emailType: string = "JOB_NOTIFICATION"
): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingNotification = await this.findOne({
    recruiterId,
    emailType,
    sentDate: {
      $gte: today,
      $lt: tomorrow,
    },
    emailSent: true,
  });

  return !!existingNotification;
};

// Static method to get today's notification for a recruiter
EmailNotificationSchema.statics.getTodaysNotification = async function (
  recruiterId: string,
  emailType: string = "JOB_NOTIFICATION"
): Promise<IEmailNotification | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await this.findOne({
    recruiterId,
    emailType,
    sentDate: {
      $gte: today,
      $lt: tomorrow,
    },
  });
};

// Static method to create or update today's notification
EmailNotificationSchema.statics.createOrUpdateTodaysNotification =
  async function (
    recruiterId: string,
    jobIds: string[],
    emailType: string = "JOB_NOTIFICATION"
  ): Promise<IEmailNotification> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingNotification = await this.findOne({
      recruiterId,
      emailType,
      sentDate: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (existingNotification) {
      // Update existing notification with new jobs
      const uniqueJobIds = [
        ...new Set([
          ...existingNotification.jobIds.map((id: any) => id.toString()),
          ...jobIds,
        ]),
      ];
      existingNotification.jobIds = uniqueJobIds.map(
        (id: string) => new mongoose.Types.ObjectId(id)
      );
      existingNotification.jobCount = uniqueJobIds.length;
      return await existingNotification.save();
    } else {
      // Create new notification
      return await this.create({
        recruiterId,
        emailType,
        sentDate: today,
        jobCount: jobIds.length,
        jobIds: jobIds.map((id: string) => new mongoose.Types.ObjectId(id)),
        emailSent: false,
        retryCount: 0,
      });
    }
  };

// Instance method to mark email as sent
EmailNotificationSchema.methods.markAsSent = async function (): Promise<void> {
  this.emailSent = true;
  this.emailSentAt = new Date();
  this.sentAt = new Date();
  this.status = "sent";
  this.errorMessage = undefined;
  this.nextRetryAt = undefined;
  await this.save();
};

// Instance method to mark email as failed and schedule retry
EmailNotificationSchema.methods.markAsFailed = async function (
  errorMessage: string
): Promise<void> {
  this.emailSent = false;
  this.errorMessage = errorMessage;
  this.retryCount += 1;
  this.status = "failed";
  this.sentAt = new Date(); // Track when the failure occurred

  // Schedule next retry (exponential backoff: 5min, 15min, 30min, 1hr, 2hr)
  const retryDelays = [5, 15, 30, 60, 120]; // minutes
  const delayIndex = Math.min(this.retryCount - 1, retryDelays.length - 1);
  const delayMinutes = retryDelays[delayIndex];

  this.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
  await this.save();
};

// Create the model class with static methods
class EmailNotificationClass {
  // Static method to check if email was sent today
  static async wasEmailSentToday(
    recruiterId: string,
    emailType: string = "job_notification"
  ): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const notification = await EmailNotificationModel.findOne({
      recruiterId,
      emailType,
      sentDate: {
        $gte: today,
        $lt: tomorrow,
      },
      emailSent: true,
    });

    return !!notification;
  }

  // Static method to get today's notification
  static async getTodaysNotification(
    recruiterId: string,
    emailType: string = "job_notification"
  ): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await EmailNotificationModel.findOne({
      recruiterId,
      emailType,
      sentDate: {
        $gte: today,
        $lt: tomorrow,
      },
    });
  }

  // Static method to create or update notification
  static async createOrUpdate(
    recruiterId: string,
    emailType: string,
    jobCount: number,
    jobIds: string[],
    recipientCount: number = 1
  ): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingNotification = await EmailNotificationModel.findOne({
      recruiterId,
      emailType,
      sentDate: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (existingNotification) {
      // Update existing notification with new job IDs
      const uniqueJobIds = [
        ...new Set([
          ...existingNotification.jobIds.map((id: any) => id.toString()),
          ...jobIds,
        ]),
      ];
      existingNotification.jobCount = jobCount;
      existingNotification.jobIds = uniqueJobIds.map(
        (id: string) => new mongoose.Types.ObjectId(id)
      );
      return await existingNotification.save();
    } else {
      // Create new notification
      const notification = new EmailNotificationModel({
        recruiterId,
        emailType,
        jobCount,
        jobIds: jobIds.map((id: string) => new mongoose.Types.ObjectId(id)),
        sentDate: new Date(),
        emailSent: false,
        recipientCount,
        status: "pending",
        retryCount: 0,
      });
      return await notification.save();
    }
  }
}

// Export the model
const EmailNotificationModel =
  mongoose.models.EmailNotification ||
  mongoose.model<IEmailNotification>(
    "EmailNotification",
    EmailNotificationSchema
  );

// Add static methods to the model
Object.assign(EmailNotificationModel, EmailNotificationClass);

export default EmailNotificationModel as typeof EmailNotificationModel &
  typeof EmailNotificationClass;
