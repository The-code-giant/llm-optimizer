(function() {
  'use strict';
  
  // Prevent multiple script executions
  if (window.cleversearchTrackerLoaded || window.llmOptimizerTracker) {
    return;
  }
  
  // Check if we're in a hot reload scenario (Next.js development)
  if (typeof window !== 'undefined' && window.location && window.location.href.includes('localhost')) {
    // Development environment detected
  }
  window.cleversearchTrackerLoaded = true;
  
  // Get configuration from the script tag's data-config attribute
  let configData = {};
  try {
    const currentScript = document.currentScript || 
      (function() {
        const scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
      })();
    
    if (currentScript && currentScript.getAttribute('data-config')) {
      configData = JSON.parse(currentScript.getAttribute('data-config'));
    }
  } catch (error) {
    // Failed to parse configuration, using defaults
  }

  // Initialize URL params early - needed for CONFIG object
  const urlParams = new URLSearchParams(window.location.search);

  // Determine origin of the script to infer API base in any environment
  let inferredApiOrigin = null;
  try {
    const currentScriptForOrigin = document.currentScript || (function() {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();
    if (currentScriptForOrigin && currentScriptForOrigin.src) {
      inferredApiOrigin = new URL(currentScriptForOrigin.src).origin;
    }
  } catch (_) {}

  // Configuration - merge with provided config or use defaults
  const CONFIG = {
    // Prefer explicitly provided API_BASE; otherwise infer from script src origin;
    // finally fall back to production backend hostname.
    API_BASE: configData.API_BASE || inferredApiOrigin || 'https://backend.cleversearch.ai',
    SITE_ID: configData.SITE_ID || '{{SITE_ID}}',
    VERSION: configData.VERSION || '1.0.0',
    RETRY_ATTEMPTS: configData.RETRY_ATTEMPTS || 3,
    TIMEOUT: configData.TIMEOUT || 2000,
    DEBUG_MODE: configData.DEBUG_MODE || urlParams.has('clever-search-debug'),
    OVERRIDE_URL: configData.OVERRIDE_URL || window.LLM_OVERRIDE_URL || null, // URL override for testing
    API_ENDPOINTS: {
      CONTENT: '/api/v1/tracker/content',
      EVENT: '/api/v1/tracker/event'
    }
  };

  // Detect SPA environment (any framework)
  const isSPA = () => {
    // Next.js detection
    if (window?.next || window?.__NEXT_DATA__ || document.querySelector('[data-nextjs-scroll-focus-boundary]')) {
      return 'nextjs';
    }
    // React detection (Create React App, Vite, etc.)
    if (window.React || document.querySelector('#root') || document.querySelector('[data-reactroot]')) {
      return 'react';
    }
    // Vue.js detection
    if (window.Vue || document.querySelector('[data-v-]') || document.querySelector('#app[data-v-app]')) {
      return 'vue';
    }
    // Angular detection
    if (window.ng || document.querySelector('[ng-version]') || document.querySelector('app-root')) {
      return 'angular';
    }
    // Generic SPA detection (history API usage)
    if (window.history && window.history.pushState && 
        (document.querySelector('[data-spa]') || 
         document.querySelector('[data-router]') ||
         window.location.hash.includes('#/'))) {
      return 'generic';
    }
    return false;
  };


  // Simplified tracker - no intervals or fast mode

  // Counters for diagnostics
  let injectionCounts = {
    title: 0,
    meta: 0,
    faq: 0,
    paragraph: 0,
    keywords: 0
  };

  // Removed interval tracking - no longer needed

  // Main tracker class
  class LLMOptimizerTracker {
    constructor() {
      this.instanceId = Math.random().toString(36).substr(2, 9); // Unique instance ID
      this.sessionId = this.generateSessionId();
      this.pageLoadTime = Date.now();
      this.contentInjected = false;
      this.contentTypes = [];
      this.spaFramework = isSPA();
      this.currentUrl = CONFIG.OVERRIDE_URL || window.location.href;
      this.cachedContent = null; // Cache content to avoid duplicate API calls
      this.isLoadingContent = false; // Prevent concurrent content loading
      this.lastContentLoadTime = 0; // Track last content load to prevent rapid successive calls
      this.eventsSent = new Set(); // Track sent events to prevent duplicates
      this.lastEventTime = 0; // Track last event time for rate limiting
      this.pageViewTracked = false; // Track if page view has been sent
      this.pendingEvents = new Set(); // Track events currently being sent
      this.performanceTrackingSetup = false; // Track if performance tracking is already set up
      this.webVitalsSetup = false; // Track if web vitals observers are already set up
      this.webVitalsSent = false; // Track if web vitals have been sent
       
      if (CONFIG.OVERRIDE_URL) {
        // URL Override active
      }
      
      this.init();
    }

    async init() {
      try {
        // IMMEDIATE: Load SEO-critical content as early as possible
        await this.loadContentEarly();
        
        // Set up SPA navigation handling for all SPA frameworks
        if (this.spaFramework) {
          this.setupSPANavigation();
        }

        // Wait for DOM to be ready for non-critical content
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
          this.onDOMReady();
        }
      } catch (error) {
        this.trackError('initialization_failed', error);
      }
    }

    setupSPANavigation() {
      try {
        // Hook into history.pushState for client-side navigation
        const originalPushState = history.pushState;
        history.pushState = function() {
          originalPushState.apply(history, arguments);
          window.dispatchEvent(new Event('locationchange'));
        };

        // Hook into history.replaceState for route replacements
        const originalReplaceState = history.replaceState;
        history.replaceState = function() {
          originalReplaceState.apply(history, arguments);
          window.dispatchEvent(new Event('locationchange'));
        };

        // Hook into popstate for back/forward navigation
        const originalPopState = window.onpopstate;
        window.onpopstate = function(event) {
          if (originalPopState) originalPopState.call(window, event);
          window.dispatchEvent(new Event('locationchange'));
        };

        // Listen for location changes
        window.addEventListener('locationchange', () => {
          this.onLocationChange();
        });

        // Framework-specific navigation detection
        this.setupFrameworkSpecificDetection();

      } catch (error) {
      }
    }

    setupFrameworkSpecificDetection() {
      try {
        switch (this.spaFramework) {
          case 'nextjs':
            this.setupNextJSDetection();
            break;
          case 'react':
            this.setupReactDetection();
            break;
          case 'vue':
            this.setupVueDetection();
            break;
          case 'angular':
            this.setupAngularDetection();
            break;
          case 'generic':
            this.setupGenericSPADetection();
            break;
        }
      } catch (error) {
      }
    }

    setupNextJSDetection() {
      // Watch for Next.js router events if available
      if (window.next?.router) {
        window.next.router.events.on('routeChangeComplete', () => {
          window.dispatchEvent(new Event('locationchange'));
        });
      }

      // Watch for __NEXT_DATA__ changes (indicates route change)
      if (window.__NEXT_DATA__) {
        let lastNextData = JSON.stringify(window.__NEXT_DATA__);
        const checkNextDataChange = () => {
          const currentNextData = JSON.stringify(window.__NEXT_DATA__);
          if (currentNextData !== lastNextData) {
            lastNextData = currentNextData;
            window.dispatchEvent(new Event('locationchange'));
          }
        };
        setInterval(checkNextDataChange, 1000);
      }
    }

    setupReactDetection() {
      // React Router detection
      if (window.history && window.location) {
        // Additional React-specific detection could be added here
      }
    }

    setupVueDetection() {
      // Vue Router detection
      if (window.Vue || window.__VUE__) {
        // Watch for Vue router changes if available
        if (window.$router) {
          window.$router.afterEach(() => {
            window.dispatchEvent(new Event('locationchange'));
          });
        }
      }
    }

    setupAngularDetection() {
      // Angular Router detection
      if (window.ng) {
        // Listen for Angular navigation events
        document.addEventListener('angular-route-change', () => {
          window.dispatchEvent(new Event('locationchange'));
        });
      }
    }

    setupGenericSPADetection() {
      // Generic SPA fallback - monitor URL changes more frequently
      let lastUrl = window.location.href;
      const checkUrlChange = () => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;
          window.dispatchEvent(new Event('locationchange'));
        }
      };
      setInterval(checkUrlChange, 500); // More frequent checking for generic SPAs
    }

    async onLocationChange() {
      try {
        const previousUrl = this.currentUrl;
        const newUrl = CONFIG.OVERRIDE_URL || window.location.href;
        
        // Only proceed if URL actually changed
        if (previousUrl === newUrl) {
          return;
        }


        // Clean up previous content
        this.removePreviousContent();

        // Update current URL
        this.currentUrl = newUrl;
        
        // Clear cached content for new page
        this.cachedContent = null;
        this.isLoadingContent = false;
        
        // Reset content injection status for new page
        this.contentInjected = false;
        this.contentTypes = [];
        
        // IMMEDIATE: Load SEO-critical content first for new page
        await this.loadContentEarly();
        
        // Then load remaining content (will use cached content)
        await this.loadContent();
        
        // Track page view for new route
        this.trackPageView();
        
      } catch (error) {
        this.trackError('location_change_failed', error);
      }
    }

    removePreviousContent() {
      try {
        // Remove elements with our tracking attributes
        const elementsToRemove = document.querySelectorAll('[data-clever-search="injected"]');
        elementsToRemove.forEach(element => {
          try {
            element.remove();
          } catch (e) {
            // Ignore removal errors
          }
        });
        
      } catch (error) {
      }
    }

    async onDOMReady() {
      try {
        await this.loadContent(); // Will use cached content, no duplicate API call
        this.trackPageView();
        this.setupPerformanceTracking();
      } catch (error) {
        this.trackError('dom_ready_failed', error);
      }
    }

    // Early execution for SEO-critical elements
    async loadContentEarly() {
      if (CONFIG.SITE_ID === '{{SITE_ID}}') {
        return;
      }

      // Prevent concurrent loading and rate limit calls
      if (this.isLoadingContent) {
        return;
      }

      const now = Date.now();
      if (now - this.lastContentLoadTime < 2000) { // Minimum 2 seconds between calls
        return;
      }

      const url = this.currentUrl;
      
      try {
        this.isLoadingContent = true;
        this.lastContentLoadTime = now;
        
        // Make API call and cache the result
        const response = await this.apiCall(`/api/v1/tracker/${CONFIG.SITE_ID}/content?pageUrl=${encodeURIComponent(url)}`, null, 'GET');

        if (response && Array.isArray(response) && response.length > 0) {
          // Cache the content for later use
          this.cachedContent = response;
          
          // Inject only SEO-critical content immediately
          await this.injectSEOCriticalContent(response);
        }
      } catch (error) {
        if (error.message.includes('HTTP 404')) {
        } else {
        }
      } finally {
        this.isLoadingContent = false;
      }
    }

    async injectSEOCriticalContent(contentItems) {
      
      for (const item of contentItems) {
        try {
          // Only inject title, description, and keywords early
          switch (item.type) {
            case 'title':
              this.injectTitle({ optimized: item.content });
              break;
            case 'description':
              this.injectMetaDescription({ optimized: item.content });
              break;
            case 'keywords':
              this.injectKeywords({ keywords: item.content });
              break;
            // Skip FAQ and paragraph content for early injection
          }
        } catch (error) {
          this.trackError('early_content_injection_failed', { type: item.type, error: error.message });
        }
      }
    }

    async loadContent() {
      if (CONFIG.SITE_ID === '{{SITE_ID}}') {
        return;
      }

      try {
        let contentItems = this.cachedContent;
        
        // If no cached content, fetch it (fallback case)
        if (!contentItems) {
          // Check rate limiting
          const now = Date.now();
          if (now - this.lastContentLoadTime < 2000) {
            return;
          }

          const url = this.currentUrl;
          
          this.lastContentLoadTime = now;
          const response = await this.apiCall(`/api/v1/tracker/${CONFIG.SITE_ID}/content?pageUrl=${encodeURIComponent(url)}`, null, 'GET');

          if (response && Array.isArray(response) && response.length > 0) {
            contentItems = response;
            this.cachedContent = contentItems; // Cache for future use
          }
        } else {
        }

        if (contentItems && contentItems.length > 0) {
          // Skip SEO-critical content as it was already injected early
          await this.injectContent(contentItems, true);
          
          // No interval updates needed - content is injected once
        }
      } catch (error) {
        if (error.message.includes('HTTP 404')) {
        } else {
        }
      }
    }

    // Removed setupIntervalUpdates - no longer needed

    async injectContent(contentItems, skipSEOCritical = false) {
      const injectedTypes = [];
      
      for (const item of contentItems) {
        try {
          let injected = false;
          
          // Skip SEO-critical content if it was already injected early
          if (skipSEOCritical && ['title', 'description', 'keywords'].includes(item.type)) {
            continue;
          }
          
          switch (item.type) {
            case 'title':
              injected = this.injectTitle({ optimized: item.content });
              break;
            case 'description':
              injected = this.injectMetaDescription({ optimized: item.content });
              break;
            case 'keywords':
              injected = this.injectKeywords({ keywords: item.content });
              break;
            case 'faq':
              injected = this.injectFAQ(JSON.parse(item.content));
              break;
            case 'paragraph':
              injected = this.injectParagraph({ content: item.content });
              break;
            default:
          }
          
          if (injected && !injectedTypes.includes(item.type)) {
            injectedTypes.push(item.type);
          }
        } catch (error) {
          this.trackError('content_injection_failed', { type: item.type, error: error.message });
        }
      }

      if (injectedTypes.length > 0) {
        this.contentInjected = true;
        this.contentTypes = [...(this.contentTypes || []), ...injectedTypes];
        this.trackEvent('content_injected', { 
          contentTypes: injectedTypes,
          itemCount: contentItems.length,
          spaFramework: this.spaFramework
        });
      }
    }

    injectTitle(data) {
      if (!data || !data.optimized) return false;
      
      try {
        const newTitle = data.optimized;
        let titleElementExists = false;
        
        // First, handle existing titles (like sample tracker)
        const existingTitles = document.querySelectorAll('title');
        if (existingTitles?.length) {
          existingTitles?.forEach(item => {
            if (this.spaFramework !== 'nextjs') {
              item?.remove();
            }
          });
        }
        
        // Check if title element exists after removal
        titleElementExists = document.querySelector('title') || false;
        
        if (titleElementExists) {
          // Update existing title element using innerHTML
          titleElementExists.innerHTML = newTitle;
          injectionCounts.title++;
        } else {
          // Create new title element
          injectionCounts.title++;
          
          if (this.spaFramework === 'nextjs') {
            // For Next.js, find title element and update innerHTML
            const titleElement = document.querySelector('title');
            if (titleElement) {
              titleElement.innerHTML = newTitle;
            }
          } else {
            // For regular HTML, insert new title tag
            const titleTag = `<title>${newTitle}</title>`;
            document.head.insertAdjacentHTML('afterbegin', titleTag);
          }
        }
        
        // Also update H1 tags if specified
        // if (data.updateH1 !== false) {
        //   const h1 = document.querySelector('h1');
        //   if (h1) {
        //     h1.textContent = newTitle;
        //   }
        // }
        
        return true;
      } catch (error) {
      }
      return false;
    }

    injectMetaDescription(data) {
      if (!data || !data.optimized) return false;
      
      try {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          metaDesc.setAttribute('data-clever-search', 'injected');
          document.head.appendChild(metaDesc);
        }
        
        if (metaDesc.getAttribute('content') !== data.optimized) {
          metaDesc.setAttribute('content', data.optimized);
          injectionCounts.meta++;
          return true;
        }
      } catch (error) {
      }
      return false;
    }

    injectKeywords(data) {
      if (!data) return false;
      
      let injected = false;
      
      try {
        // Meta keywords
        if (data.keywords) {
          let metaKeywords = document.querySelector('meta[name="keywords"]');
          if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.setAttribute('name', 'keywords');
            metaKeywords.setAttribute('data-clever-search', 'injected');
            document.head.appendChild(metaKeywords);
          }
          
          if (metaKeywords.getAttribute('content') !== data.keywords) {
            metaKeywords.setAttribute('content', data.keywords);
            injectionCounts.keywords++;
            injected = true;
          }
        }

        // Inject keyword-rich content if specified
        if (data.contentInjection && data.contentInjection.target && data.contentInjection.html) {
          const target = document.querySelector(data.contentInjection.target);
          if (target) {
            // Remove existing keyword content
            const existingKeywordContent = target.querySelector('.clever-search-keywords[data-clever-search="injected"]');
            if (existingKeywordContent) {
              existingKeywordContent.remove();
            }

            const keywordContent = document.createElement('div');
            keywordContent.innerHTML = data.contentInjection.html;
                    keywordContent.className = 'clever-search-keywords';
        keywordContent.setAttribute('data-clever-search', 'injected');
            
            if (data.contentInjection.hidden) {
              keywordContent.style.display = 'none';
            }
            
            target.appendChild(keywordContent);
            injected = true;
          }
        }
      } catch (error) {
      }
      
      return injected;
    }

    injectFAQ(data) {
      if (!data || !data.questions || !Array.isArray(data.questions)) return false;
      
      try {
        const targetSelector = data.placement || '.clever-search-faq';
        let target = document.querySelector(targetSelector);
        
        if (!target) {
          // Create FAQ container at end of main content
          const mainContent = document.querySelector('main, article, .content, #content, .main-content, body');
          if (mainContent) {
            target = document.createElement('div');
                    target.className = 'clever-search-faq';
        target.setAttribute('data-clever-search', 'injected');
            mainContent.appendChild(target);
          } else {
            return false;
          }
        }

        // Generate FAQ HTML
        const faqHTML = this.generateFAQHTML(data.questions, data.title || 'Frequently Asked Questions');
        
        // Only update if content is different
        if (target.innerHTML !== faqHTML) {
          target.innerHTML = faqHTML;
          injectionCounts.faq++;

          // Add schema markup if requested
          if (data.schemaMarkup !== false) {
            this.addFAQSchema(data.questions);
          }
          
          return true;
        }
      } catch (error) {
      }
      return false;
    }

    injectParagraph(data) {
      if (!data || !data.content) return false;
      
      try {
        const targetSelector = data.placement || '.clever-search-content';
        let target = document.querySelector(targetSelector);
        
        if (!target) {
          const mainContent = document.querySelector('main, article, .content, #content, .main-content');
          if (mainContent) {
            target = document.createElement('div');
                                target.className = 'clever-search-content';
            target.setAttribute('data-clever-search', 'injected');
            mainContent.appendChild(target);
          } else {
            return false;
          }
        }

        // Remove existing paragraph content
        const existingParagraph = target.querySelector('.clever-search-paragraph[data-clever-search="injected"]');
        if (existingParagraph) {
          existingParagraph.remove();
        }

        const paragraph = document.createElement('div');
        paragraph.className = 'clever-search-paragraph';
        paragraph.innerHTML = data.content;
        paragraph.setAttribute('data-clever-search', 'injected');
        
        if (data.hidden) {
          paragraph.style.display = 'none';
        }
        
        target.appendChild(paragraph);
        injectionCounts.paragraph++;
        return true;
      } catch (error) {
      }
      return false;
    }

    generateFAQHTML(questions, title) {
      const faqItems = questions.map((q, index) => `
        <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
          <h3 class="faq-question" itemprop="name">${this.escapeHtml(q.question)}</h3>
          <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <div itemprop="text">${q.answer}</div>
          </div>
        </div>
      `).join('');

      return `
        <div class="faq-section" itemscope itemtype="https://schema.org/FAQPage">
          <h2 class="faq-title">${this.escapeHtml(title)}</h2>
          ${faqItems}
        </div>
      `;
    }

    addFAQSchema(questions) {
      try {
        // Remove existing schema
        const existingSchema = document.querySelector('script[type="application/ld+json"][data-clever-search="injected"]');
        if (existingSchema) {
          existingSchema.remove();
        }

        const schema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": questions.map(q => ({
            "@type": "Question",
            "name": q.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": q.answer
            }
          }))
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        script.setAttribute('data-clever-search', 'injected');
        document.head.appendChild(script);
      } catch (error) {
      }
    }

    trackPageView() {
      // Only track page view once per page load
      if (this.pageViewTracked) {
        return;
      }
      
      this.pageViewTracked = true;
      const loadTime = Date.now() - this.pageLoadTime;
      
      this.trackEvent('page_view', {
        url: this.currentUrl,
        title: document.title,
        loadTime: loadTime,
        contentInjected: this.contentInjected,
        contentTypes: this.contentTypes,
        spaFramework: this.spaFramework,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        // Additional analytics data
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : null,
        // Performance timing data
        performanceTiming: performance.timing ? {
          navigationStart: performance.timing.navigationStart,
          loadEventEnd: performance.timing.loadEventEnd,
          domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd
        } : null
      });
    }

    setupPerformanceTracking() {
      // Prevent multiple setups
      if (this.performanceTrackingSetup) {
        return;
      }
      this.performanceTrackingSetup = true;

      // Track page unload
      window.addEventListener('beforeunload', () => {
        const timeOnPage = Date.now() - this.pageLoadTime;
        this.trackEvent('page_unload', {
          timeOnPage: timeOnPage,
          contentInjected: this.contentInjected,
          spaFramework: this.spaFramework
        });
      });

      // Enable Web Vitals tracking for analytics
      if (typeof PerformanceObserver !== 'undefined') {
        try {
          this.trackWebVitals();
        } catch (error) {
          // Silently fail for web vitals
        }
      }
    }

    trackWebVitals() {
      // Prevent multiple web vitals observers
      if (this.webVitalsSetup) {
        return;
      }
      this.webVitalsSetup = true;

      // Initialize web vitals data object
      this.webVitalsData = {
        lcp: null,
        fid: null,
        cls: 0,
        contentInjected: this.contentInjected,
        spaFramework: this.spaFramework
      };

      // Track Largest Contentful Paint (LCP) - modern approach
      try {
        // Method 1: Set up observer for LCP measurements
        if (typeof PerformanceObserver !== 'undefined') {
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.webVitalsData.lcp = lastEntry.startTime;
            this.checkAndSendWebVitals();
          }).observe({ entryTypes: ['largest-contentful-paint'] });
        }
        
        // Method 2: Fallback using navigation timing after 3 seconds
        setTimeout(() => {
          if (this.webVitalsData.lcp === null && performance.timing) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            if (loadTime > 0) {
              this.webVitalsData.lcp = loadTime;
              this.checkAndSendWebVitals();
            }
          }
        }, 3000);
        
      } catch (error) {
        // Fallback: use navigation timing
        setTimeout(() => {
          if (this.webVitalsData.lcp === null && performance.timing) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            if (loadTime > 0) {
              this.webVitalsData.lcp = loadTime;
              this.checkAndSendWebVitals();
            }
          }
        }, 3000);
      }

      // Track First Input Delay (FID) - only once per session
      try {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const firstEntry = entries[0]; // Only track the first input
          this.webVitalsData.fid = firstEntry.processingStart - firstEntry.startTime;
          this.checkAndSendWebVitals();
        }).observe({ entryTypes: ['first-input'] });
      } catch (error) {
        // Ignore FID tracking errors
      }

      // Track Cumulative Layout Shift (CLS) - accumulate all shifts
      try {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              this.webVitalsData.cls += entry.value;
            }
          });
          this.checkAndSendWebVitals();
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Also send final web vitals when page is about to unload
        window.addEventListener('beforeunload', () => {
          this.sendWebVitalsIfReady();
        });
        
        // Fallback: Send web vitals after 10 seconds if not already sent
        setTimeout(() => {
          // If LCP is still null, try to calculate it from navigation timing
          if (this.webVitalsData.lcp === null && performance.timing) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            if (loadTime > 0) {
              this.webVitalsData.lcp = loadTime;
            }
          }
          this.sendWebVitalsIfReady();
        }, 10000);
      } catch (error) {
        // Ignore CLS tracking errors
      }
    }

    checkAndSendWebVitals() {
      // Send web vitals as soon as we have LCP (which always happens)
      if (this.webVitalsData.lcp !== null) {
        this.sendWebVitalsIfReady();
      }
    }

    sendWebVitalsIfReady() {
      // Only send once per page load
      if (this.webVitalsSent) {
        return;
      }
      
      this.webVitalsSent = true;
      
      // Prepare web vitals data - send even if LCP is null
      const webVitalsData = {
        lcp: this.webVitalsData.lcp,
        fid: this.webVitalsData.fid,
        cls: this.webVitalsData.cls,
        contentInjected: this.webVitalsData.contentInjected,
        spaFramework: this.webVitalsData.spaFramework,
        timestamp: new Date().toISOString()
      };

      // Send combined web vitals event
      this.trackEvent('web_vitals', webVitalsData);
    }

    async trackEvent(eventType, data = {}) {
      try {
        // Rate limiting: minimum 1 second between events (except web vitals)
        const now = Date.now();
        if (eventType !== 'web_vital' && eventType !== 'web_vitals' && now - this.lastEventTime < 1000) {
          return;
        }

        // Create unique event key to prevent duplicates
        const eventKey = `${eventType}_${this.currentUrl}_${this.sessionId}_${JSON.stringify(data)}`;
        
        // Check if this exact event is already being sent
        if (this.pendingEvents.has(eventKey)) {
          return;
        }
        
        // Check if this event was already sent
        if (this.eventsSent.has(eventKey)) {
          return;
        }

        // Mark this event as pending
        this.pendingEvents.add(eventKey);
        this.lastEventTime = now;
        
        try {
          const userAgent = navigator?.userAgent || 'unknown';
          
          await this.apiCall(`/api/v1/tracker/${CONFIG.SITE_ID}/data`, {
            pageUrl: this.currentUrl,
            eventType,
            eventData: data,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            userAgent: userAgent,
            referrer: document.referrer
          });

          // Mark this event as successfully sent
          this.eventsSent.add(eventKey);
          
          // Clean up old event keys to prevent memory leaks
          if (this.eventsSent.size > 100) {
            const keysArray = Array.from(this.eventsSent);
            this.eventsSent.clear();
            keysArray.slice(-50).forEach(key => this.eventsSent.add(key));
          }
          
        } catch (apiError) {
          throw apiError;
        } finally {
          this.pendingEvents.delete(eventKey);
        }
      } catch (error) {
        // Silently fail for tracking to not affect user experience
      }
    }

    trackError(errorType, error) {
      this.trackEvent('error', {
        type: errorType,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userAgent: navigator.userAgent,
        url: this.currentUrl,
        isNextJS: this.isNextJS
      });
    }

    async apiCall(endpoint, data, method = 'POST', retries = 0) {
      try {
        const requestOptions = {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        };

        // Only add body for POST requests
        if (method === 'POST' && data) {
          requestOptions.body = JSON.stringify(data);
        }

        // Add performance timing
        const startTime = performance.now();
        const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, requestOptions);
        const endTime = performance.now();
        
        if (CONFIG.DEBUG_MODE) {
        }

        if (!response.ok) {
          // Don't retry on client errors (4xx) - they indicate invalid requests or missing resources
          // if (response.status >= 400 && response.status < 500) {
          //   throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          // }
          // // Only retry on server errors (5xx) or network issues
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        // Only retry on server errors (5xx) or network issues, not on client errors (4xx)
        const isRetryableError = !error.message.includes('HTTP 4') && 
                                (error.message.includes('HTTP 5') || 
                                 error.message.includes('fetch') || 
                                 error.message.includes('network') ||
                                 error.message.includes('timeout'));
        
        if (isRetryableError && retries < CONFIG.RETRY_ATTEMPTS) {
          await this.delay(1000 * Math.pow(2, retries)); // Exponential backoff
          return this.apiCall(endpoint, data, retries + 1);
        }
        throw error;
      }
    }

    generateSessionId() {
      return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // Manual refresh function for immediate content updates
    async refreshContent() {
      try {
        // Remove previous content
        this.removePreviousContent();
        
        // Clear cached content to force fresh fetch
        this.cachedContent = null;
        
        // Load fresh content
        await this.loadContentEarly();
        await this.loadContent();
        
        return true;
      } catch (error) {
        return false;
      }
    }
  }

  // Initialize tracker when script loads
  // Only initialize if we're not in an iframe and we have a valid site ID
  if (window === window.top && CONFIG.SITE_ID !== '{{SITE_ID}}') {
    // Prevent multiple tracker instances
    if (window.llmOptimizerTracker) {
      return;
    }
    
    try {
      window.llmOptimizerTracker = new LLMOptimizerTracker();
      
      // Expose global API for manual control
      window.LLMOptimizer = {
        refresh: () => window.llmOptimizerTracker?.refreshContent(),
        getStats: () => ({
          config: CONFIG,
          injectionCounts: injectionCounts,
          sessionId: window.llmOptimizerTracker?.sessionId,
          currentUrl: window.llmOptimizerTracker?.currentUrl,
          contentInjected: window.llmOptimizerTracker?.contentInjected,
          contentTypes: window.llmOptimizerTracker?.contentTypes,
          spaFramework: window.llmOptimizerTracker?.spaFramework
        }),
        enableDebug: () => {
          CONFIG.DEBUG_MODE = true;
        },
        enableFastMode: () => {
          CONFIG.FAST_MODE = true;
          CONFIG.UPDATE_INTERVAL = 250; // Super fast updates
        }
      };
      
      // Add diagnostics summary if enabled
      if (diagnosticsEnabled) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            // Diagnostics summary
          }, 2000);
        });
      }
    } catch (error) {
      // Initialization failed
    }
  }
})();