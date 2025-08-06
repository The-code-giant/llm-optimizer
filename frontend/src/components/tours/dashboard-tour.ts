import { Tour } from './tour-provider';

export const dashboardTour: Tour = {
  id: 'dashboard',
  name: 'Dashboard Tour',
  autoStart: true,
  steps: [
    {
      id: 'welcome',
      selector: '[data-tour="welcome"]',
      title: 'Welcome to Your Dashboard! 🎉',
      content: 'This is your command center for optimizing websites for AI and search engines. Let me show you around!',
      position: 'bottom'
    },
    {
      id: 'stats-overview',
      selector: '[data-tour="stats-overview"]',
      title: 'Key Metrics at a Glance 📊',
      content: 'Here you can see your total sites, average LLM readiness scores, and active scans. These give you a quick overview of your optimization progress.',
      position: 'bottom'
    },
    {
      id: 'sites-section',
      selector: '[data-tour="sites-section"]',
      title: 'Your Websites Hub 🌐',
      content: 'This section displays all your tracked websites. Each card shows detailed information about a site\'s performance, including its LLM readiness score and recent improvements.',
      position: 'bottom'
    },
    {
      id: 'add-site',
      selector: '[data-tour="add-site"]',
      title: 'Ready to Get Started? 🚀',
      content: 'Click the "Add Site" button to add your first website! Simply enter your site\'s URL and name, and we\'ll start analyzing it for AI optimization opportunities.',
      position: 'bottom'
    }
  ]
}; 