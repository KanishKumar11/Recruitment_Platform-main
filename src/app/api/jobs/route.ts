//src/app/api/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDb from "./../../lib/db";
import Job from "./../../models/Job";
import User from "./../../models/User";
import {
  authenticateRequest,
  authorizeRoles,
  unauthorized,
  forbidden,
} from "./../../lib/auth";
import { UserRole } from "./../../models/User";
import { transformJobForUser } from "@/app/lib/jobUtils";
import mongoose from "mongoose";
import {
  shouldSendGlobalNotification,
  getActiveRecruiters,
} from "@/app/lib/recruiterEmailService";
import { addBulkEmailNotificationJob } from "@/app/lib/backgroundJobProcessor";

// Commission configuration - should match frontend config
const COMMISSION_CONFIG = {
  DEFAULT_REDUCTION_PERCENTAGE: 50,
  MIN_REDUCTION_PERCENTAGE: 0,
  MAX_REDUCTION_PERCENTAGE: 80,
  MIN_COMMISSION_PERCENTAGE: 1,
  MAX_COMMISSION_PERCENTAGE: 50,
  MIN_FIXED_AMOUNT: 100, // Minimum fixed commission amount
  MIN_HOURLY_RATE: 10, // Minimum hourly commission rate
};

// Function to validate commission data
function validateCommissionData(commission: any) {
  if (!commission || typeof commission !== "object") {
    return { isValid: false, error: "Commission data is required" };
  }

  const { type, originalPercentage, fixedAmount, hourlyRate } = commission;

  if (!type || !["percentage", "fixed", "hourly"].includes(type)) {
    return {
      isValid: false,
      error:
        'Commission type must be either "percentage", "fixed", or "hourly"',
    };
  }

  if (type === "percentage") {
    if (
      typeof originalPercentage !== "number" ||
      originalPercentage < COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE ||
      originalPercentage > COMMISSION_CONFIG.MAX_COMMISSION_PERCENTAGE
    ) {
      return {
        isValid: false,
        error: `Commission percentage must be between ${COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE}% and ${COMMISSION_CONFIG.MAX_COMMISSION_PERCENTAGE}%`,
      };
    }
  }

  if (type === "fixed") {
    if (
      typeof fixedAmount !== "number" ||
      fixedAmount < COMMISSION_CONFIG.MIN_FIXED_AMOUNT
    ) {
      return {
        isValid: false,
        error: `Fixed commission amount must be at least $${COMMISSION_CONFIG.MIN_FIXED_AMOUNT}`,
      };
    }
  }

  if (type === "hourly") {
    if (
      typeof hourlyRate !== "number" ||
      hourlyRate < COMMISSION_CONFIG.MIN_HOURLY_RATE
    ) {
      return {
        isValid: false,
        error: `Hourly commission rate must be at least $${COMMISSION_CONFIG.MIN_HOURLY_RATE}`,
      };
    }
  }

  return { isValid: true };
}

// Function to calculate recruiter commission (for percentage type)
const calculateRecruiterCommission = (
  originalCommission: number,
  reductionPercentage: number = COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE
): number => {
  if (originalCommission <= 0) return 0;

  const reduction = (originalCommission * reductionPercentage) / 100;
  const recruiterCommission = originalCommission - reduction;

  return Math.max(
    recruiterCommission,
    COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE
  );
};

// Function to calculate fixed commission breakdown
const calculateFixedCommissionBreakdown = (
  fixedAmount: number,
  reductionPercentage: number = COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE
): { recruiterAmount: number; platformFeeAmount: number } => {
  if (fixedAmount <= 0) return { recruiterAmount: 0, platformFeeAmount: 0 };

  const platformFeeAmount = (fixedAmount * reductionPercentage) / 100;
  const recruiterAmount = fixedAmount - platformFeeAmount;

  return {
    recruiterAmount: Math.max(recruiterAmount, 0),
    platformFeeAmount,
  };
};

// Function to calculate hourly commission breakdown
const calculateHourlyCommissionBreakdown = (
  hourlyRate: number,
  reductionPercentage: number = COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE
): { recruiterAmount: number; platformFeeAmount: number } => {
  if (hourlyRate <= 0) return { recruiterAmount: 0, platformFeeAmount: 0 };

  const platformFeeAmount = (hourlyRate * reductionPercentage) / 100;
  const recruiterAmount = hourlyRate - platformFeeAmount;

  return {
    recruiterAmount: Math.max(recruiterAmount, 0),
    platformFeeAmount,
  };
};

// Function to calculate commission amount (for percentage type)
const calculateCommissionAmount = (
  salary: number,
  percentage: number
): number => {
  return (salary * percentage) / 100;
};

// Function to create complete commission structure
const createCommissionStructure = (
  type: "percentage" | "fixed" | "hourly",
  originalPercentage: number,
  fixedAmount: number,
  maxSalary: number,
  reductionPercentage: number = COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE,
  isAdminUser: boolean = false,
  hourlyRate: number = 0
) => {
  if (type === "percentage") {
    let recruiterPercentage;
    let actualOriginalPercentage = originalPercentage;

    // If admin sets recruiterPercentage directly, calculate backward
    if (isAdminUser && originalPercentage === undefined) {
      // This case would need to be handled differently based on your admin UI
      recruiterPercentage = originalPercentage;
    } else {
      recruiterPercentage = calculateRecruiterCommission(
        originalPercentage,
        reductionPercentage
      );
    }

    const platformFeePercentage =
      actualOriginalPercentage - recruiterPercentage;
    const originalAmount = calculateCommissionAmount(
      maxSalary,
      actualOriginalPercentage
    );
    const recruiterAmount = calculateCommissionAmount(
      maxSalary,
      recruiterPercentage
    );

    return {
      type: "percentage",
      originalPercentage: actualOriginalPercentage,
      fixedAmount: 0,
      hourlyRate: 0,
      recruiterPercentage,
      platformFeePercentage,
      reductionPercentage,
      originalAmount,
      recruiterAmount,
    };
  } else if (type === "fixed") {
    // Fixed commission type
    const { recruiterAmount, platformFeeAmount } =
      calculateFixedCommissionBreakdown(fixedAmount, reductionPercentage);

    return {
      type: "fixed",
      originalPercentage: 0,
      fixedAmount,
      hourlyRate: 0,
      recruiterPercentage: 0,
      platformFeePercentage: 0,
      reductionPercentage,
      originalAmount: fixedAmount,
      recruiterAmount,
    };
  } else {
    // Hourly commission type
    const { recruiterAmount, platformFeeAmount } =
      calculateHourlyCommissionBreakdown(hourlyRate, reductionPercentage);

    return {
      type: "hourly",
      originalPercentage: 0,
      fixedAmount: 0,
      hourlyRate,
      recruiterPercentage: 0,
      platformFeePercentage: 0,
      reductionPercentage,
      originalAmount: hourlyRate,
      recruiterAmount,
    };
  }
};

export async function GET(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();

    // Different handling based on user role
    let jobs;
    if (
      userData.role === UserRole.ADMIN ||
      userData.role === UserRole.INTERNAL
    ) {
      // Admin and Internal users can see all jobs with company information populated
      jobs = await Job.find()
        .populate("postedBy", "name email companyName role parentId")
        .sort({ createdAt: -1 });

      // Add poster name and company information for better context
      jobs = jobs.map((job) => {
        const jobObj = job.toObject();
        const poster = job.postedBy as any;

        if (poster) {
          jobObj.postedByName = poster.name;
          jobObj.postedByEmail = poster.email;

          // Use the stored companyName from the job, fallback to poster info
          jobObj.postedByCompany =
            jobObj.companyName ||
            poster.companyName ||
            poster.name ||
            "Unknown Company";
        } else {
          jobObj.postedByName = "Unknown User";
          jobObj.postedByCompany = jobObj.companyName || "Unknown Company";
        }

        return jobObj;
      });
    } else if (userData.role === UserRole.COMPANY) {
      // Get the current user to check isPrimary status
      const currentUser = await User.findById(userData.userId);

      if (currentUser?.isPrimary) {
        // Primary company users can see all jobs from their company (including those posted by their team members)
        const companyMembers = await User.find({
          $or: [{ _id: userData.userId }, { parentId: userData.userId }],
        }).select("_id");

        const memberIds = companyMembers.map((member) => member._id);
        jobs = await Job.find({ postedBy: { $in: memberIds } })
          .populate("postedBy", "name email companyName role")
          .sort({ createdAt: -1 });

        // Add poster name and company information for better context
        jobs = jobs.map((job) => {
          const jobObj = job.toObject();
          const poster = job.postedBy as any;

          if (poster) {
            jobObj.postedByName = poster.name;
            jobObj.postedByCompany =
              jobObj.companyName ||
              poster.companyName ||
              currentUser.companyName ||
              currentUser.name;
          } else {
            jobObj.postedByName = "Unknown User";
            jobObj.postedByCompany =
              jobObj.companyName || currentUser.companyName || currentUser.name;
          }

          return jobObj;
        });
      } else {
        // Non-primary company users can only see their own jobs
        jobs = await Job.find({ postedBy: userData.userId })
          .populate("postedBy", "name email companyName")
          .sort({ createdAt: -1 });

        // Add company information
        const currentUser = await User.findById(userData.userId);
        jobs = jobs.map((job) => {
          const jobObj = job.toObject();
          const poster = job.postedBy as any;

          jobObj.postedByName = poster?.name || "Unknown User";
          jobObj.postedByCompany =
            jobObj.companyName ||
            poster?.companyName ||
            currentUser?.companyName ||
            currentUser?.name ||
            "Unknown Company";

          return jobObj;
        });
      }
    } else if (userData.role === UserRole.RECRUITER) {
      // Recruiters can see all active and paused jobs with reduced commission
      jobs = await Job.find({ status: { $in: ["ACTIVE", "PAUSED"] } })
        .populate("postedBy", "name companyName")
        .sort({ createdAt: -1 });

      // Add company information for recruiters
      jobs = jobs.map((job) => {
        const jobObj = job.toObject();
        const poster = job.postedBy as any;

        if (poster) {
          jobObj.postedByCompany =
            jobObj.companyName || poster.companyName || poster.name;
        } else {
          jobObj.postedByCompany = jobObj.companyName || "Unknown Company";
        }

        return jobObj;
      });
    } else {
      // Default case - return an empty array
      jobs = [];
    }

    // Transform jobs based on user role (apply commission reduction for recruiters)
    const transformedJobs = jobs.map((job) =>
      transformJobForUser(job, userData.role)
    );

    return NextResponse.json(transformedJobs);
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    // Only Company, Admin, and Internal users can create jobs
    if (
      !authorizeRoles(req, [
        UserRole.COMPANY,
        UserRole.ADMIN,
        UserRole.INTERNAL,
      ])
    ) {
      return forbidden();
    }

    await connectDb();
    const jobData = await req.json();

    // Validate commission data
    if (jobData.commission) {
      const validationResult = validateCommissionData(jobData.commission);
      if (!validationResult.isValid) {
        return NextResponse.json(
          { error: validationResult.error },
          { status: 400 }
        );
      }
    }

    // Validate salary data for commission calculations
    if (jobData.salary) {
      if (
        !jobData.salary.min ||
        !jobData.salary.max ||
        jobData.salary.min <= 0 ||
        jobData.salary.max <= 0
      ) {
        return NextResponse.json(
          {
            error: "Valid salary range is required for commission calculations",
          },
          { status: 400 }
        );
      }

      if (jobData.salary.min > jobData.salary.max) {
        return NextResponse.json(
          { error: "Minimum salary cannot be greater than maximum salary" },
          { status: 400 }
        );
      }
    }

    // Create a unique job code if not provided
    if (!jobData.jobCode) {
      const date = new Date();
      jobData.jobCode = `JOB-${date.getFullYear()}${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}${date
        .getDate()
        .toString()
        .padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Process commission data - Enhanced for both percentage and fixed types
    if (jobData.commission) {
      const commission = jobData.commission;
      const isAdminUser =
        userData.role === UserRole.ADMIN || userData.role === UserRole.INTERNAL;
      const maxSalary = jobData.salary?.max || 0;

      // Create commission structure based on type
      const commissionStructure = createCommissionStructure(
        commission.type,
        commission.originalPercentage || 0,
        commission.fixedAmount || 0,
        maxSalary,
        commission.reductionPercentage ||
          COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE,
        isAdminUser,
        commission.hourlyRate || 0
      );

      // Special handling for admin users who can set custom reductions
      if (isAdminUser && commission.reductionPercentage !== undefined) {
        // Validate platform fee is within allowed range
        if (
          commission.reductionPercentage <
            COMMISSION_CONFIG.MIN_REDUCTION_PERCENTAGE ||
          commission.reductionPercentage >
            COMMISSION_CONFIG.MAX_REDUCTION_PERCENTAGE
        ) {
          return NextResponse.json(
            {
              error: `Platform fee must be between ${COMMISSION_CONFIG.MIN_REDUCTION_PERCENTAGE}% and ${COMMISSION_CONFIG.MAX_REDUCTION_PERCENTAGE}%`,
            },
            { status: 400 }
          );
        }

        commissionStructure.reductionPercentage =
          commission.reductionPercentage;

        // Recalculate based on custom reduction
        if (commission.type === "percentage") {
          commissionStructure.recruiterPercentage =
            calculateRecruiterCommission(
              commissionStructure.originalPercentage,
              commission.reductionPercentage
            );
          commissionStructure.platformFeePercentage =
            commissionStructure.originalPercentage -
            commissionStructure.recruiterPercentage;
          commissionStructure.recruiterAmount = calculateCommissionAmount(
            maxSalary,
            commissionStructure.recruiterPercentage
          );
        } else {
          const { recruiterAmount } = calculateFixedCommissionBreakdown(
            commissionStructure.fixedAmount,
            commission.reductionPercentage
          );
          commissionStructure.recruiterAmount = recruiterAmount;
        }
      }

      jobData.commission = commissionStructure;

      // Set legacy fields for backward compatibility
      if (commission.type === "percentage") {
        jobData.commissionPercentage = commissionStructure.originalPercentage;
        jobData.commissionAmount = commissionStructure.originalAmount;
      } else {
        jobData.commissionPercentage = 0; // No percentage for fixed commissions
        jobData.commissionAmount = commissionStructure.originalAmount;
      }
    } else if (jobData.commissionPercentage) {
      // Handle legacy commission format (percentage only)
      const originalPercentage = jobData.commissionPercentage;
      const maxSalary = jobData.salary?.max || 0;
      const reductionPercentage =
        COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE;

      const commissionStructure = createCommissionStructure(
        "percentage",
        originalPercentage,
        0,
        maxSalary,
        reductionPercentage,
        false,
        0
      );

      jobData.commission = commissionStructure;
      jobData.commissionAmount = commissionStructure.originalAmount;
    }

    // Enhanced validation
    if (jobData.commission) {
      const { commission } = jobData;

      if (commission.type === "percentage") {
        if (
          commission.originalPercentage <
          COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE
        ) {
          return NextResponse.json(
            {
              error: `Commission percentage must be at least ${COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE}%`,
            },
            { status: 400 }
          );
        }

        if (
          commission.originalPercentage >
          COMMISSION_CONFIG.MAX_COMMISSION_PERCENTAGE
        ) {
          return NextResponse.json(
            {
              error: `Commission percentage cannot exceed ${COMMISSION_CONFIG.MAX_COMMISSION_PERCENTAGE}%`,
            },
            { status: 400 }
          );
        }

        // Validate recruiter commission for admin users
        if (
          userData.role === UserRole.ADMIN ||
          userData.role === UserRole.INTERNAL
        ) {
          if (
            commission.recruiterPercentage <
            COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE
          ) {
            return NextResponse.json(
              {
                error: `Recruiter commission percentage must be at least ${COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE}%`,
              },
              { status: 400 }
            );
          }
        }
      } else if (commission.type === "fixed") {
        if (commission.fixedAmount < COMMISSION_CONFIG.MIN_FIXED_AMOUNT) {
          return NextResponse.json(
            {
              error: `Fixed commission amount must be at least $${COMMISSION_CONFIG.MIN_FIXED_AMOUNT}`,
            },
            { status: 400 }
          );
        }

        // Validate recruiter amount for admin users
        if (
          userData.role === UserRole.ADMIN ||
          userData.role === UserRole.INTERNAL
        ) {
          if (commission.recruiterAmount <= 0) {
            return NextResponse.json(
              { error: "Recruiter commission amount must be greater than 0" },
              { status: 400 }
            );
          }
        }
      }
    }

    // Add the user ID as the poster
    jobData.postedBy = userData.userId;

    // Handle company name based on user role
    if (userData.role === UserRole.COMPANY) {
      // For company users, use their profile company name if not provided
      if (!jobData.companyName) {
        const currentUser = await User.findById(userData.userId);
        jobData.companyName =
          currentUser?.companyName || currentUser?.name || "Unknown Company";
      }
    } else if (
      userData.role === UserRole.INTERNAL ||
      userData.role === UserRole.ADMIN
    ) {
      // For internal/admin users, company name is required
      if (!jobData.companyName) {
        return NextResponse.json(
          { error: "Company name is required for internal job postings" },
          { status: 400 }
        );
      }
    }

    // Set job status to ACTIVE by default when posted
    jobData.status = "ACTIVE";

    // Create the job - the model's pre-save hook will handle final commission calculations
    const job = new Job(jobData);
    await job.save();

    // Populate the created job with user information before returning
    await job.populate("postedBy", "name email companyName");

    // Add company information to the created job
    const poster = job.postedBy as any;
    const jobObj = job.toObject();
    if (poster) {
      jobObj.postedByName = poster.name;
      jobObj.postedByCompany =
        jobObj.companyName || poster.companyName || poster.name;
    }

    // Transform the created job based on user role before returning
    const transformedJob = transformJobForUser(jobObj, userData.role);

    // Trigger email notifications for recruiters (non-blocking) - AFTER job is saved
    try {
      // Check if we should send notifications (every 5 jobs)
      const notificationCheck = await shouldSendGlobalNotification();
      if (notificationCheck.shouldSend) {
        console.log(
          `Triggering email notifications for ${notificationCheck.jobCount} jobs`
        );

        // Add bulk email notification job to queue for background processing
        await addBulkEmailNotificationJob(
          notificationCheck.jobIds,
          notificationCheck.jobCount
        );

        console.log("Email notification job added to queue successfully");
      }
    } catch (emailError) {
      // Log error but don't fail the job creation
      console.error("Error triggering email notifications:", emailError);
    }

    return NextResponse.json(transformedJob);
  } catch (error) {
    console.error("Create job error:", error);

    // Handle validation errors
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as any).name === "ValidationError"
    ) {
      const validationErrors = Object.values((error as any).errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: "Validation error", details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
