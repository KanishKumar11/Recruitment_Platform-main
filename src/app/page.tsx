"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import PublicFooter from "@/app/components/layout/PublicFooter";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  // Role data for the feature tabs
  const roles = [
    {
      title: "Employers",
      icon: "building",
      description:
        "Post jobs, set screening questions, and manage applicants with ease. Define custom commission structures and track recruiter performance.",
      features: [
        "Post & manage jobs",
        "Set screening questions",
        "Define commissions",
        "Review applicants",
      ],
    },
    {
      title: "Recruiters",
      icon: "user-tie",
      description:
        "Access job listings, submit candidates, and track submission statuses in real-time. Get notified of new opportunities matching your expertise.",
      features: [
        "View available jobs",
        "Upload resumes",
        "Track submissions",
        "Get real-time updates",
      ],
    },
  ];

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % roles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [roles.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">SS</span>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-800 dark:text-white">
                  SourcingScreen
                </span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#about"
                className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 px-3 py-2 font-medium text-sm"
              >
                About Us
              </Link>
              <Link
                href="#how-it-works"
                className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 px-3 py-2 font-medium text-sm"
              >
                How It Works
              </Link>
              <Link
                href="/whyChooseUs"
                className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 px-3 py-2 font-medium text-sm"
              >
                Why Choose Us
              </Link>
              <Link
                href="/faq"
                className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 px-3 py-2 font-medium text-sm"
              >
                FAQ
              </Link>
              <Link
                href="#testimonials"
                className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 px-3 py-2 font-medium text-sm"
              >
                Testimonials
              </Link>
              <Link
                href="/login"
                className="bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-gray-700 dark:text-indigo-400 dark:hover:bg-gray-600 px-4 py-2 rounded-md font-medium text-sm"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md font-medium text-sm"
              >
                Sign Up
              </Link>
            </div>
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={
                      isMenuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 shadow-lg">
              <Link
                href="#about"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                About Us
              </Link>
              <Link
                href="#how-it-works"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                How It Works
              </Link>
              <Link
                href="#why-choose-us"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                Why Choose Us
              </Link>
              <Link
                href="/faq"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                FAQ
              </Link>
              <Link
                href="#testimonials"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              >
                Testimonials
              </Link>
              <Link
                href="/login"
                className="block px-3 py-2 text-base font-medium text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-gray-700"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="block px-3 py-2 text-base font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-md"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-center md:text-left"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Streamline Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                  Recruitment
                </span>{" "}
                Process
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">
                A comprehensive platform to manage recruitment vendors,
                streamline hiring workflows, and find the best talent
                efficiently.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/login"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-md shadow-lg hover:shadow-xl transition duration-300 text-center"
                >
                  Get Started
                </Link>
                <Link
                  href="#how-it-works"
                  className="px-8 py-3 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-medium rounded-md shadow-md hover:shadow-lg transition duration-300 border border-gray-200 dark:border-gray-700 text-center"
                >
                  Learn More
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative w-full h-[400px] md:h-[450px] shadow-2xl rounded-lg overflow-hidden">
                <img
                  src="/img1.png"
                  alt="SourcingScreen Dashboard Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                      12 New Applications Today
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg transform rotate-12">
                <span className="font-bold text-gray-900">NEW</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-300 dark:bg-indigo-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </section>

      {/* Stats Section */}
      <section className="bg-white dark:bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            <motion.div variants={fadeIn} className="p-6">
              <p className="text-4xl md:text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                98%
              </p>
              <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300">
                Client Satisfaction
              </p>
            </motion.div>
            <motion.div variants={fadeIn} className="p-6">
              <p className="text-4xl md:text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                5K+
              </p>
              <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300">
                Job Placements
              </p>
            </motion.div>
            <motion.div variants={fadeIn} className="p-6">
              <p className="text-4xl md:text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                2K+
              </p>
              <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300">
                Companies
              </p>
            </motion.div>
            <motion.div variants={fadeIn} className="p-6">
              <p className="text-4xl md:text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                60%
              </p>
              <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300">
                Time Saved
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced About Us Section - Original Content */}
      <section
        id="about"
        className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-20"
          >
            <span className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
              Who We Are
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              About{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SourcingScreen
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              We're on a mission to transform the recruitment industry through
              technology and transparency.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="order-2 lg:order-1"
            >
              <div className="relative w-full max-w-md mx-auto lg:max-w-none">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl transform rotate-2 opacity-20"></div>
                <div className="relative bg-white rounded-2xl p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-full h-80 rounded-xl overflow-hidden">
                    <img
                      src="/aboutUs.jpg"
                      alt="SourcingScreen Team"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="order-1 lg:order-2"
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Our Story
                  </h3>
                  <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6"></div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    SourcingScreen – The Future of Talent Sourcing Founded in
                    2023, SourcingScreen is a next-generation Recruitment &
                    Hiring Marketplace powered by AI, designed to revolutionize
                    the way companies and recruitment agencies connect. We
                    eliminate the inefficiencies of traditional hiring by
                    offering a transparent, data-driven platform where employers
                    find the best talent and recruiters maximize their success.
                    Our team of HR experts and software engineers collaborated
                    to build a platform that bridges the gap between companies
                    and recruitment agencies, creating a seamless ecosystem
                    where both parties can thrive. At SourcingScreen, we bring
                    together the power of AI, smart automation, and a global
                    vendor network to create a seamless talent acquisition
                    ecosystem Whether you're hiring for technology, healthcare,
                    manufacturing, finance, or any other sector, we have
                    pre-vetted vendor partners across industries ready to
                    deliver results.{" "}
                    <Link
                      href="/ourStory"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Learn more about our story
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Vision & Mission Cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:translate-x-12 group-hover:-translate-y-12 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">
                  Our Vision
                </h4>
                <p className="text-blue-100 leading-relaxed">
                  To become the go-to global marketplace for recruitment
                  partnerships — where hiring meets speed, quality, and trust.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-700 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:translate-x-12 group-hover:-translate-y-12 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">
                  Our Mission
                </h4>
                <p className="text-purple-100 leading-relaxed">
                  To simplify and scale recruitment by enabling seamless
                  collaboration between employers and expert recruiters through
                  technology and trust.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Role Features Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Tailored For Each Role
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our platform provides specific tools and features for employers
              and recruiters.
            </p>
          </motion.div>

          <div className="mt-12">
            {/* Feature tabs */}
            <div className="flex flex-wrap justify-center mb-8">
              {roles.map((role, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`m-2 px-6 py-3 rounded-full font-medium text-sm md:text-base transition-all duration-300 ${
                    activeFeature === index
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <i className={`fas fa-${role.icon} mr-2`}></i>
                  {role.title}
                </button>
              ))}
            </div>

            {/* Feature content */}
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-8 md:p-12">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    <i
                      className={`fas fa-${roles[activeFeature].icon} text-indigo-600 dark:text-indigo-400 mr-3`}
                    ></i>
                    For {roles[activeFeature].title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {roles[activeFeature].description}
                  </p>
                  <ul className="space-y-4">
                    {roles[activeFeature].features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="h-6 w-6 text-green-500 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                        <span className="ml-3 text-gray-600 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link
                      href="/signup"
                      className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                    >
                      Learn more about {roles[activeFeature].title} features
                      <svg
                        className="ml-2 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        ></path>
                      </svg>
                    </Link>
                  </div>
                </div>
                <div className="bg-indigo-50 dark:bg-gray-700 p-6 flex items-center justify-center">
                  <div className="relative w-full h-64 md:h-full max-h-80">
                    <img
                      src="/recruiter-dashboard1.jpg"
                      alt={`${roles[activeFeature].title} Dashboard`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              How SourcingScreen Works
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              A simple, efficient process that connects employers with top
              recruiters and candidates.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="relative"
          >
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-indigo-200 dark:bg-gray-700"></div>

            {/* Steps */}
            <div className="space-y-12 md:space-y-0">
              {/* Step 1 */}
              <motion.div
                variants={fadeIn}
                className="relative md:grid md:grid-cols-2 md:gap-8 md:items-center"
              >
                <div className="md:col-start-1">
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg md:mr-12">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-gray-600 flex items-center justify-center mb-4">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                        1
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Employers Post Jobs
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Companies create detailed job listings with custom
                      screening questions and commission structures.
                    </p>
                  </div>
                </div>
                <div className="hidden md:block md:col-start-2">
                  <div className="h-0 md:h-auto"></div>
                </div>
                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 border-4 border-white dark:border-gray-800"></div>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                variants={fadeIn}
                className="relative md:grid md:grid-cols-2 md:gap-8 md:items-center"
              >
                <div className="md:col-start-2">
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg md:ml-12">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-gray-600 flex items-center justify-center mb-4">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                        2
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Recruiters Submit Candidates
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Recruiters browse available positions and submit qualified
                      candidates with detailed profiles.
                    </p>
                  </div>
                </div>
                <div className="hidden md:block md:col-start-1">
                  <div className="h-0 md:h-auto"></div>
                </div>
                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 border-4 border-white dark:border-gray-800"></div>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                variants={fadeIn}
                className="relative md:grid md:grid-cols-2 md:gap-8 md:items-center"
              >
                <div className="md:col-start-1">
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg md:mr-12">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-gray-600 flex items-center justify-center mb-4">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                        3
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Review and Selection
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Employers review submissions, shortlist candidates, and
                      schedule interviews through the platform.
                    </p>
                  </div>
                </div>
                <div className="hidden md:block md:col-start-2">
                  <div className="h-0 md:h-auto"></div>
                </div>
                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 border-4 border-white dark:border-gray-800"></div>
                </div>
              </motion.div>

              {/* Step 4 */}
              <motion.div
                variants={fadeIn}
                className="relative md:grid md:grid-cols-2 md:gap-8 md:items-center"
              >
                <div className="md:col-start-2">
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg md:ml-12">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-gray-600 flex items-center justify-center mb-4">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                        4
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Hire and Reward
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Once hired, recruiters earn their commission and the
                      platform tracks success metrics for all parties.
                    </p>
                  </div>
                </div>
                <div className="hidden md:block md:col-start-1">
                  <div className="h-0 md:h-auto"></div>
                </div>
                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 border-4 border-white dark:border-gray-800"></div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Know More Button */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="flex justify-center mt-12"
          >
            <a
              href="/howItWorks"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow hover:shadow-lg"
            >
              <span>Know More</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:transform group-hover:translate-x-1"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Why Choose SourcingScreen Section */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Why Choose SourcingScreen?
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
              SourcingScreen combines the collaborative power of expert
              recruiters with smart matching algorithms, ensuring companies find
              the right candidates without delays or high agency fees.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto"
          >
            {/* Global Network */}
            <motion.div variants={fadeIn} className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-all duration-300 group-hover:scale-110">
                <svg
                  className="w-10 h-10 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="8" cy="8" r="2" />
                  <circle cx="16" cy="8" r="2" />
                  <circle cx="8" cy="16" r="2" />
                  <circle cx="16" cy="16" r="2" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 flex items-center justify-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                Global Network of Specialized Recruiters
              </h3>
              <p className="text-slate-300 text-lg leading-relaxed">
                Tap into a growing pool of pre-vetted, domain-specific
                recruitment agencies across industries and geographies.
              </p>
            </motion.div>

            {/* Faster Time-to-Hire */}
            <motion.div variants={fadeIn} className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-all duration-300 group-hover:scale-110">
                <svg
                  className="w-10 h-10 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 flex items-center justify-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                Faster Time-to-Hire
              </h3>
              <p className="text-slate-300 text-lg leading-relaxed">
                Reduce hiring cycles by connecting instantly with
                domain-specific recruiters who can source qualified candidates
                quickly.
              </p>
            </motion.div>

            {/* End-to-End Transparency */}
            <motion.div variants={fadeIn} className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-all duration-300 group-hover:scale-110">
                <svg
                  className="w-10 h-10 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <polyline points="9,9 9,15" />
                  <polyline points="15,9 15,15" />
                  <polyline points="9,12 15,12" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 flex items-center justify-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                End-to-End Transparency
              </h3>
              <p className="text-slate-300 text-lg leading-relaxed">
                Track candidates, recruiter performance, and communication
                history through a centralized dashboard.
              </p>
            </motion.div>

            {/* No Upfront Fees */}
            <motion.div variants={fadeIn} className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-all duration-300 group-hover:scale-110">
                <svg
                  className="w-10 h-10 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 8l-4 4-4-4" />
                  <path d="M12 12v8" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 flex items-center justify-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                No Upfront Fees
              </h3>
              <p className="text-slate-300 text-lg leading-relaxed">
                Pay only when you successfully hire a candidate. There are no
                hidden charges or subscription costs.
              </p>
            </motion.div>

            {/* AI-Driven Matching */}
            <motion.div variants={fadeIn} className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-all duration-300 group-hover:scale-110">
                <svg
                  className="w-10 h-10 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 flex items-center justify-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                AI-Driven Matching
              </h3>
              <p className="text-slate-300 text-lg leading-relaxed">
                SourcingScreen uses intelligent matchmaking to connect jobs with
                the best-suited recruiters in real time.
              </p>
            </motion.div>

            {/* Scalable */}
            <motion.div variants={fadeIn} className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-all duration-300 group-hover:scale-110">
                <svg
                  className="w-10 h-10 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 flex items-center justify-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                Scalable for Enterprises & Startups
              </h3>
              <p className="text-slate-300 text-lg leading-relaxed">
                Whether you're a high-growth startup or a global enterprise, our
                flexible platform adapts to your hiring needs.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Call to Action */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="text-center mt-16"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
          <h3 className="text-3xl font-bold mb-4">
            A Marketplace Built for Recruiters & Employers
          </h3>
          <p className="text-xl mb-6 opacity-90">
            Join the future of recruitment—where every placement counts.
            Showcase your best talent, and grow your recruitment business with
            every successful hire.
          </p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors duration-300 transform hover:scale-105">
            🌐 Explore SourcingScreen.com Today!
          </button>
        </div>
      </motion.div>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              What Our Users Say
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Hear from employers and recruiters who have transformed their
              hiring process.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    Sarah Johnson
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    HR Director, TechCorp
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "SourcingScreen has reduced our time-to-hire by 60%. The
                platform's transparency and ease of use have made managing
                recruiters a breeze."
              </p>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    Michael Chen
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Founder, Elite Recruiting
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "As a recruiter, SourcingScreen has opened doors to new clients
                I couldn't reach before. The automated updates and clear
                commission structures make my job easier."
              </p>
            </motion.div>

            {/* Testimonial 3 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    Emma Rodriguez
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    VP of Talent, GrowthCo
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(4)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                  <svg
                    className="w-5 h-5 text-gray-300 dark:text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "The analytics and reporting features give us insights we never
                had before. We've improved our hiring process and reduced costs
                significantly."
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Recruitment Process?
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Join thousands of companies and recruiters already using
              SourcingScreen to streamline their hiring process.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/login"
                className="px-8 py-3 bg-white text-indigo-600 font-medium rounded-md shadow-lg hover:shadow-xl transition duration-300"
              >
                Get Started for Free
              </Link>
              <Link
                href="/contactUs"
                className="px-8 py-3 bg-transparent text-white font-medium rounded-md border border-white hover:bg-white hover:bg-opacity-10 transition duration-300"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
