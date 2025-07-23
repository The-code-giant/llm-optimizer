'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { motion } from 'framer-motion';
import Link from "next/link";
import { ArrowRight, Bot, Code, Search, Target, CheckCircle, Users, TrendingUp } from "lucide-react";

export default function MississaugaLLMServices() {
  const stats = [
    { icon: <Users className="w-8 h-8 text-blue-600" />, number: "350+", label: "Mississauga Businesses Optimized" },
    { icon: <TrendingUp className="w-8 h-8 text-green-600" />, number: "94%", label: "Average LLM Citation Increase" },
    { icon: <Bot className="w-8 h-8 text-purple-600" />, number: "24/7", label: "LLM Monitoring & Analysis" }
  ];

  const services = [
    {
      icon: <Bot className="w-8 h-8 text-blue-600" />,
      title: "LLM Citation Optimization",
      description: "Optimize your Mississauga business content for ChatGPT, Claude, and Gemini citations. Perfect for corporate headquarters, logistics, and aviation companies.",
      features: ["Corporate headquarters optimization", "Logistics content analysis", "Aviation industry citations", "Enterprise AI-readiness scoring"]
    },
    {
      icon: <Code className="w-8 h-8 text-green-600" />,
      title: "Dynamic Content Injection",
      description: "Add AI-generated FAQs, corporate definitions, and logistics content to your Mississauga business pages without coding.",
      features: ["No-code content updates", "Mississauga-specific FAQs", "Corporate service definitions", "Logistics terminology"]
    },
    {
      icon: <Search className="w-8 h-8 text-purple-600" />,
      title: "LLM Readiness Analysis",
      description: "Comprehensive analysis optimized for Mississauga's corporate and logistics sectors. See how well your enterprise content performs with LLMs.",
      features: ["Corporate sector scoring", "Mississauga market analysis", "Logistics optimization", "Aviation content tracking"]
    },
    {
      icon: <Target className="w-8 h-8 text-orange-600" />,
      title: "Tracker Script & Monitoring",
      description: "Enterprise-grade tracking designed for Mississauga's corporate environment. Monitor LLM performance across all business divisions.",
      features: ["Secure corporate installation", "Real-time LLM monitoring", "Enterprise content metrics", "Multi-division performance tracking"]
    }
  ];

  const industries = [
    "Corporate Headquarters",
    "Logistics & Distribution", 
    "Aviation & Aerospace",
    "Financial Services",
    "Technology Companies",
    "Manufacturing",
    "Professional Services",
    "International Trade"
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
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-6xl font-normal mb-8 leading-tight">
                              Mississauga Clever Search Services
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Specialized LLM optimization for Mississauga's corporate and logistics sectors. Increase your ChatGPT, Claude, and Gemini citations 
              with content optimization designed for Canada's corporate hub. Trusted by 350+ Mississauga organizations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 rounded-full px-8 py-3">
                  Start Free Mississauga LLM Analysis <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-3">
                  Contact Mississauga LLM Team
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 mt-16"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              >
                <Card className="p-8 text-center bg-gray-900 border-gray-800 text-white">
                  <div className="flex justify-center mb-4">{stat.icon}</div>
                  <div className="text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-gray-300">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-normal mb-6 text-gray-900 leading-tight">
              LLM Optimization Services for Mississauga Businesses
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive LLM optimization solutions tailored for Mississauga's corporate and logistics sectors.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-8 hover:shadow-xl transition-all duration-300 h-full">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">{service.icon}</div>
                    <div>
                      <h3 className="text-xl font-semibold mb-4">{service.title}</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                      <ul className="space-y-3">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-gray-500 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 