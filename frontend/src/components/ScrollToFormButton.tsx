'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ScrollToFormButtonProps extends React.ComponentProps<typeof Button> {
  targetSelector?: string;
  offset?: number; // offset for fixed navbar height
}

export default function ScrollToFormButton({
  targetSelector = 'demo-form',
  offset = 100,
  onClick,
  ...props
}: ScrollToFormButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (onClick) onClick(e);
    try {
      const target = document.getElementById(targetSelector);
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    } catch {}
  };

  return (
    <Button {...props} onClick={handleClick} />
  );
}


