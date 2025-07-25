'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Phone, Mail, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

// Define TypeScript interfaces
interface Section {
  id: string;
  title: string;
  content: ReactNode;
}

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Handle scroll progress for the progress bar at the top
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = scrollTop / (docHeight - winHeight);
      setScrollProgress(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };

  // Section data
  const sections: Section[] = [
    {
      id: 'scope',
      title: '1. Scope',
      content: (
        <ul className="list-disc pl-6 space-y-2">
          <li>Visitors to our website <a href="http://www.sourcingscreen.com" className="text-indigo-400 hover:text-indigo-300 underline">www.sourcingscreen.com</a>;</li>
          <li>Registered users including recruiters, vendors, hiring companies, and other authorized users;</li>
          <li>Personal data collected during the course of our recruitment services and interactions.</li>
        </ul>
      )
    },
    {
      id: 'information',
      title: '2. Information We Collect',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-200 mb-2">a) Personal Data Provided by You</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li><span className="font-medium text-gray-300">Registration Information:</span> Name, email, mobile number, company name, designation, business details, and password.</li>
              <li><span className="font-medium text-gray-300">Candidate Data:</span> Candidate names, contact details, resumes, experience, skills, and other information submitted by recruiters or vendors.</li>
              <li><span className="font-medium text-gray-300">Hiring Requirements:</span> Job descriptions, hiring budgets, screening questions, preferences, and related documentation.</li>
              <li><span className="font-medium text-gray-300">Communication Data:</span> Messages, emails, and responses exchanged on the Platform.</li>
              <li><span className="font-medium text-gray-300">Billing and Payment Information:</span> If applicable, we may collect PAN, GSTIN, bank details, and transaction records.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-200 mb-2">b) Automatically Collected Data</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li><span className="font-medium text-gray-300">Device and Usage Data:</span> IP address, browser type, operating system, access times, and referring URLs.</li>
              <li><span className="font-medium text-gray-300">Cookies and Similar Technologies:</span> We use cookies and analytics tools to enhance user experience.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'usage',
      title: '3. How We Use Your Information',
      content: (
        <ul className="list-disc pl-6 space-y-2">
          <li>To create and manage your account;</li>
          <li>To connect employers with recruiters and facilitate candidate submissions;</li>
          <li>To communicate with you regarding jobs, submissions, offers, payments, and other platform activity;</li>
          <li>To comply with legal obligations and regulatory requirements;</li>
          <li>To enhance the Platform, perform analytics, and prevent fraud;</li>
          <li>To enforce our Terms of Use and protect our legal rights.</li>
        </ul>
      )
    },
    {
      id: 'legal-basis',
      title: '4. Legal Basis for Processing',
      content: (
        <ul className="list-disc pl-6 space-y-2">
          <li><span className="font-medium text-gray-300">Consent:</span> Where you have given explicit consent (e.g., marketing communications).</li>
          <li><span className="font-medium text-gray-300">Contractual Necessity:</span> To fulfill our obligations under the service agreement.</li>
          <li><span className="font-medium text-gray-300">Legitimate Interest:</span> To ensure the smooth operation and improvement of our services.</li>
          <li><span className="font-medium text-gray-300">Legal Obligation:</span> Where required by applicable law or court order.</li>
        </ul>
      )
    },
    {
      id: 'sharing',
      title: '5. Sharing of Data',
      content: (
        <div className="space-y-4">
          <p>We may share your personal data with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><span className="font-medium text-gray-300">Hiring companies and recruiters/vendors</span> (as part of the recruitment process);</li>
            <li><span className="font-medium text-gray-300">Third-party service providers:</span> Cloud hosting, analytics, payment processors, background verification partners;</li>
            <li><span className="font-medium text-gray-300">Government agencies or law enforcement,</span> if required by law;</li>
            <li><span className="font-medium text-gray-300">Business transfers:</span> In case of merger, acquisition, or sale of assets.</li>
          </ul>
          <p className="font-medium text-gray-200">We <span className="underline">do not</span> sell your personal data to third parties.</p>
        </div>
      )
    },
    {
      id: 'international',
      title: '6. International Data Transfers',
      content: (
        <p>
          Your data may be processed and stored in countries outside of your own, 
          including countries that may not offer the same level of data protection. 
          In such cases, we ensure appropriate safeguards are in place, such as 
          contractual clauses or adequacy decisions under applicable laws.
        </p>
      )
    },
    {
      id: 'retention',
      title: '7. Data Retention',
      content: (
        <div className="space-y-4">
          <p>We retain your data for as long as necessary to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Fulfill the purpose for which it was collected;</li>
            <li>Comply with legal, regulatory, or contractual requirements;</li>
            <li>Enforce our rights or resolve disputes.</li>
          </ul>
          <p>We periodically review and delete data that is no longer required.</p>
        </div>
      )
    },
    {
      id: 'rights',
      title: '8. Your Rights',
      content: (
        <div className="space-y-4">
          <p>Depending on your location, you may have the following rights:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Right to access your personal data;</li>
            <li>Right to correction or updating of your data;</li>
            <li>Right to withdraw consent (where applicable);</li>
            <li>Right to object to or restrict processing;</li>
            <li>Right to deletion (subject to contractual and legal obligations);</li>
            <li>Right to data portability (under GDPR or similar laws).</li>
          </ul>
          <p>You can exercise these rights by contacting us at: <a href="mailto:privacy@sourcingscreen.com" className="text-indigo-400 hover:text-indigo-300">privacy@sourcingscreen.com</a></p>
        </div>
      )
    },
    {
      id: 'security',
      title: '9. Data Security',
      content: (
        <div className="space-y-4">
          <p>We implement appropriate technical and organizational measures to protect your personal data, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>SSL encryption;</li>
            <li>Role-based access control;</li>
            <li>Regular audits and security assessments.</li>
          </ul>
          <p>However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>
        </div>
      )
    },
    {
      id: 'children',
      title: '10. Children\'s Privacy',
      content: (
        <p>
          The Platform is not intended for individuals under 18. We do not knowingly 
          collect data from children. If you believe a child has provided us with 
          personal data, please contact us immediately.
        </p>
      )
    },
    {
      id: 'third-party',
      title: '11. Third-Party Links',
      content: (
        <p>
          Our Platform may contain links to third-party websites or services. 
          We are not responsible for the privacy practices or content of such external sites.
        </p>
      )
    },
    {
      id: 'updates',
      title: '12. Updates to This Privacy Policy',
      content: (
        <p>
          We may update this Privacy Policy periodically. Changes will be posted 
          on this page with an updated "Last Updated" date. Your continued use of the 
          Platform constitutes your acceptance of the updated policy.
        </p>
      )
    },
    {
      id: 'contact',
      title: '13. Contact Us',
      content: (
        <div>
          <p>For any questions or concerns regarding this Privacy Policy or your data:</p>
          <div className="mt-4 p-4 bg-gray-700/40 rounded-lg border border-gray-600">
            <p className="font-semibold text-gray-200">SourcingScreen</p>
            <p className="mt-2">
              <Mail className="inline-block h-4 w-4 mr-2 text-indigo-400" />
              Email: <a href="mailto:privacy@sourcingscreen.com" className="text-indigo-400 hover:text-indigo-300">privacy@sourcingscreen.com</a>
            </p>
            <p className="mt-1">
              <ExternalLink className="inline-block h-4 w-4 mr-2 text-indigo-400" />
              Website: <a href="http://www.sourcingscreen.com" className="text-indigo-400 hover:text-indigo-300">www.sourcingscreen.com</a>
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-950">
      {/* Progress bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-indigo-500 z-50 transition-all duration-300"
        style={{ width: `${scrollProgress * 100}%` }}
      />
      
      <div className="container mx-auto px-4 py-12 lg:px-8">
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
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
            </div>
            
            <div className="flex items-center text-gray-300 text-sm">
              <Lock className="h-4 w-4 mr-2" />
              <span>Last Updated: May 10, 2025</span>
            </div>
          </motion.div>

          {/* Introduction */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10 p-6 bg-gray-800/80 rounded-xl border border-gray-700 shadow-xl"
          >
            <p className="text-gray-300 leading-relaxed">
              Welcome to <span className="font-bold text-white">SourcingScreen.com</span> ("we," "us," or "our"). 
              Your privacy is important to us. This Privacy Policy explains how we collect, use, share, 
              and protect your personal data when you use our website, platform, and related services 
              (collectively, the "Platform").
            </p>
            <p className="mt-4 text-gray-300 leading-relaxed">
              This policy is in accordance with applicable laws including the 
              <span className="font-medium text-gray-200"> Information Technology Act, 2000</span>, the 
              <span className="font-medium text-gray-200"> Digital Personal Data Protection Act, 2023 (India)</span>, the 
              <span className="font-medium text-gray-200"> General Data Protection Regulation (GDPR)</span> (EU), 
              and other international privacy frameworks.
            </p>
          </motion.div>

          {/* Table of Contents */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10 p-6 bg-gray-800/50 rounded-xl border border-gray-700"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <ChevronDown className="h-5 w-5 mr-2 text-indigo-400" />
              Table of Contents
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sections.map(section => (
                <li key={section.id}>
                  <a 
                    href={`#${section.id}`}
                    className="flex items-center py-2 px-3 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                  >
                    <span className="w-8 h-8 flex items-center justify-center bg-indigo-900/50 rounded-full mr-3 text-indigo-400 text-sm">
                      {section.title.split('.')[0]}
                    </span>
                    <span>{section.title.split('.')[1].trim()}</span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Content Sections */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {sections.map((section) => (
              <motion.section
                key={section.id}
                id={section.id}
                variants={itemVariants}
                className="p-6 bg-gray-800/60 rounded-xl border border-gray-700 shadow-lg transition-all duration-300 hover:border-gray-600"
              >
                <button 
                  onClick={() => toggleSection(section.id)} 
                  className="w-full flex items-center justify-between text-left"
                >
                  <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                  {activeSection === section.id ? (
                    <ChevronUp className="h-5 w-5 text-indigo-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-indigo-400" />
                  )}
                </button>
                
                <div 
                  className={`mt-4 text-gray-300 leading-relaxed overflow-hidden transition-all duration-300 ${
                    activeSection === section.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {section.content}
                </div>
              </motion.section>
            ))}
          </motion.div>

          {/* Footer CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-400 mb-6">
              Have more questions about our Privacy Policy or how we handle your data?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/30"
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Us
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                Back to Register
              </Link>
            </div>
          </motion.div>
          
          {/* Copyright */}
          <div className="mt-16 pt-6 border-t border-gray-700/50 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} SourcingScreen. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}