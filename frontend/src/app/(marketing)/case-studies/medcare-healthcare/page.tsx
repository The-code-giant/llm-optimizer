'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";

export default function MedCareCaseStudy() {
  const metrics = [
    { value: "400%", label: "Patient Discovery", subtext: "Patients finding services through AI" },
    { value: "30 days", label: "Results Timeline", subtext: "Quick implementation and results" },
    { value: "88%", label: "Citation Rate", subtext: "Accuracy in AI recommendations" },
    { value: "150%", label: "Appointment Bookings", subtext: "Increase in new patient appointments" }
  ];

  const challenges = [
    {
      title: "Complex Medical Information",
      description: "Medical services and procedures were described in technical jargon that AI assistants couldn&apos;t easily interpret for patients.",
      icon: "🔬",
      impact: "Patients couldn&apos;t find relevant services"
    },
    {
      title: "Local Competition",
      description: "Competing with larger hospital systems that dominated traditional search results for medical queries.",
      icon: "🏥",
      impact: "Low visibility in health searches"
    },
    {
      title: "Trust and Credibility",
      description: "Patients needed to see credentials and expertise clearly communicated to trust AI recommendations.",
      icon: "🛡️",
      impact: "Poor conversion from referrals"
    }
  ];

  const solutions = [
    {
      phase: "Phase 1: Medical Content Translation",
      duration: "Week 1-2",
      description: "Converted complex medical terminology into patient-friendly language while maintaining accuracy.",
      actions: [
        "Rewrote service descriptions in plain language",
        "Added &ldquo;What to expect&rdquo; sections for procedures",
        "Created condition-based content addressing patient concerns"
      ],
      result: "200% increase in AI understanding of services"
    },
    {
      phase: "Phase 2: Local Healthcare Optimization",
      duration: "Week 3-4",
      description: "Optimized content specifically for local healthcare searches and patient journey mapping.",
      actions: [
        "Implemented location-specific health content",
        "Added insurance and accessibility information",
        "Created symptom-to-service connection content"
      ],
      result: "350% increase in local patient referrals"
    },
    {
      phase: "Phase 3: Trust Signal Integration",
      duration: "Week 5+",
      description: "Enhanced credibility markers and patient testimonials for AI comprehension.",
      actions: [
        "Integrated physician credentials and specializations",
        "Added patient success stories and outcomes",
        "Implemented quality metrics and certifications"
      ],
      result: "85% improvement in patient conversion rates"
    }
  ];

  const testimonials = [
    {
      quote: "We&apos;re now the first recommendation when patients ask AI assistants about specialized cardiac care in our area. It&apos;s completely transformed our patient acquisition.",
      name: "Dr. Patricia Williams",
      title: "Chief Medical Officer",
      avatar: "👩‍⚕️"
    },
    {
      quote: "The quality of patients we&apos;re getting through AI referrals is exceptional. They come in already understanding our services and ready to schedule procedures.",
      name: "Michael Rodriguez",
      title: "Director of Patient Services",
      avatar: "👨‍💼"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-blue-700 text-white pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/case-studies" className="inline-flex items-center text-green-200 hover:text-white mb-8 transition-colors">
              ← Back to Case Studies
            </Link>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl">🏥</span>
                  <div>
                    <div className="text-green-200 text-lg font-medium">Healthcare</div>
                    <div className="text-2xl font-bold">MedCare Plus</div>
                  </div>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  How MedCare Plus Improved Patient Discovery by 400%
                </h1>
                
                <p className="text-xl text-green-100 mb-8 leading-relaxed">
                  Discover how this specialized healthcare provider leveraged AI optimization 
                  to help patients find the right medical services through AI assistants.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                    Healthcare Strategy Guide
                  </Button> */}
                  <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white text-black hover:bg-white hover:text-green-600">
                    Schedule Consultation
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

      {/* About MedCare */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">About MedCare Plus</h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  MedCare Plus is a multi-specialty healthcare provider serving the greater Atlanta area 
                  with over 45 physicians across cardiology, orthopedics, neurology, and primary care. 
                  Founded in 2015, they focus on providing personalized, comprehensive medical care.
                </p>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  As patients increasingly turned to AI assistants for health information and provider 
                  recommendations, MedCare Plus faced a critical challenge: their specialized services 
                  weren&apos;t being recommended, despite their excellent reputation and outcomes.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  The problem was clear: their medical content was too technical for AI assistants to 
                  understand and translate into helpful recommendations for patients seeking care.
                </p>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              
              transition={{ duration: 0.8 }}
              className="bg-white rounded-xl p-8 shadow-sm"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">Healthcare Stats</h3>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <div className="text-2xl font-bold text-green-600">45+</div>
                  <div className="text-gray-600">Physicians</div>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <div className="text-2xl font-bold text-green-600">8</div>
                  <div className="text-gray-600">Specialties</div>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <div className="text-2xl font-bold text-green-600">25K+</div>
                  <div className="text-gray-600">Annual Patients</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">9 years</div>
                  <div className="text-gray-600">Serving Community</div>
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
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Healthcare AI Challenges</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Healthcare providers face unique challenges in AI optimization, from complex medical 
              terminology to establishing trust and credibility with patients.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {challenges.map((challenge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-gray-50 rounded-xl p-8 text-center"
              >
                <div className="text-5xl mb-6">{challenge.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{challenge.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{challenge.description}</p>
                <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                  <div className="text-red-700 font-medium text-sm">{challenge.impact}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Process */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">The Implementation Process</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              MedCare Plus&apos;s transformation happened through a structured, patient-focused 
              approach to content optimization.
            </p>
          </motion.div>

          <div className="space-y-12">
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white rounded-xl p-8 shadow-sm"
              >
                <div className="grid lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1">
                    <div className="text-center lg:text-left">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{solution.phase}</h3>
                      <div className="text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1 inline-block">
                        {solution.duration}
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <p className="text-gray-600 text-lg mb-6 leading-relaxed">{solution.description}</p>
                    <ul className="space-y-2">
                      {solution.actions.map((action, actionIndex) => (
                        <li key={actionIndex} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700" dangerouslySetInnerHTML={{__html: action}}></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="lg:col-span-1">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                      <div className="text-lg font-bold text-green-800 mb-2">Result</div>
                      <div className="text-green-700 font-medium">{solution.result}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Remarkable Results</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Within 30 days, MedCare Plus saw transformational improvements across all key metrics.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              
              transition={{ duration: 0.6 }}
              className="text-center bg-gradient-to-br from-green-500 to-blue-600 text-white rounded-xl p-8"
            >
              <div className="text-4xl font-bold mb-2">400%</div>
              <div className="text-green-100">Patient Discovery</div>
              <div className="text-sm text-green-200 mt-2">More patients finding services via AI</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center bg-white border border-gray-200 rounded-xl p-8"
            >
              <div className="text-4xl font-bold text-gray-900 mb-2">150%</div>
              <div className="text-gray-600">New Appointments</div>
              <div className="text-sm text-gray-500 mt-2">Increase in appointment bookings</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center bg-white border border-gray-200 rounded-xl p-8"
            >
              <div className="text-4xl font-bold text-gray-900 mb-2">88%</div>
              <div className="text-gray-600">Citation Accuracy</div>
              <div className="text-sm text-gray-500 mt-2">Accurate AI recommendations</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center bg-white border border-gray-200 rounded-xl p-8"
            >
              <div className="text-4xl font-bold text-gray-900 mb-2">65%</div>
              <div className="text-gray-600">Show Rate</div>
              <div className="text-sm text-gray-500 mt-2">Higher appointment attendance</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-green-600 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6">What the Team Says</h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Hear from MedCare Plus leadership about the transformation.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8"
              >
                <blockquote className="text-lg mb-6 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-xl">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-green-200 text-sm">{testimonial.title}</div>
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
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-8">
              Transform Your Healthcare Practice
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join MedCare Plus and other healthcare providers seeing remarkable patient growth 
              through AI optimization. Help more patients find the care they need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-8 py-3">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-gray-900 hover:bg-white hover:text-black px-8 py-3">
                  Healthcare Consultation
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