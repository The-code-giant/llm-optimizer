export default function Head() {
  return (
    <>
      <title>LLM & Crawler Accessibility Checker | Cleversearch Tools</title>
      <meta
        name="description"
        content="Free tool to check if Googlebot and AI crawlers (GPTBot, ClaudeBot, Perplexity, and more) can access your page. Identify robots.txt and HTTP blockers, and get AI-SEO guidance."
      />
      <meta
        name="keywords"
        content="LLM crawler checker, AI crawler accessibility, robots.txt checker, GPTBot access, ClaudeBot access, Perplexity crawler, AI-SEO tools, Answer Engine Optimization"
      />
      <link rel="canonical" href="https://cleversearch.ai/tools" />

      {/* Open Graph */}
      <meta property="og:title" content="LLM & Crawler Accessibility Checker | Cleversearch Tools" />
      <meta
        property="og:description"
        content="See if leading AI crawlers and Googlebot can reach your page. Find and fix blockers fast."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://cleversearch.ai/tools" />
      <meta property="og:site_name" content="Cleversearch" />
      <meta property="og:image" content="https://cleversearch.ai/og-default.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="LLM & Crawler Accessibility Checker | Cleversearch Tools" />
      <meta
        name="twitter:description"
        content="See if leading AI crawlers and Googlebot can reach your page. Find and fix blockers fast."
      />
      <meta name="twitter:image" content="https://cleversearch.ai/og-default.png" />
      <meta name="twitter:site" content="@cleversearch" />
      <meta name="twitter:creator" content="@cleversearch" />

      {/* Robots */}
      <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
      <meta name="googlebot" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
    </>
  );
}


