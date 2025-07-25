//app/api/user/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '../../../lib/db';
import User from '../../../models/User';
import { authenticateRequest, unauthorized } from '../../../lib/auth';

// GET endpoint to fetch team members for the current user
export async function GET(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();

    // Get the current user
    const currentUser = await User.findById(userData.userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let teamMembers;
    
    if (currentUser.isPrimary) {
      // If primary user, get all team members with this user as parent
      teamMembers = await User.find({ 
        parentId: currentUser._id 
      }).select('-password');
    } else {
      // If not primary, get all team members under the same parent
      teamMembers = await User.find({ 
        parentId: currentUser.parentId 
      }).select('-password');
    }

    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error('Team members fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}