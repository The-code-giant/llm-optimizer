"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Features', anchor: 'features' },
    { name: 'How it Works', anchor: 'how-it-works' },
    // { name: 'Pricing', anchor: 'pricing' },
    { name: 'Resources', anchor: 'resources' },
    // { name: 'Company', anchor: 'company' },
  ];

  const handleNavClick = useCallback((anchor: string) => {
    if (pathname === '/') {
      const el = document.getElementById(anchor)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      } else {
        // fallback: update hash, browser will jump
        window.location.hash = anchor
      }
    } else {
      router.push('/#' + anchor)
    }
    setIsMenuOpen(false)
  }, [pathname, router])

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
  };

  // Smooth scroll to anchor on homepage mount if hash is present
  useEffect(() => {
    if (pathname === '/' && typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash && hash.length > 1) {
        const anchor = hash.substring(1)
        const el = document.getElementById(anchor)
        if (el) {
          // Wait for page to fully render and animations to complete
          const maxTimeout = 5000; // Maximum wait time in milliseconds
          const interval = 100; // Polling interval in milliseconds
          let elapsedTime = 0;

          const checkElementVisibility = setInterval(() => {
            const rect = el.getBoundingClientRect();
            const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;

            if (isInViewport || elapsedTime >= maxTimeout) {
              clearInterval(checkElementVisibility);
              if (!isInViewport) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }

            elapsedTime += interval;
          }, interval);
        }
      }
    }
  }, [pathname])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Clever Search
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.anchor)}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium bg-transparent border-none outline-none cursor-pointer"
                type="button"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isSignedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span className="font-medium">
                    {user?.emailAddresses[0]?.emailAddress}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1"
                  >
                    <Link href="/dashboard">
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Dashboard
                      </button>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-gray-200 py-4"
          >
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.anchor)}
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium py-2 bg-transparent border-none outline-none text-left cursor-pointer"
                  type="button"
                >
                  {item.name}
                </button>
              ))}
              <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200">
                {isSignedIn ? (
                  <>
                    <div className="flex items-center space-x-2 py-2">
                      <UserCircleIcon className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700 font-medium">
                        {user?.emailAddresses[0]?.emailAddress}
                      </span>
                    </div>
                    <Link href="/dashboard">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-600 hover:text-gray-900"
                      >
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-600 hover:text-gray-900"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-600 hover:text-gray-900"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
