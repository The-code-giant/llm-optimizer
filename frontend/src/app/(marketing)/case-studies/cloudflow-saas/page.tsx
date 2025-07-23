'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";

export default function CloudFlowCaseStudy() {
  const metrics = [
    { value: "300%", label: "Lead Growth", subtext: "From 50 to 200 qualified leads per month" },
    { value: "45 days", label: "Implementation Time", subtext: "Complete optimization in 6 weeks" },
    { value: "92%", label: "LLM Readiness Score", subtext: "Highest score in SaaS category" },
    { value: "68%", label: "Cost Reduction", subtext: "Lower customer acquisition costs" }
  ];

  const beforeAfter = [
    {
      metric: "AI Assistant Mentions",
      before: "2-3 per month",
      after: "25+ per week",
      improvement: "1000%+"
    },
    {
      metric: "Demo Requests",
      before: "12 per month", 
      after: "48 per month",
      improvement: "300%"
    },
    {
      metric: "Qualified Leads",
      before: "50 per month",
      after: "200 per month", 
      improvement: "300%"
    },
    {
      metric: "LLM Readiness Score",
      before: "31%",
      after: "92%",
      improvement: "197%"
    }
  ];

  const strategy = [
    {
      title: "AI-First Content Strategy",
      description: "Restructured all product documentation and help articles to be AI-friendly, focusing on clear, conversational language that LLMs can easily parse and recommend.",
      results: ["400% increase in content citations", "92% improvement in answer accuracy"]
    },
    {
      title: "Competitive Intelligence Integration",
      description: "Implemented content that directly addresses comparison queries, helping AI assistants recommend CloudFlow over competitors for specific use cases.",
      results: ["65% win rate in AI comparisons", "45% reduction in competitive losses"]
    },
    {
      title: "Use Case Optimization",
      description: "Created detailed use case content optimized for long-tail queries that potential customers ask AI assistants about workflow automation.",
      results: ["300% increase in use case traffic", "28% higher conversion rates"]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 to-blue-700 text-white pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/case-studies" className="inline-flex items-center text-purple-200 hover:text-white mb-8 transition-colors">
              ← Back to Case Studies
            </Link>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl">☁️</span>
                  <div>
                    <div className="text-purple-200 text-lg font-medium">SaaS</div>
                    <div className="text-2xl font-bold">CloudFlow</div>
                  </div>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  How CloudFlow Achieved 300% Lead Growth Through AI-Powered Discovery
                </h1>
                
                <p className="text-xl text-purple-100 mb-8 leading-relaxed">
                  See how this workflow automation platform transformed their content strategy 
                  to dominate AI-powered business software searches and triple their qualified leads.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                    View Implementation Guide
                  </Button> */}
                  <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white text-gray-900 hover:bg-white hover:text-purple-600">
                    Book Strategy Call
                  </Button>
                  </Link>
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

      {/* Company Background */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About CloudFlow</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                CloudFlow is a B2B workflow automation platform that helps mid-market companies 
                streamline their business processes. Founded in 2020, they serve over 1,200 customers 
                across industries like manufacturing, healthcare, and professional services.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                With features like drag-and-drop workflow builders, API integrations, and advanced 
                analytics, CloudFlow competes with established players like Zapier and Microsoft Power Automate.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                The challenge: potential customers were increasingly asking AI assistants for workflow 
                automation recommendations, but CloudFlow was rarely mentioned in responses.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              
              transition={{ duration: 0.8 }}
              className="bg-white rounded-xl p-8 shadow-sm"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-2xl font-bold text-gray-900">The Problem</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="font-semibold text-red-800">Low AI Visibility</div>
                  <div className="text-red-600">Mentioned in &lt;5% of AI recommendations</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="font-semibold text-orange-800">High CAC</div>
                  <div className="text-orange-600">$800 customer acquisition cost</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="font-semibold text-yellow-800">Competitive Losses</div>
                  <div className="text-yellow-600">Losing 60% of comparisons to Zapier</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Before/After Comparison */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Before vs After</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See the dramatic transformation in CloudFlow&apos;s key metrics after implementing 
              Clever Search&apos;s LLM optimization strategy.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beforeAfter.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <h3 className="font-bold text-gray-900 mb-4">{item.metric}</h3>
                <div className="space-y-3">
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-sm text-red-600 font-medium">Before</div>
                    <div className="text-lg font-bold text-red-800">{item.before}</div>
                  </div>
                  <div className="text-2xl">↓</div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-sm text-green-600 font-medium">After</div>
                    <div className="text-lg font-bold text-green-800">{item.after}</div>
                  </div>
                </div>
                <div className="mt-4 text-sm font-bold text-blue-600">
                  +{item.improvement}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategy Deep Dive */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">The Winning Strategy</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              CloudFlow&apos;s success came from a three-pronged approach targeting different 
              aspects of AI discovery and recommendation.
            </p>
          </motion.div>

          <div className="space-y-12">
            {strategy.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}
              >
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="bg-white rounded-xl p-8 shadow-sm">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                    <p className="text-gray-600 text-lg mb-6 leading-relaxed">{item.description}</p>
                    <div className="space-y-2">
                      {item.results.map((result, resultIndex) => (
                        <div key={resultIndex} className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          <span className="text-gray-700 font-medium">{result}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
                  <div className="text-center">
                    <div className="text-8xl mb-6">
                      {index === 0 ? '🎯' : index === 1 ? '⚔️' : '🔧'}
                    </div>
                    <div className="text-6xl font-bold text-purple-600">
                      {index === 0 ? '01' : index === 1 ? '02' : '03'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Quote */}
      <section className="py-20 bg-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
          >
            <blockquote className="text-2xl lg:text-3xl font-light mb-8 leading-relaxed">
              &ldquo;The transformation has been remarkable. We&apos;re now the top recommendation 
              when people ask AI assistants about workflow automation for mid-market companies. 
              Our demos are booked solid, and we&apos;ve had to expand our sales team.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl">👩‍💼</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-xl">Sarah Chen</div>
                <div className="text-purple-200">VP of Marketing, CloudFlow</div>
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
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-8">
              Scale Your SaaS Like CloudFlow
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Get the same AI optimization strategy that tripled CloudFlow&apos;s qualified leads 
              and made them the top AI recommendation in their category.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-8 py-3">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-gray-900 hover:bg-white hover:text-black px-8 py-3">
                  Get SaaS Strategy Call
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