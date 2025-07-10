'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";
import { 
  PlayIcon,
  ClockIcon,
  BookmarkIcon,
  ShareIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function Tutorials() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All Tutorials', count: 24 },
    { id: 'getting-started', name: 'Getting Started', count: 6 },
    { id: 'optimization', name: 'Optimization', count: 8 },
    { id: 'analytics', name: 'Analytics', count: 5 },
    { id: 'advanced', name: 'Advanced', count: 5 }
  ];

  const tutorials = [
    {
      id: 1,
              title: "Getting Started with Cleaver Search",
      description: "Complete walkthrough of setting up your first site analysis and understanding your dashboard",
      duration: "12:45",
      category: "getting-started",
      level: "Beginner",
      views: "15.2K",
      thumbnail: "/api/placeholder/400/225",
      featured: true
    },
    {
      id: 2,
      title: "Understanding Your LLM Readiness Score",
      description: "Deep dive into what your score means and how to interpret each component",
      duration: "8:30",
      category: "getting-started",
      level: "Beginner",
      views: "12.8K",
      thumbnail: "/api/placeholder/400/225"
    },
    {
      id: 3,
      title: "Installing the Tracking Script",
      description: "Step-by-step guide to adding our tracking script to your website",
      duration: "6:15",
      category: "getting-started",
      level: "Beginner",
      views: "9.4K",
      thumbnail: "/api/placeholder/400/225"
    },
    {
      id: 4,
      title: "Content Optimization Best Practices",
      description: "Learn how to structure your content for maximum AI citation potential",
      duration: "15:20",
      category: "optimization",
      level: "Intermediate",
      views: "18.7K",
      thumbnail: "/api/placeholder/400/225"
    },
    {
      id: 5,
      title: "Creating AI-Friendly FAQ Sections",
      description: "Master the art of FAQ creation that AI systems love to cite",
      duration: "10:45",
      category: "optimization",
      level: "Intermediate",
      views: "14.3K",
      thumbnail: "/api/placeholder/400/225"
    },
    {
      id: 6,
      title: "Advanced Schema Markup Implementation",
      description: "Technical guide to implementing schema markup for better AI understanding",
      duration: "18:30",
      category: "advanced",
      level: "Advanced",
      views: "7.2K",
      thumbnail: "/api/placeholder/400/225"
    },
    {
      id: 7,
      title: "Analyzing Your Citation Performance",
      description: "How to read and interpret your analytics dashboard for actionable insights",
      duration: "11:20",
      category: "analytics",
      level: "Intermediate",
      views: "11.5K",
      thumbnail: "/api/placeholder/400/225"
    },
    {
      id: 8,
      title: "Competitor Analysis and Benchmarking",
      description: "Use competitor insights to improve your optimization strategy",
      duration: "9:45",
      category: "analytics",
      level: "Intermediate",
      views: "8.9K",
      thumbnail: "/api/placeholder/400/225"
    },
    {
      id: 9,
      title: "API Integration for Developers",
              description: "Complete guide to integrating Cleaver Search via our REST API",
      duration: "22:15",
      category: "advanced",
      level: "Advanced",
      views: "5.8K",
      thumbnail: "/api/placeholder/400/225"
    },
    {
      id: 10,
      title: "Optimizing E-commerce Product Pages",
      description: "Specific strategies for product page optimization in e-commerce",
      duration: "13:30",
      category: "optimization",
      level: "Intermediate",
      views: "10.2K",
      thumbnail: "/api/placeholder/400/225"
    },
    {
      id: 11,
      title: "Building Topical Authority",
      description: "Long-term strategies for becoming the go-to source in your niche",
      duration: "16:45",
      category: "optimization",
      level: "Advanced",
      views: "9.7K",
      thumbnail: "/api/placeholder/400/225"
    },
    {
      id: 12,
      title: "Troubleshooting Common Issues",
      description: "Solutions to the most frequently encountered problems",
      duration: "14:20",
      category: "getting-started",
      level: "Beginner",
      views: "13.1K",
      thumbnail: "/api/placeholder/400/225"
    }
  ];

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredTutorial = tutorials.find(t => t.featured);

  const learningPaths = [
    {
      title: "Complete Beginner Path",
      description: "Start from zero and master the fundamentals",
      duration: "2 hours",
      tutorials: 6,
      color: "bg-blue-500"
    },
    {
      title: "Content Optimization Mastery",
      description: "Advanced strategies for content optimization",
      duration: "3.5 hours", 
      tutorials: 8,
      color: "bg-green-500"
    },
    {
      title: "Analytics & Measurement",
      description: "Learn to track and improve your results",
      duration: "1.5 hours",
      tutorials: 5,
      color: "bg-purple-500"
    },
    {
      title: "Technical Implementation",
      description: "Developer-focused technical tutorials",
      duration: "4 hours",
      tutorials: 7,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-black text-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-6xl font-normal mb-8 leading-tight">
              Video Tutorials
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Master LLM optimization with our comprehensive video library. From beginner basics to advanced strategies, learn at your own pace.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tutorials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Tutorial */}
      {featuredTutorial && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Tutorial</h2>
              <p className="text-lg text-gray-600">Start here if you're new to LLM optimization</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-4xl mx-auto"
            >
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="relative">
                  <div className="aspect-video bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <PlayIcon className="w-16 h-16 text-white mx-auto mb-4" />
                      <div className="text-white text-sm">{featuredTutorial.duration}</div>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Featured
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                      {featuredTutorial.level}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{featuredTutorial.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{featuredTutorial.description}</p>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center text-gray-500">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      <span>{featuredTutorial.duration}</span>
                      <span className="mx-2">•</span>
                      <span>{featuredTutorial.views} views</span>
                    </div>
                  </div>
                  <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-lg">
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Watch Tutorial
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Learning Paths */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-8">Learning Paths</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Structured learning paths to guide your LLM optimization journey
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {learningPaths.map((path, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-8 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-start">
                  <div className={`w-12 h-12 ${path.color} rounded-lg flex items-center justify-center mr-6 flex-shrink-0`}>
                    <PlayIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{path.title}</h3>
                    <p className="text-gray-600 mb-4">{path.description}</p>
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      <span>{path.duration}</span>
                      <span className="mx-2">•</span>
                      <span>{path.tutorials} tutorials</span>
                    </div>
                    <Button variant="outline" className="rounded-lg">
                      Start Learning Path
                      <ChevronRightIcon className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tutorial Library */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-8">Complete Tutorial Library</h2>
            <p className="text-lg text-gray-600">
              Browse all tutorials by category or search for specific topics
            </p>
          </motion.div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>

          {/* Tutorial Grid */}
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
            {filteredTutorials.map((tutorial, index) => (
              <motion.div
                key={tutorial.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
              >
                <div className="relative">
                  <div className="aspect-video bg-gray-900 flex items-center justify-center">
                    <PlayIcon className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                    {tutorial.duration}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                      {tutorial.level}
                    </span>
                    <span className="text-gray-500 text-sm">{tutorial.views} views</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                    {tutorial.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {tutorial.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Button size="sm" className="bg-black text-white hover:bg-gray-800 rounded-lg">
                      <PlayIcon className="w-4 h-4 mr-2" />
                      Watch
                    </Button>
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                        <BookmarkIcon className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                        <ShareIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredTutorials.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No tutorials found matching your criteria.</p>
              <Button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                }}
                variant="outline"
                className="mt-4 rounded-lg"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Ready to optimize your content?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Start applying what you've learned with a free Cleaver Search account.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-4"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/demo">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-4"
                >
                  Book a Demo
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