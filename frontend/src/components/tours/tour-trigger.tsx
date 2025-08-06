"use client";

import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useTour } from './tour-provider';

interface TourTriggerProps {
  tourId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export function TourTrigger({ 
  tourId, 
  variant = 'outline', 
  size = 'sm', 
  className,
  children,
  showIcon = true 
}: TourTriggerProps) {
  const { startTour, hasSeenTour } = useTour();

  const handleClick = () => {
    startTour(tourId);
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
    >
      {showIcon && <Play className="w-4 h-4 mr-2" />}
      {children || 'Start Tour'}
    </Button>
  );
} 