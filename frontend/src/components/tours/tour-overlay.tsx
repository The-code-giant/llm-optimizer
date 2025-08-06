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
  const [elementPosition, setElementPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Prevent scrolling when tour is active
  useEffect(() => {
    if (isTourActive) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      // Prevent scrolling by setting body styles
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = `-${scrollX}px`;
      document.body.style.width = '100%';
      
      // Prevent scroll events
      const preventScroll = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      // Add event listeners to prevent scrolling
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Home' || e.key === 'End') {
          e.preventDefault();
        }
      });
      
      // Cleanup function to restore scrolling
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.width = '';
        
        // Remove event listeners
        document.removeEventListener('wheel', preventScroll);
        document.removeEventListener('touchmove', preventScroll);
        
        // Restore scroll position
        window.scrollTo(scrollX, scrollY);
      };
    }
  }, [isTourActive]);

  useEffect(() => {
    if (!isTourActive || !activeTour) return;

    const currentStepData = activeTour.steps[currentStep];
    if (!currentStepData) return;

    // Wait a bit for the DOM to be ready
    const timeoutId = setTimeout(() => {
      let element = document.querySelector(currentStepData.selector) as HTMLElement;
      
      // If element not found, try again after a short delay (for dynamic content)
      if (!element) {
        setTimeout(() => {
          element = document.querySelector(currentStepData.selector) as HTMLElement;
          if (!element) {
            console.warn(`Tour element not found after retry: ${currentStepData.selector}`);
            // Use fallback positioning if element not found
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            setTooltipPosition({
              top: viewportHeight / 2,
              left: viewportWidth / 2
            });
            return;
          }
          processElement(element);
        }, 200);
        return;
      }
      
      processElement(element);
      
      function processElement(element: HTMLElement) {
        setHighlightedElement(element);
        
        // Store the element position
        const rect = element.getBoundingClientRect();
        
        setElementPosition({
          top: rect.top,
          left: rect.left,
          width: element.offsetWidth,
          height: element.offsetHeight
        });
        
        // Scroll element into view if needed (only if not already scrolled)
        const isElementVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        
        if (!isElementVisible) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
        }
        
        // Calculate tooltip position with better positioning logic
        const position = currentStepData.position || 'bottom';
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Tooltip dimensions (approximate)
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        
        let top = 0;
        let left = 0;

        // Calculate the center of the element
        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;

        // Determine the best position based on element location and available space
        let bestPosition = position;
        
        // Check available space in each direction
        const spaceAbove = rect.top - tooltipHeight - 20;
        const spaceBelow = viewportHeight - rect.bottom - tooltipHeight - 20;
        const spaceLeft = rect.left - tooltipWidth - 20;
        const spaceRight = viewportWidth - rect.right - tooltipWidth - 20;

        // If the preferred position doesn't have enough space, try alternatives
        if (position === 'top' && spaceAbove < 20) {
          bestPosition = spaceBelow > spaceAbove ? 'bottom' : (spaceLeft > spaceRight ? 'left' : 'right');
        } else if (position === 'bottom' && spaceBelow < 20) {
          bestPosition = spaceAbove > spaceBelow ? 'top' : (spaceLeft > spaceRight ? 'left' : 'right');
        } else if (position === 'left' && spaceLeft < 20) {
          bestPosition = spaceRight > spaceLeft ? 'right' : (spaceAbove > spaceBelow ? 'top' : 'bottom');
        } else if (position === 'right' && spaceRight < 20) {
          bestPosition = spaceLeft > spaceRight ? 'left' : (spaceAbove > spaceBelow ? 'top' : 'bottom');
        }

        switch (bestPosition) {
          case 'top':
            // Position above the element with adequate spacing
            // Account for transform that centers the tooltip vertically
            top = Math.max(20, rect.top - tooltipHeight - 30 + tooltipHeight / 2);
            left = Math.max(tooltipWidth / 2, Math.min(viewportWidth - tooltipWidth / 2, elementCenterX));
            break;
          case 'bottom':
            // Position below the element with adequate spacing
            // Account for transform that centers the tooltip vertically
            top = Math.min(viewportHeight - tooltipHeight - 20, rect.bottom + 30 + tooltipHeight / 2);
            left = Math.max(tooltipWidth / 2, Math.min(viewportWidth - tooltipWidth / 2, elementCenterX));
            break;
          case 'left':
            // Position to the left of the element with adequate spacing
            // Account for transform that centers the tooltip horizontally
            top = Math.max(tooltipHeight / 2, Math.min(viewportHeight - tooltipHeight / 2, elementCenterY));
            left = Math.max(20, rect.left - tooltipWidth - 30 + tooltipWidth / 2);
            break;
          case 'right':
            // Position to the right of the element with adequate spacing
            // Account for transform that centers the tooltip horizontally
            top = Math.max(tooltipHeight / 2, Math.min(viewportHeight - tooltipHeight / 2, elementCenterY));
            left = Math.min(viewportWidth - tooltipWidth - 20, rect.right + 30 + tooltipWidth / 2);
            break;
        }

        // Ensure tooltip is always visible within viewport
        top = Math.max(20, Math.min(viewportHeight - tooltipHeight - 20, top));
        left = Math.max(20, Math.min(viewportWidth - tooltipWidth - 20, left));

        setTooltipPosition({ top, left });
      }
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
            top: elementPosition.top,
            left: elementPosition.left,
            width: elementPosition.width,
            height: elementPosition.height,
          }}
        >
          <div className="w-full h-full rounded-lg border-4 border-primary shadow-[0_0_0_8px_rgba(0,0,0,0.1)] animate-pulse bg-primary/10" />
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