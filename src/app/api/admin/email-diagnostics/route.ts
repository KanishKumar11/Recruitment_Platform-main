import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, authorizeRoles } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import connectDb from "@/app/lib/db";
import EmailNotification from "@/app/models/EmailNotification";
import { validateEmailConfiguration } from "@/app/lib/supportEmailService";
import { getAllEmailNotificationSettings } from "@/app/lib/emailNotificationSettings";
import { getProcessorStatus } from "@/app/lib/backgroundJobProcessor";
import { sendOTPEmail } from "@/app/lib/emailService";

// GET - Email system diagnostics
export async function GET(request: NextRequest) {
  try {
    const userData = authenticateRequest(request);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authResult = authorizeRoles([UserRole.ADMIN], userData.role);
    if (!authResult.authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDb();

    // Check email configuration
    const emailConfig = await validateEmailConfiguration();
    
    // Get email notification settings
    const emailSettings = await getAllEmailNotificationSettings();
    
    // Get background processor status
    const processorStatus = getProcessorStatus();
    
    // Get recent email notifications
    const recentNotifications = await EmailNotification.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type status errorMessage createdAt recipientCount emailSent');
    
    // Get failed notifications count
    const failedCount = await EmailNotification.countDocuments({ status: 'failed' });
    const pendingCount = await EmailNotification.countDocuments({ status: 'pending' });
    const sentCount = await EmailNotification.countDocuments({ status: 'sent' });
    
    // Environment variables check
    const envCheck = {
      ZOHO_EMAIL: !!process.env.ZOHO_EMAIL,
      ZOHO_APP_PASSWORD: !!process.env.ZOHO_APP_PASSWORD,
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json({
      emailConfiguration: emailConfig,
      emailSettings,
      processorStatus,
      environmentVariables: envCheck,
      statistics: {
        failed: failedCount,
        pending: pendingCount,
        sent: sentCount,
        total: failedCount + pendingCount + sentCount,
      },
      recentNotifications,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in email diagnostics:", error);
    return NextResponse.json(
      { error: "Failed to get email diagnostics" },
      { status: 500 }
    );
  }
}

// POST - Test email functionality
export async function POST(request: NextRequest) {
  try {
    const userData = authenticateRequest(request);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authResult = authorizeRoles([UserRole.ADMIN], userData.role);
    if (!authResult.authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { testEmail, testType = "basic" } = await request.json();

    if (!testEmail) {
      return NextResponse.json(
        { error: "Test email address is required" },
        { status: 400 }
      );
    }

    let testResult;
    
    if (testType === "basic") {
      // Send a basic test email using OTP function (repurposed for testing)
      testResult = await sendOTPEmail(
        testEmail,
        "Test User",
        "TEST123"
      );
    }

    return NextResponse.json({
      success: testResult,
      message: testResult 
        ? "Test email sent successfully" 
        : "Failed to send test email",
      testEmail,
      testType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to send test email",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
