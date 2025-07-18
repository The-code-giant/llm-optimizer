'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";

export default function CaseStudies() {
  const featuredCase = {
    title: "E-commerce Giant Increases LLM Citations by 500% in 60 Days",
    company: "TechMart",
    industry: "E-commerce",
    results: [
      { metric: "500%", label: "Increase in LLM Citations" },
      { metric: "60 days", label: "Time to Results" },
      { metric: "85%", label: "LLM Readiness Score" },
      { metric: "$2.4M", label: "Additional Revenue" }
    ],
    challenge: "TechMart struggled with AI visibility as customers increasingly used ChatGPT and Claude for product research. Their content wasn't optimized for LLM understanding.",
    solution: "Implemented comprehensive LLM optimization strategy including content restructuring, FAQ injection, and AI-friendly product descriptions.",
    image: "🛍️",
    href: "/case-studies/techmart-ecommerce"
  };

  const caseStudies = [
    {
      title: "SaaS Company Achieves 300% Growth in AI-Driven Leads",
      company: "CloudFlow",
      industry: "SaaS",
      image: "☁️",
      metrics: [
        { value: "300%", label: "Lead Growth" },
        { value: "45 days", label: "Implementation" },
        { value: "92%", label: "LLM Score" }
      ],
      description: "How CloudFlow optimized their content strategy to dominate AI-powered business software searches.",
      href: "/case-studies/cloudflow-saas"
    },
    {
      title: "Healthcare Provider Improves Patient Discovery by 400%",
      company: "MedCare Plus",
      industry: "Healthcare",
      image: "🏥",
      metrics: [
        { value: "400%", label: "Patient Discovery" },
        { value: "30 days", label: "Results Timeline" },
        { value: "88%", label: "Citation Rate" }
      ],
      description: "MedCare Plus leveraged LLM optimization to help patients find their specialized services through AI assistants.",
      href: "/case-studies/medcare-healthcare"
    },
    {
      title: "Financial Advisor Captures 250% More Qualified Leads",
      company: "WealthWise",
      industry: "Financial Services",
      image: "💰",
      metrics: [
        { value: "250%", label: "Qualified Leads" },
        { value: "21 days", label: "First Results" },
        { value: "90%", label: "LLM Readiness" }
      ],
      description: "WealthWise transformed their content to capture high-intent prospects using AI-powered financial advice searches.",
      href: "/case-studies/wealthwise-finance"
    },
    {
      title: "Local Restaurant Chain Boosts Visibility by 350%",
      company: "Tasty Bites",
      industry: "Food & Beverage",
      image: "🍽️",
      metrics: [
        { value: "350%", label: "Local Visibility" },
        { value: "14 days", label: "Quick Results" },
        { value: "86%", label: "AI Citations" }
      ],
      description: "Tasty Bites optimized their local presence to appear in AI-powered restaurant recommendations and food queries.",
      href: "/case-studies/tasty-bites-restaurant"
    },
    {
      title: "B2B Manufacturer Increases Inquiries by 280%",
      company: "IndusTech",
      industry: "Manufacturing",
      image: "🏭",
      metrics: [
        { value: "280%", label: "Inquiries" },
        { value: "35 days", label: "Full Results" },
        { value: "91%", label: "LLM Score" }
      ],
      description: "IndusTech leveraged technical content optimization to dominate AI-powered industrial equipment searches.",
      href: "/case-studies/industech-manufacturing"
    },
    {
      title: "Educational Platform Grows Student Acquisition by 320%",
      company: "LearnPro",
      industry: "Education",
      image: "🎓",
      metrics: [
        { value: "320%", label: "Student Growth" },
        { value: "28 days", label: "Implementation" },
        { value: "89%", label: "AI Visibility" }
      ],
      description: "LearnPro optimized their course content to capture students searching for educational resources via AI assistants.",
      href: "/case-studies/learnpro-education"
    }
  ];

  const industries = [
    { name: "E-commerce", count: 12, icon: "🛍️" },
    { name: "SaaS", count: 8, icon: "💻" },
    { name: "Healthcare", count: 6, icon: "🏥" },
    { name: "Finance", count: 5, icon: "💰" },
    { name: "Education", count: 4, icon: "🎓" },
    { name: "Manufacturing", count: 3, icon: "🏭" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-black text-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl lg:text-6xl font-normal mb-8 leading-tight">
              Real Results from Real Businesses
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              See how companies across industries are using Clever Search to increase their 
              AI visibility and drive measurable business growth.
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">500+</div>
                <div className="text-gray-300">Companies Optimized</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">350%</div>
                <div className="text-gray-300">Average Growth</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">30 days</div>
                <div className="text-gray-300">Average Time to Results</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Industries Filter */}
      <section className="py-12 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="px-6 py-3 bg-black text-white rounded-full font-medium"
            >
              All Industries (38)
            </motion.button>
            {industries.map((industry, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="px-6 py-3 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-full font-medium transition-colors duration-200"
              >
                {industry.icon} {industry.name} ({industry.count})
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Case Study */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Case Study</h2>
            
            <Link href={featuredCase.href} className="block">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 lg:p-12 text-white hover:shadow-2xl transition-shadow duration-300">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-4xl">{featuredCase.image}</span>
                      <div>
                        <div className="text-blue-200 text-sm font-medium">{featuredCase.industry}</div>
                        <div className="text-xl font-bold">{featuredCase.company}</div>
                      </div>
                    </div>
                    
                    <h3 className="text-3xl lg:text-4xl font-bold mb-6 leading-tight">
                      {featuredCase.title}
                    </h3>
                    
                    <p className="text-blue-100 mb-6 leading-relaxed">
                      <strong>Challenge:</strong> {featuredCase.challenge}
                    </p>
                    
                    <p className="text-blue-100 mb-8 leading-relaxed">
                      <strong>Solution:</strong> {featuredCase.solution}
                    </p>
                    
                    <Button 
                      size="lg" 
                      className="bg-white text-blue-600 hover:bg-gray-100 rounded-lg px-8 py-3"
                    >
                      Read Full Case Study
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {featuredCase.results.map((result, index) => (
                      <div key={index} className="bg-white bg-opacity-20 rounded-xl p-6 text-center">
                        <div className="text-3xl font-bold mb-2">{result.metric}</div>
                        <div className="text-blue-200 text-sm">{result.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              More Success Stories
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover how businesses across different industries are achieving remarkable results with LLM optimization.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {caseStudies.map((study, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
              >
                <Link href={study.href} className="block">
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-3xl">{study.image}</span>
                      <div>
                        <div className="text-gray-500 text-sm font-medium">{study.industry}</div>
                        <div className="text-lg font-bold text-gray-900">{study.company}</div>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight hover:text-blue-600 transition-colors duration-200">
                      {study.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {study.description}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {study.metrics.map((metric, metricIndex) => (
                        <div key={metricIndex} className="text-center bg-gray-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-blue-600 mb-1">{metric.value}</div>
                          <div className="text-gray-500 text-sm">{metric.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-16"
          >
            <Button 
              size="lg" 
              className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-3"
            >
              View All Case Studies
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Ready to become our next success story?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join hundreds of companies already seeing remarkable results with LLM optimization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-3"
                >
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 