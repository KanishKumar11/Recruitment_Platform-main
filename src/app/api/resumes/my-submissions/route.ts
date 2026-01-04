import { NextRequest, NextResponse } from 'next/server';
import connectDb from './../../../lib/db';
import ResumeModel from './../../../models/Resume';
import Job from './../../../models/Job';
import User from './../../../models/User';
import { authenticateRequest, unauthorized, forbidden } from './../../../lib/auth';
import { UserRole } from './../../../models/User';

export async function GET(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    // Only recruiters should access this endpoint
    if (userData.role !== UserRole.RECRUITER) {
      return forbidden();
    }

    await connectDb();

    // Check if the user is a primary account holder
    const currentUser = await User.findById(userData.userId).lean();
    const isPrimary = Array.isArray(currentUser) ? false : currentUser?.isPrimary || false;
    
    // Define the query based on whether the user is primary
    let resumeQuery = {};
    
    if (isPrimary) {
      // Get all team members (users where parentId is the current user's ID)
      const teamMembers = await User.find({ 
        $or: [
          { _id: userData.userId },
          { parentId: userData.userId }
        ]
      }).select('_id').lean();
      
      const memberIds = teamMembers.map(member => member._id);
      
      // Primary recruiters can see all submissions from themselves and their team
      resumeQuery = { 
        submittedBy: { $in: memberIds }
      };
    } else {
      // Regular recruiters can only see their own submissions
      resumeQuery = { 
        submittedBy: userData.userId 
      };
    }

    // Find resumes based on the determined query
    const resumes = await ResumeModel.find(resumeQuery).sort({ updatedAt: -1 }).lean();

    // Get unique job IDs from the resumes
    const jobIds = [...new Set(resumes.map(resume => resume.jobId))];
    
    // Fetch job details for all related jobs in a single query
    const jobs = await Job.find({ 
      _id: { $in: jobIds } 
    }).select('_id title company jobCode location').lean();
    
    // Create a map of job IDs to titles for quick lookup
    const jobMap = (jobs as any).reduce((map: Record<string, { title: string; company: string; jobCode?: string; location?: string }>, job: any) => {
      map[job._id.toString()] = {
        title: job.title,
        company: job.company,
        jobCode: job.jobCode,
        location: job.location,
      };
      return map;
    }, {});
    
    // If primary user, get info about all recruiters who submitted resumes
    let recruiterMap: Record<string, string> = {};
    
    if (isPrimary) {
      // Get unique recruiter IDs
      const recruiterIds = [...new Set(resumes
        .map(resume => resume.submittedBy)
        .filter(id => id !== null && id !== undefined)
      )];
      
      // Fetch all recruiters' info in one query
      const recruiters = await User.find({
        _id: { $in: recruiterIds }
      }).select('_id name').lean();
      
      // Create a map for easy lookup
      recruiterMap = recruiters.reduce((map: Record<string, string>, recruiter: any) => {
        map[recruiter._id.toString()] = recruiter.name;
        return map;
      }, {});
    }
    
    // Add job title, company, and recruiter name to each resume
    const resumesWithDetails = resumes.map(resume => {
      const jobId = resume.jobId.toString();
      const submittedById = resume.submittedBy ? resume.submittedBy.toString() : '';
      
      return {
        ...resume,
        jobTitle: jobMap[jobId]?.title || 'Unknown Job',
        companyName: jobMap[jobId]?.company || 'Unknown Company',
        jobCode: jobMap[jobId]?.jobCode,
        jobLocation: jobMap[jobId]?.location,
        // Add submitter name if it's a primary user viewing
        ...(isPrimary && { submittedByName: recruiterMap[submittedById] || 'Unknown Recruiter' })
      };
    });

    return NextResponse.json(resumesWithDetails);
  } catch (error) {
    console.error('Get recruiter submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}