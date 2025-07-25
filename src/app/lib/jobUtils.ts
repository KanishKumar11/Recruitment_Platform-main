import { UserRole } from "@/app/models/User";
import { IJob } from "@/app/models/Job";

// Commission configuration - should match frontend config
const COMMISSION_CONFIG = {
  DEFAULT_REDUCTION_PERCENTAGE: 40,
  MIN_COMMISSION_PERCENTAGE: 1,
  MAX_COMMISSION_PERCENTAGE: 50,
};

// Function to calculate recruiter commission
const calculateRecruiterCommission = (
  originalCommission: number,
  reductionPercentage: number = COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE
): number => {
  if (originalCommission <= 0) return 0;
  
  const reduction = (originalCommission * reductionPercentage) / 100;
  const recruiterCommission = originalCommission - reduction;
  
  return Math.max(recruiterCommission, COMMISSION_CONFIG.MIN_COMMISSION_PERCENTAGE);
};

// Function to calculate commission amount
export const calculateCommissionAmount = (salary: number, percentage: number): number => {
  return (salary * percentage) / 100;
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

// Function to transform job data based on user role
export const transformJobForUser = (job: any, userRole: string): IJob => {
  const jobObj = job.toObject ? job.toObject() : job;

  // If user is a recruiter, show reduced commission
  if (userRole === UserRole.RECRUITER) {
    // Get the original commission data
    const originalCommission = jobObj.commission || {};
    const originalPercentage = originalCommission.originalPercentage || jobObj.commissionPercentage || 0;
    const originalFixedAmount = originalCommission.fixedAmount || jobObj.fixedCommissionAmount || 0;
    const reductionPercentage = originalCommission.reductionPercentage || COMMISSION_CONFIG.DEFAULT_REDUCTION_PERCENTAGE;
    
    // Check if this is a fixed commission job
    if (originalFixedAmount > 0) {
      // Calculate fixed commission breakdown for recruiter
      const { recruiterAmount } = calculateFixedCommissionBreakdown(originalFixedAmount, reductionPercentage);
      
      // Return job with recruiter-visible fixed commission data
      return {
        ...jobObj,
        // Show recruiter commission as the main commission fields
        fixedCommissionAmount: recruiterAmount,
        commissionPercentage: 0, // Not applicable for fixed commission
        commissionAmount: 0, // Not applicable for fixed commission
        commission: {
          ...jobObj.commission,
          type: 'fixed',
          fixedAmount: originalFixedAmount,
          recruiterAmount,
        },
      };
    } else {
      // Handle percentage-based commission
      const recruiterPercentage = calculateRecruiterCommission(originalPercentage, reductionPercentage);
      const recruiterAmount = calculateCommissionAmount(jobObj.salary?.max || 0, recruiterPercentage);
      
      // Return job with recruiter-visible percentage commission data
      return {
        ...jobObj,
        // Show recruiter commission as the main commission fields
        commissionPercentage: recruiterPercentage,
        commissionAmount: recruiterAmount,
        fixedCommissionAmount: 0, // Not applicable for percentage commission
        commission: {
          ...jobObj.commission,
          type: 'percentage',
          recruiterPercentage,
          recruiterAmount,
        },
      };
    }
  }

  // For other roles (ADMIN, INTERNAL, etc.), return the job as-is with full commission data
  return {
    ...jobObj,
    // Ensure both commission fields are available for non-recruiter roles
    fixedCommissionAmount: jobObj.fixedCommissionAmount || jobObj.commission?.fixedAmount || 0,
  };
};