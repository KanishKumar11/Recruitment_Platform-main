'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileSearch, 
  Users, 
  UserCheck, 
  Calendar, 
  CheckCircle, 
  Globe, 
  Clock, 
  Layers, 
  DollarSign, 
  Cpu, 
  Expand, 
  ArrowLeft, 
  ChevronRight, 
  Sparkles
} from 'lucide-react';

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [isStepHovered, setIsStepHovered] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Update scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Define steps
  const steps = [
    {
      id: 1,
      title: 'Post a Job',
      description: 'Employers post job openings with specific requirements, timelines, and salary ranges. Our intuitive dashboard makes it seamless to upload, manage, and update job listings in real-time.',
      icon: <FileSearch className="h-6 w-6" />,
      color: 'from-indigo-500 to-blue-600'
    },
    {
      id: 2,
      title: 'Recruiters Get Matched',
      description: 'Verified and specialized recruiters from our curated network receive your job posting. Only those with relevant expertise and industry knowledge are invited to submit candidates.',
      icon: <Users className="h-6 w-6" />,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 3,
      title: 'Submit Pre-Screened Candidates',
      description: 'Recruiters submit thoroughly screened candidates using custom screening questions, assessments, or video interviews (optional). This ensures you only receive high-quality profiles.',
      icon: <UserCheck className="h-6 w-6" />,
      color: 'from-indigo-500 to-purple-600'
    },
    {
      id: 4,
      title: 'Review & Interview',
      description: 'Employers can compare multiple candidate profiles in one place. Collaborate with your hiring team, schedule interviews, and track progress via our centralized hiring workspace.',
      icon: <Calendar className="h-6 w-6" />,
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 5,
      title: 'Hire with Confidence',
      description: 'Once a candidate is hired, payment is processed via our secure platform. SourcingScreen manages payouts, contracts, and recruiter compliance—so you don\'t have to.',
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'from-indigo-500 to-blue-600'
    }
  ];

  // Define benefits
  const benefits = [
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Global Network of Specialized Recruiters',
      description: 'Tap into a growing pool of pre-vetted, domain-specific recruitment agencies across industries and geographies.'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Faster Time-to-Hire',
      description: 'Reduce hiring cycles by connecting instantly with domain-specific recruiters who can source qualified candidates quickly.'
    },
    {
      icon: <Layers className="h-8 w-8" />,
      title: 'End-to-End Transparency',
      description: 'Track candidates, recruiter performance, and communication history through a centralized dashboard.'
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: 'No Upfront Fees',
      description: 'Pay only when you successfully hire a candidate. There are no hidden charges or subscription costs.'
    },
    {
      icon: <Cpu className="h-8 w-8" />,
      title: 'AI-Driven Matching',
      description: 'SourcingScreen uses intelligent matchmaking to connect jobs with the best-suited recruiters in real time.'
    },
    {
      icon: <Expand className="h-8 w-8" />,
      title: 'Scalable for Enterprises & Startups',
      description: 'Whether you\'re a high-growth startup or a global enterprise, our flexible platform adapts to your hiring needs.'
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const stepVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: (custom: number) => ({
      x: 0,
      opacity: 1,
      transition: { 
        delay: custom * 0.1,
        duration: 0.5 
      }
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-950">
      <div className="container mx-auto px-4 py-16 lg:px-8">
        {/* Header Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link 
              href="/"
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
                How SourcingScreen Works
              </motion.span>
            </h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed"
            >
              SourcingScreen is an intelligent recruitment marketplace that connects top recruiters with companies 
              seeking quality talent—faster, smarter, and at scale.
            </motion.p>
          </motion.div>
        </div>

        {/* Process/Steps Section */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto mb-24"
        >
          <motion.div 
            variants={itemVariants} 
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Our Recruitment Process</h2>
            <div className="h-1 w-20 bg-indigo-500 mx-auto mb-6"></div>
            <p className="text-gray-300">A simple 5-step process to connect you with top talent</p>
          </motion.div>

          {/* Process Steps */}
          <div className="relative">
            {/* Progress Bar */}
            <div className="hidden md:block absolute left-1/2 top-0 w-1 bg-gray-700 h-full -translate-x-1/2 z-0">
              <motion.div 
                className="w-full bg-gradient-to-b from-indigo-500 to-blue-600"
                initial={{ height: "0%" }}
                animate={{ height: `${Math.min(100, (activeStep + 1) * 25)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {/* Steps */}
            <div className="space-y-12 md:space-y-0 relative z-10">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  custom={index}
                  variants={stepVariants}
                  onMouseEnter={() => {
                    setActiveStep(index);
                    setIsStepHovered(true);
                  }}
                  onMouseLeave={() => setIsStepHovered(false)}
                  className={`flex flex-col md:flex-row ${index % 2 === 0 ? 'md:justify-start' : 'md:flex-row-reverse md:justify-start'} items-center`}
                >
                  <div 
                    className={`w-16 h-16 rounded-full flex items-center justify-center z-10 shadow-lg ${
                      index <= activeStep ? `bg-gradient-to-r ${step.color} shadow-indigo-500/20` : 'bg-gray-800'
                    } mb-4 md:mb-0`}
                  >
                    <div className="text-white">
                      {step.icon}
                    </div>
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0.8 }}
                    animate={{ 
                      opacity: isStepHovered && activeStep === index ? 1 : 0.9,
                      scale: isStepHovered && activeStep === index ? 1.02 : 1
                    }}
                    transition={{ duration: 0.3 }}
                    className={`md:w-5/12 ${
                      index % 2 === 0 ? 'md:ml-8' : 'md:mr-8 md:text-right'
                    } p-6 bg-gray-800/70 rounded-xl border border-gray-700 hover:border-indigo-500/50 shadow-xl transition-all duration-300`}
                  >
                    <div className="flex items-center mb-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-900/50 flex items-center justify-center mr-3">
                        <span className="font-bold text-indigo-400">{step.id}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{step.description}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Benefits Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-indigo-400 mr-2" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">Why Choose SourcingScreen</h2>
            </div>
            <div className="h-1 w-20 bg-indigo-500 mx-auto mb-6"></div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              SourcingScreen combines the <span className="font-semibold text-indigo-300">collaborative power of expert recruiters</span> with <span className="font-semibold text-indigo-300">smart matching algorithms</span>, ensuring companies find the right candidates without delays or high agency fees.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-indigo-500/30 transition-all duration-300 shadow-lg"
              >
                <div className="h-14 w-14 rounded-full bg-indigo-900/50 flex items-center justify-center mb-4 text-indigo-400">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{benefit.title}</h3>
                <p className="text-gray-300">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="max-w-4xl mx-auto mt-24 text-center"
        >
          <div className="bg-gradient-to-r from-indigo-900/50 to-blue-900/50 p-8 md:p-12 rounded-2xl border border-indigo-500/30 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Transform Your Hiring Process?</h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              Join hundreds of companies that have already improved their recruiting efficiency and quality of hires with SourcingScreen.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/30 transition-all duration-300 font-medium flex items-center"
              >
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/contactUs"
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-300 font-medium"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </motion.div>
        
        {/* Footer Section */}
        <div className="max-w-6xl mx-auto mt-24 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-400 text-sm">© {new Date().getFullYear()} SourcingScreen. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacyPolicy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}