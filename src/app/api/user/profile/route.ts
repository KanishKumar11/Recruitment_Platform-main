import { NextResponse, NextRequest } from 'next/server';
import connectDb from '../../../lib/db';
import User from '../../../models/User';
import { verifyToken } from '../../../lib/auth';

// GET user profile
export async function GET(req: NextRequest) {
  try {
    await connectDb();
    
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Find user without returning password
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isPrimary: user.isPrimary,
      companyName: user.companyName,
      designation: user.designation,
      companySize: user.companySize,
      recruitmentFirmName: user.recruitmentFirmName,
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// UPDATE user profile
export async function PUT(req: NextRequest) {
  try {
    await connectDb();
    
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const { 
      name, 
      email, 
      phone, 
      companyName, 
      companySize, 
      designation, 
      recruitmentFirmName,
      // Recruiter-specific fields
      profilePicture,
      mobileNumber,
      whatsappNumber,
      otherContactInfo,
      country,
      state,
      city,
      totalWorkExperience,
      recruitmentExperience,
      rolesClosedLastYear,
      countriesWorkedIn,
      bio,
      linkedinUrl,
      facebookUrl,
      otherSocialUrl,
      geographiesCanHireIn,
      recruiterType,
      recruiterCompanyName,
      recruiterDesignation,
      recruiterCompanySize,
      companyEstablishmentYears,
      companyProfile,
      resumeFileUrl
    } = await req.json();
    
    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Check if email is already in use by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: decoded.userId } 
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        );
      }
    }
    
    // Prepare update object
    const updateData = {
      name,
      email,
      phone: phone || '',
      companyName: companyName || '',
      designation: designation || '',
      companySize: companySize || '',
      recruitmentFirmName: recruitmentFirmName || '',
      // Recruiter-specific fields
      ...(profilePicture !== undefined && { profilePicture }),
      ...(mobileNumber !== undefined && { mobileNumber }),
      ...(whatsappNumber !== undefined && { whatsappNumber }),
      ...(otherContactInfo !== undefined && { otherContactInfo }),
      ...(country !== undefined && { country }),
      ...(state !== undefined && { state }),
      ...(city !== undefined && { city }),
      ...(totalWorkExperience !== undefined && { totalWorkExperience }),
      ...(recruitmentExperience !== undefined && { recruitmentExperience }),
      ...(rolesClosedLastYear !== undefined && { rolesClosedLastYear }),
      ...(countriesWorkedIn !== undefined && { countriesWorkedIn }),
      ...(bio !== undefined && { bio }),
      ...(linkedinUrl !== undefined && { linkedinUrl }),
      ...(facebookUrl !== undefined && { facebookUrl }),
      ...(otherSocialUrl !== undefined && { otherSocialUrl }),
      ...(geographiesCanHireIn !== undefined && { geographiesCanHireIn }),
      ...(recruiterType !== undefined && { recruiterType }),
      ...(recruiterCompanyName !== undefined && { recruiterCompanyName }),
      ...(recruiterDesignation !== undefined && { recruiterDesignation }),
      ...(recruiterCompanySize !== undefined && { recruiterCompanySize }),
      ...(companyEstablishmentYears !== undefined && { companyEstablishmentYears }),
      ...(companyProfile !== undefined && { companyProfile }),
      ...(resumeFileUrl !== undefined && { resumeFileUrl })
    };
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isPrimary: updatedUser.isPrimary,
      companyName: updatedUser.companyName,
      designation: updatedUser.designation,
      companySize: updatedUser.companySize,
      recruitmentFirmName: updatedUser.recruitmentFirmName,
    });
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}