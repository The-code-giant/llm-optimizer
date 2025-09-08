'use client';

import { motion } from 'framer-motion';
import Link from "next/link";
import { 
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { Button } from './button';
import { LinkedinIcon } from 'lucide-react';
export function Footer() {
  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "How it Works", href: "#how-it-works" },
        { name: "Pricing", href: "/pricing" },
        // { name: "API Documentation", href: "/docs" },
        // { name: "Integrations", href: "/integrations" },
        // { name: "Changelog", href: "/changelog" }
      ]
    },
    // {
    //   title: "Solutions",
    //   links: [
    //     { name: "For Agencies", href: "/solutions/agencies" },
    //     { name: "For Enterprise", href: "/solutions/enterprise" },
    //     { name: "For E-commerce", href: "/solutions/ecommerce" },
    //     { name: "For Publishers", href: "/solutions/publishers" },
    //     { name: "For SaaS", href: "/solutions/saas" },
    //     { name: "Case Studies", href: "/case-studies" }
    //   ]
    // },
    {
      title: "Resources",
      links: [
        { name: "Blog", href: "/blog" },
        // { name: "Documentation", href: "/docs" },
        // { name: "Help Center", href: "/help" },
        // { name: "LLM Optimization Guide", href: "/guide" },
        // { name: "Templates", href: "/templates" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Careers", href: "/careers" },
        // { name: "Press", href: "/press" },
        // { name: "Partners", href: "/partners" },
        { name: "Contact", href: "/contact" },
        // { name: "Brand Kit", href: "/brand" }
      ]
    }
  ];

  const socialLinks = [
    // { name: "Twitter", href: "https://twitter.com", icon: "𝕏" },
    { name: "LinkedIn", href: "https://www.linkedin.com/company/clever-search-ai/", icon: <LinkedinIcon /> },
    // { name: "GitHub", href: "https://github.com", icon: "🐙" },
    // { name: "YouTube", href: "https://youtube.com", icon: "📺" }
  ];

  return (
    <footer className="bg-white text-gray-900 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Link href="/" className="flex items-center space-x-2 mb-6">
                  <Image src="/logo/clever-search-logo-black.png" alt="Clever Search" width={130} height={43.67} />
                  {/* <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold">Clever Search</span> */}
                </Link>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Increase your website&apos;s visibility in ChatGPT, Claude, and Gemini responses. 
                  Optimize your content for LLM citation and discovery.
                </p>
                
                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <EnvelopeIcon className="w-5 h-5 mr-3 text-blue-600" />
                    <a href="mailto:hi@cleversearch.ai"><span>hi@cleversearch.ai</span></a>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <PhoneIcon className="w-5 h-5 mr-3 text-blue-600" />
                    <a href="tel:+16047050740"><span>+1 (604) 705-0740</span></a>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="w-5 h-5 mr-3 text-blue-600" />
                    <span>New Westminster, BC </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Footer Links */}
            {footerSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-900">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="py-8 border-t border-gray-200"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900">Stay ahead of LLM optimization trends</h3>
              <p className="text-gray-600">
                Get weekly insights on LLM citation strategies, content optimization, and platform updates.
              </p>
            </div>
            {/* <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button className="rounded-(--radius) px-6 py-5.5" >
                Subscribe
              </Button>
       
            </div> */}
          </div>
        </motion.div>

        {/* Bottom Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="py-8 border-t border-gray-200"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-gray-500">
              <p>&copy; 2024 Cleversearch. All rights reserved.</p>
            </div>

            {/* Legal Links */}
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-500 hover:text-gray-900 transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-gray-900 transition-colors duration-200">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-500 hover:text-gray-900 transition-colors duration-200">
                Cookie Policy
              </Link>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
                  aria-label={social.name}
                >
                  <span className="text-lg">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="py-8 border-t border-gray-200"
        >
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🔒</span>
              </div>
              <span>GDPR Ready</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">⚡</span>
              </div>
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🛡️</span>
              </div>
              <span>Enterprise Security</span>
            </div>
          </div>
        </motion.div> */}
      </div>
    </footer>
  );
} 