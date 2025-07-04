(function() {
  'use strict';
  
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
    console.warn('LLM Optimizer: Failed to parse configuration, using defaults');
  }

  // Configuration - merge with provided config or use defaults
  const CONFIG = {
    API_BASE: configData.API_BASE || 'http://localhost:3001',
    SITE_ID: configData.SITE_ID || '{{SITE_ID}}',
    VERSION: configData.VERSION || '1.0.0',
    RETRY_ATTEMPTS: configData.RETRY_ATTEMPTS || 3,
    TIMEOUT: configData.TIMEOUT || 5000,
    UPDATE_INTERVAL: configData.UPDATE_INTERVAL || 3000,
    MAX_INTERVAL_DURATION: configData.MAX_INTERVAL_DURATION || 30000
  };

  // Detect Next.js environment
  const isNextJS = () => window?.next || window?.__NEXT_DATA__ || document.querySelector('[data-nextjs-scroll-focus-boundary]');

  // Diagnostics helper
  const urlParams = new URLSearchParams(window.location.search);
  const diagnosticsEnabled = urlParams.has('llm-optimizer-debug') || urlParams.has('diagnostics');
  const consolePrint = (message) => {
    if (diagnosticsEnabled) {
      console.log(`[LLM Optimizer] ${message}`);
    }
  };

  // Counters for diagnostics
  let injectionCounts = {
    title: 0,
    meta: 0,
    faq: 0,
    paragraph: 0,
    keywords: 0
  };

  // Interval ID for cleanup
  let updateIntervalId = null;

  // Main tracker class
  class LLMOptimizerTracker {
    constructor() {
      this.sessionId = this.generateSessionId();
      this.pageLoadTime = Date.now();
      this.contentInjected = false;
      this.contentTypes = [];
      this.isNextJS = isNextJS();
      this.currentUrl = window.location.href;
      this.init();
    }

    async init() {
      try {
        consolePrint('Initializing LLM Optimizer Tracker');
        consolePrint(`Environment: ${this.isNextJS ? 'Next.js' : 'Standard HTML'}`);
        
        // IMMEDIATE: Load SEO-critical content as early as possible
        await this.loadContentEarly();
        
        // Set up SPA navigation handling for Next.js
        if (this.isNextJS) {
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

        // Hook into popstate for back/forward navigation
        const originalPopState = window.onpopstate;
        window.onpopstate = function(event) {
          if (originalPopState) originalPopState.call(window, event);
          window.dispatchEvent(new Event('locationchange'));
        };

        // Listen for location changes
        window.addEventListener('locationchange', () => {
          consolePrint('Location changed - reloading content');
          this.onLocationChange();
        });

        consolePrint('SPA navigation handling set up');
      } catch (error) {
        consolePrint('SPA navigation setup failed: ' + error.message);
      }
    }

    async onLocationChange() {
      try {
        // Clean up previous content
        this.removePreviousContent();
        
        // Clear existing interval
        if (updateIntervalId) {
          clearInterval(updateIntervalId);
          updateIntervalId = null;
        }

        // Update current URL
        this.currentUrl = window.location.href;
        
        // IMMEDIATE: Load SEO-critical content first for new page
        await this.loadContentEarly();
        
        // Then load remaining content
        await this.loadContent();
        this.trackPageView();
      } catch (error) {
        this.trackError('location_change_failed', error);
      }
    }

    removePreviousContent() {
      try {
        // Remove elements with our tracking attributes
        const elementsToRemove = document.querySelectorAll('[data-llm-optimizer="injected"]');
        elementsToRemove.forEach(element => {
          try {
            element.remove();
          } catch (e) {
            // Ignore removal errors
          }
        });
        
        consolePrint(`Removed ${elementsToRemove.length} previously injected elements`);
      } catch (error) {
        consolePrint('Error removing previous content: ' + error.message);
      }
    }

    async onDOMReady() {
      try {
        consolePrint('DOM ready - loading content');
        await this.loadContent();
        this.trackPageView();
        this.setupPerformanceTracking();
      } catch (error) {
        this.trackError('dom_ready_failed', error);
      }
    }

    // Early execution for SEO-critical elements
    async loadContentEarly() {
      if (CONFIG.SITE_ID === '{{SITE_ID}}') {
        console.warn('LLM Optimizer: Invalid site ID. Please ensure script is properly configured.');
        return;
      }

      const url = this.currentUrl;
      
      try {
        consolePrint('Early content loading for SEO...');
        const response = await this.apiCall('/tracker/content', {
          url: url,
          siteId: CONFIG.SITE_ID,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          isNextJS: this.isNextJS,
          priority: 'seo_critical' // Flag for server to prioritize title/meta
        });

        if (response.success && response.content && response.content.length > 0) {
          // Inject only SEO-critical content immediately
          await this.injectSEOCriticalContent(response.content);
        }
      } catch (error) {
        console.warn('LLM Optimizer: Failed to load early content:', error.message);
      }
    }

    async injectSEOCriticalContent(contentItems) {
      consolePrint('Injecting SEO-critical content immediately...');
      
      for (const item of contentItems) {
        try {
          // Only inject title, description, and keywords early
          switch (item.type) {
            case 'title':
              this.injectTitle(item.data);
              consolePrint('Early title injection completed');
              break;
            case 'description':
              this.injectMetaDescription(item.data);
              consolePrint('Early meta description injection completed');
              break;
            case 'keywords':
              this.injectKeywords(item.data);
              consolePrint('Early keywords injection completed');
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
        console.warn('LLM Optimizer: Invalid site ID. Please ensure script is properly configured.');
        return;
      }

      const url = this.currentUrl;
      
      try {
        const response = await this.apiCall('/tracker/content', {
          url: url,
          siteId: CONFIG.SITE_ID,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          isNextJS: this.isNextJS
        });

        if (response.success && response.content && response.content.length > 0) {
          // Skip SEO-critical content as it was already injected early
          await this.injectContent(response.content, false, true);
          
          // Set up interval updates for Next.js to handle React re-renders
          if (this.isNextJS) {
            this.setupIntervalUpdates(response.content);
          }
        }
      } catch (error) {
        console.warn('LLM Optimizer: Failed to load content:', error.message);
      }
    }

    setupIntervalUpdates(contentItems) {
      if (updateIntervalId) {
        clearInterval(updateIntervalId);
      }

      updateIntervalId = setInterval(() => {
        consolePrint('Interval update - reapplying content');
        this.injectContent(contentItems, true);
      }, CONFIG.UPDATE_INTERVAL);

      // Clear interval after max duration
      setTimeout(() => {
        if (updateIntervalId) {
          clearInterval(updateIntervalId);
          updateIntervalId = null;
          consolePrint('Interval updates stopped');
        }
      }, CONFIG.MAX_INTERVAL_DURATION);
    }

    async injectContent(contentItems, isIntervalUpdate = false, skipSEOCritical = false) {
      const injectedTypes = [];
      
      for (const item of contentItems) {
        try {
          let injected = false;
          
          // Skip SEO-critical content if it was already injected early
          if (skipSEOCritical && ['title', 'description', 'keywords'].includes(item.type)) {
            consolePrint(`Skipping ${item.type} - already injected early for SEO`);
            continue;
          }
          
          switch (item.type) {
            case 'title':
              injected = this.injectTitle(item.data);
              break;
            case 'description':
              injected = this.injectMetaDescription(item.data);
              break;
            case 'keywords':
              injected = this.injectKeywords(item.data);
              break;
            case 'faq':
              injected = this.injectFAQ(item.data);
              break;
            case 'paragraph':
              injected = this.injectParagraph(item.data);
              break;
            default:
              console.warn('LLM Optimizer: Unknown content type:', item.type);
          }
          
          if (injected && !injectedTypes.includes(item.type)) {
            injectedTypes.push(item.type);
          }
        } catch (error) {
          this.trackError('content_injection_failed', { type: item.type, error: error.message });
        }
      }

      if (injectedTypes.length > 0 && !isIntervalUpdate) {
        this.contentInjected = true;
        this.contentTypes = [...(this.contentTypes || []), ...injectedTypes];
        this.trackEvent('content_injected', { 
          contentTypes: injectedTypes,
          itemCount: contentItems.length,
          isNextJS: this.isNextJS
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
            if (!this.isNextJS) {
              item?.remove();
            }
          });
        }
        
        // Check if title element exists after removal
        titleElementExists = document.querySelector('title') || false;
        
        if (titleElementExists) {
          // Update existing title element using innerHTML
          consolePrint(`Replacing existing title content - ${newTitle}`);
          titleElementExists.innerHTML = newTitle;
          injectionCounts.title++;
        } else {
          // Create new title element
          consolePrint(`Header Title Not Found - creating new title`);
          injectionCounts.title++;
          
          if (this.isNextJS) {
            // For Next.js, find title element and update innerHTML
            const titleElement = document.querySelector('title');
            if (titleElement) {
              titleElement.innerHTML = newTitle;
            }
          } else {
            // For regular HTML, insert new title tag
            const titleTag = `<title>${newTitle}</title>`;
            consolePrint(`Inserting Title tag element: ${titleTag}`);
            document.head.insertAdjacentHTML('afterbegin', titleTag);
          }
        }
        
        // Also update H1 tags if specified
        if (data.updateH1 !== false) {
          const h1 = document.querySelector('h1');
          if (h1) {
            h1.textContent = newTitle;
          }
        }
        
        consolePrint(`Title updated: ${newTitle}`);
        return true;
      } catch (error) {
        console.warn('LLM Optimizer: Title injection failed:', error);
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
          metaDesc.setAttribute('data-llm-optimizer', 'injected');
          document.head.appendChild(metaDesc);
        }
        
        if (metaDesc.getAttribute('content') !== data.optimized) {
          metaDesc.setAttribute('content', data.optimized);
          consolePrint(`Meta description updated: ${data.optimized}`);
          injectionCounts.meta++;
          return true;
        }
      } catch (error) {
        console.warn('LLM Optimizer: Meta description injection failed:', error);
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
            metaKeywords.setAttribute('data-llm-optimizer', 'injected');
            document.head.appendChild(metaKeywords);
          }
          
          if (metaKeywords.getAttribute('content') !== data.keywords) {
            metaKeywords.setAttribute('content', data.keywords);
            consolePrint(`Meta keywords updated: ${data.keywords}`);
            injectionCounts.keywords++;
            injected = true;
          }
        }

        // Inject keyword-rich content if specified
        if (data.contentInjection && data.contentInjection.target && data.contentInjection.html) {
          const target = document.querySelector(data.contentInjection.target);
          if (target) {
            // Remove existing keyword content
            const existingKeywordContent = target.querySelector('.llm-optimizer-keywords[data-llm-optimizer="injected"]');
            if (existingKeywordContent) {
              existingKeywordContent.remove();
            }

            const keywordContent = document.createElement('div');
            keywordContent.innerHTML = data.contentInjection.html;
            keywordContent.className = 'llm-optimizer-keywords';
            keywordContent.setAttribute('data-llm-optimizer', 'injected');
            
            if (data.contentInjection.hidden) {
              keywordContent.style.display = 'none';
            }
            
            target.appendChild(keywordContent);
            consolePrint('Keyword content injected');
            injected = true;
          }
        }
      } catch (error) {
        console.warn('LLM Optimizer: Keywords injection failed:', error);
      }
      
      return injected;
    }

    injectFAQ(data) {
      if (!data || !data.questions || !Array.isArray(data.questions)) return false;
      
      try {
        const targetSelector = data.placement || '.llm-optimizer-faq';
        let target = document.querySelector(targetSelector);
        
        if (!target) {
          // Create FAQ container at end of main content
          const mainContent = document.querySelector('main, article, .content, #content, .main-content, body');
          if (mainContent) {
            target = document.createElement('div');
            target.className = 'llm-optimizer-faq';
            target.setAttribute('data-llm-optimizer', 'injected');
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
          consolePrint(`FAQ injected with ${data.questions.length} questions`);
          injectionCounts.faq++;

          // Add schema markup if requested
          if (data.schemaMarkup !== false) {
            this.addFAQSchema(data.questions);
          }
          
          return true;
        }
      } catch (error) {
        console.warn('LLM Optimizer: FAQ injection failed:', error);
      }
      return false;
    }

    injectParagraph(data) {
      if (!data || !data.content) return false;
      
      try {
        const targetSelector = data.placement || '.llm-optimizer-content';
        let target = document.querySelector(targetSelector);
        
        if (!target) {
          const mainContent = document.querySelector('main, article, .content, #content, .main-content');
          if (mainContent) {
            target = document.createElement('div');
            target.className = 'llm-optimizer-content';
            target.setAttribute('data-llm-optimizer', 'injected');
            mainContent.appendChild(target);
          } else {
            return false;
          }
        }

        // Remove existing paragraph content
        const existingParagraph = target.querySelector('.llm-optimizer-paragraph[data-llm-optimizer="injected"]');
        if (existingParagraph) {
          existingParagraph.remove();
        }

        const paragraph = document.createElement('div');
        paragraph.className = 'llm-optimizer-paragraph';
        paragraph.innerHTML = data.content;
        paragraph.setAttribute('data-llm-optimizer', 'injected');
        
        if (data.hidden) {
          paragraph.style.display = 'none';
        }
        
        target.appendChild(paragraph);
        consolePrint('Paragraph content injected');
        injectionCounts.paragraph++;
        return true;
      } catch (error) {
        console.warn('LLM Optimizer: Paragraph injection failed:', error);
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
        const existingSchema = document.querySelector('script[type="application/ld+json"][data-llm-optimizer="injected"]');
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
        script.setAttribute('data-llm-optimizer', 'injected');
        document.head.appendChild(script);
        consolePrint('FAQ schema added');
      } catch (error) {
        console.warn('LLM Optimizer: FAQ schema injection failed:', error);
      }
    }

    trackPageView() {
      const loadTime = Date.now() - this.pageLoadTime;
      
      this.trackEvent('page_view', {
        url: this.currentUrl,
        title: document.title,
        loadTime: loadTime,
        contentInjected: this.contentInjected,
        contentTypes: this.contentTypes,
        isNextJS: this.isNextJS,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
    }

    setupPerformanceTracking() {
      // Track page unload
      window.addEventListener('beforeunload', () => {
        const timeOnPage = Date.now() - this.pageLoadTime;
        this.trackEvent('page_unload', {
          timeOnPage: timeOnPage,
          contentInjected: this.contentInjected,
          isNextJS: this.isNextJS
        });
      });

      // Track Core Web Vitals if available
      if (typeof PerformanceObserver !== 'undefined') {
        try {
          this.trackWebVitals();
        } catch (error) {
          // Silently fail for web vitals
        }
      }
    }

    trackWebVitals() {
      // Track Largest Contentful Paint (LCP)
      try {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.trackEvent('web_vital', {
            metric: 'LCP',
            value: lastEntry.startTime,
            contentInjected: this.contentInjected,
            isNextJS: this.isNextJS
          });
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        // Ignore LCP tracking errors
      }

      // Track First Input Delay (FID)
      try {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            this.trackEvent('web_vital', {
              metric: 'FID',
              value: entry.processingStart - entry.startTime,
              contentInjected: this.contentInjected,
              isNextJS: this.isNextJS
            });
          });
        }).observe({ entryTypes: ['first-input'] });
      } catch (error) {
        // Ignore FID tracking errors
      }

      // Track Cumulative Layout Shift (CLS)
      try {
        new PerformanceObserver((entryList) => {
          let cls = 0;
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          });
          if (cls > 0) {
            this.trackEvent('web_vital', {
              metric: 'CLS',
              value: cls,
              contentInjected: this.contentInjected,
              isNextJS: this.isNextJS
            });
          }
        }).observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        // Ignore CLS tracking errors
      }
    }

    async trackEvent(eventType, data = {}) {
      try {
        await this.apiCall('/tracker/event', {
          siteId: CONFIG.SITE_ID,
          eventType,
          eventData: data,
          sessionId: this.sessionId,
          url: this.currentUrl,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Silently fail for tracking to not affect user experience
        if (console && console.warn) {
          console.warn('LLM Optimizer tracking failed:', error.message);
        }
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

    async apiCall(endpoint, data, retries = 0) {
      try {
        const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (retries < CONFIG.RETRY_ATTEMPTS) {
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
  }

  // Initialize tracker when script loads
  // Only initialize if we're not in an iframe and we have a valid site ID
  if (window === window.top && CONFIG.SITE_ID !== '{{SITE_ID}}') {
    try {
      window.llmOptimizerTracker = new LLMOptimizerTracker();
      
      // Add diagnostics summary if enabled
      if (diagnosticsEnabled) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            console.log('=== LLM Optimizer Diagnostics ===');
            console.log('Environment:', isNextJS() ? 'Next.js' : 'Standard HTML');
            console.log('Injection Counts:', injectionCounts);
            console.log('Site ID:', CONFIG.SITE_ID);
            console.log('Current URL:', window.location.href);
            console.log('================================');
          }, 2000);
        });
      }
    } catch (error) {
      if (console && console.error) {
        console.error('LLM Optimizer initialization failed:', error);
      }
    }
  }
})();