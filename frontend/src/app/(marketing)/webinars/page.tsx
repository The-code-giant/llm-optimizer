'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";
import { 
  PlayIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

export default function Webinars() {
  const [selectedCategory, setSelectedCategory] = useState('upcoming');

  const categories = [
    { id: 'upcoming', name: 'Upcoming', count: 3 },
    { id: 'on-demand', name: 'On-Demand', count: 12 },
    { id: 'series', name: 'Series', count: 4 }
  ];

  const upcomingWebinars = [
    {
      id: 1,
      title: "Advanced LLM Optimization Strategies for 2025",
      description: "Discover the latest techniques for maximizing your content's visibility in AI responses. Learn about emerging trends and future-proof your optimization strategy.",
      date: "January 25, 2025",
      time: "2:00 PM EST",
      duration: "60 minutes",
      presenter: "Dr. Sarah Chen",
      presenterTitle: "Head of AI Research",
      attendees: 847,
      maxAttendees: 1000,
      featured: true,
      topics: [
        "2025 LLM optimization trends",
        "Advanced content structuring",
        "Multi-modal optimization",
        "Performance measurement"
      ]
    },
    {
      id: 2,
      title: "E-commerce LLM Optimization Masterclass",
      description: "Specialized training for e-commerce businesses looking to improve product discovery through AI assistants.",
      date: "February 8, 2025",
      time: "1:00 PM EST",
      duration: "45 minutes",
      presenter: "Mike Rodriguez",
      presenterTitle: "E-commerce Optimization Expert",
      attendees: 523,
      maxAttendees: 500,
      topics: [
        "Product page optimization",
        "Category structure for AI",
        "Review optimization",
        "Competitive analysis"
      ]
    },
    {
      id: 3,
      title: "Agency Growth Through LLM Optimization",
      description: "How agencies can add LLM optimization services to increase revenue and client satisfaction.",
      date: "February 22, 2025",
      time: "3:00 PM EST",
      duration: "45 minutes",
      presenter: "Emily Watson",
      presenterTitle: "Agency Success Manager",
      attendees: 312,
      maxAttendees: 750,
      topics: [
        "Service packaging",
        "Client onboarding",
        "Pricing strategies",
        "Case study presentation"
      ]
    }
  ];

  const onDemandWebinars = [
    {
      id: 4,
      title: "LLM Optimization Fundamentals",
      description: "Complete introduction to LLM optimization for beginners",
      duration: "50 minutes",
      views: "12.5K",
      rating: 4.8,
      date: "December 2024"
    },
    {
      id: 5,
      title: "Content Strategy for AI Citation",
      description: "How to structure your content strategy for maximum AI visibility",
      duration: "45 minutes",
      views: "9.2K",
      rating: 4.9,
      date: "November 2024"
    },
    {
      id: 6,
      title: "Technical Implementation Deep Dive",
      description: "Advanced technical strategies for developers and technical teams",
      duration: "65 minutes",
      views: "7.8K",
      rating: 4.7,
      date: "November 2024"
    },
    {
      id: 7,
      title: "ROI Measurement and Analytics",
      description: "How to measure and prove the ROI of your LLM optimization efforts",
      duration: "40 minutes",
      views: "8.9K",
      rating: 4.8,
      date: "October 2024"
    }
  ];

  const webinarSeries = [
    {
      id: 1,
      title: "LLM Optimization Bootcamp",
      description: "4-week intensive series covering all aspects of LLM optimization",
      sessions: 4,
      totalDuration: "6 hours",
      nextSession: "January 30, 2025",
      enrolled: 1247
    },
    {
      id: 2,
      title: "Industry-Specific Optimization",
      description: "Deep dives into optimization strategies for different industries",
      sessions: 6,
      totalDuration: "4.5 hours",
      nextSession: "February 15, 2025",
      enrolled: 892
    }
  ];

  const [registrationData, setRegistrationData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: ''
  });

  const handleRegistration = (webinarId: number) => {
    // Handle webinar registration
    console.log('Registering for webinar:', webinarId, registrationData);
  };

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
              LLM Optimization Webinars
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join industry experts for live training sessions on LLM optimization strategies, tools, and best practices. Level up your AI visibility game.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-4"
              >
                <CalendarDaysIcon className="w-5 h-5 mr-2" />
                Register for Next Webinar
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-4"
              >
                <PlayIcon className="w-5 h-5 mr-2" />
                Watch On-Demand
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Upcoming Webinar */}
      {upcomingWebinars.find(w => w.featured) && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Webinar</h2>
              <p className="text-lg text-gray-600">Don't miss our most anticipated session of the month</p>
            </motion.div>

            {(() => {
              const featured = upcomingWebinars.find(w => w.featured)!;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  
                  transition={{ duration: 0.8 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-5xl mx-auto"
                >
                  <div className="grid lg:grid-cols-3 gap-0">
                    <div className="lg:col-span-2 p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          Featured
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Live
                        </span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{featured.title}</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">{featured.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center text-gray-600">
                          <CalendarDaysIcon className="w-5 h-5 mr-2 text-blue-500" />
                          <span>{featured.date}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <ClockIcon className="w-5 h-5 mr-2 text-blue-500" />
                          <span>{featured.time} ({featured.duration})</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <UserGroupIcon className="w-5 h-5 mr-2 text-blue-500" />
                          <span>{featured.attendees} registered</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <GlobeAltIcon className="w-5 h-5 mr-2 text-blue-500" />
                          <span>Online Event</span>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">What you'll learn:</h4>
                        <ul className="space-y-2">
                          {featured.topics.map((topic, index) => (
                            <li key={index} className="flex items-center text-gray-600">
                              <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-blue-600 font-bold">SC</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{featured.presenter}</div>
                          <div className="text-gray-600">{featured.presenterTitle}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-8 flex flex-col justify-center">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <VideoCameraIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Reserve Your Spot</h4>
                        <p className="text-gray-600 text-sm">Free registration • Limited seats</p>
                      </div>

                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="First Name"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Last Name"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="email"
                          placeholder="Work Email"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button 
                          className="w-full bg-black text-white hover:bg-gray-800 rounded-lg py-3"
                          onClick={() => handleRegistration(featured.id)}
                        >
                          Register Now
                          <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        </section>
      )}

      {/* Category Navigation */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center">
            <div className="flex bg-gray-100 rounded-full p-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-full transition-colors duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:text-black'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Webinar Content */}
      <section className="pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          {selectedCategory === 'upcoming' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {upcomingWebinars.filter(w => !w.featured).map((webinar, index) => (
                <motion.div
                  key={webinar.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Upcoming
                    </span>
                    <span className="text-gray-500 text-sm">{webinar.attendees} registered</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{webinar.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{webinar.description}</p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                    <div className="flex items-center text-gray-600">
                      <CalendarDaysIcon className="w-4 h-4 mr-2" />
                      <span>{webinar.date}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      <span>{webinar.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center mb-6 p-3 bg-white rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold text-sm">
                        {webinar.presenter.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{webinar.presenter}</div>
                      <div className="text-gray-600 text-xs">{webinar.presenterTitle}</div>
                    </div>
                  </div>

                  <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-lg">
                    Register Now
                  </Button>
                </motion.div>
              ))}
            </div>
          )}

          {selectedCategory === 'on-demand' && (
            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
              {onDemandWebinars.map((webinar, index) => (
                <motion.div
                  key={webinar.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  <div className="aspect-video bg-gray-900 flex items-center justify-center">
                    <PlayIcon className="w-12 h-12 text-white" />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        On-Demand
                      </span>
                      <span className="text-gray-500 text-sm">{webinar.views} views</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{webinar.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{webinar.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-500 text-sm">{webinar.duration}</span>
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-gray-600 text-sm">{webinar.rating}</span>
                      </div>
                    </div>

                    <Button size="sm" className="w-full bg-black text-white hover:bg-gray-800 rounded-lg">
                      <PlayIcon className="w-4 h-4 mr-2" />
                      Watch Now
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {selectedCategory === 'series' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {webinarSeries.map((series, index) => (
                <motion.div
                  key={series.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      Series
                    </span>
                    <span className="text-gray-500 text-sm">{series.enrolled} enrolled</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{series.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{series.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{series.sessions}</div>
                      <div className="text-gray-600 text-sm">Sessions</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{series.totalDuration}</div>
                      <div className="text-gray-600 text-sm">Total Duration</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-sm text-gray-600 mb-1">Next session:</div>
                    <div className="font-semibold text-gray-900">{series.nextSession}</div>
                  </div>

                  <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-lg">
                    Enroll in Series
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Never miss a webinar
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Subscribe to get notified about upcoming webinars and exclusive content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-6 py-4 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-md"
              />
              <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-4">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 