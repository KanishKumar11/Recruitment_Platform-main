// src/app/models/Notification.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export enum NotificationType {
  CANDIDATE_STATUS_CHANGE = "CANDIDATE_STATUS_CHANGE",
  JOB_MODIFICATION = "JOB_MODIFICATION",
  NEW_NOTE_COMMENT = "NEW_NOTE_COMMENT",
}

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId; // The recruiter who should receive this notification
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  
  // Related entities
  jobId?: mongoose.Types.ObjectId;
  resumeId?: mongoose.Types.ObjectId;
  candidateName?: string;
  jobTitle?: string;
  
  // Additional metadata
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    modifiedFields?: string[];
    noteAuthor?: string;
    [key: string]: any;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: false,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: false,
    },
    candidateName: {
      type: String,
      required: false,
    },
    jobTitle: {
      type: String,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ jobId: 1 });
NotificationSchema.index({ resumeId: 1 });

let NotificationModel: Model<INotification>;

try {
  NotificationModel = mongoose.model<INotification>("Notification");
} catch {
  NotificationModel = mongoose.model<INotification>("Notification", NotificationSchema);
}

export default NotificationModel;