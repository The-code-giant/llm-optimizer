"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { useTour } from './tour-provider';
import { cn } from '@/lib/utils';

export function TourOverlay() {
  const { 
    activeTour, 
    currentStep, 
    isTourActive, 
    nextStep, 
    previousStep, 
    skipTour, 
    stopTour 
  } = useTour();
  
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTourActive || !activeTour) return;

    const currentStepData = activeTour.steps[currentStep];
    if (!currentStepData) return;

    // Wait a bit for the DOM to be ready
    const timeoutId = setTimeout(() => {
      const element = document.querySelector(currentStepData.selector) as HTMLElement;
      if (!element) {
        console.warn(`Tour element not found: ${currentStepData.selector}`);
        // Use fallback positioning if element not found
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        setTooltipPosition({
          top: viewportHeight / 2,
          left: viewportWidth / 2
        });
        return;
      }

      setHighlightedElement(element);
      
      // Scroll element into view if needed
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
      
      // Calculate tooltip position with better positioning logic
      const rect = element.getBoundingClientRect();
      const position = currentStepData.position || 'bottom';
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Tooltip dimensions (approximate)
      const tooltipWidth = 320;
      const tooltipHeight = 200;
      
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = Math.max(20, rect.top - tooltipHeight - 20);
          left = Math.max(tooltipWidth / 2, Math.min(viewportWidth - tooltipWidth / 2, rect.left + rect.width / 2));
          break;
        case 'bottom':
          top = Math.min(viewportHeight - tooltipHeight - 20, rect.bottom + 20);
          left = Math.max(tooltipWidth / 2, Math.min(viewportWidth - tooltipWidth / 2, rect.left + rect.width / 2));
          break;
        case 'left':
          top = Math.max(tooltipHeight / 2, Math.min(viewportHeight - tooltipHeight / 2, rect.top + rect.height / 2));
          left = Math.max(tooltipWidth / 2, rect.left - tooltipWidth - 20);
          break;
        case 'right':
          top = Math.max(tooltipHeight / 2, Math.min(viewportHeight - tooltipHeight / 2, rect.top + rect.height / 2));
          left = Math.min(viewportWidth - tooltipWidth / 2, rect.right + 20);
          break;
      }

      // Ensure tooltip is always visible
      top = Math.max(20, Math.min(viewportHeight - tooltipHeight - 20, top));
      left = Math.max(tooltipWidth / 2, Math.min(viewportWidth - tooltipWidth / 2, left));

      setTooltipPosition({ top, left });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isTourActive, activeTour, currentStep]);

  if (!isTourActive || !activeTour) return null;

  const currentStepData = activeTour.steps[currentStep];
  if (!currentStepData) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={stopTour}
      />
      
      {/* Highlighted element spotlight */}
      {highlightedElement && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: highlightedElement.getBoundingClientRect().top,
            left: highlightedElement.getBoundingClientRect().left,
            width: highlightedElement.offsetWidth,
            height: highlightedElement.offsetHeight,
          }}
        >
          <div className="w-full h-full rounded-lg border-2 border-primary shadow-[0_0_0_4px_rgba(0,0,0,0.1)] animate-pulse" />
        </div>
      )}

      {/* Tooltip */}
      <div
        ref={overlayRef}
        className="fixed z-[10000] max-w-sm"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <Card className="shadow-2xl border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">{currentStepData.title}</h3>
                <p className="text-sm text-muted-foreground">{currentStepData.content}</p>
              </div>
              <Button
                onClick={stopTour}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-2"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex space-x-1">
                {activeTour.steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index === currentStep
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} of {activeTour.steps.length}
              </span>
            </div>

            {/* Navigation */}
            <div className="flex justify-between gap-2">
              <Button
                onClick={previousStep}
                variant="outline"
                size="sm"
                disabled={currentStep === 0}
                className="flex-1"
              >
                <ChevronLeft className="w-3 h-3 mr-1" />
                Previous
              </Button>
              <Button
                onClick={nextStep}
                variant="default"
                size="sm"
                className="flex-1"
              >
                {currentStep === activeTour.steps.length - 1 ? 'Finish' : 'Next'}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {/* Skip button */}
            <Button
              onClick={skipTour}
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="w-3 h-3 mr-1" />
              Skip Tour
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 