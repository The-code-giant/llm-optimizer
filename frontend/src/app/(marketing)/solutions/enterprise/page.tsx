'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon,
  GlobeAltIcon,
  CogIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

export default function ForEnterprise() {
  const benefits = [
    {
      icon: ShieldCheckIcon,
      title: "Enterprise Security",
      description: "SOC 2 Type II compliance, SSO integration, and enterprise-grade security controls for your peace of mind."
    },
    {
      icon: GlobeAltIcon,
      title: "Global Scale",
      description: "Optimize content across multiple regions, languages, and markets with our global infrastructure."
    },
    {
      icon: CogIcon,
      title: "Custom Integrations",
      description: "Seamlessly integrate with your existing tech stack including CMS, analytics, and workflow tools."
    },
    {
      icon: UserGroupIcon,
      title: "Dedicated Support",
      description: "Get a dedicated customer success manager and priority support with guaranteed response times."
    }
  ];

  const features = [
    {
      title: "Advanced Analytics",
      description: "Comprehensive reporting and analytics with custom dashboards and automated insights.",
      icon: "📊"
    },
    {
      title: "Multi-Site Management",
      description: "Manage hundreds of websites and domains from a single, unified platform.",
      icon: "🌐"
    },
    {
      title: "API-First Platform",
      description: "Full REST API access for custom integrations and automated workflows.",
      icon: "🔌"
    },
    {
      title: "Role-Based Access",
      description: "Granular permissions and role-based access controls for team collaboration.",
      icon: "👥"
    },
    {
      title: "Custom Workflows",
      description: "Build custom approval workflows and automated optimization processes.",
      icon: "⚙️"
    },
    {
      title: "SLA Guarantees",
      description: "99.9% uptime SLA with guaranteed response times and performance metrics.",
      icon: "📈"
    }
  ];

  const caseStudy = {
    company: "Fortune 500 Retailer",
    challenge: "Optimizing 10,000+ product pages across 50 international markets",
    solution: "Enterprise deployment with custom integrations and dedicated support",
    results: [
      "400% increase in LLM citations across all markets",
      "90% reduction in content optimization time",
      "$50M+ additional revenue from improved visibility",
      "50% faster time-to-market for new products"
    ]
  };

  const securityFeatures = [
    "SOC 2 Type II Certified",
    "GDPR & CCPA Compliant",
    "Single Sign-On (SSO)",
    "Multi-Factor Authentication",
    "Data Encryption at Rest",
    "Regular Security Audits",
    "Private Cloud Options",
    "Custom Data Retention"
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl lg:text-7xl font-normal mb-8 leading-tight">
              Enterprise-grade
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                LLM optimization
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Scale LLM optimization across your entire organization with enterprise security, 
              custom integrations, and dedicated support.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-4 text-lg"
              >
                Contact Sales
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-4 text-lg"
              >
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-8 leading-tight">
              Built for enterprise scale
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Everything your enterprise needs to optimize content at scale with security and compliance.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                    <benefit.icon className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-8 leading-tight">
              Enterprise features
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Advanced capabilities designed for large organizations with complex requirements.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <LockClosedIcon className="w-16 h-16 text-blue-600 mx-auto mb-8" />
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-8 leading-tight">
              Enterprise security
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Your data security is our top priority. We maintain the highest standards of security and compliance.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-6">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 text-center"
              >
                <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-4" />
                <p className="font-medium text-gray-900">{feature}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Enterprise success
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              See how enterprises are using Clever Search to transform their content strategy.
            </p>
          </motion.div>

          <div className="bg-gray-900 rounded-2xl p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6">{caseStudy.company}</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">Challenge</h4>
                    <p className="text-gray-300">{caseStudy.challenge}</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">Solution</h4>
                    <p className="text-gray-300">{caseStudy.solution}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-blue-400 mb-6">Results</h4>
                <div className="space-y-4">
                  {caseStudy.results.map((result, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{result}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-8 leading-tight">
              Ready to scale enterprise-wide?
            </h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Join leading enterprises already using Clever Search to optimize content at scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-4 text-lg"
              >
                Contact Sales
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-8 py-4 text-lg"
              >
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 