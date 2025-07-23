'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";

export default function TastyBitesCaseStudy() {
  const metrics = [
    { value: "350%", label: "Local Visibility", subtext: "Increase in AI-powered recommendations" },
    { value: "14 days", label: "Quick Results", subtext: "Fastest implementation in portfolio" },
    { value: "86%", label: "AI Citations", subtext: "Accuracy in local restaurant searches" },
    { value: "180%", label: "Reservations", subtext: "Growth in new customer bookings" }
  ];

  const challenges = [
    {
      icon: "🔍",
      title: "Local Search Invisibility", 
      description: "Despite excellent reviews, Tasty Bites wasn&apos;t appearing when customers asked AI assistants for restaurant recommendations in their area.",
      impact: "Lost potential customers to competitors"
    },
    {
      icon: "🍽️",
      title: "Menu Complexity",
      description: "Their diverse international menu with specialty dishes was difficult for AI to categorize and recommend for specific cuisines or dietary needs.",
      impact: "Missed opportunities for targeted recommendations"
    },
    {
      icon: "⭐",
      title: "Review Integration",
      description: "Positive customer reviews and ratings weren&apos;t being recognized by AI assistants when making dining recommendations.",
      impact: "Lower trust and credibility in AI responses"
    }
  ];

  const solutions = [
    {
      title: "Local AI Optimization",
      description: "Optimized location-specific content to help AI assistants understand the restaurant&apos;s place in the local dining scene.",
      tactics: [
        "Location-based keyword optimization",
        "Neighborhood and landmark references",
        "Local event and community connections",
        "Delivery and service area mapping"
      ],
      result: "400% increase in &ldquo;restaurants near me&rdquo; AI citations"
    },
    {
      title: "Menu & Cuisine Intelligence",
      description: "Restructured menu descriptions and categorization to help AI understand cuisine types, dietary options, and specialty dishes.",
      tactics: [
        "AI-friendly dish descriptions",
        "Cuisine type and fusion explanations", 
        "Dietary restriction and allergen information",
        "Signature dish and chef specialties"
      ],
      result: "275% increase in cuisine-specific recommendations"
    },
    {
      title: "Social Proof Integration",
      description: "Integrated customer reviews, ratings, and testimonials in formats that AI assistants could easily parse and include in recommendations.",
      tactics: [
        "Structured review data markup",
        "Customer story optimization",
        "Award and recognition highlighting",
        "Social media mention integration"
      ],
      result: "320% improvement in trust-based recommendations"
    }
  ];

  const timeline = [
    {
      day: "Day 1-3",
      title: "Local Market Analysis",
      tasks: [
        "Analyzed local competition and AI visibility",
        "Identified key search patterns and opportunities",
        "Mapped customer journey and touchpoints"
      ]
    },
    {
      day: "Day 4-7", 
      title: "Content Optimization",
      tasks: [
        "Rewrote menu descriptions for AI comprehension",
        "Optimized location and atmosphere content",
        "Structured dietary and cuisine information"
      ]
    },
    {
      day: "Day 8-11",
      title: "Review Integration",
      tasks: [
        "Integrated customer testimonials and reviews",
        "Added award and recognition content",
        "Implemented social proof markup"
      ]
    },
    {
      day: "Day 12-14",
      title: "Launch & Monitor",
      tasks: [
        "Deployed optimized content across platforms",
        "Monitored AI citation improvements",
        "Tracked reservation and inquiry increases"
      ]
    }
  ];

  const beforeAfter = [
    {
      category: "AI Recommendations",
      before: "2-3 mentions/month",
      after: "15+ mentions/week",
      growth: "1400%"
    },
    {
      category: "New Reservations", 
      before: "45 bookings/week",
      after: "126 bookings/week",
      growth: "180%"
    },
    {
      category: "Local Visibility Score",
      before: "23%",
      after: "86%", 
      growth: "274%"
    },
    {
      category: "Customer Acquisition Cost",
      before: "$28 per customer",
      after: "$12 per customer",
      growth: "-57%"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 to-orange-700 text-white pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/case-studies" className="inline-flex items-center text-red-200 hover:text-white mb-8 transition-colors">
              ← Back to Case Studies
            </Link>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl">🍽️</span>
                  <div>
                    <div className="text-red-200 text-lg font-medium">Food & Beverage</div>
                    <div className="text-2xl font-bold">Tasty Bites</div>
                  </div>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  How Tasty Bites Boosted Local Visibility by 350% in Just 14 Days
                </h1>
                
                <p className="text-xl text-red-100 mb-8 leading-relaxed">
                  Discover how this family-owned restaurant chain became the top AI recommendation 
                  for dining in their area and nearly doubled their customer reservations.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100">
                    Restaurant Success Guide
                  </Button> */}
                  <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white text-black hover:bg-white hover:text-red-600">
                    Schedule Demo
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

      {/* Restaurant Story */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">The Tasty Bites Story</h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Tasty Bites started as a single family-owned restaurant in downtown Portland in 2018. 
                  Known for their fusion of Asian and Pacific Northwest cuisine, they quickly gained a loyal 
                  following and expanded to three locations across the metro area.
                </p>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  With excellent Yelp reviews (4.8 stars) and strong word-of-mouth, they were thriving 
                  through traditional marketing. However, they noticed a troubling trend: when potential 
                  customers asked AI assistants like ChatGPT or Google Assistant for restaurant recommendations, 
                  Tasty Bites was nowhere to be found.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  &ldquo;We realized that the future of restaurant discovery was changing,&rdquo; said owner Maria Chen. 
                  &ldquo;People were asking their phones for dinner suggestions, and we needed to be part of that conversation.&rdquo;
                </p>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-xl p-8 shadow-sm"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">Restaurant Stats</h3>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <div className="text-2xl font-bold text-red-600">3</div>
                  <div className="text-gray-600">Locations</div>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <div className="text-2xl font-bold text-red-600">4.8★</div>
                  <div className="text-gray-600">Average Rating</div>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <div className="text-2xl font-bold text-red-600">850+</div>
                  <div className="text-gray-600">Weekly Covers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">6 years</div>
                  <div className="text-gray-600">In Business</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Restaurant Industry Challenges</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Local restaurants face unique hurdles in AI discovery, from complex menu descriptions 
              to competing with chain restaurants for visibility.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {challenges.map((challenge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-gray-50 rounded-xl p-8 text-center"
              >
                <div className="text-5xl mb-6">{challenge.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{challenge.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{challenge.description}</p>
                <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                  <div className="text-red-700 font-medium text-sm">{challenge.impact}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">The Local AI Strategy</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tasty Bites&apos; success came from a hyper-local approach that helped AI assistants 
              understand their unique value in the local dining ecosystem.
            </p>
          </motion.div>

          <div className="space-y-12">
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white rounded-xl p-8 shadow-sm"
              >
                <div className="grid lg:grid-cols-3 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{solution.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{solution.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Implementation Tactics:</h4>
                    <ul className="space-y-2">
                      {solution.tactics.map((tactic, tacticIndex) => (
                        <li key={tacticIndex} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm">{tactic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-lg font-bold text-red-800 mb-2">Result</div>
                    <div className="text-red-700 font-medium" dangerouslySetInnerHTML={{__html: solution.result}}></div>
                  </div>
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
            <h2 className="text-4xl font-bold text-gray-900 mb-6">14-Day Sprint to Success</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how Tasty Bites achieved dramatic results in just two weeks with focused, 
              restaurant-specific AI optimization.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {timeline.map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-gray-50 rounded-xl p-6"
              >
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                    {index + 1}
                  </div>
                  <div className="text-red-600 font-semibold text-sm">{phase.day}</div>
                  <h3 className="text-lg font-bold text-gray-900">{phase.title}</h3>
                </div>
                <ul className="space-y-2">
                  {phase.tasks.map((task, taskIndex) => (
                    <li key={taskIndex} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm">{task}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Results */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Remarkable Results</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The transformation was immediate and dramatic across all key restaurant metrics.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beforeAfter.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 text-center shadow-sm"
              >
                <h3 className="font-bold text-gray-900 mb-4 text-sm">{metric.category}</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-xs text-red-600 font-medium">Before</div>
                    <div className="text-lg font-bold text-red-800">{metric.before}</div>
                  </div>
                  <div className="text-xl text-gray-400">↓</div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-600 font-medium">After</div>
                    <div className="text-lg font-bold text-green-800">{metric.after}</div>
                  </div>
                </div>
                
                <div className={`text-sm font-bold ${metric.growth.startsWith('-') ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.growth.startsWith('-') ? '' : '+'}{metric.growth}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Owner Quote */}
      <section className="py-20 bg-red-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <blockquote className="text-2xl lg:text-3xl font-light mb-8 leading-relaxed">
              &ldquo;It&apos;s been incredible to watch. Customers now come in saying their AI assistant 
              recommended us specifically for our fusion cuisine and date night atmosphere. 
              We&apos;ve had to hire additional staff to handle the increased demand.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl">👩‍🍳</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-xl">Maria Chen</div>
                <div className="text-red-200">Owner & Executive Chef, Tasty Bites</div>
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
              Transform Your Restaurant&apos;s Visibility
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join Tasty Bites and hundreds of restaurants now thriving with AI-powered discovery. 
              Help hungry customers find your amazing food.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-8 py-3">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-black hover:bg-white hover:text-black px-8 py-3">
                  Restaurant Strategy Call
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