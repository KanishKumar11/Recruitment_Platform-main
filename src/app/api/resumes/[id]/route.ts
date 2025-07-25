import { NextRequest, NextResponse } from 'next/server';
import connectDb from './../../../lib/db';
import Resume from './../../../models/Resume';
import Job from './../../../models/Job';
import User, { UserRole } from './../../../models/User';
import { authenticateRequest, unauthorized, forbidden } from './../../../lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) return unauthorized();

    await connectDb();

    const { id } = await params;

    const resume = await Resume.findById(id).populate({
      path: 'screeningAnswers.questionId',
      model: 'ScreeningQuestion',
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const job = await Job.findById(resume.jobId);
    if (!job) {
      return NextResponse.json({ error: 'Associated job not found' }, { status: 404 });
    }

    // Admins/Internal can view all resumes
    if (userData.role === UserRole.ADMIN || userData.role === UserRole.INTERNAL) {
      return NextResponse.json(resume);
    }

    // Company logic stays as-is
    if (userData.role === UserRole.COMPANY) {
      const currentUser = await User.findById(userData.userId);
      if (!currentUser) return forbidden();

      if (currentUser.isPrimary) {
        const members = await User.find({
          $or: [
            { _id: currentUser._id },
            { parentId: currentUser._id },
          ],
        }).select('_id');

        const memberIds = members.map(m => m._id.toString());
        if (!memberIds.includes(job.postedBy.toString())) return forbidden();

        return NextResponse.json(resume);
      } else {
        if (job.postedBy.toString() !== currentUser._id.toString()) return forbidden();
        return NextResponse.json(resume);
      }
    }

    // ✅ Recruiter logic — including primary recruiter access
    if (userData.role === UserRole.RECRUITER) {
      const currentUser = await User.findById(userData.userId);
      if (!currentUser) return forbidden();

      // If the recruiter is the one who submitted the resume
      if (resume.submittedBy.toString() === userData.userId) {
        return NextResponse.json(resume);
      }

      // If recruiter is primary, check if submission was from their team
      if (currentUser.isPrimary) {
        const teamMember = await User.findOne({
          _id: resume.submittedBy,
          parentId: currentUser._id,
        });

        if (teamMember) {
          return NextResponse.json(resume);
        }
      }

      return forbidden();
    }

    // All other roles forbidden
    return forbidden();
  } catch (error) {
    console.error('Get resume error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) return unauthorized();

    // Only admins can delete resumes
    if (userData.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Only administrators can delete resumes' },
        { status: 403 }
      );
    }

    await connectDb();

    const { id } = await params;

    const resume = await Resume.findById(id);
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Delete the physical file if it exists
    // if (resume.filePath) {
    //   try {
    //     const fullPath = path.join(process.cwd(), 'uploads', resume.filePath);
    //     await unlink(fullPath);
    //   } catch (fileError) {
    //     console.warn('Could not delete physical file:', fileError);
    //     // Continue with database deletion even if file deletion fails
    //   }
    // }

    // Delete the resume from database
    await Resume.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'Resume deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete resume error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}