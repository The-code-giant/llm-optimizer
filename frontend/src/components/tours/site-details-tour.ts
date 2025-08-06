import { Tour } from './tour-provider';

export const siteDetailsTour: Tour = {
  id: 'site-details',
  name: 'Site Details Tour',
  autoStart: true,
  steps: [
    {
      id: 'welcome',
      selector: '[data-tour="site-header"]',
      title: 'Welcome to Your Site Dashboard! 🎯',
      content: 'This is your command center for managing and optimizing your website. The interface is mobile-friendly and adapts to your screen size.',
      position: 'bottom'
    },
    {
      id: 'quick-actions',
      selector: '[data-tour="quick-actions"]',
      title: 'Quick Actions Hub ⚡',
      content: 'Here you can access your tracker script, manage pages, refresh data, and configure site settings - all in one convenient location.',
      position: 'bottom'
    },
    {
      id: 'metrics-overview',
      selector: '[data-tour="metrics-overview"]',
      title: 'Site Performance Metrics 📊',
      content: 'These cards show your site\'s key performance indicators: total pages, average LLM readiness score, high-quality pages, and recent scans.',
      position: 'bottom'
    },
    {
      id: 'pages-management',
      selector: '[data-tour="pages-management"]',
      title: 'Pages Management Center 📄',
      content: 'This is where you can view, search, filter, and manage all your website pages. You can see all your pages listed here with their performance scores.',
      position: 'top'
    },
    {
      id: 'add-new-page',
      selector: '[data-tour="add-new-page"]',
      title: '➕ Add New Pages',
      content: 'Click this "Add New Page" button to quickly add new pages to your site. This is the fastest way to add individual pages or import from sitemap.',
      position: 'left'
    },
    {
      id: 'search-filters',
      selector: '[data-tour="search-filters"]',
      title: 'Search & Filter Tools 🔍',
      content: 'Use these tools to find specific pages, filter by LLM readiness scores, and sort your pages by different criteria.',
      position: 'top'
    },
    {
      id: 'page-actions',
      selector: '[data-tour="page-actions"]',
      title: 'Page Actions & Analysis 🎯',
      content: 'For each page, you can view detailed analysis, see the LLM readiness score, and access optimization recommendations.',
      position: 'left'
    }
  ]
}; 