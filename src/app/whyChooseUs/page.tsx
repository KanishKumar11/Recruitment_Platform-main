"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import PublicFooter from "@/app/components/layout/PublicFooter";
import {
  Globe,
  Clock,
  Layers,
  DollarSign,
  Cpu,
  Expand,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  CheckCircle,
  Users,
  Target,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";

export default function WhyChooseUsPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isFeatureHovered, setIsFeatureHovered] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Update scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Define main features
  const features = [
    {
      id: 1,
      title: "Global Network of Specialized Recruiters",
      description:
        "Tap into a growing pool of pre-vetted, domain-specific recruitment agencies across industries and geographies. Our network spans multiple continents and covers every major industry vertical.",
      icon: <Globe className="h-6 w-6" />,
      color: "from-blue-500 to-indigo-600",
      stats: "500+ Recruiters Worldwide",
    },
    {
      id: 2,
      title: "Faster Time-to-Hire",
      description:
        "Reduce hiring cycles by connecting instantly with domain-specific recruiters who can source qualified candidates quickly. Our streamlined process cuts average hiring time by 60%.",
      icon: <Clock className="h-6 w-6" />,
      color: "from-green-500 to-teal-600",
      stats: "60% Faster Hiring",
    },
    {
      id: 3,
      title: "End-to-End Transparency",
      description:
        "Track candidates, recruiter performance, and communication history through a centralized dashboard. Every interaction is logged and accessible in real-time.",
      icon: <Layers className="h-6 w-6" />,
      color: "from-purple-500 to-indigo-600",
      stats: "100% Visibility",
    },
    {
      id: 4,
      title: "No Upfront Fees",
      description:
        "Pay only when you successfully hire a candidate. There are no hidden charges or subscription costs. Our success-based pricing model aligns our interests with yours.",
      icon: <DollarSign className="h-6 w-6" />,
      color: "from-yellow-500 to-orange-600",
      stats: "Pay Only on Success",
    },
    {
      id: 5,
      title: "AI-Driven Matching",
      description:
        "SourcingScreen uses intelligent matchmaking to connect jobs with the best-suited recruiters in real time. Our algorithms consider industry expertise, past performance, and availability.",
      icon: <Cpu className="h-6 w-6" />,
      color: "from-pink-500 to-rose-600",
      stats: "95% Match Accuracy",
    },
    {
      id: 6,
      title: "Scalable for Enterprises & Startups",
      description:
        "Whether you're a high-growth startup or a global enterprise, our flexible platform adapts to your hiring needs. From single positions to bulk hiring campaigns.",
      icon: <Expand className="h-6 w-6" />,
      color: "from-cyan-500 to-blue-600",
      stats: "Any Scale, Any Size",
    },
  ];

  // Define competitive advantages
  const advantages = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Quality Over Quantity",
      description:
        "Our recruiters are pre-vetted and specialized in specific domains, ensuring you receive high-quality candidates rather than generic profiles.",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Proven Track Record",
      description:
        "With thousands of successful placements across various industries, our platform has consistently delivered results for companies of all sizes.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Risk-Free Hiring",
      description:
        "Our guarantee policy ensures you only pay for successful hires. If a candidate doesn't work out within the first 90 days, we'll find a replacement at no extra cost.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Instant Activation",
      description:
        "Get started immediately with our quick onboarding process. Post your first job and start receiving candidate profiles within 24 hours.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Dedicated Support",
      description:
        "Our customer success team provides personalized support throughout your hiring journey, ensuring optimal results and smooth operations.",
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Compliance & Security",
      description:
        "Built with enterprise-grade security and compliance standards, ensuring your data and hiring processes meet the highest industry standards.",
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  const featureVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: (custom: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: custom * 0.1,
        duration: 0.5,
      },
    }),
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
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500"
              >
                Why Choose SourcingScreen?
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed"
            >
              SourcingScreen combines the collaborative power of expert
              recruiters with smart matching algorithms, ensuring companies find
              the right candidates without delays or high agency fees.
            </motion.p>
          </motion.div>
        </div>

        {/* Main Features Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto mb-24"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Our Core Advantages
            </h2>
            <div className="h-1 w-20 bg-indigo-500 mx-auto mb-6"></div>
            <p className="text-gray-300">
              Six key reasons why SourcingScreen is the preferred choice for
              modern hiring
            </p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                custom={index}
                variants={featureVariants}
                onMouseEnter={() => {
                  setActiveFeature(index);
                  setIsFeatureHovered(true);
                }}
                onMouseLeave={() => setIsFeatureHovered(false)}
                className="group"
              >
                <motion.div
                  initial={{ opacity: 0.9 }}
                  animate={{
                    opacity:
                      isFeatureHovered && activeFeature === index ? 1 : 0.95,
                    scale:
                      isFeatureHovered && activeFeature === index ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="p-8 bg-gray-800/70 rounded-xl border border-gray-700 hover:border-indigo-500/50 shadow-xl transition-all duration-300 h-full"
                >
                  <div className="flex items-center mb-6">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-r ${feature.color} shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <div className="text-white">{feature.icon}</div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {feature.title}
                      </h3>
                      <div className="text-sm text-indigo-400 font-medium">
                        {feature.stats}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Checkmark indicator */}
                  <div className="flex items-center mt-4 text-green-400">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">
                      Verified Advantage
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Competitive Advantages Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto mb-24"
        >
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-indigo-400 mr-2" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                What Sets Us Apart
              </h2>
            </div>
            <div className="h-1 w-20 bg-indigo-500 mx-auto mb-6"></div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Beyond our core features, here's what makes SourcingScreen the{" "}
              <span className="font-semibold text-indigo-300">
                smart choice
              </span>{" "}
              for your recruitment needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advantages.map((advantage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-indigo-500/30 transition-all duration-300 shadow-lg group"
              >
                <div className="h-14 w-14 rounded-full bg-indigo-900/50 flex items-center justify-center mb-4 text-indigo-400 group-hover:bg-indigo-800/50 transition-colors duration-300">
                  {advantage.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {advantage.title}
                </h3>
                <p className="text-gray-300">{advantage.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
      </div>
      <PublicFooter />
    </div>
  );
}
