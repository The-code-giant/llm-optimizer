import { Tour } from './tour-provider';

export const analyticsTour: Tour = {
  id: 'analytics',
  name: 'Analytics Tour',
  autoStart: false,
  steps: [
    {
      id: 'welcome',
      selector: 'h2',
      title: 'Welcome to Analytics! 📊',
      content: 'This is your analytics dashboard where you can track performance metrics, view traffic sources, and monitor your site\'s performance over time.',
      position: 'bottom'
    },
    {
      id: 'time-range',
      selector: '.flex.items-center.space-x-1.border.rounded-lg.p-1',
      title: 'Time Range Selector ⏰',
      content: 'Use these buttons to select different time periods for your analytics data - 24 hours, 7 days, 30 days, or 90 days.',
      position: 'bottom'
    },
    {
      id: 'overview-tab',
      selector: '[value="overview"]',
      title: 'Overview Tab 📈',
      content: 'The Overview tab shows your key performance metrics including total views, unique visitors, average load time, and content deployments.',
      position: 'bottom'
    },
    {
      id: 'traffic-sources-tab',
      selector: '[value="demographics"]',
      title: 'Traffic Sources Tab 🌐',
      content: 'The Traffic Sources tab shows where your visitors are coming from and device breakdown information.',
      position: 'bottom'
    },
    {
      id: 'page-performance-tab',
      selector: '[value="performance"]',
      title: 'Page Performance Tab 🎯',
      content: 'The Page Performance tab shows detailed performance metrics for each page on your site.',
      position: 'bottom'
    },
    {
      id: 'recent-activity-tab',
      selector: '[value="activity"]',
      title: 'Recent Activity Tab 📝',
      content: 'The Recent Activity tab shows recent page views, content injections, and deployments.',
      position: 'bottom'
    }
  ]
}; 