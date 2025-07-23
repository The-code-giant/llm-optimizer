import path from 'path';
import fs from 'fs/promises';
import BlogListClient, { BlogMeta } from './BlogListClient';

const POSTS_PER_PAGE = 10;

async function getAllPostsMeta(): Promise<BlogMeta[]> {
  const postsDir = path.join(process.cwd(), 'src/content/blog');
  const files = await fs.readdir(postsDir);
  const posts: BlogMeta[] = [];
  for (const filename of files) {
    if (!filename.endsWith('.mdx')) continue;
    const slug = filename.replace(/\.mdx$/, '');
    try {
      const mod = await import(`@/content/blog/${slug}.mdx`);
      const meta = mod.meta || {};
      posts.push({
        ...meta,
        href: `/blog/${slug}`,
      });
    } catch {
      // skip invalid MDX
    }
  }
  // Sort by date descending
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default async function Blog({ searchParams }: { searchParams?: { page?: string } }) {
  const page = parseInt(searchParams?.page || '1', 10);
  const allPosts = await getAllPostsMeta();
  const posts = allPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  // Use the first post as featured if available
  const featuredPost = posts[0] || null;

  const categories = [
    { name: "All", count: allPosts.length, active: true },
    // Add more categories if you want to filter
  ];
  console.log({posts});
  return <BlogListClient posts={posts} featuredPost={featuredPost} categories={categories} />;
} 