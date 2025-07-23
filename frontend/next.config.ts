import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    // Add remark/rehype plugins here if needed
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withMDX(nextConfig);
