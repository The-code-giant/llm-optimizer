'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";
import { useState, useEffect } from 'react';
import { 
  SparklesIcon,
  ArrowUpIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

function AIOptimizationTabs() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 'seo',
      title: 'AI SEO',
      icon: MagnifyingGlassIcon,
      subtitle: 'Search Engine Optimization for AI',
      description: 'Optimize your content structure and metadata to help AI systems understand and index your content effectively.',
      features: [
        'Structured data implementation for better AI comprehension',
        'Content hierarchy optimization for AI crawlers',
        'Semantic keyword integration for context understanding',
        'Technical SEO improvements for AI accessibility'
      ],
      color: 'blue'
    },
    {
      id: 'aeo',
      title: 'AEO',
      icon: ChatBubbleLeftRightIcon,
      subtitle: 'Answer Engine Optimization',
      description: 'Structure your content to be the preferred source for AI-generated answers and responses.',
      features: [
        'Question-answer format optimization',
        'Featured snippet targeting for AI responses',
        'Content formatting for direct answer extraction',
        'Authority signals to increase citation probability'
      ],
      color: 'green'
    },
    {
      id: 'geo',
      title: 'GEO',
      icon: GlobeAltIcon,
      subtitle: 'Generative Engine Optimization',
      description: 'Optimize for generative AI platforms that create content based on multiple sources.',
      features: [
        'Multi-source content validation and consistency',
        'Cross-platform optimization for various AI models',
        'Content freshness and update frequency optimization',
        'Brand mention and citation tracking across AI platforms'
      ],
      color: 'purple'
    },
    {
      id: 'llmo',
      title: 'LLMO',
      icon: CpuChipIcon,
      subtitle: 'Large Language Model Optimization',
      description: 'Specifically optimize for LLMs like ChatGPT, Claude, and Gemini to increase citation rates.',
      features: [
        'LLM-specific content formatting and structure',
        'Training data optimization strategies',
        'Citation-worthy content creation guidelines',
        'Real-time LLM response monitoring and adjustment'
      ],
      color: 'orange'
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 5000); // Change tab every 5 seconds

    return () => clearInterval(interval);
  }, [tabs.length]);

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: isActive ? 'bg-blue-500 text-white' : 'text-blue-600 hover:bg-blue-50',
      green: isActive ? 'bg-green-500 text-white' : 'text-green-600 hover:bg-green-50',
      purple: isActive ? 'bg-purple-500 text-white' : 'text-purple-600 hover:bg-purple-50',
      orange: isActive ? 'bg-orange-500 text-white' : 'text-orange-600 hover:bg-orange-50'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === index;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(index)}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${getColorClasses(tab.color, isActive)}`}
            >
              <Icon className="w-5 h-5 mr-2" />
              {tab.title}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-50 rounded-2xl p-8 lg:p-12"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center mb-6">
              {React.createElement(tabs[activeTab].icon, {
                className: `w-12 h-12 text-${tabs[activeTab].color}-500 mr-4`
              })}
              <div>
                <h3 className="text-3xl font-bold text-gray-900">{tabs[activeTab].title}</h3>
                <p className="text-lg text-gray-600">{tabs[activeTab].subtitle}</p>
              </div>
            </div>
            
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              {tabs[activeTab].description}
            </p>

            <ul className="space-y-4">
              {tabs[activeTab].features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <div className={`w-2 h-2 bg-${tabs[activeTab].color}-500 rounded-full mt-2 mr-3 flex-shrink-0`}></div>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            {/* Visual representation based on active tab */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center">
                <div className={`w-24 h-24 bg-${tabs[activeTab].color}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
                  {React.createElement(tabs[activeTab].icon, {
                    className: `w-12 h-12 text-${tabs[activeTab].color}-500`
                  })}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  {tabs[activeTab].title} Implementation
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold text-${tabs[activeTab].color}-600`}>
                      {activeTab === 0 ? '95%' : activeTab === 1 ? '87%' : activeTab === 2 ? '92%' : '89%'}
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold text-${tabs[activeTab].color}-600`}>
                      {activeTab === 0 ? '24h' : activeTab === 1 ? '12h' : activeTab === 2 ? '48h' : '36h'}
                    </div>
                    <div className="text-sm text-gray-600">Avg. Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Progress Indicator */}
      <div className="flex justify-center mt-8 space-x-2">
        {tabs.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeTab === index ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
     const metrics = [
     { platform: "ChatGPT", percentage: "4.6%", number: "2,301", label: "citations", color: "bg-blue-500" },
     { platform: "Claude", percentage: "3.1%", number: "550", label: "citations", color: "bg-green-500" },
     { platform: "Gemini", percentage: "2.2%", number: "237", label: "citations", color: "bg-orange-500" }
   ];

     const stats = [
     { number: 75, suffix: "%", label: "of users now ask LLMs for recommendations before making purchase decisions.", source: "According to Recent Studies" },
     { number: 3, suffix: "x", label: "more likely to be cited when content follows LLM-optimized structure and formatting.", source: "LLM Optimizer Research" },
     { number: 85, suffix: "%", label: "of websites lack proper structure for LLM understanding and citation.", source: "Industry Analysis" }
   ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Hero Section - Dark */}
      <section className="bg-black text-white min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
                         <h1 className="text-4xl lg:text-6xl font-normal mb-8 leading-tight">
               Let&apos;s talk about what LLM Optimizer can do for your business.
             </h1>
            <Link href="/register">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
              >
                Get started
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Person Image Placeholder */}
            <div className="relative">
              <div className="w-80 h-80 bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl flex items-center justify-center mx-auto">
                <div className="w-64 h-64 bg-teal-700 rounded-full flex items-center justify-center">
                  <span className="text-6xl">👨‍💼</span>
                </div>
              </div>
              
              {/* Floating Metric Cards */}
              <div className="absolute -right-8 top-8 space-y-4">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    className="bg-white text-black p-4 rounded-lg shadow-lg min-w-[200px]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">{metric.platform}</span>
                                             <div className="flex items-center text-green-600 text-sm">
                         <ArrowUpIcon className="w-4 h-4 mr-1" />
                         {metric.percentage}
                       </div>
                    </div>
                    <div className="text-2xl font-bold">{metric.number}</div>
                    <div className="text-sm text-gray-600">{metric.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
   {/* Webinar CTA */}
   <section className="py-12 bg-blue-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-lg text-gray-700 mb-6">
              Stay ahead as AI transforms brand visibility. Join our webinar to learn how.
            </p>
            <Link href="/register">
              <Button 
                size="lg" 
                className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-3"
              >
                Register now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
  {/* AI Optimization Types Section */}
  <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Complete AI optimization strategy.
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Master all aspects of AI visibility with our comprehensive approach to SEO, AEO, GEO, and LLMO.
            </p>
          </motion.div>

          <AIOptimizationTabs />
        </div>
      </section>

             {/* Content Optimization Section */}
       <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
                         <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900 leading-tight">
               Increase your website&apos;s LLM citations and visibility.
             </h2>
             <p className="text-lg text-gray-600 mb-8 leading-relaxed">
               Analyze your website content from an LLM&apos;s perspective and get specific recommendations 
               to improve how ChatGPT, Claude, and Gemini understand and cite your content.
             </p>
             <ul className="space-y-4 text-gray-700">
               <li className="flex items-start">
                 <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                 Import your sitemap and analyze all pages for LLM-readiness with AI-powered scoring.
               </li>
               <li className="flex items-start">
                 <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                 Get specific, actionable recommendations to improve content structure and clarity.
               </li>
               <li className="flex items-start">
                 <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                 Inject AI-generated FAQs and structured content directly onto your pages.
               </li>
               <li className="flex items-start">
                 <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                 Track your LLM-readiness score and monitor citation improvements over time.
               </li>
             </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Dashboard Mockup */}
            <div className="bg-white rounded-lg shadow-2xl p-6 border">
                             <div className="flex items-center justify-between mb-6">
                 <span className="text-purple-600 text-sm font-medium">LLM Citation Analysis</span>
               </div>
              
              {/* Chart Placeholder */}
              <div className="relative">
                <div className="w-48 h-48 mx-auto relative">
                  <svg className="w-full h-full" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="20"/>
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#3b82f6" strokeWidth="20"
                            strokeDasharray="251.2" strokeDashoffset="125.6" 
                            className="transform -rotate-90 origin-center"/>
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#06b6d4" strokeWidth="20"
                            strokeDasharray="251.2" strokeDashoffset="188"
                            className="transform -rotate-90 origin-center"/>
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#8b5cf6" strokeWidth="20"
                            strokeDasharray="251.2" strokeDashoffset="213"
                            className="transform -rotate-90 origin-center"/>
                  </svg>
                                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <div className="text-3xl font-bold text-gray-900">87</div>
                     <div className="text-sm text-gray-600">LLM Score</div>
                   </div>
                </div>
                
                {/* Legend */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">ChatGPT</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-cyan-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Claude</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Gemini</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Others</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Stats */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ChatGPT</span>
                                     <div className="flex items-center">
                     <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                     <span className="text-sm font-medium">2.2%</span>
                   </div>
                </div>
                <div className="text-2xl font-bold mt-1">2K citations</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

             {/* Content Deployment Section */}
       <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            {/* Content Management Interface Mockup */}
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="bg-blue-600 p-4 text-white">
                <div className="flex items-center">
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  <span className="font-medium">AI guidance</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-4">AI-Generated Content Suggestions:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Add structured FAQ section
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Include clear definitions
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Optimize heading structure
                  </li>
                </ul>
                
                {/* Sample Content */}
                <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white relative overflow-hidden">
                  <h4 className="font-bold text-xl">Frequently Asked Questions</h4>
                  <p className="text-sm opacity-90 mt-1">What is LLM optimization?</p>
                  <p className="text-xs opacity-80 mt-2">LLM optimization is the process of structuring website content to improve how large language models understand and cite your information.</p>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <SparklesIcon className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-sm text-gray-600">LLM Score improvement</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">+34%</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900 leading-tight">
              Inject optimized content directly onto your website.
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Move from analysis to action with AI-generated content suggestions that you can 
              deploy directly onto your pages without developer assistance. Improve your LLM 
              readiness score with structured content that LLMs love to cite.
            </p>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Get AI-generated FAQ sections, definitions, and structured content suggestions.
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Preview and edit suggested content before publishing to your live site.
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Deploy content with a simple JavaScript snippet - no developer required.
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Track improvements in your LLM readiness score as you implement recommendations.
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Case Study Section */}
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
              Real results from LLM optimization.
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              See how businesses are succeeding with LLM optimization strategies and getting cited by AI systems.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {/* Success Metrics Card */}
              <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                      <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Success Stories</h3>
                      <p className="text-gray-600">LLM Optimization Results</p>
                    </div>
                  </div>
                  
                  <h4 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                    Companies Show Up in AI Search Within 48 Hours
                  </h4>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Businesses using LLM optimization strategies are getting featured in ChatGPT, Claude, and Gemini responses rapidly by structuring their content for AI understanding.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">48</div>
                      <div className="text-sm text-gray-600">Hours Average</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">3x</div>
                      <div className="text-sm text-gray-600">More Citations</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Start optimizing your content today</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <blockquote className="text-2xl lg:text-3xl text-gray-900 font-light leading-relaxed mb-8">
                &ldquo;The key to LLM citations is understanding how AI systems process and prioritize information.&rdquo;
              </blockquote>
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <SparklesIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">LLM Optimization Expert</div>
                  <div className="text-gray-600">AI Content Strategy Specialist</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700">Proven strategies for faster AI discovery</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700">Expert knowledge of AI content preferences</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700">Comprehensive optimization across all AI platforms</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    

             {/* Statistics Section */}
       <section id="pricing" className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Why an AI search and discovery strategy is critical.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="text-6xl lg:text-7xl font-light text-gray-900 mb-4">
                  <AnimatedCounter end={stat.number} suffix={stat.suffix} />
                </div>
                <p className="text-lg text-gray-700 mb-4 leading-relaxed max-w-sm mx-auto">
                  {stat.label}
                </p>
                <p className="text-sm text-gray-500 underline">
                  {stat.source}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hero CTA Section - Dark */}
      <section className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-sm text-gray-400 uppercase tracking-wider mb-4 block">
              LLM OPTIMIZER: AVAILABLE NOW
            </span>
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Get cited by ChatGPT, Claude, and Gemini.
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Customers and prospects increasingly turn to LLMs for information 
              and recommendations. LLM Optimizer helps optimize your content 
              structure so these AI systems understand and cite your website, 
              driving qualified traffic and influence at every stage of the 
              customer journey.
            </p>
            <Link href="/register">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
              >
                Sign up for updates
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Person with Glasses */}
            <div className="relative">
              <div className="w-80 h-96 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/30 to-transparent"></div>
                <span className="text-8xl relative z-10">👩‍💼</span>
              </div>
              
              {/* Floating UI Elements */}
              <div className="absolute -right-8 top-12 space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-white text-black p-4 rounded-lg shadow-lg"
                >
                  <div className="text-sm text-gray-600 mb-2">What&apos;s my brand presence on AI engines?</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="bg-white text-black p-4 rounded-lg shadow-lg grid grid-cols-3 gap-4 min-w-[280px]"
                >
                                     <div className="text-center">
                     <div className="flex items-center justify-center text-green-600 text-sm mb-1">
                       <ArrowUpIcon className="w-4 h-4 mr-1" />
                       4.6%
                     </div>
                     <div className="text-sm text-gray-600">AI engines mentions</div>
                     <div className="text-2xl font-bold">5,120</div>
                   </div>
                   <div className="text-center">
                     <div className="flex items-center justify-center text-green-600 text-sm mb-1">
                       <ArrowUpIcon className="w-4 h-4 mr-1" />
                       3.1%
                     </div>
                     <div className="text-sm text-gray-600">Google AI mentions</div>
                     <div className="text-2xl font-bold">1,128</div>
                   </div>
                   <div className="text-center">
                     <div className="flex items-center justify-center text-green-600 text-sm mb-1">
                       <ArrowUpIcon className="w-4 h-4 mr-1" />
                       2.2%
                     </div>
                     <div className="text-sm text-gray-600">ChatGPT mentions</div>
                     <div className="text-2xl font-bold">870</div>
                   </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

   

             {/* Final Section */}
       <section id="resources" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Ensure your brand&apos;s visibility in LLM responses with LLM Optimizer.
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {/* Content Grid Mockup */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-500 rounded-lg p-4 text-white">
                  <div className="text-xs mb-2">🔥 Top performing content</div>
                  <div className="text-sm font-medium">Optimize content</div>
                </div>
                <div className="bg-blue-500 rounded-lg p-4 text-white">
                  <div className="text-xs mb-2">📈 TOP TRENDING</div>
                  <div className="text-xs mb-1">KEYWORDS</div>
                  <div className="text-sm font-medium">Thankful running shoes</div>
                </div>
                <div className="bg-cyan-500 rounded-lg p-4 text-white">
                  <div className="text-xs mb-2">🌊 Top performing content</div>
                  <div className="bg-white/20 rounded p-2 mt-2">
                    <div className="w-8 h-8 bg-orange-400 rounded"></div>
                  </div>
                </div>
                <div className="bg-purple-500 rounded-lg p-4 text-white">
                  <div className="text-xs mb-2">🔥 Top performing content</div>
                  <div className="bg-white/20 rounded p-2 mt-2">
                    <div className="w-8 h-8 bg-yellow-400 rounded"></div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h3 className="text-3xl font-normal mb-6 text-gray-900">
                Own your presence within AI search and discovery.
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Ensure your brand, products, and content are visible, credible, and influential as customers 
                turn to AI to explore and decide.
              </p>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Optimize your owned and earned content to surface in leading AI models such as 
                  ChatGPT, Google AI Mode, Perplexity, and more.
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Uncover and understand the third-party content that shapes how your brand appears in 
                  search results.
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Measure and improve how AI systems present and position your brand to high-intent 
                  audiences.
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Track your share of voice against competitors in the evolving AI search ecosystem.
                </li>
              </ul>
            </motion.div>
          </div>
                 </div>
       </section>

       <Footer />
     </div>
   );
 }
