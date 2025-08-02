import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cleversearch.ai';
  
  // Blog posts
  const blogPosts = [
    {
      url: `${baseUrl}/blog/llm-optimization-complete-guide-2025`,
      lastModified: new Date('2025-01-27'),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/answer-engine-optimization-2025-checklist`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ];

  return blogPosts;
} 