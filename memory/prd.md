```markdown
# LLM Optimizer Product Requirements Document (PRD)

## 1. Document Header
*   **Product Name:** Cleaver Search
*   **Version:** 1.0
*   **Date:** June 25, 2025
*   **Author:** [Your Name/Team Name]

## 2. Executive Summary

The LLM Optimizer is a SaaS product designed to help website owners, particularly non-technical marketing managers and founders, improve their website's visibility and citation frequency by large language models (LLMs) such as ChatGPT, Claude, and Gemini. As LLMs become increasingly prevalent as information sources, websites need to be structured and contain content that is easily discoverable, understandable, and trustworthy for these models to reference. The LLM Optimizer provides tools to analyze website content from an LLM's perspective, generate actionable recommendations, and facilitate the direct injection of optimized content (like structured FAQs or definitions) onto the website without requiring developer intervention. This MVP focuses on core capabilities: a tracker script for basic data collection, sitemap import for page discovery, AI-powered analysis with recommendations and scoring, in-dashboard content injection, and a central user dashboard to manage these functions.

## 3. Product Vision

**Purpose:** To become the leading platform for optimizing website content for discovery and citation by large language models, ensuring websites remain relevant and visible in the age of generative AI.
**Users:** Primarily non-technical marketing managers, content strategists, small business owners, and founders who manage their website's online presence but lack deep technical expertise for site code modifications. They are seeking proactive ways to adapt their digital strategy to the evolving landscape of AI search and information retrieval.
**Business Goals:**
*   Drive adoption by providing a novel and essential tool for AI-era SEO.
*   Generate recurring revenue through subscription plans based on site size and usage (e.g., page limits, analysis frequency).
*   Establish market leadership in the emerging field of LLM optimization.
*   Achieve target success metrics: 80% of scanned pages receiving actionable recommendations, 75% of active users utilizing the content injection feature, achieving quick and easy setup, and demonstrating improvement in a calculated LLM visibility/readiness score over time for active users.

## 4. User Personas

**Persona Name:** Marketing Manager Mary
*   **Background:** Works for a mid-sized B2B SaaS company. Manages the company blog, website content, social media, and email marketing. Familiar with traditional SEO concepts but not a coder.
*   **Goals:** Increase website traffic, improve lead generation, enhance brand authority, stay ahead of digital marketing trends, prove ROI on marketing efforts.
*   **Pain Points:**
    *   Doesn't understand how LLMs find and use website information.
    *   Lacks the technical ability or developer resources to make significant changes to website structure or inject new content blocks.
    *   Overwhelmed by rapid changes in the AI/digital landscape.
    *   Needs clear, actionable steps she can implement herself.
    *   Needs to justify marketing spend with measurable results.
*   **Needs from LLM Optimizer:** Easy setup, clear analysis results, simple content recommendations, a straightforward way to add content to pages, a score or metric to track progress.

## 5. Feature Specifications (MVP)

### 5.1. Tracker Script

**Description:** A lightweight JavaScript snippet that users place on their website to collect basic page data (URL, title, meta description, headings, potentially sections of body text) and anonymized traffic metrics (page views, unique visitors) relevant to LLM visibility. This script also facilitates the dynamic injection of content managed via the dashboard.

#### User Stories
*   As a user, I want a simple JavaScript snippet I can easily add to my website header or via a tag manager so the LLM Optimizer can collect necessary data.
*   As a user, I want the script to be very lightweight and not impact my website's loading speed or user experience.
*   As a user, I want the script to securely send anonymized page data and basic traffic metrics to the LLM Optimizer backend.
*   As a user, I want the script to dynamically display content I configure in the dashboard on my website pages.

#### Acceptance Criteria
*   The system provides a single JS snippet code block for the user to copy.
*   The snippet can be installed directly in the `<head>` or `<body>` of an HTML page, or via common Tag Management Systems (e.g., Google Tag Manager).
*   Upon page load, the script successfully captures and sends:
    *   Page URL
    *   Page Title (`<title>`)
    *   Meta Description (`<meta name="description">`)
    *   H1, H2, H3 headings (text content only)
    *   A sample of the main body text (e.g., first 500-1000 characters, or content within defined main content areas like `<article>`, `<main>`). *Specificity required on how main content is identified.*
    *   Timestamp of visit.
    *   Anonymized user ID (e.g., cookie-based, not linked to personal info).
    *   Basic traffic events (page view).
*   Data is sent to the backend via a secure HTTPS endpoint.
*   The script's performance impact is negligible (e.g., adds < 50ms to page load, < 50KB transfer size).
*   The script loads asynchronously and does not block page rendering.
*   The script includes functionality to receive and render HTML content payloads from the backend at specified locations (via CSS selectors or logical placements).

#### Edge Cases
*   Website uses a complex Single Page Application (SPA) framework (React, Vue, Angular) where DOM changes don't trigger traditional page loads. *Needs to handle client-side navigation events.*
*   Website uses dynamic content or is behind a login. *Script only collects data accessible publicly.*
*   Script conflicts with existing website JavaScript libraries.
*   User installs the script incorrectly (e.g., missing part of the code).
*   Network issues prevent the script from sending data to the backend.
*   Website has extreme security policies (CSP - Content Security Policy) blocking external scripts. *Need clear instructions for users.*
*   Page content is primarily images, videos, or within iframes, making text scraping difficult. *Limit analysis to accessible text.*

### 5.2. Sitemap Import

**Description:** Functionality allowing users to provide their website's `sitemap.xml` URL, which the system then parses to discover and list all pages within the user's dashboard for analysis.

#### User Stories
*   As a user, I want to easily add my website's sitemap URL so the LLM Optimizer knows which pages to analyze.
*   As a user, I want the system to automatically find and list all the URLs from my sitemap in the dashboard.
*   As a user, I want the system to periodically check my sitemap for new or removed pages.
*   As a user, I want to see confirmation that my sitemap was successfully imported.

#### Acceptance Criteria
*   The dashboard provides an input field for the user to enter a `sitemap.xml` URL.
*   The system fetches and parses standard `sitemap.xml` formats, including sitemap index files (`sitemapindex`).
*   All valid `<loc>` URLs found within the sitemap(s) are extracted and added to the user's list of pages in the dashboard.
*   Handles sitemaps containing tens of thousands of URLs efficiently (pagination in dashboard view needed).
*   Provides feedback to the user on import status (success, failure, number of URLs found).
*   Automatically schedules a recurring check of the sitemap (e.g., weekly) to discover new pages.
*   Allows manual re-import or refresh of the sitemap.

#### Edge Cases
*   The provided URL is not a valid sitemap or does not exist.
*   The sitemap file is malformed XML.
*   The sitemap is very large and causes memory or timeout issues during parsing.
*   The sitemap URL requires authentication. *Scope limited to public sitemaps.*
*   The sitemap contains non-web URLs (e.g., images, PDFs - *only process HTML pages*).
*   Network issues prevent fetching the sitemap.

### 5.3. AI Analysis

**Description:** The core intelligence feature where the system analyzes the content of website pages (using data collected by the tracker or fetched directly by the backend) via integrated LLMs. It assesses the content's clarity, structure, and potential for LLM understanding, generating an LLM-readiness score and specific optimization recommendations.

#### User Stories
*   As a user, I want the system to analyze my website pages using LLMs to understand how well they might be understood and cited.
*   As a user, I want to receive concrete, actionable recommendations for improving my pages' LLM readability.
*   As a user, I want to see an "LLM-readiness score" for each page and my overall site to track my progress.
*   As a user, I want to trigger analysis for specific pages or the entire site from the dashboard.

#### Acceptance Criteria
*   Integrates with at least one major LLM API (e.g., OpenAI, Anthropic, Google AI).
*   For each page, the system analyzes:
    *   Content clarity and conciseness.
    *   Presence and structure of key information (definitions, lists, steps, FAQs).
    *   Use of clear headings and semantic HTML elements (to the extent discernible from scraped/tracked data).
    *   Potential for factual accuracy and trust signals (limited by content provided, *not a fact-checking service*).
    *   Absence of ambiguity or overly promotional/subjective language where objective information is expected.
*   Generates a list of specific, actionable recommendations for each page (e.g., "Add a clear definition of [concept]," "Structure steps for [process] as a numbered list," "Consider adding an FAQ section addressing [common question]," "Ensure the main topic is clearly stated in the first paragraph").
*   Calculates an LLM-readiness score for each analyzed page (e.g., 0-100 scale) based on analysis factors.
*   Calculates an aggregate site-level LLM-readiness score.
*   Displays recommendations and scores prominently in the user dashboard.
*   Allows triggering analysis for newly imported pages or re-analysis for updated pages.
*   Handles potential LLM API errors, rate limits, and timeouts gracefully.

#### Edge Cases
*   Page content is very thin or repetitive (e.g., template pages).
*   Page content is primarily non-textual (images, videos).
*   Content is in a language not well-supported by the integrated LLM.
*   Page content is extremely long, exceeding LLM context windows. *Need content summarization or chunking strategy.*
*   LLM analysis produces generic or irrelevant recommendations. *Requires prompt engineering and potential filtering.*
*   Costs associated with LLM API usage become unexpectedly high. *Needs monitoring and potential usage limits.*
*   Analysis is slow for large pages or many pages. *Needs queuing and status indicators.*

### 5.4. Content Injection

**Description:** Enables users to add new, structured content (like AI-suggested FAQs or definitions) directly onto their website pages via the dashboard UI, without needing to edit the website's underlying code. This content is injected dynamically using the tracker script.

#### User Stories
*   As a user, I want to easily add structured content like FAQs or definitions to my pages based on the AI recommendations.
*   As a user, I want to preview and edit the suggested content before it appears on my live site.
*   As a user, I want to specify where on the page the new content should appear (e.g., below the main article, before the footer).
*   As a user, I want to be able to turn off or remove injected content if needed.
*   As a user, I want the injected content to look reasonably integrated with my site's styling.

#### Acceptance Criteria
*   Within the page details view in the dashboard, users can see and select from AI-generated content suggestions (or manually add content).
*   Provides a rich text editor interface for users to review and edit the content to be injected.
*   Allows the user to specify an injection point on the page using:
    *   Pre-defined logical locations (e.g., "After main content area").
    *   Potentially, a simple visual selector tool or CSS selector input (MVP might start simpler).
*   The system securely stores the content and injection point details.
*   The tracker script, when loading on a page with configured injections, fetches the content and dynamically inserts it into the specified location in the page's DOM.
*   Injected content is rendered as standard HTML elements (paragraphs, lists, basic headings).
*   Provides options in the dashboard to activate/deactivate or delete injected content for a specific page.
*   Injected content is live on the user's site shortly after activation in the dashboard (subject to caching).

#### Edge Cases
*   The specified injection point (selector) is invalid, not found on the page, or selects multiple conflicting locations.
*   The page structure changes on the user's website, causing the injection point to fail.
*   The user's website uses a framework that makes dynamic DOM manipulation difficult or unstable.
*   The injected content conflicts with existing page elements, breaking layout or functionality.
*   The injected content's basic styling clashes severely with the website's CSS.
*   The tracker script fails to load, preventing content injection.
*   Search engines or LLMs may not see dynamically injected content (though many modern ones execute JS; this is a platform limitation risk). *Clearly communicate that injection targets user experience and potentially JS-executing bots, not guarantee basic crawler visibility.*

### 5.5. User Dashboard

**Description:** The central web interface where users manage their website configuration, view imported pages, see analysis results and scores, manage content injections, and access account settings.

#### User Stories
*   As a user, I want a clear overview of my website's LLM optimization status.
*   As a user, I want to see a list of all the pages imported from my sitemap.
*   As a user, I want to view the detailed analysis, recommendations, and LLM score for each page.
*   As a user, I want to manage all my content injections from one place.
*   As a user, I want to configure my site's settings (sitemap URL, tracker script, account details).

#### Acceptance Criteria
*   Provides a secure login and user account management system.
*   The main dashboard view displays key metrics: overall site LLM score, number of pages analyzed, number of recommendations generated, number of active content injections.
*   Includes a table or list view of all pages imported via the sitemap, showing URL, current LLM score, analysis status (Pending, Analyzed, Error), and date of last analysis.
*   Clicking on a page in the list navigates to a detailed page view displaying:
    *   Page URL and title.
    *   LLM-readiness score for the page.
    *   List of specific recommendations generated by AI analysis for this page.
    *   Interface to manage content injections for this page (add new based on suggestions/manual input, edit, activate/deactivate, delete existing).
*   A dedicated "Content Injections" section lists all active injections across the site, allowing editing/removal from a central place.
*   A "Settings" section allows users to:
    *   Manage their site(s).
    *   Update the sitemap URL and trigger re-import.
    *   Copy the tracker script snippet.
    *   Manage billing information (placeholder for MVP).
    *   View account details.
*   The dashboard is responsive and usable on different screen sizes.
*   All actions within the dashboard (trigger analysis, save injection) provide clear feedback (success messages, errors, loading states).

#### Edge Cases
*   User manages multiple websites under one account. *Dashboard needs clear site switcher.*
*   A site has a very large number of pages (requires pagination and filtering in page lists).
*   Analysis or injection operations take a long time or fail (dashboard needs to show processing states and errors clearly).
*   Concurrency issues if multiple users manage the same site account simultaneously.
*   User session expires during a long operation.

## 6. Technical Requirements

### 6.1. API Requirements
*   **LLM Integration API:** Secure communication layer with chosen LLM providers (e.g., OpenAI API, Anthropic API, Google AI API). Needs error handling, rate limiting, and cost monitoring.
*   **Data Ingestion API:** Secure HTTPS endpoint for the client-side tracker script to send collected page data and traffic events. Needs to handle potentially high volume and ensure data integrity.
*   **Sitemap Fetching:** Backend capability to fetch and parse XML content from external URLs, handling redirects and various encodings.
*   **Backend Service APIs:** Internal APIs to support the dashboard functionality: retrieving site list, page data, analysis results, recommendations, managing injections, triggering tasks (analysis, sitemap import). Needs authentication and authorization checks for user access.
*   **Content Injection API:** Backend endpoint that the tracker script calls on page load to check for and retrieve activated content injections for the current URL.

### 6.2. Data Storage Requirements
*   **Database:** Relational database (e.g., PostgreSQL, MySQL) or NoSQL database (e.g., MongoDB) capable of storing structured and semi-structured data.
    *   **User Data:** User accounts, subscription status, associated websites.
    *   **Site Configuration Data:** Website URLs, sitemap URLs, settings.
    *   **Page Data:** List of imported page URLs, titles, meta descriptions.
    *   **Collected Data:** Processed and aggregated data from the tracker script (anonymized traffic counts per page, potentially snapshots of page content if needed for re-analysis without re-scraping).
    *   **Analysis Results:** LLM scores per page and site, generated recommendations (text format).
    *   **Content Injection Data:** Stored HTML/text content to be injected, associated page URL, injection point definition, status (active/inactive).
*   **Storage Considerations:**
    *   Scalability: Database needs to handle potentially millions of pages and associated analysis/injection data.
    *   Performance: Efficient querying for dashboard display and injection retrieval.
    *   Security: Data encryption at rest and in transit. PII minimization (tracker data should be anonymous/aggregated where possible).
    *   Blob Storage: Potentially needed for storing larger content snapshots if full page re-fetching for analysis becomes inefficient.

## 7. Implementation Roadmap (Prioritized MVP Features)

This roadmap outlines the suggested sequence for implementing the MVP features, focusing on building the core data flow and user value incrementally.

**Phase 1: Foundation & Basic Dashboard (Weeks 1-4)**
*   Set up core backend infrastructure and database.
*   Implement user authentication and account management.
*   Build the basic User Dashboard structure with site creation/management.
*   Implement Sitemap Import functionality (parsing, storing URLs, manual trigger).
*   Develop the core Data Storage schema for users, sites, and pages.

**Phase 2: Data Collection & Core Analysis (Weeks 5-8)**
*   Develop and test the lightweight Tracker Script for data collection (URL, metadata, basic content snippet, traffic).
*   Implement the Data Ingestion API for the tracker script.
*   Integrate with the primary LLM API.
*   Develop the AI Analysis logic (sending content to LLM, processing response into recommendations and score).
*   Implement the backend logic to trigger analysis for imported pages.

**Phase 3: Dashboard Integration & Initial Value (Weeks 9-12)**
*   Integrate analysis results (scores, recommendations) into the User Dashboard (page list view, detailed page view).
*   Refine the Tracker Script to include dynamic content injection capability (listening for backend payload).
*   Develop the Content Injection Data Storage schema.
*   Build the Content Injection management UI in the dashboard (view suggestions, add manual, edit, save, activate/deactivate).
*   Implement the Content Injection API backend endpoint for the tracker script.

**Phase 4: Refinement & Automation (Weeks 13-16)**
*   Implement scheduled Sitemap Re-import.
*   Implement automated re-analysis triggers (e.g., on sitemap update detecting new page).
*   Improve dashboard UI/UX based on initial testing (e.g., better data visualization, filtering).
*   Add basic site-level analytics and overall score display.
*   Implement error handling and logging across all components.
*   Add basic styling for injected content.

**Beyond MVP:** Scheduled analysis, advanced injection options (visual selector), more sophisticated AI analysis (e.g., identifying entity relationships, knowledge graph compatibility), A/B testing for injected content, integrations with CMS platforms, detailed reporting dashboards, multi-site management improvements, billing system integration.
```
