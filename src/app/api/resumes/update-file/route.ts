import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/app/lib/db';
import ResumeModel from '@/app/models/Resume';
import { verifyToken } from '@/app/lib/auth';
import path from 'path';
import { validateResumeFile } from '@/app/lib/fileValidation';
import { uploadFileToR2, deleteFileFromR2, getContentType } from '@/app/lib/r2Storage';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check user role permissions
    const allowedRoles = ['COMPANY', 'ADMIN', 'INTERNAL', 'RECRUITER'];
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const resumeId = formData.get('resumeId') as string;

    if (!file || !resumeId) {
      return NextResponse.json({ error: 'File and resumeId are required' }, { status: 400 });
    }

    // Validate resume file
    const validation = validateResumeFile(file);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await connectDb();

    // Find the resume
    const resume = await ResumeModel.findById(resumeId);
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Check if resume status allows editing
    if (resume.status !== 'SUBMITTED') {
      return NextResponse.json({ error: 'Can only edit files when status is SUBMITTED' }, { status: 403 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const newFilename = `resume_${resumeId}_${timestamp}${fileExtension}`;

    // Save new file to R2
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const contentType = getContentType(file.name);
    await uploadFileToR2(buffer, newFilename, contentType);

    // Delete old file from R2 if it exists
    if (resume.resumeFile) {
      try {
        await deleteFileFromR2(resume.resumeFile);
      } catch (error) {
        console.warn('Could not delete old resume file from R2:', error);
      }
    }

    // Update resume record
    resume.resumeFile = newFilename;
    resume.updatedAt = new Date();
    await resume.save();

    return NextResponse.json({
      message: 'Resume file updated successfully',
      filename: newFilename
    });

  } catch (error) {
    console.error('Error updating resume file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}