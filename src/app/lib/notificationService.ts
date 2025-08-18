// src/app/lib/notificationService.ts
import Notification, {
  NotificationType,
  INotification,
} from "@/app/models/Notification";
import { ResumeStatus } from "@/app/models/Resume";
import mongoose from "mongoose";
import connectDb from "@/app/lib/db";

export interface CreateNotificationParams {
  recipientId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  jobId?: string | mongoose.Types.ObjectId;
  resumeId?: string | mongoose.Types.ObjectId;
  candidateName?: string;
  jobTitle?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(
    params: CreateNotificationParams
  ): Promise<INotification> {
    await connectDb();

    const notification = new Notification({
      recipientId: params.recipientId,
      type: params.type,
      title: params.title,
      message: params.message,
      jobId: params.jobId || undefined,
      resumeId: params.resumeId || undefined,
      candidateName: params.candidateName || undefined,
      jobTitle: params.jobTitle || undefined,
      metadata: params.metadata || undefined,
    });

    await notification.save();
    return notification;
  }

  /**
   * Create notification for candidate status change
   */
  static async createCandidateStatusChangeNotification(
    recruiterId: string | mongoose.Types.ObjectId,
    candidateName: string,
    jobTitle: string,
    oldStatus: ResumeStatus,
    newStatus: ResumeStatus,
    jobId?: string | mongoose.Types.ObjectId,
    resumeId?: string | mongoose.Types.ObjectId
  ): Promise<INotification> {
    const statusDisplayNames: Record<ResumeStatus, string> = {
      [ResumeStatus.SUBMITTED]: "Submitted",
      [ResumeStatus.REVIEWED]: "Reviewed",
      [ResumeStatus.SHORTLISTED]: "Shortlisted",
      [ResumeStatus.ONHOLD]: "On Hold",
      [ResumeStatus.INTERVIEW_IN_PROCESS]: "Interview in Process",
      [ResumeStatus.INTERVIEWED]: "Interviewed",
      [ResumeStatus.SELECTED_IN_FINAL_INTERVIEW]: "Selected in Final Interview",
      [ResumeStatus.OFFERED]: "Offered",
      [ResumeStatus.OFFER_DECLINED]: "Offer Declined",
      [ResumeStatus.HIRED]: "Hired",
      [ResumeStatus.JOINED]: "Joined",
      [ResumeStatus.TRIAL_FAILED]: "Trial Failed",
      [ResumeStatus.BACKOUT]: "Backed Out",
      [ResumeStatus.QUIT_AFTER_JOINED]: "Quit After Joining",
      [ResumeStatus.REJECTED]: "Rejected",
      [ResumeStatus.DUPLICATE]: "Duplicate",
    };

    const oldStatusDisplay = statusDisplayNames[oldStatus] || oldStatus;
    const newStatusDisplay = statusDisplayNames[newStatus] || newStatus;

    return this.createNotification({
      recipientId: recruiterId,
      type: NotificationType.CANDIDATE_STATUS_CHANGE,
      title: "Candidate Status Updated",
      message: `${candidateName}'s status for "${jobTitle}" changed from ${oldStatusDisplay} to ${newStatusDisplay}`,
      jobId,
      resumeId,
      candidateName,
      jobTitle,
      metadata: {
        oldStatus,
        newStatus,
        oldStatusDisplay,
        newStatusDisplay,
      },
    });
  }

  /**
   * Create notification for job modification
   */
  static async createJobModificationNotification(
    recruiterId: string | mongoose.Types.ObjectId,
    jobTitle: string,
    modifiedFields: string[],
    jobId?: string | mongoose.Types.ObjectId
  ): Promise<INotification> {
    const fieldDisplayNames: Record<string, string> = {
      title: "Job Title",
      description: "Job Description",
      requirements: "Requirements",
      salary: "Salary",
      location: "Location",
      jobType: "Job Type",
      experienceLevel: "Experience Level",
      commission: "Commission",
      status: "Status",
      deadline: "Application Deadline",
    };

    const modifiedFieldsDisplay = modifiedFields
      .map((field) => fieldDisplayNames[field] || field)
      .join(", ");

    return this.createNotification({
      recipientId: recruiterId,
      type: NotificationType.JOB_MODIFICATION,
      title: "Job Updated",
      message: `Your job "${jobTitle}" has been updated. Modified fields: ${modifiedFieldsDisplay}`,
      jobId,
      jobTitle,
      metadata: {
        modifiedFields,
        modifiedFieldsDisplay,
      },
    });
  }

  /**
   * Create notification for new note/comment
   */
  static async createNewNoteNotification(
    recruiterId: string | mongoose.Types.ObjectId,
    candidateName: string,
    jobTitle: string,
    noteAuthor: string,
    notePreview: string,
    jobId?: string | mongoose.Types.ObjectId,
    resumeId?: string | mongoose.Types.ObjectId
  ): Promise<INotification> {
    // Truncate note preview if too long
    const truncatedPreview =
      notePreview.length > 100
        ? notePreview.substring(0, 100) + "..."
        : notePreview;

    return this.createNotification({
      recipientId: recruiterId,
      type: NotificationType.NEW_NOTE_COMMENT,
      title: `New Note Added - for ${candidateName} - ${jobTitle}`,
      message: truncatedPreview,
      jobId,
      resumeId,
      candidateName,
      jobTitle,
      metadata: {
        noteAuthor,
        notePreview: truncatedPreview,
        fullNotePreview: notePreview,
      },
    });
  }

  /**
   * Create notification for job update
   */
  static async createJobUpdateNotification(
    recruiterId: string | mongoose.Types.ObjectId,
    jobTitle: string,
    updateTitle: string,
    updateContent: string,
    postedByName: string,
    jobId?: string | mongoose.Types.ObjectId
  ): Promise<INotification> {
    // Truncate update content if too long
    const truncatedContent =
      updateContent.length > 100
        ? updateContent.substring(0, 100) + "..."
        : updateContent;

    return this.createNotification({
      recipientId: recruiterId,
      type: NotificationType.JOB_MODIFICATION,
      title: `Job Update: ${updateTitle}`,
      message: `New update posted for "${jobTitle}" by ${postedByName}: ${truncatedContent}`,
      jobId,
      jobTitle,
      metadata: {
        updateTitle,
        updateContent: truncatedContent,
        fullUpdateContent: updateContent,
        postedByName,
      },
    });
  }

  /**
   * Get notifications for a user with pagination
   */
  static async getNotifications(
    userId: string | mongoose.Types.ObjectId,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    } = {}
  ) {
    await connectDb();

    const { page = 1, limit = 20, unreadOnly = false, type } = options;
    const skip = (page - 1) * limit;

    const query: any = { recipientId: userId };
    if (unreadOnly) {
      query.isRead = false;
    }
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("jobId", "title")
      .populate("resumeId", "candidateName")
      .lean();

    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    return {
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
      unreadCount,
    };
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(
    userId: string | mongoose.Types.ObjectId,
    notificationIds?: string[]
  ): Promise<number> {
    await connectDb();

    if (notificationIds && notificationIds.length > 0) {
      const result = await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          recipientId: userId,
        },
        { isRead: true }
      );
      return result.modifiedCount;
    } else {
      const result = await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { isRead: true }
      );
      return result.modifiedCount;
    }
  }

  /**
   * Delete notifications
   */
  static async deleteNotifications(
    userId: string | mongoose.Types.ObjectId,
    options: {
      notificationIds?: string[];
      deleteAll?: boolean;
      deleteRead?: boolean;
    } = {}
  ): Promise<number> {
    await connectDb();

    const { notificationIds, deleteAll = false, deleteRead = false } = options;

    if (deleteAll) {
      const result = await Notification.deleteMany({ recipientId: userId });
      return result.deletedCount;
    } else if (deleteRead) {
      const result = await Notification.deleteMany({
        recipientId: userId,
        isRead: true,
      });
      return result.deletedCount;
    } else if (notificationIds && notificationIds.length > 0) {
      const result = await Notification.deleteMany({
        _id: { $in: notificationIds },
        recipientId: userId,
      });
      return result.deletedCount;
    }

    return 0;
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(
    userId: string | mongoose.Types.ObjectId
  ): Promise<number> {
    await connectDb();
    return await Notification.countDocuments({
      recipientId: userId,
      isRead: false,
    });
  }

  /**
   * Clean up old notifications (older than specified days)
   */
  static async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    await connectDb();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true, // Only delete read notifications
    });

    return result.deletedCount;
  }
}
