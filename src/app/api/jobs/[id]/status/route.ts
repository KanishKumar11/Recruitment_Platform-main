//src/app/api/jobs/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from './../../../../lib/db';
import Job from './../../../../models/Job';
import { authenticateRequest, unauthorized, forbidden, JwtPayload } from './../../../../lib/auth';
import User, { UserRole } from './../../../../models/User';
import mongoose from 'mongoose';
import { NotificationService } from './../../../../lib/notificationService';
import { JobUpdateNotificationService } from './../../../../lib/jobUpdateNotificationService';

// Helper function to check if user has access to modify job questions
async function hasAccessToModifyJobQuestions(userData: JwtPayload, jobId: string) {
  // Admin and internal users have access to modify all job questions
  if (userData.role === UserRole.ADMIN || userData.role === UserRole.INTERNAL) {
    return true;
  }
  
  // Get the job to check ownership and other permissions
  const job = await Job.findById(jobId);
  if (!job) {
    return false;
  }
  
  // Job creator always has access
  if (job.postedBy.toString() === userData.userId) {
    return true;
  }
  
  // Primary company users have access to jobs posted by their team members
  if (userData.role === UserRole.COMPANY) {
    // Get the current user to check isPrimary status
    const currentUser = await User.findById(userData.userId);
    
    if (currentUser?.isPrimary) {
      // Check if the job was posted by a team member
      const teamMember = await User.findOne({
        _id: job.postedBy,
        parentId: userData.userId
      });
      
      if (teamMember) {
        return true;
      }
    }
  }
  
  // Recruiters cannot modify job questions
  return false;
}

// PUT - Update job status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
// Then await it first

) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();
    
    const { id } = await params;
    
    // Ensure id is a valid ObjectId format
    if (!id || id.length !== 24) {
      return NextResponse.json({ error: 'Invalid job ID format' }, { status: 400 });
    }
    
    // Validate input data
    const { status } = await req.json();
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    
    // Check if job exists
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if user has permission to update the job status
    const hasAccess = await hasAccessToModifyJobQuestions(userData, id);
    if (!hasAccess) {
      return forbidden();
    }

    // Update only the status field
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).populate('screeningQuestions');

    // Create notification for job status change - only for recruiters who have saved the job
    try {
      if (updatedJob) {
        // Get recruiters who have saved this job or uploaded resumes for it
        const eligibleRecruiters = await JobUpdateNotificationService.getEligibleRecruiters(
          (updatedJob._id as mongoose.Types.ObjectId).toString()
        );
        
        // Create notifications for each eligible recruiter
        for (const recruiter of eligibleRecruiters) {
          await NotificationService.createJobModificationNotification(
            recruiter.recruiterId,
            updatedJob.title,
            ['status'], // modifiedFields - status change
            (updatedJob._id as mongoose.Types.ObjectId).toString()
          );
        }
        
        console.log(`Job status change notifications sent to ${eligibleRecruiters.length} eligible recruiters for job: ${updatedJob.title}`);
      }
    } catch (notificationError) {
      console.error('Failed to create job status change notification:', notificationError);
      // Continue with the response even if notification fails
    }

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Update job status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}