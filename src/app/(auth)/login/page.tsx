"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLoginMutation } from "../../store/services/authApi";
import { setCredentials } from "../../store/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./../../store/index";
import { UserRole } from "@/app/constants/userRoles";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Lock, ArrowRight, Home } from "lucide-react";
import { Suspense } from "react";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get("from") || "";
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard or the original requested page
      if (
        fromPath &&
        !fromPath.includes("/login") &&
        !fromPath.includes("/register")
      ) {
        router.push(fromPath);
      } else {
        // Redirect based on user role
        switch (user.role) {
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
      }
    }
  }, [isAuthenticated, user, router, fromPath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await login({ email, password }).unwrap();

      // Transform the user data to match ClientUser interface
      // Remove _id and ensure we have the correct structure
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

      // Redirection will be handled by the useEffect above
    } catch (err: any) {
      setError(err.data?.error || "Login failed. Please try again.");
    }
  };

  // If already authenticated, show loading animation
  if (isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 to-indigo-950">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{
              rotate: 360,
              transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
            }}
            className="mx-auto mb-4 w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full"
          />
          <p className="text-indigo-300 font-medium">
            Redirecting you to your dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
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
      {/* Back to Home Button - Positioned absolutely */}
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
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={itemVariants}>
            <div className="h-14 w-14 bg-indigo-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4 text-center text-3xl font-bold text-white">
              Welcome Back
            </h2>
            {fromPath && (
              <p className="mt-2 text-center text-sm text-gray-300">
                Please login to continue
              </p>
            )}
          </motion.div>

          <motion.form
            variants={itemVariants}
            className="mt-8 space-y-6"
            onSubmit={handleLogin}
          >
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
              </div>
            </div>

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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-500 focus:ring-indigo-400 border-gray-600 rounded bg-gray-700"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-300"
                >
                  Remember me
                </label>
              </div>

              {/* <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div> */}
            </div>

            <div>
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-200 shadow-lg shadow-indigo-500/30"
              >
                {isLoading ? (
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
                    <Lock className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />
                  </span>
                )}
                {isLoading ? "Signing in..." : "Sign in"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </motion.button>
            </div>
          </motion.form>

          <motion.div
            variants={itemVariants}
            className="text-center pt-4 border-t border-gray-700"
          >
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
              >
                Register now
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
