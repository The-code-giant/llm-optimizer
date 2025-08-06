"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface TourStep {
  id: string;
  selector: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface Tour {
  id: string;
  name: string;
  steps: TourStep[];
  autoStart?: boolean;
}

interface TourContextType {
  tours: Tour[];
  activeTour: Tour | null;
  currentStep: number;
  isTourActive: boolean;
  startTour: (tourId: string) => void;
  stopTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  hasSeenTour: (tourId: string) => boolean;
  resetTour: (tourId: string) => void;
  resetAllTours: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: React.ReactNode;
  tours: Tour[];
}

export function TourProvider({ children, tours }: TourProviderProps) {
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTourActive, setIsTourActive] = useState(false);

  // Load tour completion status from localStorage
  useEffect(() => {
    // Wait for DOM to be ready
    const timeoutId = setTimeout(() => {
      const completedTours = localStorage.getItem('completed-tours');
      if (completedTours) {
        const parsed = JSON.parse(completedTours);
        
        // Check for auto-start tours
        const autoStartTour = tours.find(tour => tour.autoStart && !parsed[tour.id]);
        if (autoStartTour) {
          startTour(autoStartTour.id);
        }
      } else {
        // First time user - start the first auto-start tour
        const autoStartTour = tours.find(tour => tour.autoStart);
        if (autoStartTour) {
          startTour(autoStartTour.id);
        }
      }
    }, 500); // Wait 500ms for DOM to be ready

    return () => clearTimeout(timeoutId);
  }, [tours]);

  const startTour = (tourId: string) => {
    const tour = tours.find(t => t.id === tourId);
    if (tour) {
      setActiveTour(tour);
      setCurrentStep(0);
      setIsTourActive(true);
    }
  };

  const stopTour = () => {
    setActiveTour(null);
    setCurrentStep(0);
    setIsTourActive(false);
  };

  const nextStep = () => {
    if (activeTour && currentStep < activeTour.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    if (activeTour) {
      // Save to localStorage that user skipped this tour
      const completedTours = JSON.parse(localStorage.getItem('completed-tours') || '{}');
      completedTours[activeTour.id] = { skipped: true, completedAt: new Date().toISOString() };
      localStorage.setItem('completed-tours', JSON.stringify(completedTours));
    }
    stopTour();
  };

  const completeTour = () => {
    if (activeTour) {
      // Save to localStorage that user completed this tour
      const completedTours = JSON.parse(localStorage.getItem('completed-tours') || '{}');
      completedTours[activeTour.id] = { completed: true, completedAt: new Date().toISOString() };
      localStorage.setItem('completed-tours', JSON.stringify(completedTours));
    }
    stopTour();
  };

  const hasSeenTour = (tourId: string): boolean => {
    const completedTours = JSON.parse(localStorage.getItem('completed-tours') || '{}');
    return !!completedTours[tourId];
  };

  const resetTour = (tourId: string) => {
    const completedTours = JSON.parse(localStorage.getItem('completed-tours') || '{}');
    delete completedTours[tourId];
    localStorage.setItem('completed-tours', JSON.stringify(completedTours));
  };

  const resetAllTours = () => {
    localStorage.removeItem('completed-tours');
  };

  const value: TourContextType = {
    tours,
    activeTour,
    currentStep,
    isTourActive,
    startTour,
    stopTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    hasSeenTour,
    resetTour,
    resetAllTours,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
} 