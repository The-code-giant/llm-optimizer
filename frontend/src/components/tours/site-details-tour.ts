import { Tour } from './tour-provider';

export const siteDetailsTour: Tour = {
  id: 'site-details',
  name: 'Site Details Tour',
  autoStart: false,
  steps: [
    {
      id: 'site-overview',
      selector: '[data-tour="site-overview"]',
      title: 'Site Overview 📊',
      content: 'This section shows your site\'s overall performance metrics, including LLM readiness score and scanning status.',
      position: 'bottom'
    },
    {
      id: 'pages-section',
      selector: '[data-tour="pages-section"]',
      title: 'Pages Management 📄',
      content: 'Here you can view all pages on your site, their optimization scores, and manage content deployment.',
      position: 'bottom'
    },
    {
      id: 'add-page',
      selector: '[data-tour="add-page"]',
      title: 'Add New Pages ➕',
      content: 'Click here to add new pages to your site or import pages from a sitemap.',
      position: 'bottom'
    }
  ]
}; 