//src/app/api/admin/payout-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/app/lib/db";
import User, { UserRole } from "@/app/models/User";
import PayoutSettings from "@/app/models/PayoutSettings";

// GET - Retrieve all payout settings (admin only)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (jwtError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Get all payout settings with user information
    const payoutSettings = await PayoutSettings.find()
      .populate({
        path: "userId",
        select: "name email phone recruitmentFirmName country state city",
        match: { role: UserRole.RECRUITER }
      })
      .populate({
        path: "lastUpdatedBy",
        select: "name email"
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out any settings where userId population failed (non-recruiter users)
    const validPayoutSettings = payoutSettings.filter(setting => setting.userId);

    const totalCount = await PayoutSettings.countDocuments({
      userId: { $in: await User.find({ role: UserRole.RECRUITER }).distinct('_id') }
    });

    return NextResponse.json({
      success: true,
      data: validPayoutSettings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching payout settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET specific recruiter's payout settings (admin only)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (jwtError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { recruiterId } = body;

    // Validate recruiter ID
    if (!recruiterId || typeof recruiterId !== 'string') {
      return NextResponse.json(
        { error: "Valid recruiter ID is required" },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(recruiterId)) {
      return NextResponse.json(
        { error: "Invalid recruiter ID format" },
        { status: 400 }
      );
    }

    // Verify the recruiter exists and has the correct role
    let recruiter;
    try {
      recruiter = await User.findById(recruiterId);
    } catch (dbError) {
      console.error("Database error finding recruiter:", dbError);
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    }
    
    if (!recruiter || recruiter.role !== UserRole.RECRUITER) {
      return NextResponse.json(
        { error: "Recruiter not found" },
        { status: 404 }
      );
    }

    let payoutSettings;
    try {
      payoutSettings = await PayoutSettings.findOne({ userId: recruiterId })
        .populate('userId', 'firstName lastName email');
    } catch (dbError) {
      console.error("Database error finding payout settings:", dbError);
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    }
    
    if (!payoutSettings) {
      return NextResponse.json(
        { error: "Payout settings not found for this recruiter" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: payoutSettings,
    });
  } catch (error) {
    console.error("Error fetching recruiter payout settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}