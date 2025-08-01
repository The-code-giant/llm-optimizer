'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

export default function AIOptimizationTabs() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: "seo",
      title: "AI SEO",
      icon: MagnifyingGlassIcon,
      subtitle: "Search Engine Optimization for AI",
      description:
        'Optimize your content structure and metadata to reach new customers who are using AI for search. "AI-first SEO built for actionable insights."',
      features: [
        "Auto-apply structured data so AI understands your content",
        "Optimize hierarchy to maximize page-level scoring",
        "Inject semantic keywords grounded in real AI prompts",
        "Close technical SEO gaps based on crawler analytics",
      ],
      color: "blue",
    },
    {
      id: "aeo",
      title: "AEO",
      icon: ChatBubbleLeftRightIcon,
      subtitle: "Answer Engine Optimization",
      description:
        "Structure your content to be the preferred source for AI-generated answers and responses.",
      features: [
        "Question-answer format optimization",
        "Featured snippet targeting for AI responses",
        "Content formatting for direct answer extraction",
        "Authority signals to increase citation probability",
      ],
      color: "green",
    },
    {
      id: "geo",
      title: "GEO",
      icon: GlobeAltIcon,
      subtitle: "Generative Engine Optimization",
      description:
        "Optimize for generative AI platforms that create content based on multiple sources.",
      features: [
        "Multi-source content validation and consistency",
        "Cross-platform optimization for various AI models",
        "Content freshness and update frequency optimization",
        "Brand mention and citation tracking across AI platforms",
      ],
      color: "purple",
    },
    {
      id: "llmo",
      title: "LLMO",
      icon: CpuChipIcon,
      subtitle: "Large Language Model Optimization",
      description:
        "Specifically optimize for LLMs like ChatGPT, Claude, and Gemini to increase citation rates.",
      features: [
        "LLM-specific content formatting and structure",
        "Training data optimization strategies",
        "Citation-worthy content creation guidelines",
        "Real-time LLM response monitoring and adjustment",
      ],
      color: "orange",
    },
  ];

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 8000); // Change tab every 8 seconds

    return () => clearInterval(interval);
  }, [tabs.length]);

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: isActive
        ? "bg-blue-500 text-white"
        : "text-blue-600 hover:bg-blue-50",
      green: isActive
        ? "bg-green-500 text-white"
        : "text-green-600 hover:bg-green-50",
      purple: isActive
        ? "bg-purple-500 text-white"
        : "text-purple-600 hover:bg-purple-50",
      orange: isActive
        ? "bg-orange-500 text-white"
        : "text-orange-600 hover:bg-orange-50",
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
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${getColorClasses(
                tab.color,
                isActive
              )}`}
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
                className: `w-12 h-12 text-${tabs[activeTab].color}-500 mr-4`,
              })}
              <div>
                <h3 className="text-3xl font-bold text-gray-900">
                  {tabs[activeTab].title}
                </h3>
                <p className="text-lg text-gray-600">
                  {tabs[activeTab].subtitle}
                </p>
              </div>
            </div>

            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              {tabs[activeTab].description}
            </p>

            <ul className="space-y-4">
              {tabs[activeTab].features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <div
                    className={`w-2 h-2 bg-${tabs[activeTab].color}-500 rounded-full mt-2 mr-3 flex-shrink-0`}
                  ></div>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            {/* Visual representation based on active tab */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center">
                <div
                  className={`w-24 h-24 bg-${tabs[activeTab].color}-100 rounded-full flex items-center justify-center mx-auto mb-6`}
                >
                  {React.createElement(tabs[activeTab].icon, {
                    className: `w-12 h-12 text-${tabs[activeTab].color}-500`,
                  })}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  {tabs[activeTab].title} Implementation
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div
                      className={`text-2xl font-bold text-${tabs[activeTab].color}-600`}
                    >
                      {activeTab === 0
                        ? "95%"
                        : activeTab === 1
                        ? "87%"
                        : activeTab === 2
                        ? "92%"
                        : "89%"}
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div
                      className={`text-2xl font-bold text-${tabs[activeTab].color}-600`}
                    >
                      {activeTab === 0
                        ? "24h"
                        : activeTab === 1
                        ? "12h"
                        : activeTab === 2
                        ? "48h"
                        : "36h"}
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
              activeTab === index ? "bg-blue-500" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
} 