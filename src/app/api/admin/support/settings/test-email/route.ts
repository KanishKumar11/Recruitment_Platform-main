import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import { authenticateRequest, authorizeRoles } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import {
  sendTestSupportEmail,
  validateEmailConfiguration,
  logEmailAttempt,
} from "@/app/lib/supportEmailService";
import { validateSupportEmail } from "@/app/lib/supportSettings";

// POST - Send test email to verify configuration
export async function POST(request: NextRequest) {
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
    const { testEmail } = body;

    // Validate test email
    if (!testEmail) {
      return NextResponse.json(
        { error: "Test email address is required" },
        { status: 400 }
      );
    }

    const emailValidation = validateSupportEmail(testEmail);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: "Invalid email format", details: emailValidation.error },
        { status: 400 }
      );
    }

    // Validate email configuration first
    const configValidation = await validateEmailConfiguration();
    if (!configValidation.isValid) {
      return NextResponse.json(
        {
          error: "Email configuration is invalid",
          issues: configValidation.issues,
        },
        { status: 400 }
      );
    }

    // Send test email
    const result = await sendTestSupportEmail(testEmail);

    // Log the attempt
    logEmailAttempt(
      "test",
      "TEST-EMAIL",
      testEmail,
      result.success,
      result.error
    );

    if (result.success) {
      return NextResponse.json({
        message: "Test email sent successfully",
        recipient: testEmail,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          error: "Failed to send test email",
          details: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}

// GET - Validate current email configuration
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

    // Validate email configuration
    const validation = await validateEmailConfiguration();

    return NextResponse.json({
      isValid: validation.isValid,
      issues: validation.issues,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error validating email configuration:", error);
    return NextResponse.json(
      { error: "Failed to validate email configuration" },
      { status: 500 }
    );
  }
}
