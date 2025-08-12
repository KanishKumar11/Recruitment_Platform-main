"use client";

import React, { useState, useEffect } from "react";

// Extend the Window interface to include scrollTimeout
declare global {
  interface Window {
    scrollTimeout?: NodeJS.Timeout;
  }
}
import Link from "next/link";
import { motion } from "framer-motion";
import PublicFooter from "@/app/components/layout/PublicFooter";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Mail,
  ExternalLink,
  Shield,
  Book,
  UserCheck,
  Users,
  Briefcase,
  Lock,
  FileClock,
  AlertTriangle,
  Globe,
  RefreshCw,
  Phone,
} from "lucide-react";

export default function TermsAndConditionsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Handle scroll progress for the progress bar at the top
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = scrollTop / (docHeight - winHeight);
      setScrollProgress(scrollPercent);
      setIsScrolling(true);

      // Add debounce to isScrolling state
      clearTimeout(window.scrollTimeout);
      window.scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(window.scrollTimeout);
    };
  }, []);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const sectionData = [
    {
      id: "use-of-platform",
      title: "1. Use of the Platform",
      icon: <Book />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-200 mb-2">1.1 License</h4>
            <p>
              We grant you a limited, non-exclusive, non-transferable license to
              access and use the Platform solely for the purpose of recruitment,
              job posting, and talent acquisition services as intended.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-200 mb-2">1.2 User Roles</h4>
            <p>The Platform supports multiple user types, including:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Employers (posting jobs)</li>
              <li>Recruiters/Vendors (submitting candidates)</li>
              <li>Platform Admins (SourcingScreen team)</li>
            </ul>
            <p className="mt-2">
              Each user is responsible for complying with the Terms and for
              actions taken under their account.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-200 mb-2">1.3 Restrictions</h4>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                Use the Platform for any illegal, unethical, or unauthorized
                purpose.
              </li>
              <li>
                Reproduce, duplicate, sell, resell or exploit any portion of the
                Platform without express written permission.
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Platform, including introducing viruses or harmful code.
              </li>
              <li>
                Use any automated systems (e.g., bots, spiders) to access the
                Platform without written consent.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "account-security",
      title: "2. Account Registration & Security",
      icon: <Lock />,
      content: (
        <div>
          <ul className="list-disc pl-6 space-y-3">
            <li>
              You agree to provide accurate, current, and complete information
              when registering.
            </li>
            <li>
              You are solely responsible for maintaining the confidentiality of
              your account and password.
            </li>
            <li>
              You must immediately notify us of any unauthorized access or
              suspected breach.
            </li>
            <li>
              We reserve the right to suspend or terminate accounts that violate
              these Terms or misuse the Platform.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "job-postings",
      title: "3. Job Postings & Candidate Submissions",
      icon: <Briefcase />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-200 mb-2">3.1 Employers</h4>
            <p>
              Employers may post jobs and access recruiter-submitted candidates
              under the terms defined on the Platform.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-200 mb-2">
              3.2 Recruiters/Vendors
            </h4>
            <p>
              Recruiters must submit only authentic and consented candidate
              profiles. Misrepresentation or spamming will result in suspension
              and potential legal action.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "intellectual-property",
      title: "4. Intellectual Property",
      icon: <Shield />,
      content: (
        <div>
          <ul className="list-disc pl-6 space-y-3">
            <li>
              All content on the Platform (including software, text, images,
              logos) is owned by or licensed to SourcingScreen and is protected
              by intellectual property laws.
            </li>
            <li>
              You may not copy, distribute, or create derivative works without
              permission.
            </li>
            <li>
              By submitting content (e.g., candidate profiles or job posts), you
              grant us a non-exclusive, worldwide, royalty-free license to use,
              display, and distribute that content in connection with our
              services.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "privacy",
      title: "5. Privacy",
      icon: <UserCheck />,
      content: (
        <p>
          Your use of the Platform is governed by our Privacy Policy, which
          outlines how we collect, use, and protect your personal data. You
          agree to the use of your data as described therein.
        </p>
      ),
    },
    {
      id: "fees",
      title: "6. Fees & Payments",
      icon: <FileText />,
      content: (
        <p>
          Certain services or transactions may require payment. All fees, if
          applicable, will be clearly stated. Late or non-payment may lead to
          service suspension.
        </p>
      ),
    },
    {
      id: "termination",
      title: "7. Termination",
      icon: <AlertTriangle />,
      content: (
        <p>
          We reserve the right to terminate or suspend your access, account, or
          use of the Platform at our sole discretion, without notice, for
          conduct that violates these Terms or harms other users or
          SourcingScreen.
        </p>
      ),
    },
    {
      id: "liability",
      title: "8. Limitation of Liability",
      icon: <Shield />,
      content: (
        <p>
          To the maximum extent permitted by law, SourcingScreen shall not be
          liable for any indirect, incidental, special, or consequential damages
          arising from your use of the Platform or your inability to use it.
        </p>
      ),
    },
    {
      id: "force-majeure",
      title: "9. Force Majeure",
      icon: <AlertTriangle />,
      content: (
        <p>
          We are not liable for delays or failures resulting from causes beyond
          our reasonable control, including but not limited to natural
          disasters, internet outages, pandemics, labor strikes, or government
          restrictions.
        </p>
      ),
    },
    {
      id: "changes",
      title: "10. Changes to Terms",
      icon: <RefreshCw />,
      content: (
        <p>
          We may revise these Terms from time to time. The updated version will
          be posted on this page with a new effective date. Your continued use
          of the Platform after changes constitutes your acceptance of the new
          Terms.
        </p>
      ),
    },
    {
      id: "governing-law",
      title: "11. Governing Law",
      icon: <Globe />,
      content: (
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of <span className="font-semibold">India</span>. Any disputes
          will be subject to the exclusive jurisdiction of the courts located in
          Indore, Madhya Pradesh, India.
        </p>
      ),
    },
    {
      id: "contact",
      title: "12. Contact Us",
      icon: <Mail />,
      content: (
        <div>
          <p>
            For any questions or concerns about these Terms, please contact:
          </p>
          <div className="mt-4 p-4 bg-gray-700/40 rounded-lg border border-gray-600">
            <p className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-indigo-400" />
              Email:{" "}
              <a
                href="mailto:support@sourcingscreen.com"
                className="ml-1 text-indigo-400 hover:text-indigo-300"
              >
                support@sourcingscreen.com
              </a>
            </p>
          </div>
        </div>
      ),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 },
    },
  };

  // Function to handle smooth scrolling to a section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
      });
      setTimeout(() => {
        setActiveSection(id);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-950">
      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-indigo-500 z-50 transition-all duration-300"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      {/* Quick navigation - appears when scrolling */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: isScrolling || scrollProgress > 0.1 ? 0 : -100,
          opacity: isScrolling || scrollProgress > 0.1 ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm z-40 border-b border-gray-800 shadow-lg"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-indigo-400 mr-2" />
            <h3 className="text-white font-semibold">Terms & Conditions</h3>
          </div>
          <div className="hidden md:flex space-x-4">
            {sectionData.slice(0, 5).map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`text-sm px-3 py-1 rounded-md transition-colors ${
                  activeSection === section.id
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {section.title.split(".")[0]}
              </button>
            ))}
            <div className="relative group">
              <button className="text-sm px-3 py-1 rounded-md text-gray-400 hover:text-white flex items-center">
                More <ChevronDown className="h-4 w-4 ml-1" />
              </button>
              <div className="absolute right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl hidden group-hover:block p-2 w-48 z-50">
                {sectionData.slice(5).map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="block w-full text-left px-3 py-2 text-sm rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-16 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link
              href="/"
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>

            <div className="flex items-center mb-4">
              <div className="h-14 w-14 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 mr-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Terms & Conditions
                </h1>
                <p className="text-gray-400">Last updated: April 28, 2025</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              Please read these Terms carefully before using our Platform. By
              accessing or using SourcingScreen, you agree to be bound by these
              Terms.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
              >
                <FileText className="h-4 w-4 mr-2" />
                Print Terms
              </button>

              <a
                href="/SourcingScreen_Terms_and_Conditions.docx"
                download
                className="flex items-center px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Download as DOCX
              </a>

              <Link
                href="/contactUs"
                className="flex items-center px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Us
              </Link>
            </div>
          </motion.div>

          {/* Table of Contents - Desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12 p-6 bg-gray-800/50 rounded-lg border border-gray-700 hidden md:block"
          >
            <h2 className="text-xl font-semibold text-white mb-4">
              Table of Contents
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {sectionData.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="flex items-center text-left p-2 rounded-md text-gray-300 hover:bg-gray-700/60 hover:text-white transition-colors"
                >
                  <span className="bg-gray-700 h-6 w-6 rounded-full flex items-center justify-center mr-2 text-xs font-medium text-indigo-300">
                    {index + 1}
                  </span>
                  <span className="text-sm">{section.title}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Main content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {sectionData.map((section) => (
              <motion.div
                key={section.id}
                id={section.id}
                variants={itemVariants}
                className="p-6 rounded-lg border border-gray-700 bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                      {React.cloneElement(section.icon, {
                        className: "h-5 w-5 text-indigo-400",
                      })}
                    </div>
                    <h2 className="text-xl font-semibold text-white">
                      {section.title}
                    </h2>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                    {activeSection === section.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {activeSection === section.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 text-gray-300 border-t border-gray-700 pt-6"
                  >
                    {section.content}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Footer */}
          <PublicFooter />
        </div>
      </div>
    </div>
  );
}
