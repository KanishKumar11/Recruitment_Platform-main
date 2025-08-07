import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import Settings from "@/app/models/Settings";
import { authenticateRequest, authorizeRoles } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";

// GET - Fetch settings
export async function GET(request: NextRequest) {
  try {
    await connectDb();

    // Check if user is admin
    if (!authorizeRoles(request, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const settings = await Settings.find().populate("updatedBy", "name email");

    // Convert to key-value object for easier frontend usage
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
        updatedBy: setting.updatedBy,
        updatedAt: setting.updatedAt,
      };
      return acc;
    }, {} as any);

    return NextResponse.json({ settings: settingsObj });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    await connectDb();

    // Check if user is admin
    if (!authorizeRoles(request, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const userData = authenticateRequest(request);
    if (!userData) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { key, value, description } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      );
    }

    const setting = await Settings.findOneAndUpdate(
      { key },
      {
        value,
        description,
        updatedBy: userData.userId,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).populate("updatedBy", "name email");

    return NextResponse.json({ setting });
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
