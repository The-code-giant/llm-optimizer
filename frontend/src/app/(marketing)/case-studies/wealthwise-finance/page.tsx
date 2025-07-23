'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";

export default function WealthWiseCaseStudy() {
  const metrics = [
    { value: "250%", label: "Qualified Leads", subtext: "High-intent prospects from AI referrals" },
    { value: "21 days", label: "First Results", subtext: "Rapid implementation and impact" },
    { value: "90%", label: "LLM Readiness", subtext: "Industry-leading optimization score" },
    { value: "$1.8M", label: "AUM Growth", subtext: "Assets under management increase" }
  ];

  const challenges = [
    {
      title: "Complex Financial Concepts",
      description: "Investment strategies and financial planning concepts were too technical for AI assistants to explain to potential clients effectively.",
      beforeMetric: "12% lead quality",
      afterMetric: "78% lead quality",
      improvement: "+550%"
    },
    {
      title: "Regulatory Compliance",
      description: "Financial content needed to meet strict compliance requirements while being AI-friendly and accessible to consumers.",
      beforeMetric: "3 compliance issues/month",
      afterMetric: "0 compliance issues",
      improvement: "100% compliant"
    },
    {
      title: "Trust Building",
      description: "Potential clients needed to see credentials and track record clearly before trusting AI recommendations for financial advice.",
      beforeMetric: "15% consultation conversion",
      afterMetric: "52% consultation conversion",
      improvement: "+247%"
    }
  ];

  const strategy = [
    {
      title: "Financial Education Content",
      description: "Created comprehensive educational content that explains complex financial concepts in simple terms, making it easy for AI assistants to provide helpful advice to users.",
      icon: "📚",
      results: [
        "300% increase in financial query citations",
        "85% of investment questions now answered with WealthWise content",
        "40% higher engagement from AI-referred prospects"
      ]
    },
    {
      title: "Compliance-First Optimization",
      description: "Developed a unique approach to AI optimization that maintains full regulatory compliance while maximizing discoverability and trustworthiness.",
      icon: "⚖️",
      results: [
        "100% regulatory compliance maintained",
        "Zero content violations or warnings",
        "Approved by legal team for all AI-facing content"
      ]
    },
    {
      title: "Credibility & Social Proof",
      description: "Integrated comprehensive credentials, client testimonials, and performance metrics in AI-readable formats to build immediate trust.",
      icon: "🏆",
      results: [
        "92% of AI citations include credibility markers",
        "65% faster client onboarding process",
        "250% increase in qualified lead generation"
      ]
    }
  ];

  const timeline = [
    {
      week: "Week 1",
      title: "Compliance Assessment",
      description: "Reviewed all existing content for regulatory requirements and AI optimization opportunities.",
      deliverables: ["Content audit", "Compliance checklist", "Optimization roadmap"]
    },
    {
      week: "Week 2",
      title: "Educational Content Creation",
      description: "Developed AI-friendly explanations of financial concepts and investment strategies.",
      deliverables: ["25 educational articles", "FAQ optimization", "Glossary creation"]
    },
    {
      week: "Week 3",
      title: "Trust Signal Integration",
      description: "Added credentials, certifications, and client success stories in AI-readable formats.",
      deliverables: ["Credential markup", "Testimonial optimization", "Performance metrics"]
    },
    {
      week: "Week 4+",
      title: "Monitoring & Refinement",
      description: "Tracked AI citations and refined content based on performance and compliance feedback.",
      deliverables: ["Weekly reports", "Content updates", "Performance optimization"]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-600 to-orange-700 text-white pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/case-studies" className="inline-flex items-center text-amber-200 hover:text-white mb-8 transition-colors">
              ← Back to Case Studies
            </Link>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl">💰</span>
                  <div>
                    <div className="text-amber-200 text-lg font-medium">Financial Services</div>
                    <div className="text-2xl font-bold">WealthWise</div>
                  </div>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  How WealthWise Captured 250% More Qualified Leads Through AI Optimization
                </h1>
                
                <p className="text-xl text-amber-100 mb-8 leading-relaxed">
                  See how this boutique financial advisory firm became the top AI recommendation 
                  for wealth management and investment planning in their market.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-white text-amber-600 hover:bg-gray-100">
                    Financial AI Strategy
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-amber-600">
                    Schedule Advisory Call
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {metrics.map((metric, index) => (
                                     <motion.div
                     key={index}
                     initial={{ opacity: 0, y: 40 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: index * 0.1 }}
                     className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-6 text-center"
                   >
                     <div className="text-3xl font-bold mb-2 text-gray-900">{metric.value}</div>
                     <div className="text-gray-700 text-sm font-medium mb-2">{metric.label}</div>
                     <div className="text-gray-600 text-xs">{metric.subtext}</div>
                   </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About WealthWise</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                WealthWise is a boutique financial advisory firm specializing in comprehensive wealth management 
                for high-net-worth individuals and families. Founded in 2019 by former Wall Street advisors, 
                they manage over $850M in client assets across 300+ client relationships.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Their personalized approach combines traditional investment strategies with modern portfolio 
                management, tax optimization, and estate planning. They pride themselves on transparent fees 
                and fiduciary responsibility to their clients.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                The challenge emerged when potential clients started asking AI assistants for financial advisor 
                recommendations. Despite excellent client satisfaction and strong performance, WealthWise 
                was rarely mentioned in AI responses.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-xl p-8 shadow-sm"
            >
              <div className="text-center mb-6">
                <span className="text-4xl mb-4 block">📈</span>
                <h3 className="text-2xl font-bold text-gray-900">The Challenge</h3>
              </div>
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="font-semibold text-red-800 mb-2">Low Digital Visibility</div>
                  <div className="text-red-600 text-sm">Only 8% of prospects finding them through AI assistants</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="font-semibold text-orange-800 mb-2">Complex Financial Language</div>
                  <div className="text-orange-600 text-sm">Technical jargon preventing AI understanding</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="font-semibold text-yellow-800 mb-2">Trust & Credibility Gap</div>
                  <div className="text-yellow-600 text-sm">Credentials not visible to AI assistants</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Challenges Deep Dive */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Overcoming Financial Service Challenges</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              WealthWise faced unique challenges in the highly regulated financial services industry, 
              requiring specialized approaches to AI optimization.
            </p>
          </motion.div>

          <div className="space-y-8">
            {challenges.map((challenge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-gray-50 rounded-xl p-8"
              >
                <div className="grid lg:grid-cols-3 gap-8 items-center">
                  <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{challenge.title}</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">{challenge.description}</p>
                  </div>
                  <div className="bg-white rounded-lg p-6">
                    <div className="text-center">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-red-50 rounded p-3">
                          <div className="text-red-600 font-medium">Before</div>
                          <div className="text-red-800 font-bold">{challenge.beforeMetric}</div>
                        </div>
                        <div className="bg-green-50 rounded p-3">
                          <div className="text-green-600 font-medium">After</div>
                          <div className="text-green-800 font-bold">{challenge.afterMetric}</div>
                        </div>
                      </div>
                      <div className="mt-4 text-2xl font-bold text-amber-600">{challenge.improvement}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategy Breakdown */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">The Winning Strategy</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              WealthWise&apos;s success came from a compliance-first approach that maintained regulatory 
              requirements while maximizing AI discoverability.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {strategy.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white rounded-xl p-8 shadow-sm"
              >
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900">{item.title}</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">{item.description}</p>
                <div className="space-y-3">
                  <div className="font-semibold text-gray-900 text-sm">Key Results:</div>
                  {item.results.map((result, resultIndex) => (
                    <div key={resultIndex} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="text-gray-700 text-sm">{result}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">4-Week Implementation</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how WealthWise achieved remarkable results with a fast, systematic approach 
              to financial content optimization.
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-amber-200 h-full"></div>
            
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className="w-1/2 pr-8">
                    {index % 2 === 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="text-amber-600 font-bold text-lg mb-2">{item.week}</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                        <p className="text-gray-600 mb-4">{item.description}</p>
                        <div className="space-y-1">
                          {item.deliverables.map((deliverable, delIndex) => (
                            <div key={delIndex} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-amber-600 rounded-full"></div>
                              <span className="text-sm text-gray-700">{deliverable}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative z-10">
                    <div className="w-8 h-8 bg-amber-600 rounded-full border-4 border-white shadow-lg"></div>
                  </div>
                  
                  <div className="w-1/2 pl-8">
                    {index % 2 === 1 && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="text-amber-600 font-bold text-lg mb-2">{item.week}</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                        <p className="text-gray-600 mb-4">{item.description}</p>
                        <div className="space-y-1">
                          {item.deliverables.map((deliverable, delIndex) => (
                            <div key={delIndex} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-amber-600 rounded-full"></div>
                              <span className="text-sm text-gray-700">{deliverable}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Customer Quote */}
      <section className="py-20 bg-amber-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <blockquote className="text-2xl lg:text-3xl font-light mb-8 leading-relaxed">
              &ldquo;The results have exceeded our expectations. We&apos;re now the first name that comes up 
              when people ask AI assistants about wealth management in our area. Our appointment calendar 
              is fully booked with high-quality prospects who already understand our value proposition.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl">👨‍💼</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-xl">David Chen, CFP</div>
                <div className="text-amber-200">Senior Partner & Founder, WealthWise</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-8">
              Scale Your Financial Advisory Practice
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Get the same compliant AI optimization strategy that helped WealthWise capture 
              250% more qualified leads while maintaining full regulatory compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-8 py-3">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-black hover:bg-white hover:text-black px-8 py-3">
                  Financial Services Consultation
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