'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  gradient?: string;
}

export function GradientText({ 
  children, 
  className = '', 
  gradient = 'from-blue-600 via-purple-600 to-blue-800' 
}: GradientTextProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent ${className}`}
    >
      {children}
    </motion.span>
  );
} 