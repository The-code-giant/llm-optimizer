"use client";

import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  SparklesIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { usePathname, useRouter } from 'next/navigation'
import Image from "next/image";

export function NavbarComponent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Features', link: '#features' },
    { name: 'How it Works', link: '#how-it-works' },
    { name: 'Resources', link: '#resources' },
  ];

  const handleNavClick = useCallback((link: string) => {
    const anchor = link.substring(1); // Remove the # from the link
    if (pathname === '/') {
      const el = document.getElementById(anchor)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      } else {
        console.warn(`Element with ID '${anchor}' not found. Falling back to updating hash.`);
        router.push('/#' + anchor);
      }
    } else {
      router.push('/#' + anchor)
    }
    setIsMobileMenuOpen(false)
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
    <div className="relative w-full ">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <CustomNavbarLogo />
          <NavItems 
            items={navItems} 
            onItemClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="flex items-start gap-4">
            {isSignedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  {/* <UserCircleIcon className="w-5 h-5" /> */}
                  <span className="font-medium text-sm">
                    {user?.emailAddresses[0]?.emailAddress}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
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
                  <NavbarButton variant="secondary">Sign In</NavbarButton>
                </Link>
                <Link href="/register">
                  <NavbarButton variant="primary">Get Started</NavbarButton>
                </Link>
              </>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <CustomNavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <button
                key={`mobile-link-${idx}`}
                onClick={() => handleNavClick(item.link)}
                className="relative text-neutral-600 dark:text-neutral-300 text-left w-full py-2"
              >
                <span className="block">{item.name}</span>
              </button>
            ))}
            <div className="flex w-full flex-col gap-4 justify-start items-start">
              {isSignedIn ? (
                <>
                  <div className="flex items-start space-x-2 py-2">
                    <UserCircleIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700 font-medium text-sm">
                      {user?.emailAddresses[0]?.emailAddress}
                    </span>
                  </div>
                  <Link href="/dashboard">
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="secondary"
                      className="w-full"
                    >
                      Dashboard
                    </NavbarButton>
                  </Link>
                  <div>
                  <NavbarButton
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    variant="secondary"
                    className="w-full"
                  >
                    Sign Out
                  </NavbarButton>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="secondary"
                      className="w-full"
                    >
                      Sign In
                    </NavbarButton>
                  </Link>
                  <Link href="/register">
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="primary"
                      className="w-full"
                    >
                      Get Started
                    </NavbarButton>
                  </Link>
                </>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}

// Custom NavbarLogo component to match your design
const CustomNavbarLogo = () => {
  return (
    <Link href="/" className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1">
      <Image
        src="/logo/clever-search-logo-black.png"
        alt="CleverSearch"
        width={100}
        height={50}
        className="w-auto h-auto"
      />
      {/* <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
        <SparklesIcon className="w-5 h-5 text-white" />
      </div>
      <span className="text-xl font-bold text-gray-900 dark:text-white">
        Clever Search
      </span> */}
    </Link>
  );
};

// Export the main component
export { NavbarComponent as Navbar };
