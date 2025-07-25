// api/resumes/route.ts - Updated version
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import connectDb from './../../lib/db';
import Resume from './../../models/Resume';
import Job from './../../models/Job';
import { authenticateRequest, unauthorized } from './../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();
    
    const formData = await req.formData();
    
    const jobId = formData.get('jobId') as string;
    const candidateName = formData.get('candidateName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const alternativePhone = formData.get('alternativePhone') as string;
    const country = formData.get('country') as string;
    const location = formData.get('location') as string;
    const currentCompany = formData.get('currentCompany') as string;
    const currentDesignation = formData.get('currentDesignation') as string;
    const totalExperience = formData.get('totalExperience') as string;
    const relevantExperience = formData.get('relevantExperience') as string;
    const currentCTC = formData.get('currentCTC') as string;
    const expectedCTC = formData.get('expectedCTC') as string;
    const noticePeriod = formData.get('noticePeriod') as string;
    const qualification = formData.get('qualification') as string;
    const remarks = formData.get('remarks') as string;
    
    const resumeFile = formData.get('resumeFile') as File;
    if (!resumeFile) {
      return NextResponse.json(
        { error: 'Resume file is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!jobId || !candidateName || !email || !phone || !country || !location || 
        !currentCompany || !currentDesignation || !totalExperience || !relevantExperience ||
        !currentCTC || !expectedCTC || !noticePeriod || !qualification) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Parse screening question answers
    const screeningAnswers = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('screeningAnswer_')) {
        const questionId = key.replace('screeningAnswer_', '');
        screeningAnswers.push({
          questionId,
          answer: value as string,
        });
      }
    }

    // Save the file - Updated to use uploads directory outside public
    const bytes = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create uploads directory outside public folder
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    
    // Generate unique filename
    const uniqueFilename = `${uuidv4()}_${resumeFile.name}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    
    // Write the file
    await writeFile(filePath, buffer);
    
    // Create resume record - store relative path for API serving
    const resume = new Resume({
      jobId,
      submittedBy: userData.userId,
      candidateName,
      email,
      phone,
      alternativePhone: alternativePhone || undefined,
      country,
      location,
      currentCompany,
      currentDesignation,
      totalExperience,
      relevantExperience,
      currentCTC,
      expectedCTC,
      noticePeriod,
      qualification,
      remarks: remarks || undefined,
      resumeFile: uniqueFilename, // Store just the filename
      screeningAnswers,
    });

    await resume.save();

    return NextResponse.json(resume);
  } catch (error) {
    console.error('Upload resume error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}