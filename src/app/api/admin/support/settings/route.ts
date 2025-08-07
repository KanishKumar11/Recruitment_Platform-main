import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import { authenticateRequest, authorizeRoles } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import {
  getAllSupportSettings,
  setSupportSetting,
  validateSupportEmail,
  SUPPORT_SETTINGS,
} from "@/app/lib/supportSettings";

// GET - Fetch support settings
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

    const settings = await getAllSupportSettings();

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching support settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch support settings" },
      { status: 500 }
    );
  }
}

// PUT - Update support settings
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

    // Validate support email if provided
    if (settings[SUPPORT_SETTINGS.SUPPORT_EMAIL]) {
      const emailValidation = validateSupportEmail(
        settings[SUPPORT_SETTINGS.SUPPORT_EMAIL]
      );
      if (!emailValidation.isValid) {
        validationErrors.support_email = emailValidation.error!;
      }
    }

    // Validate boolean settings
    const booleanSettings = [
      SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE,
      SUPPORT_SETTINGS.SUPPORT_NOTIFICATION_ENABLED,
    ];

    booleanSettings.forEach((key) => {
      if (settings[key] !== undefined && typeof settings[key] !== "boolean") {
        validationErrors[key] = "Must be a boolean value";
      }
    });

    // Validate email template if provided
    if (
      settings[SUPPORT_SETTINGS.SUPPORT_EMAIL_TEMPLATE] &&
      typeof settings[SUPPORT_SETTINGS.SUPPORT_EMAIL_TEMPLATE] !== "string"
    ) {
      validationErrors.support_email_template = "Must be a string";
    }

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Update each setting
    const updatedSettings: Record<string, any> = {};
    const validSupportKeys = Object.values(SUPPORT_SETTINGS);

    for (const [key, value] of Object.entries(settings)) {
      if (validSupportKeys.includes(key as any)) {
        await setSupportSetting(
          key,
          value,
          userData.userId,
          getSettingDescription(key)
        );
        updatedSettings[key] = value;

        // Log the change for audit trail
        console.log(
          `Support setting updated: ${key} = ${JSON.stringify(value)} by user ${
            userData.userId
          }`
        );
      }
    }

    // Get all current settings to return
    const allSettings = await getAllSupportSettings();

    return NextResponse.json({
      message: "Support settings updated successfully",
      settings: allSettings,
      updated: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating support settings:", error);
    return NextResponse.json(
      { error: "Failed to update support settings" },
      { status: 500 }
    );
  }
}

/**
 * Get description for a setting key
 */
function getSettingDescription(key: string): string {
  switch (key) {
    case SUPPORT_SETTINGS.SUPPORT_EMAIL:
      return "Email address where support ticket notifications are sent";
    case SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE:
      return "Whether to send automatic response emails to users when they submit tickets";
    case SUPPORT_SETTINGS.SUPPORT_EMAIL_TEMPLATE:
      return "HTML template for support ticket notification emails";
    case SUPPORT_SETTINGS.SUPPORT_NOTIFICATION_ENABLED:
      return "Whether email notifications for new tickets are enabled";
    default:
      return "Support system setting";
  }
}
