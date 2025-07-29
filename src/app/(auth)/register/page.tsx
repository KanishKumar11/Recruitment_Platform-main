"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useRegisterWithOTPMutation,
  useVerifyOTPMutation,
  useResendOTPMutation,
} from "./../../store/services/authApi";
import { setCredentials } from "./../../store/slices/authSlice";
import { useDispatch } from "react-redux";
import { UserRole } from "@/app/constants/userRoles";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Lock,
  ArrowRight,
  EyeOff,
  Eye,
  CheckCircle,
  Shield,
  Clock,
  RefreshCw,
  Building,
  Users,
  FileText,
  Check,
  Home,
} from "lucide-react";


type RegistrationStep = "form" | "otp";

const companySizeOptions = [
  { value: "1-10", label: "1-10 employees" },
  { value: "10-50", label: "10-50 employees" },
  { value: "50-100", label: "50-100 employees" },
  { value: "100-200", label: "100-200 employees" },
  { value: "200-500", label: "200-500 employees" },
  { value: "500-1000", label: "500-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

export default function RegisterPage() {
  // Form data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.COMPANY);

  // Company-specific fields
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [designation, setDesignation] = useState("");

  // Recruiter-specific fields
const [recruiterType, setRecruiterType] = useState<"individual" | "firm">("individual");
const [recruitmentFirmName, setRecruitmentFirmName] = useState("");

  // Agreement and verification
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isAuthorizedRep, setIsAuthorizedRep] = useState(false);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);

  // UI state
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("form");

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // API hooks
  const [registerWithOTP, { isLoading: isRegistering }] =
    useRegisterWithOTPMutation();
  const [verifyOTP, { isLoading: isVerifying }] = useVerifyOTPMutation();
  const [resendOTP, { isLoading: isResending }] = useResendOTPMutation();

  const dispatch = useDispatch();
  const router = useRouter();

  // List of personal email domains to block for company registration
  const personalEmailDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "aol.com",
    "icloud.com",
    "protonmail.com",
    "yandex.com",
    "mail.com",
    "rediffmail.com",
  ];

  const validateCompanyEmail = (email: string): boolean => {
    const domain = email.split("@")[1]?.toLowerCase();
    return !personalEmailDomains.includes(domain);
  };

  // Simulate reCAPTCHA verification
  const handleRecaptchaVerification = () => {
    // In a real implementation, this would integrate with Google reCAPTCHA
    setRecaptchaVerified(true);
  };

  // Timer effect for OTP countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleInitialRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate company email for COMPANY role
    if (role === UserRole.COMPANY && !validateCompanyEmail(email)) {
      setError(
        "Please use a company email address. Personal email domains (gmail.com, yahoo.com, etc.) are not allowed for company registration."
      );
      return;
    }

    // Company-specific validations
    if (role === UserRole.COMPANY) {
      if (!companyName.trim()) {
        setError("Company name is required");
        return;
      }
      if (!companySize) {
        setError("Please select company size");
        return;
      }
      if (!designation.trim()) {
        setError("Designation/Job title is required");
        return;
      }
      if (!isAuthorizedRep) {
        setError(
          "Please confirm that you are an authorized representative of the organization"
        );
        return;
      }
    }

    if (role === UserRole.RECRUITER && recruiterType === "firm") {
  if (!recruitmentFirmName.trim()) {
    setError("Recruitment firm name is required");
    return;
  }
}

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service & Privacy Policy");
      return;
    }

    if (!recaptchaVerified) {
      setError("Please complete the reCAPTCHA verification");
      return;
    }

    try {
      const registrationData = {
        name,
        email,
        password,
        phone,
        role,
        ...(role === UserRole.COMPANY && {
          companyName,
          companySize,
          designation,
        }),
        ...(role === UserRole.RECRUITER && recruiterType === "firm" && {
    recruitmentFirmName,
  }),
      };

      const result = await registerWithOTP(registrationData).unwrap();

      // Set timer for OTP expiration (10 minutes = 600 seconds)
      setOtpTimer(600);
      setCanResend(false);
      setCurrentStep("otp");
      setError("");
    } catch (err: any) {
      setError(err.data?.error || "Registration failed. Please try again.");
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      const result = await verifyOTP({
        email,
        otp,
      }).unwrap();

      // Transform the user data to match ClientUser interface
      const clientUser = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role as UserRole,
        isPrimary: result.user.isPrimary,
      };

      dispatch(
        setCredentials({
          user: clientUser,
          token: result.token,
        })
      );

      // Redirect based on role
      switch (result.user.role) {
        case "COMPANY":
          router.push("/dashboard/company");
          break;
        case "RECRUITER":
          router.push("/dashboard/recruiter");
          break;
        case "ADMIN":
          router.push("/dashboard/admin");
          break;
        case "INTERNAL":
          router.push("/dashboard/internal");
          break;
        default:
          router.push("/");
      }
    } catch (err: any) {
      setError(err.data?.error || "OTP verification failed. Please try again.");
    }
  };

  const handleResendOTP = async () => {
    setError("");

    try {
      await resendOTP({ email }).unwrap();
      setOtpTimer(600); // Reset timer to 10 minutes
      setCanResend(false);
      setOtp(""); // Clear current OTP input
    } catch (err: any) {
      setError(err.data?.error || "Failed to resend OTP. Please try again.");
    }
  };

  const getEmailPlaceholder = () => {
    return role === UserRole.COMPANY
      ? "Company Email Address (e.g., you@yourcompany.com)"
      : "Email Address";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-indigo-950 py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-6 left-6"
      >
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-600 rounded-lg hover:bg-gray-700/50 hover:text-white transition-all duration-200 backdrop-blur-sm"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700"
      >
        <AnimatePresence mode="wait">
          {currentStep === "form" ? (
            <motion.div
              key="form"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              <motion.div variants={itemVariants} className="text-center">
                <div className="h-14 w-14 bg-indigo-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="mt-4 text-center text-3xl font-bold text-white">
                  Create Your Account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-300">
                  Join our platform and get started today
                </p>
              </motion.div>

              <motion.form
                variants={containerVariants}
                className="mt-8 space-y-5"
                onSubmit={handleInitialRegistration}
              >
                <motion.div variants={itemVariants} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="role"
                    name="role"
                    value={role}
                    onChange={(e) => {
  setRole(e.target.value as UserRole);
  setEmail(""); // Clear email when role changes
  setError(""); // Clear any existing errors
  // Reset company fields when switching away from company
  if (e.target.value !== UserRole.COMPANY) {
    setCompanyName("");
    setCompanySize("");
    setDesignation("");
    setIsAuthorizedRep(false);
  }
  // Reset recruiter fields when switching away from recruiter
  if (e.target.value !== UserRole.RECRUITER) {
    setRecruiterType("individual");
    setRecruitmentFirmName("");
  }
}}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                  >
                    <option value={UserRole.COMPANY}>Company</option>
                    <option value={UserRole.RECRUITER}>Recruiter</option>
                  </select>
                </motion.div>


                    {/* Recruiter type selection */}
{role === UserRole.RECRUITER && (
  <motion.div variants={itemVariants} className="space-y-3">
    <label className="text-sm font-medium text-gray-300">
      Are you an individual recruiter or part of a recruitment firm?
    </label>
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => {
          setRecruiterType("individual");
          setRecruitmentFirmName(""); // Clear firm name when switching to individual
        }}
        className={`p-3 rounded-lg border transition-all duration-200 ${
          recruiterType === "individual"
            ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
            : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
        }`}
      >
        Individual
      </button>
      <button
        type="button"
        onClick={() => setRecruiterType("firm")}
        className={`p-3 rounded-lg border transition-all duration-200 ${
          recruiterType === "firm"
            ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
            : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
        }`}
      >
        Recruitment Firm
      </button>
    </div>
  </motion.div>
)}

{/* Recruitment firm name field */}
{role === UserRole.RECRUITER && recruiterType === "firm" && (
  <motion.div variants={itemVariants} className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Building className="h-5 w-5 text-gray-400" />
    </div>
    <input
      id="recruitmentFirmName"
      name="recruitmentFirmName"
      type="text"
      required
      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
      placeholder="Recruitment Firm Name"
      value={recruitmentFirmName}
      onChange={(e) => setRecruitmentFirmName(e.target.value)}
    />
  </motion.div>
)}
                {/* Company-specific fields */}
                {role === UserRole.COMPANY && (
                  <>
                    <motion.div variants={itemVariants} className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        required
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                        placeholder="Company Name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="companySize"
                        name="companySize"
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                        required
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                      >
                        <option value="">Select Company Size</option>
                        {companySizeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="designation"
                        name="designation"
                        type="text"
                        required
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                        placeholder="Designation / Job Title"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                      />
                    </motion.div>
                  </>
                )}

                <motion.div variants={itemVariants} className="space-y-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                      placeholder={getEmailPlaceholder()}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {role === UserRole.COMPANY && (
                    <div className="text-xs text-gray-400">
                      * Company email required (gmail.com, yahoo.com, etc. not
                      allowed)
                    </div>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-lg bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors duration-200" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors duration-200" />
                    )}
                  </button>
                </motion.div>

                <motion.div variants={itemVariants} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-lg bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors duration-200" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors duration-200" />
                    )}
                  </button>
                </motion.div>

                {/* Authorization checkbox for companies */}
                {role === UserRole.COMPANY && (
                  <motion.div variants={itemVariants} className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="authorized-rep"
                          name="authorized-rep"
                          type="checkbox"
                          checked={isAuthorizedRep}
                          onChange={(e) => setIsAuthorizedRep(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 bg-gray-700 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="authorized-rep"
                          className="text-gray-300"
                        >
                          I confirm that I am a representative of the
                          organization who is legally authorized to sign the
                          agreement on behalf of the organization
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Terms and Privacy Policy */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="terms-agreement"
                        name="terms-agreement"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 bg-gray-700 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="terms-agreement"
                        className="text-gray-300"
                      >
                        I agree to the{" "}
                        <Link
                          href="/terms"
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          Terms of Service
                        </Link>{" "}
                        &{" "}
                        <Link
                          href="/privacy"
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                  </div>
                </motion.div>

                {/* reCAPTCHA */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex items-center h-5">
                          <input
                            id="recaptcha"
                            name="recaptcha"
                            type="checkbox"
                            checked={recaptchaVerified}
                            onChange={handleRecaptchaVerification}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 bg-gray-700 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="recaptcha" className="text-gray-300">
                            I'm not a robot
                          </label>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">reCAPTCHA</div>
                    </div>
                  </div>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-3 py-2 text-sm bg-red-900/50 text-red-200 rounded-md border border-red-800 flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </motion.div>
                )}

                <motion.div variants={itemVariants}>
                  <motion.button
                    type="submit"
                    disabled={isRegistering}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-200 shadow-lg shadow-indigo-500/30"
                  >
                    {isRegistering ? (
                      <motion.span
                        animate={{
                          rotate: 360,
                          transition: {
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          },
                        }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                    ) : (
                      <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        <CheckCircle className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />
                      </span>
                    )}
                    {isRegistering
                      ? "Sending Verification..."
                      : "Create Account"}
                    {!isRegistering && <ArrowRight className="ml-2 h-4 w-4" />}
                  </motion.button>
                </motion.div>
              </motion.form>

              <motion.div
                variants={itemVariants}
                className="text-center pt-4 border-t border-gray-700"
              >
                <p className="text-sm text-gray-400">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
                  >
                    Sign in instead
                  </Link>
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              <motion.div variants={itemVariants} className="text-center">
                <div className="h-14 w-14 bg-green-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h2 className="mt-4 text-center text-3xl font-bold text-white">
                  Verify Your Email
                </h2>
                <p className="mt-2 text-center text-sm text-gray-300">
                  We've sent a 6-digit code to{" "}
                  <span className="font-medium text-indigo-400">{email}</span>
                </p>
              </motion.div>

              <motion.form
                variants={containerVariants}
                className="mt-8 space-y-5"
                onSubmit={handleOTPVerification}
              >
                <motion.div variants={itemVariants} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 sm:text-sm text-center text-lg tracking-widest"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setOtp(value);
                    }}
                  />
                </motion.div>

                {otpTimer > 0 && (
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-center text-sm text-gray-400"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Code expires in {formatTime(otpTimer)}
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-3 py-2 text-sm bg-red-900/50 text-red-200 rounded-md border border-red-800 flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </motion.div>
                )}

                <motion.div variants={itemVariants}>
                  <motion.button
                    type="submit"
                    disabled={isVerifying || otp.length !== 6}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-all duration-200 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? (
                      <motion.span
                        animate={{
                          rotate: 360,
                          transition: {
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          },
                        }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                    ) : (
                      <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        <Shield className="h-5 w-5 text-green-300 group-hover:text-green-200" />
                      </span>
                    )}
                    {isVerifying ? "Verifying..." : "Verify Account"}
                    {!isVerifying && <ArrowRight className="ml-2 h-4 w-4" />}
                  </motion.button>
                </motion.div>

                <motion.div variants={itemVariants} className="text-center">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={isResending}
                      className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200 flex items-center justify-center mx-auto"
                    >
                      {isResending ? (
                        <motion.span
                          animate={{
                            rotate: 360,
                            transition: {
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            },
                          }}
                          className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full mr-2"
                        />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {isResending ? "Sending..." : "Resend Code"}
                    </button>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Didn't receive the code? Wait {formatTime(otpTimer)} to
                      resend
                    </p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep("form");
                      setOtp("");
                      setOtpTimer(0);
                      setCanResend(false);
                      setError("");
                    }}
                    className="text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors duration-200"
                  >
                    ← Back to registration
                  </button>
                </motion.div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
