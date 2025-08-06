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
      content: 'This is your command center for managing and optimizing your website. Let me show you around the key features!',
      position: 'bottom'
    },
    {
      id: 'quick-actions',
      selector: '[data-tour="quick-actions"]',
      title: 'Quick Actions Hub ⚡',
      content: 'Here you can quickly access your tracker script and manage pages. The tracker script helps us monitor your site\'s performance.',
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
      content: 'This is where you can view, search, filter, and manage all your website pages. You can also bulk select pages for analysis or deletion.',
      position: 'bottom'
    },
    {
      id: 'search-filters',
      selector: '[data-tour="search-filters"]',
      title: 'Search & Filter Tools 🔍',
      content: 'Use these tools to find specific pages, filter by LLM readiness scores, and sort your pages by different criteria.',
      position: 'bottom'
    },
    {
      id: 'page-actions',
      selector: '[data-tour="page-actions"]',
      title: 'Page Actions & Analysis 🎯',
      content: 'For each page, you can view detailed analysis, see the LLM readiness score, and access optimization recommendations.',
      position: 'bottom'
    },
    {
      id: 'add-pages',
      selector: '[data-tour="add-pages"]',
      title: 'Add New Pages ➕',
      content: 'Click "Manage Pages" to import pages from your sitemap or add individual pages manually for analysis.',
      position: 'bottom'
    }
  ]
}; 