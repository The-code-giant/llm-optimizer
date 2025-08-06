# Tour System

A comprehensive tour system for the platform that allows you to create guided tours for different parts of the application.

## Features

- ✅ Automatic tour start for first-time users
- ✅ localStorage persistence (remembers completed/skipped tours)
- ✅ Reusable tour components
- ✅ Spotlight highlighting of elements
- ✅ Customizable tour steps and positions
- ✅ Skip and complete functionality
- ✅ Tour triggers for manual activation

## Quick Start

### 1. Set up Tour Provider

Wrap your app or page with the `TourProvider`:

```tsx
import { TourProvider, TourOverlay } from '@/components/tours';
import { dashboardTour } from '@/components/tours/dashboard-tour';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider tours={[dashboardTour]}>
      {children}
      <TourOverlay />
    </TourProvider>
  );
}
```

### 2. Add Tour Data Attributes

Add `data-tour` attributes to elements you want to highlight:

```tsx
<div data-tour="welcome">
  <h1>Welcome to Dashboard</h1>
</div>

<div data-tour="stats-overview">
  <StatCard title="Total Sites" value={5} />
</div>
```

### 3. Create Tour Configuration

Create a tour configuration file:

```tsx
// tours/my-tour.ts
import { Tour } from './tour-provider';

export const myTour: Tour = {
  id: 'my-tour',
  name: 'My Tour',
  autoStart: true, // Auto-start for first-time users
  steps: [
    {
      id: 'welcome',
      selector: '[data-tour="welcome"]',
      title: 'Welcome! 🎉',
      content: 'This is the welcome section.',
      position: 'bottom'
    },
    {
      id: 'stats',
      selector: '[data-tour="stats-overview"]',
      title: 'Statistics 📊',
      content: 'Here you can see your stats.',
      position: 'bottom'
    }
  ]
};
```

### 4. Add Tour Trigger (Optional)

Add a button to manually start the tour:

```tsx
import { TourTrigger } from '@/components/tours';

<TourTrigger tourId="my-tour" className="my-custom-class">
  Start Tour
</TourTrigger>
```

## API Reference

### TourProvider Props

```tsx
interface TourProviderProps {
  children: React.ReactNode;
  tours: Tour[];
}
```

### Tour Interface

```tsx
interface Tour {
  id: string;           // Unique tour identifier
  name: string;         // Display name
  steps: TourStep[];    // Array of tour steps
  autoStart?: boolean;  // Auto-start for first-time users
}
```

### TourStep Interface

```tsx
interface TourStep {
  id: string;                    // Unique step identifier
  selector: string;              // CSS selector for element to highlight
  title: string;                 // Step title
  content: string;               // Step description
  position?: 'top' | 'bottom' | 'left' | 'right'; // Tooltip position
}
```

### useTour Hook

```tsx
const {
  tours,              // All available tours
  activeTour,         // Currently active tour
  currentStep,        // Current step index
  isTourActive,       // Whether a tour is currently active
  startTour,          // Start a specific tour
  stopTour,           // Stop current tour
  nextStep,           // Go to next step
  previousStep,       // Go to previous step
  skipTour,           // Skip current tour
  completeTour,       // Complete current tour
  hasSeenTour,        // Check if user has seen a tour
  resetTour,          // Reset a specific tour
  resetAllTours       // Reset all tours
} = useTour();
```

## Examples

### Dashboard Tour

```tsx
// tours/dashboard-tour.ts
export const dashboardTour: Tour = {
  id: 'dashboard',
  name: 'Dashboard Tour',
  autoStart: true,
  steps: [
    {
      id: 'welcome',
      selector: '[data-tour="welcome"]',
      title: 'Welcome to Your Dashboard! 🎉',
      content: 'This is your command center for optimizing websites.',
      position: 'bottom'
    },
    {
      id: 'stats',
      selector: '[data-tour="stats-overview"]',
      title: 'Key Metrics 📊',
      content: 'Track your total sites and performance metrics.',
      position: 'bottom'
    }
  ]
};
```

### Manual Tour Trigger

```tsx
import { TourTrigger } from '@/components/tours';

// Basic trigger
<TourTrigger tourId="dashboard">Start Tour</TourTrigger>

// Custom styled trigger
<TourTrigger 
  tourId="dashboard" 
  variant="outline" 
  size="sm"
  className="my-custom-class"
>
  <Play className="w-4 h-4 mr-2" />
  Start Dashboard Tour
</TourTrigger>
```

## Best Practices

1. **Use descriptive selectors**: Make sure your `data-tour` attributes are descriptive and unique
2. **Keep tours focused**: Don't make tours too long - focus on key features
3. **Test positioning**: Test tooltip positions on different screen sizes
4. **Provide clear content**: Make tour content actionable and informative
5. **Handle edge cases**: Consider what happens if elements don't exist

## Troubleshooting

### Tour not starting automatically
- Check if `autoStart: true` is set in tour configuration
- Verify localStorage is available (not in SSR)
- Check if user has already seen the tour

### Elements not highlighting
- Verify the CSS selector in `data-tour` attribute
- Check if element exists when tour starts
- Ensure element is visible (not hidden by CSS)

### Positioning issues
- Test different `position` values ('top', 'bottom', 'left', 'right')
- Check if tooltip is being cut off by viewport
- Consider responsive design implications 