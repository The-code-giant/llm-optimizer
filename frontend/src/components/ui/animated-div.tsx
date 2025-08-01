'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import React from 'react';

interface AnimatedDivProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedDiv({ children, className, ...props }: AnimatedDivProps) {
  return (
    <motion.div className={className} {...props}>
      {children}
    </motion.div>
  );
} 