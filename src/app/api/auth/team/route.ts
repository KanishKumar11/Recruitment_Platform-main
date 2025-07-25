//src/app/api/auth/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from './../../../lib/db';
import User from './../../../models/User';
import { authenticateRequest, unauthorized } from './../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    console.log('User data:', userData);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();
    const { name, email, password, phone } = await req.json();

    // Validate input
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Get the current user
    const currentUser = await User.findById(userData.userId);
    if (!currentUser || !currentUser.isPrimary) {
      return NextResponse.json(
        { error: 'Only primary members can add team members' },
        { status: 403 }
      );
    }

    // Create new team member
    const teamMember = new User({
      name,
      email,
      password,
      phone,
      role: currentUser.role,
      isPrimary: false,
      parentId: currentUser._id,
    });

    await teamMember.save();

    return NextResponse.json({
      success: true,
      user: {
        id: teamMember._id,
        name: teamMember.name,
        email: teamMember.email,
      },
    });
  } catch (error) {
    console.error('Team member creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}