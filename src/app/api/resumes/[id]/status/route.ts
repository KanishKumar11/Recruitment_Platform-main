// src/app/api/resumes/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from './../../../../lib/db';
import Resume, { ResumeStatus } from './../../../../models/Resume';
import Job from './../../../../models/Job';
import User, { UserRole } from './../../../../models/User';
import { authenticateRequest, authorizeRoles, unauthorized, forbidden } from './../../../../lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    // Only Company, Admin, and Internal users can update resume status
    if (!authorizeRoles(req, [UserRole.COMPANY, UserRole.ADMIN, UserRole.INTERNAL])) {
      return forbidden();
    }

    await connectDb();
    
    // Await params before accessing properties (Next.js 15+ requirement)
    const resolvedParams = await params;
    const { status } = await req.json();

    // Validate status
    if (!status || !Object.values(ResumeStatus).includes(status as ResumeStatus)) {
      return NextResponse.json(
        { 
          error: 'Valid status is required',
          validStatuses: Object.values(ResumeStatus)
        },
        { status: 400 }
      );
    }

    // Find the resume
    const resume = await Resume.findById(resolvedParams.id);
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Fetch associated job
    const job = await Job.findById(resume.jobId);
    if (!job) {
      return NextResponse.json({ error: 'Associated job not found' }, { status: 404 });
    }

    // Permission check for Company users
    if (userData.role === UserRole.COMPANY) {
      const currentUser = await User.findById(userData.userId);
      
      if (!currentUser) return forbidden();
      
      if (currentUser.isPrimary) {
        const members = await User.find({
          $or: [
            { _id: currentUser._id },
            { parentId: currentUser._id },
          ]
        }).select('_id');
        
        const memberIds = members.map(m => m._id.toString());
        
        if (!memberIds.includes(job.postedBy.toString())) {
          return forbidden();
        }
      } else {
        // Non-primary company users can only update resumes for jobs they posted
        if (job.postedBy.toString() !== userData.userId) {
          return forbidden();
        }
      }
    }

    // Store old status for response
    const oldStatus = resume.status;
    
    // Prepare update fields
    const updateFields: any = {
      status: status as ResumeStatus
    };
    
    // Update corresponding timestamp based on the new status
    const now = new Date();
    switch (status) {
      case ResumeStatus.SUBMITTED:
        updateFields.submittedAt = now;
        break;
      case ResumeStatus.REVIEWED:
        updateFields.reviewedAt = now;
        break;
      case ResumeStatus.SHORTLISTED:
        updateFields.shortlistedAt = now;
        break;
      case ResumeStatus.ONHOLD:
        updateFields.onholdAt = now;
        break;
      case ResumeStatus.INTERVIEW_IN_PROCESS:
        updateFields.interviewInProcessAt = now;
        break;
      case ResumeStatus.INTERVIEWED:
        updateFields.interviewedAt = now;
        break;
      // Fixed: Use correct enum value
      case ResumeStatus.SELECTED_IN_FINAL_INTERVIEW:
        updateFields.selectedAt = now;
        break;
      case ResumeStatus.OFFERED:
        updateFields.offeredAt = now;
        break;
      case ResumeStatus.OFFER_DECLINED:
        updateFields.offerDeclinedAt = now;
        break;
      case ResumeStatus.HIRED:
        updateFields.hiredAt = now;
        break;
      case ResumeStatus.REJECTED:
        updateFields.rejectedAt = now;
        break;
      case ResumeStatus.DUPLICATE:
        updateFields.duplicatedAt = now;
        break;
    }

    // Use findByIdAndUpdate to avoid validation on existing fields
    const updatedResume = await Resume.findByIdAndUpdate(
      resolvedParams.id,
      { $set: updateFields },
      { 
        new: true,
        runValidators: false // Skip validation to avoid required field errors
      }
    );

    if (!updatedResume) {
      return NextResponse.json(
        { error: 'Failed to update resume status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      resume: updatedResume,
      message: `Resume status updated from ${oldStatus} to ${status}`
    });
  } catch (error) {
    console.error('Update resume status error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}