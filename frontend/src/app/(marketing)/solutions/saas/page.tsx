'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import { 
  CloudIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ForSaaS() {
  const benefits = [
    {
      icon: RocketLaunchIcon,
      title: "Lead Generation",
      description: "Drive qualified prospects when they ask AI assistants about software solutions in your category."
    },
    {
      icon: CloudIcon,
      title: "Product Discovery",
      description: "Get your SaaS featured in AI recommendations for relevant use cases and business needs."
    },
    {
      icon: ChartBarIcon,
      title: "Trial Conversion",
      description: "Optimize content to convert AI-driven traffic into high-quality trial users and customers."
    },
    {
      icon: UserGroupIcon,
      title: "Customer Success",
      description: "Help existing customers discover features and use cases through AI-powered support content."
    }
  ];

  const features = [
    {
      title: "Feature Documentation Optimization",
      description: "Optimize product documentation and help content to be discoverable by AI systems",
      items: ["Feature explanation optimization", "Use case documentation", "Integration guides", "API documentation"]
    },
    {
      title: "Use Case Content Strategy",
      description: "Create content that captures prospects researching solutions for specific business problems",
      items: ["Problem-solution mapping", "Industry use cases", "Workflow optimization", "ROI calculators"]
    },
    {
      title: "Trial Conversion Tracking",
      description: "Monitor how AI citations drive trial signups and conversion to paid subscriptions",
      items: ["Trial attribution tracking", "Conversion funnel analysis", "Feature adoption tracking", "Churn prediction"]
    },
    {
      title: "Customer Journey Mapping",
      description: "Optimize content for every stage of the SaaS customer lifecycle",
      items: ["Awareness stage optimization", "Consideration content", "Retention strategies", "Expansion opportunities"]
    }
  ];

  const testimonials = [
    {
      company: "CloudFlow",
      industry: "Project Management SaaS",
      quote: "Our feature documentation now gets cited by ChatGPT for project management solutions. We've seen 300% growth in qualified leads from AI referrals.",
      author: "Alex Thompson",
      role: "Head of Growth",
      results: "+300% qualified leads"
    },
    {
      company: "DataViz Pro",
      industry: "Analytics SaaS",
      quote: "LLM optimization helped us become the recommended solution for data visualization. Our trial conversion rate from AI traffic is 40% higher.",
      author: "Rachel Park",
      role: "VP of Marketing",
      results: "40% higher conversions"
    }
  ];

  const stats = [
    { value: "200%", label: "More qualified leads" },
    { value: "80%", label: "Increase in trials" },
    { value: "45%", label: "Better retention" },
    { value: "3x", label: "Faster product adoption" }
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
              SaaS
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                LLM optimization
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Drive qualified leads and accelerate product adoption through optimized content that AI systems 
              recommend to prospects researching software solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                href="/login"
                className="bg-white text-black hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-full px-8 py-4 text-lg font-medium transition-colors duration-200 inline-flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                href="/demo"
                className="border-2 border-white text-white hover:bg-white hover:text-black dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black rounded-full px-8 py-4 text-lg font-medium transition-colors duration-200 inline-flex items-center justify-center"
              >
                View Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-6">
              Why SaaS companies choose us
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Specialized optimization for software documentation, feature discovery, and customer acquisition.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-6">
              Complete SaaS optimization
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to get your software discovered and recommended by AI systems.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                <div className="space-y-3">
                  {feature.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-6">
              Perfect for every SaaS category
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Optimize content for any type of software or business application.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "CRM & Sales Tools",
                description: "Get recommended for sales automation, lead management, and customer relationship queries.",
                icon: "📊"
              },
              {
                title: "Project Management",
                description: "Capture teams searching for workflow optimization and collaboration solutions.",
                icon: "🗂️"
              },
              {
                title: "Marketing Automation",
                description: "Be the go-to solution for email marketing, lead nurturing, and campaign management.",
                icon: "📧"
              },
              {
                title: "HR & Recruitment",
                description: "Get discovered by companies looking for talent management and hiring solutions.",
                icon: "👥"
              },
              {
                title: "Financial Software",
                description: "Capture queries about accounting, invoicing, and financial management tools.",
                icon: "💰"
              },
              {
                title: "Communication Tools",
                description: "Be recommended for team chat, video conferencing, and collaboration needs.",
                icon: "💬"
              }
            ].map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-4xl mb-4">{useCase.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                <p className="text-gray-600 leading-relaxed">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Journey Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-6">
              Optimize the entire customer journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From initial discovery to customer success, optimize every touchpoint.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {[
              {
                stage: "Discovery",
                title: "Problem Awareness",
                description: "Capture prospects researching solutions to business challenges",
                color: "from-blue-500 to-cyan-500"
              },
              {
                stage: "Evaluation",
                title: "Solution Research",
                description: "Be recommended during software comparison and evaluation phases",
                color: "from-purple-500 to-pink-500"
              },
              {
                stage: "Trial",
                title: "Product Testing",
                description: "Help prospects understand features and use cases during trials",
                color: "from-green-500 to-emerald-500"
              },
              {
                stage: "Success",
                title: "Customer Growth",
                description: "Support existing customers with feature discovery and expansion",
                color: "from-orange-500 to-red-500"
              }
            ].map((journey, index) => (
              <motion.div
                key={journey.stage}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${journey.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-white font-bold text-lg">{index + 1}</span>
                </div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">{journey.stage}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{journey.title}</h3>
                <p className="text-gray-600 leading-relaxed">{journey.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal text-gray-900 mb-6">
              Success stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how SaaS companies are growing with LLM optimization.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.company}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-gray-50 rounded-2xl p-8"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-lg text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-gray-600">{testimonial.role}, {testimonial.company}</div>
                    <div className="text-sm text-gray-500">{testimonial.industry}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{testimonial.results}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8">
              Start growing your SaaS today
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join leading SaaS companies using LLM optimization to drive qualified leads and accelerate growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                href="/login"
                className="bg-white text-black hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-full px-8 py-4 text-lg font-medium transition-colors duration-200 inline-flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                href="/demo"
                className="border-2 border-white text-white hover:bg-white hover:text-black dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black rounded-full px-8 py-4 text-lg font-medium transition-colors duration-200 inline-flex items-center justify-center"
              >
                Schedule Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 