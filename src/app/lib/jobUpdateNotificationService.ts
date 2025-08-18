// src/app/lib/jobUpdateNotificationService.ts
import connectDb from "./db";
import RecruiterJob from "../models/RecruiterJob";
import Resume from "../models/Resume";
import User from "../models/User";
import Job from "../models/Job";
import { NotificationService } from "./notificationService";
import { UserRole } from "../constants/userRoles";
import mongoose from "mongoose";

/**
 * Service for handling job update notifications to recruiters
 */
export class JobUpdateNotificationService {
  /**
   * Get recruiters who should receive job update notifications
   * This includes recruiters who have:
   * 1. Explicitly saved the job
   * 2. Uploaded a resume for the job (which automatically saves it)
   */
  static async getEligibleRecruiters(jobId: string): Promise<{
    recruiterId: string;
    recruiterName: string;
    recruiterEmail: string;
  }[]> {
    try {
      await connectDb();

      // Get all recruiters who have saved this job
      const savedJobRecruiters = await RecruiterJob.find({
        jobId: new mongoose.Types.ObjectId(jobId),
        isActive: true,
      })
        .populate({
          path: "recruiterId",
          select: "name email role",
          match: { role: UserRole.RECRUITER },
        })
        .lean();

      // Filter out null populated recruiters and extract recruiter info
      const eligibleRecruiters = savedJobRecruiters
        .filter((savedJob: any) => savedJob.recruiterId)
        .map((savedJob: any) => ({
          recruiterId: savedJob.recruiterId._id.toString(),
          recruiterName: savedJob.recruiterId.name,
          recruiterEmail: savedJob.recruiterId.email,
        }));

      // Remove duplicates based on recruiterId
      const uniqueRecruiters = eligibleRecruiters.filter(
        (recruiter, index, self) =>
          index === self.findIndex((r) => r.recruiterId === recruiter.recruiterId)
      );

      return uniqueRecruiters;
    } catch (error) {
      console.error("Error getting eligible recruiters for job update:", error);
      return [];
    }
  }

  /**
   * Send job update notifications to eligible recruiters
   */
  static async sendJobUpdateNotifications(
    jobId: string,
    updateTitle: string,
    updateContent: string,
    postedByName: string
  ): Promise<void> {
    try {
      await connectDb();

      // Get job details
      const job = await Job.findById(jobId).select("title").lean() as { _id: string; title: string } | null;
      if (!job) {
        console.error("Job not found for notification:", jobId);
        return;
      }

      // Get eligible recruiters
      const eligibleRecruiters = await this.getEligibleRecruiters(jobId);

      if (eligibleRecruiters.length === 0) {
        console.log("No eligible recruiters found for job update notification:", jobId);
        return;
      }

      console.log(
        `Sending job update notifications to ${eligibleRecruiters.length} recruiters for job: ${job.title}`
      );

      // Create notifications for each eligible recruiter
      const notificationPromises = eligibleRecruiters.map(async (recruiter) => {
        try {
          await NotificationService.createJobUpdateNotification(
            recruiter.recruiterId,
            job.title,
            updateTitle,
            updateContent,
            postedByName,
            jobId
          );
          console.log(
            `Job update notification sent to recruiter: ${recruiter.recruiterName} (${recruiter.recruiterEmail})`
          );
        } catch (error) {
          console.error(
            `Failed to send job update notification to recruiter ${recruiter.recruiterName}:`,
            error
          );
        }
      });

      // Wait for all notifications to be sent
      await Promise.allSettled(notificationPromises);

      console.log(
        `Job update notification process completed for job: ${job.title}`
      );
    } catch (error) {
      console.error("Error sending job update notifications:", error);
    }
  }
}

export default JobUpdateNotificationService;