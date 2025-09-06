import { Metadata } from 'next';

export interface MetadataOptions {
  title: string;
  description: string;
  image?: string;
  author?: string;
  publishedTime?: string;
  tags?: string[];
  slug?: string;
  type?: 'website' | 'article';
}

/**
 * Generates metadata for pages including Open Graph and Twitter cards
 */
export function generatePageMetadata(options: MetadataOptions): Metadata {
  const {
    title,
    description,
    image,
    author,
    publishedTime,
    tags,
    slug,
    type = 'website'
  } = options;

  // Get base URL from environment or use default
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cleversearch.ai';
  
  // Generate absolute URLs
  const canonicalUrl = slug ? `${baseUrl}/${slug}` : baseUrl;
  const ogImageUrl = image 
    ? (image.startsWith('http') ? image : `${baseUrl}${image}`)
    : `${baseUrl}/og-default.png`;

  const metadata: Metadata = {
    title,
    description,
    keywords: tags,
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      title,
      description,
      type,
      url: canonicalUrl,
      siteName: 'Cleversearch',
      locale: 'en_US',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: '@cleversearch',
      site: '@cleversearch',
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  // Add article-specific metadata
  if (type === 'article' && publishedTime) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      publishedTime,
      authors: author ? [author] : undefined,
    };
  }

  return metadata;
}

/**
 * Generates metadata specifically for blog posts
 */
export async function generateBlogMetadata(slug: string): Promise<Metadata> {
  try {
    const mod = await import(`@/content/blog/${slug}.mdx`);
    const meta = mod.meta || {};
    
    return generatePageMetadata({
      title: meta.title || 'Blog Post',
      description: meta.excerpt || 'Read our latest insights on LLM optimization and AI search.',
      image: meta.featuredImage,
      author: meta.author,
      publishedTime: meta.date,
      tags: meta.tags,
      slug: `blog/${slug}`,
      type: 'article',
    });
  } catch (error) {
    // Return 404 metadata if post not found
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}
