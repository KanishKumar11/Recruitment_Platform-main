//api/resumes/job/[jobId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from './../../../../lib/db';
import Resume from './../../../../models/Resume';
import Job from './../../../../models/Job';
import User from './../../../../models/User';
import { authenticateRequest, unauthorized, forbidden, JwtPayload } from './../../../../lib/auth';
import { UserRole } from './../../../../models/User';

// Helper function to check if user has access to the job and its resumes
async function hasAccessToJobResumes(userData: JwtPayload, job: { status: string; postedBy: { toString: () => any; }; }) {
  // Admin and internal users have access to all jobs
  if (userData.role === UserRole.ADMIN || userData.role === UserRole.INTERNAL) {
    return true;
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
    
    // Also check if this user is a team member of another company user
    // who posted the job
    const jobPoster = await User.findById(job.postedBy);
    if (jobPoster && userData.userId === jobPoster.parentId?.toString()) {
      return true;
    }
  }
  
  // Recruiters have access to their own submissions for active jobs
  if (userData.role === UserRole.RECRUITER && job.status === 'ACTIVE') {
    return 'RECRUITER_ACCESS'; // Special flag to indicate recruiter access type
  }
  
  return false;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();
    
    const { jobId } = await params;
    
    // Ensure jobId is a valid ObjectId format
    if (!jobId || jobId.length !== 24) {
      return NextResponse.json({ error: 'Invalid job ID format' }, { status: 400 });
    }
    
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if user has access to this job's resumes
    const accessResult = await hasAccessToJobResumes(userData, job);
    if (!accessResult) {
      return forbidden();
    }

    // Different access rules for different roles
    let resumesQuery = null;
    
    if (userData.role === UserRole.ADMIN || userData.role === UserRole.INTERNAL) {
      // Admin and Internal users can see all resumes for the job
      resumesQuery = Resume.find({ jobId }).sort({ createdAt: -1 });
    } else if (userData.role === UserRole.COMPANY) {
      // Company users can see resumes for their own jobs or their team members' jobs (if primary)
      resumesQuery = Resume.find({ jobId }).sort({ createdAt: -1 });
    } else if (userData.role === UserRole.RECRUITER && accessResult === 'RECRUITER_ACCESS') {
      // Recruiters can only see their own submissions for active jobs
      resumesQuery = Resume.find({ 
        jobId,
        submittedBy: userData.userId 
      }).sort({ createdAt: -1 });
    }

    // Populate the submittedBy field with user name
    if (!resumesQuery) {
      return NextResponse.json({ error: 'Access denied or invalid query' }, { status: 403 });
    }
    const resumes = await resumesQuery.lean();
    
    // Get unique submitter IDs
    const submitterIds = [...new Set(resumes.map(resume => resume.submittedBy))];
    
    // Fetch submitter information in a single query
    const submitters = await User.find({ 
      _id: { $in: submitterIds } 
    }).select('_id name');
    
    // Create a mapping of ID to name
    const submitterMap = submitters.reduce((map, user) => {
      map[user._id.toString()] = user.name;
      return map;
    }, {});
    
    // Add submitter name to each resume
    const resumesWithSubmitterName = resumes.map(resume => {
      const submitterId = resume.submittedBy?.toString();
      return {
        ...resume,
        submitterName: submitterId ? submitterMap[submitterId] || 'Unknown Recruiter' : 'Unknown Recruiter'
      };
    });
    
    // If the job was not posted by this user but they are a primary user,
    // add additional context information about the job poster
    if (userData.role === UserRole.COMPANY && job.postedBy.toString() !== userData.userId) {
      const jobPoster = await User.findById(job.postedBy).select('name');
      return NextResponse.json({
        resumes: resumesWithSubmitterName,
        jobPostedBy: jobPoster?.name || 'Team Member'
      });
    }

    return NextResponse.json(resumesWithSubmitterName);
  } catch (error) {
    console.error('Get resumes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}