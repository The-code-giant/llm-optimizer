'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import JobApplicationForm from "@/components/JobApplicationForm";
import { motion } from 'framer-motion';
import Link from "next/link";
import { 
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  HeartIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function Careers() {
  const openPositions = [
    {
      title: "Senior AI Engineer",
      department: "Engineering",
      location: "New West Minster, BC / Remote",
      type: "Full-time",
      salary: "$150k - $220k",
      description: "Build the next generation of LLM optimization algorithms and help shape the future of AI-driven content discovery."
    },
    // {
    //   title: "Product Manager - AI",
    //   department: "Product",
    //   location: "New West Minster, BC",
    //   type: "Full-time", 
    //   salary: "$130k - $180k",
    //   description: "Lead product strategy for our LLM optimization platform and drive features that help businesses succeed in the AI era."
    // },
    {
      title: "Frontend Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      salary: "$120k - $170k",
      description: "Create beautiful, intuitive interfaces that make LLM optimization accessible to users of all technical backgrounds."
    },
    {
      title: "Data Scientist",
      department: "Data",
      location: "New West Minster, BC / Remote",
      type: "Full-time",
      salary: "$140k - $190k",
      description: "Analyze LLM citation patterns and develop insights that drive our optimization recommendations."
    },
    // {
    //   title: "Marketing Manager",
    //   department: "Marketing",
    //   location: "Remote",
    //   type: "Full-time",
    //   salary: "$90k - $130k",
    //   description: "Lead our content marketing efforts and help educate the market about LLM optimization best practices."
    // },
    // {
    //   title: "Customer Success Manager",
    //   department: "Customer Success",
    //   location: "New West Minster, BC / Remote",
    //   type: "Full-time",
    //   salary: "$80k - $120k",
    //   description: "Help our customers achieve their LLM optimization goals and drive product adoption."
    // }
  ];

  const benefits = [
    {
      icon: CurrencyDollarIcon,
      title: "Competitive Compensation",
      description: "Competitive salary, equity, and performance bonuses"
    },
    {
      icon: HeartIcon,
      title: "Health & Wellness",
      description: "Comprehensive health, dental, and vision insurance"
    },
    {
      icon: AcademicCapIcon,
      title: "Learning & Development",
      description: "$2,000 annual learning budget and conference attendance"
    },
    {
      icon: ClockIcon,
      title: "Flexible Schedule",
      description: "Flexible hours and unlimited PTO policy"
    },
    {
      icon: UserGroupIcon,
      title: "Team Events",
      description: "Regular team building and company-wide events"
    },
    {
      icon: MapPinIcon,
      title: "Remote Friendly",
      description: "Work from anywhere with home office stipend"
    }
  ];

  const values = [
    {
      title: "Innovation First",
      description: "We're building the future of AI optimization and push boundaries daily."
    },
    {
      title: "Customer Obsessed",
      description: "Our customers' success drives every decision we make."
    },
    {
      title: "Move Fast",
      description: "In the rapidly evolving AI landscape, speed is everything."
    },
    {
      title: "Think Big",
      description: "We're solving problems that will shape how businesses interact with AI."
    }
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
            Our mission is to protect brands from digital extinction. 

            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            We are an early-stage team helping businesses harness the power of large language models with confidence — by making AI discovery and automation workflows transparent, measurable, and scalable 
            </p>
            <Link href="#positions">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
              >
                View Open Positions
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Our values guide everything we do.
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We&apos;re building a company culture that attracts the best talent and creates 
              an environment where everyone can do their best work.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {/* <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Benefits & Perks
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We believe in taking care of our team with comprehensive benefits and perks.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-6"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Open Positions Section */}
      <section id="positions" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Open Positions
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join our growing team and help build the future of LLM optimization.
            </p>
          </motion.div>

          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1 mb-6 lg:mb-0">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">{position.title}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {position.department}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-4">
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        <span>{position.location}</span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        <span>{position.type}</span>
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                        <span>{position.salary}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 leading-relaxed">{position.description}</p>
                  </div>
                  
                  <div className="lg:ml-8">
                    <Button 
                      size="lg" 
                      className="w-full lg:w-auto bg-black text-white hover:bg-gray-800 rounded-lg px-8 py-3"
                      onClick={() => {
                        document.getElementById('resume-section')?.scrollIntoView({ 
                          behavior: 'smooth',
                          block: 'start'
                        });
                      }}
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-12"
          >
            <p className="text-gray-600 mb-4">
              Don&apos;t see a position that fits? We&apos;re always looking for exceptional talent.
            </p>
            <Link href="/contact">
              <Button 
                variant="outline"
                size="lg" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-8 py-3"
              >
                Send us your resume
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 leading-tight">
              Ready to join our mission?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Help us build the tools that will define how businesses succeed in the AI era.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#positions">
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
                >
                  View Positions
                </Button>
              </Link>
              <Link href="/contact">
                <Button 
                  size="lg" 
                  variant="solid"
                  className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3"
                >
                  Get in touch
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section> */}

      {/* Resume Submission Section */}
      <section id="resume-section" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-8 text-gray-900">
              Ready to join our team?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Send us your resume and tell us why you&apos;d be a great fit for our mission to revolutionize AI-powered content discovery.
            </p>
          </motion.div>

          <JobApplicationForm positions={openPositions} />
        </div>
      </section>

      <Footer />
    </div>
  );
} 