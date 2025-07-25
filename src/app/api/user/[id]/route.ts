//app/api/user/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '../../../lib/db';
import User from '../../../models/User';
import { authenticateRequest, unauthorized } from '../../../lib/auth';

// GET endpoint to fetch a specific user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    const { id } = await params;
    await connectDb();
    const user = await User.findById(id).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    const { id } = await params;
    await connectDb();
    const updates = await req.json();
    
    // Remove password from updates if it's empty
    if (updates.password === '') {
      delete updates.password;
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only allow primary members to update team members
    const currentUser = await User.findById(userData.userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' },
        { status: 404 }
      );
    }

    // Check if user is updating their own profile or is a primary member updating a team member
    if (
      userData.userId !== id && 
      !(currentUser.isPrimary && user.parentId?.toString() === currentUser._id.toString())
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to update this user' },
        { status: 403 }
      );
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).select('-password');

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    const { id } = await params;
    await connectDb();
    
    // Find the user to delete
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if current user is authorized to delete this user
    const currentUser = await User.findById(userData.userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' },
        { status: 404 }
      );
    }

    // Only allow primary members to delete team members
    if (
      !currentUser.isPrimary || 
      userToDelete.parentId?.toString() !== currentUser._id.toString()
    ) {
      return NextResponse.json(
        { error: 'Only primary members can delete team members' },
        { status: 403 }
      );
    }

    // Cannot delete primary users
    if (userToDelete.isPrimary) {
      return NextResponse.json(
        { error: 'Cannot delete primary user accounts' },
        { status: 403 }
      );
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}