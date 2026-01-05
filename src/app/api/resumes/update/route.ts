import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import connectDb from '../../../lib/db';
import ResumeModel from '../../../models/Resume';
import { authenticateRequest, unauthorized, forbidden } from '../../../lib/auth';
import { UserRole } from '../../../models/User';
import { validateResumeFile, validateAdditionalDocument } from '../../../lib/fileValidation';
import { uploadFileToR2, deleteFileFromR2, getContentType } from '../../../lib/r2Storage';

export async function PUT(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    // Only recruiters and internal users can update resumes
    if (userData.role !== UserRole.RECRUITER && userData.role !== UserRole.INTERNAL) {
      return forbidden();
    }

    await connectDb();

    const formData = await req.formData();
    const resumeId = formData.get('resumeId') as string;

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 });
    }

    // Find the resume
    const resume = await ResumeModel.findById(resumeId);
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Check permissions - recruiters can only edit their own submissions
    if (userData.role === UserRole.RECRUITER && resume.submittedBy.toString() !== userData.userId) {
      return forbidden();
    }

    // Check if resume status allows editing
    if (resume.status === 'SUBMITTED') {
      return NextResponse.json({ error: 'Cannot edit resume after submission is finalized' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};

    // Update basic fields if provided
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

    if (candidateName) updateData.candidateName = candidateName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (alternativePhone) updateData.alternativePhone = alternativePhone;
    if (country) updateData.country = country;
    if (location) updateData.location = location;
    if (currentCompany) updateData.currentCompany = currentCompany;
    if (currentDesignation) updateData.currentDesignation = currentDesignation;
    if (totalExperience) updateData.totalExperience = totalExperience;
    if (relevantExperience) updateData.relevantExperience = relevantExperience;
    if (currentCTC) updateData.currentCTC = currentCTC;
    if (expectedCTC) updateData.expectedCTC = expectedCTC;
    if (noticePeriod) updateData.noticePeriod = noticePeriod;
    if (qualification) updateData.qualification = qualification;
    if (remarks) updateData.remarks = remarks;

    // Handle resume file update
    const resumeFile = formData.get('resumeFile') as File;
    if (resumeFile && resumeFile.size > 0) {
      // Validate resume file
      const resumeValidation = validateResumeFile(resumeFile);
      if (!resumeValidation.isValid) {
        return NextResponse.json({ error: resumeValidation.error }, { status: 400 });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = path.extname(resumeFile.name);
      const uniqueResumeFilename = `resume_${resumeId}_${timestamp}${fileExtension}`;

      // Save new resume file to R2
      const resumeBytes = await resumeFile.arrayBuffer();
      const resumeBuffer = Buffer.from(resumeBytes);
      const contentType = getContentType(resumeFile.name);
      await uploadFileToR2(resumeBuffer, uniqueResumeFilename, contentType);

      // Delete old resume file from R2 if it exists
      if (resume.resumeFile) {
        try {
          await deleteFileFromR2(resume.resumeFile);
        } catch (error) {
          console.warn('Could not delete old resume file from R2:', error);
        }
      }

      updateData.resumeFile = uniqueResumeFilename;
    }

    // Handle additional documents
    const additionalFiles = formData.getAll('additionalFiles') as File[];
    const filesToRemove = formData.get('filesToRemove') ? JSON.parse(formData.get('filesToRemove') as string) : [];

    // Remove files marked for deletion
    if (filesToRemove.length > 0 && resume.additionalDocuments) {
      const updatedAdditionalDocs = resume.additionalDocuments.filter((doc: any) => {
        if (filesToRemove.includes(doc.filename)) {
          // Delete the file from R2
          deleteFileFromR2(doc.filename).catch(error => {
            console.warn('Could not delete additional document from R2:', error);
          });
          return false;
        }
        return true;
      });
      updateData.additionalDocuments = updatedAdditionalDocs;
    }

    // Add new additional documents
    if (additionalFiles.length > 0) {
      const newAdditionalDocs = [];

      for (const file of additionalFiles) {
        if (file.size > 0) {
          // Validate additional document
          const docValidation = validateAdditionalDocument(file);
          if (!docValidation.isValid) {
            return NextResponse.json({ error: `Additional document "${file.name}": ${docValidation.error}` }, { status: 400 });
          }

          const timestamp = Date.now();
          const fileExtension = path.extname(file.name);
          const uniqueDocFilename = `doc_${resumeId}_${timestamp}_${Math.random().toString(36).substring(7)}${fileExtension}`;

          // Upload the additional document to R2
          const fileBytes = await file.arrayBuffer();
          const fileBuffer = Buffer.from(fileBytes);
          const contentType = getContentType(file.name);
          await uploadFileToR2(fileBuffer, uniqueDocFilename, contentType);

          newAdditionalDocs.push({
            filename: uniqueDocFilename,
            originalName: file.name,
            uploadedAt: new Date(),
          });
        }
      }

      // Merge with existing documents (if not replacing all)
      if (!updateData.additionalDocuments) {
        updateData.additionalDocuments = [...(resume.additionalDocuments || []), ...newAdditionalDocs];
      } else {
        updateData.additionalDocuments = [...updateData.additionalDocuments, ...newAdditionalDocs];
      }
    }

    // Update the resume
    updateData.updatedAt = new Date();
    const updatedResume = await ResumeModel.findByIdAndUpdate(
      resumeId,
      { $set: updateData },
      { new: true, runValidators: false }
    );

    if (!updatedResume) {
      return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Resume updated successfully',
      resume: updatedResume
    });

  } catch (error) {
    console.error('Error updating resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}