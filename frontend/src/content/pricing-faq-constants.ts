import { type IconName } from 'lucide-react/dynamic';

export type PricingFAQItem = {
  id: string;
  icon: IconName;
  question: string;
  answer: string;
  details?: string[];
  detailsType?: 'ol' | 'ul';
};

export const PRICING_FAQ_ITEMS: PricingFAQItem[] = [
  {
    id: 'free-trial-details',
    icon: 'gift',
    question: 'What does the 7-day free trial include?',
    answer: 'Our 7-day free trial gives you full access to the Pro plan features, including up to 2 sites, 5,000 pages per month, advanced LLM optimization, and all analytics features. No credit card required to start.',
    details: [
      'Full access to all Pro plan features during the trial period',
      'No credit card required to begin your trial',
      'Cancel anytime during the trial with no charges',
      'Trial automatically converts to paid subscription after 7 days unless cancelled'
    ],
    detailsType: 'ul'
  },
  {
    id: 'plan-comparison',
    icon: 'layers',
    question: 'What\'s the difference between Pro and Enterprise plans?',
    answer: 'The Pro plan is designed for growing websites and businesses, offering comprehensive AI-SEO tools for up to 2 sites. The Enterprise plan provides unlimited sites, dedicated support, custom AI models, and advanced team management features for large organizations.',
    details: [
      'Pro: Up to 2 sites, 5,000 pages/month, 1 seat, standard support',
      'Enterprise: Unlimited sites & pages, multiple seats, dedicated success manager',
      'Pro: Standard AI optimization tools and analytics',
      'Enterprise: Custom AI models, white-glove onboarding, early beta access'
    ],
    detailsType: 'ul'
  },
  {
    id: 'billing-cycles',
    icon: 'credit-card',
    question: 'What billing cycles do you offer?',
    answer: 'We offer monthly and annual billing options. Annual subscriptions come with a 20% discount compared to monthly billing, providing better value for long-term commitments.',
    details: [
      'Monthly billing: Full price charged each month',
      'Annual billing: 20% discount applied to yearly subscriptions',
      'All plans auto-renew unless cancelled before the next billing cycle',
      'Enterprise plans can be customized with different billing terms'
    ],
    detailsType: 'ol'
  },
  {
    id: 'upgrade-downgrade',
    icon: 'arrow-up-down',
    question: 'Can I upgrade or downgrade my plan at any time?',
    answer: 'Yes, you can upgrade your plan at any time and changes take effect immediately. Downgrades take effect at the next billing cycle to ensure you get full value from your current plan.',
    details: [
      'Upgrades: Immediate access to new features and higher limits',
      'Downgrades: Changes apply at the next billing cycle',
      'No setup fees or penalties for plan changes',
      'Prorated billing adjustments for mid-cycle upgrades'
    ],
    detailsType: 'ol'
  },
  {
    id: 'cancellation-policy',
    icon: 'x-circle',
    question: 'What is your cancellation policy?',
    answer: 'You can cancel your subscription at any time from your dashboard. Cancellations take effect at the end of your current billing period, and you\'ll retain access to all features until then.',
    details: [
      'Cancel anytime from your account dashboard',
      'No cancellation fees or penalties',
      'Access continues until the end of your current billing period',
      'Data export available before cancellation'
    ],
    detailsType: 'ul'
  },
  {
    id: 'enterprise-customization',
    icon: 'settings',
    question: 'What customization options are available for Enterprise plans?',
    answer: 'Enterprise plans offer extensive customization including custom AI models, dedicated infrastructure, white-label solutions, custom integrations, and tailored billing terms to meet your organization\'s specific needs.',
    details: [
      'Custom AI model training and fine-tuning for your specific industry',
      'Dedicated customer success manager and priority support',
      'White-label solutions for agencies and resellers',
      'Custom API integrations and data connectors',
      'Flexible billing terms and volume discounts'
    ],
    detailsType: 'ul'
  },
  {
    id: 'support-levels',
    icon: 'headphones',
    question: 'What support is included with each plan?',
    answer: 'Pro plans include priority email support with response times under 24 hours. Enterprise plans include dedicated customer success managers, phone support, and custom onboarding to ensure your success.',
    details: [
      'Pro: Priority email support (24-hour response time)',
      'Enterprise: Dedicated customer success manager',
      'Enterprise: Phone and video call support',
      'Enterprise: Custom onboarding and migration assistance'
    ],
    detailsType: 'ol'
  },
  {
    id: 'data-security',
    icon: 'shield',
    question: 'How do you handle data security and privacy?',
    answer: 'We take data security seriously and are SOC 2 compliant. All data is encrypted in transit and at rest, and we never share your data with third parties. Enterprise customers can request additional security measures and compliance certifications.',
    details: [
      'SOC 2 Type II compliant infrastructure',
      'End-to-end encryption for all data transmission',
      'GDPR and CCPA compliant data handling',
      'Enterprise: Custom security reviews and compliance support'
    ],
    detailsType: 'ul'
  },
  {
    id: 'api-access',
    icon: 'code',
    question: 'Do you provide API access?',
    answer: 'API access is available for Enterprise customers, allowing you to integrate Cleversearch functionality into your existing workflows and build custom applications on top of our platform.',
    details: [
      'Enterprise: Full REST API access with comprehensive documentation',
      'Enterprise: Webhook support for real-time notifications',
      'Enterprise: Custom integration development support',
      'Pro: Limited API access available upon request'
    ],
    detailsType: 'ol'
  },
  {
    id: 'refund-policy',
    icon: 'undo',
    question: 'What is your refund policy?',
    answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied with our service within the first 30 days, we\'ll provide a full refund, no questions asked.',
    details: [
      '30-day money-back guarantee for all paid subscriptions',
      'Full refund processed within 5-7 business days',
      'No questions asked - we want you to be completely satisfied',
      'Refund policy applies to first-time subscribers only'
    ],
    detailsType: 'ul'
  }
];
