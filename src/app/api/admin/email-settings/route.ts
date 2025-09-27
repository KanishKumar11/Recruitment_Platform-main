import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import { authenticateRequest, authorizeRoles } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import Settings from "@/app/models/Settings";
import {
  getAllEmailNotificationSettings,
  updateEmailNotificationSettings,
  EMAIL_NOTIFICATION_SETTINGS,
  initializeEmailNotificationSettings,
} from "@/app/lib/emailNotificationSettings";

// GET - Fetch email notification settings
export async function GET(request: NextRequest) {
  try {
    await connectDb();

    const userData = authenticateRequest(request);
    if (!userData) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!authorizeRoles(request, [UserRole.ADMIN])) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const settings = await getAllEmailNotificationSettings();

    // Initialize default settings if they don't exist
    const settingKeys = Object.values(EMAIL_NOTIFICATION_SETTINGS);
    const existingSettings = await Settings.find({ key: { $in: settingKeys } });
    if (existingSettings.length === 0) {
      await initializeEmailNotificationSettings(userData.userId);
      // Re-fetch after initialization
      const updatedSettings = await getAllEmailNotificationSettings();
      return NextResponse.json({ settings: updatedSettings });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching email notification settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch email notification settings" },
      { status: 500 }
    );
  }
}

// PUT - Update email notification settings
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

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Settings object is required" },
        { status: 400 }
      );
    }

    // Validate settings
    const validationErrors: Record<string, string> = {};

    // Validate job notification frequency
    if (
      settings[EMAIL_NOTIFICATION_SETTINGS.JOB_NOTIFICATION_FREQUENCY] !==
      undefined
    ) {
      const frequency =
        settings[EMAIL_NOTIFICATION_SETTINGS.JOB_NOTIFICATION_FREQUENCY];
      if (!Number.isInteger(frequency) || frequency < 1 || frequency > 50) {
        validationErrors.job_notification_frequency =
          "Frequency must be an integer between 1 and 50";
      }
    }

    // Validate boolean settings
    const booleanSettings = [
      EMAIL_NOTIFICATION_SETTINGS.END_OF_DAY_NOTIFICATIONS,
      EMAIL_NOTIFICATION_SETTINGS.NOTIFICATION_ENABLED,
    ];

    booleanSettings.forEach((key) => {
      if (settings[key] !== undefined && typeof settings[key] !== "boolean") {
        validationErrors[key] = "Boolean value expected";
      }
    });

    // Validate end-of-day time format
    if (settings[EMAIL_NOTIFICATION_SETTINGS.END_OF_DAY_TIME] !== undefined) {
      const time = settings[EMAIL_NOTIFICATION_SETTINGS.END_OF_DAY_TIME];
      if (
        typeof time !== "string" ||
        !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)
      ) {
        validationErrors.end_of_day_time =
          "Time must be in HH:MM format (24-hour)";
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { error: "Validation failed", validationErrors },
        { status: 400 }
      );
    }

    // Update settings
    await updateEmailNotificationSettings(settings, userData.userId);

    // Fetch updated settings
    const updatedSettings = await getAllEmailNotificationSettings();

    return NextResponse.json({
      message: "Email notification settings updated successfully",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating email notification settings:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update email notification settings" },
      { status: 500 }
    );
  }
}
