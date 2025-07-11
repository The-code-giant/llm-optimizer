# JavaScript Tracker Implementation Plan

## 1. JavaScript Tracker Script Architecture

### Core Script Structure
```javascript
(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    API_BASE: 'https://api.llmoptimizer.com',
    SITE_ID: '{{SITE_ID}}', // Replaced during script generation
    VERSION: '1.0.0',
    RETRY_ATTEMPTS: 3,
    TIMEOUT: 5000
  };

  // Main tracker class
  class LLMOptimizerTracker {
    constructor() {
      this.sessionId = this.generateSessionId();
      this.pageLoadTime = Date.now();
      this.contentInjected = false;
      this.init();
    }

    async init() {
      try {
        await this.loadContent();
        this.trackPageView();
        this.setupPerformanceTracking();
      } catch (error) {
        this.trackError('initialization_failed', error);
      }
    }

    async loadContent() {
      const url = window.location.href;
      const response = await this.apiCall('/tracker/content', {
        url: url,
        siteId: CONFIG.SITE_ID,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      });

      if (response.content && response.content.length > 0) {
        await this.injectContent(response.content);
      }
    }

    async injectContent(contentItems) {
      for (const item of contentItems) {
        try {
          switch (item.type) {
            case 'title':
              this.injectTitle(item.data);
              break;
            case 'description':
              this.injectMetaDescription(item.data);
              break;
            case 'keywords':
              this.injectKeywords(item.data);
              break;
            case 'faq':
              this.injectFAQ(item.data);
              break;
            case 'paragraph':
              this.injectParagraph(item.data);
              break;
          }
          this.contentInjected = true;
        } catch (error) {
          this.trackError('content_injection_failed', { type: item.type, error });
        }
      }

      if (this.contentInjected) {
        this.trackEvent('content_injected', { itemCount: contentItems.length });
      }
    }

    injectTitle(data) {
      if (data.optimized && data.optimized !== document.title) {
        document.title = data.optimized;
        
        // Also update any h1 tags if specified
        if (data.updateH1) {
          const h1 = document.querySelector('h1');
          if (h1) h1.textContent = data.optimized;
        }
      }
    }

    injectMetaDescription(data) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', data.optimized);
    }

    injectKeywords(data) {
      // Meta keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', data.meta_keywords);

      // Inject keyword-rich content if specified
      if (data.content_injection && data.content_injection.target) {
        const target = document.querySelector(data.content_injection.target);
        if (target) {
          const keywordContent = document.createElement('div');
          keywordContent.innerHTML = data.content_injection.html;
          keywordContent.style.display = data.content_injection.hidden ? 'none' : 'block';
          target.appendChild(keywordContent);
        }
      }
    }

    injectFAQ(data) {
                const targetSelector = data.placement || '.cleaver-search-faq';
      let target = document.querySelector(targetSelector);
      
      if (!target) {
        // Create FAQ container at end of main content
        const mainContent = document.querySelector('main, article, .content, body');
        target = document.createElement('div');
                    target.className = 'cleaver-search-faq';
        mainContent.appendChild(target);
      }

      // Generate FAQ HTML
      const faqHTML = this.generateFAQHTML(data.questions);
      target.innerHTML = faqHTML;

      // Add schema markup if requested
      if (data.schema_markup) {
        this.addFAQSchema(data.questions);
      }
    }

    generateFAQHTML(questions) {
      const faqItems = questions.map(q => `
        <div class="faq-item">
          <h3 class="faq-question">${q.question}</h3>
          <div class="faq-answer">${q.answer}</div>
        </div>
      `).join('');

      return `
        <div class="faq-section">
          <h2>Frequently Asked Questions</h2>
          ${faqItems}
        </div>
      `;
    }

    addFAQSchema(questions) {
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
      document.head.appendChild(script);
    }

    trackPageView() {
      this.trackEvent('page_view', {
        url: window.location.href,
        title: document.title,
        loadTime: Date.now() - this.pageLoadTime
      });
    }

    setupPerformanceTracking() {
      // Track Core Web Vitals
      if ('web-vital' in window) {
        // Implementation for Core Web Vitals tracking
      }

      // Track page unload
      window.addEventListener('beforeunload', () => {
        this.trackEvent('page_unload', {
          timeOnPage: Date.now() - this.pageLoadTime
        });
      });
    }

    async trackEvent(eventType, data = {}) {
      try {
        await this.apiCall('/tracker/event', {
          siteId: CONFIG.SITE_ID,
          eventType,
          eventData: data,
          sessionId: this.sessionId,
          url: window.location.href,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Silently fail for tracking to not affect user experience
                  console.warn('Clever Search tracking failed:', error);
      }
    }

    trackError(errorType, error) {
      this.trackEvent('error', {
        type: errorType,
        message: error.message || error,
        stack: error.stack,
        userAgent: navigator.userAgent
      });
    }

    async apiCall(endpoint, data, retries = 0) {
      try {
        const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data),
          timeout: CONFIG.TIMEOUT
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
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
  }

  // Initialize tracker when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new LLMOptimizerTracker());
  } else {
    new LLMOptimizerTracker();
  }
})();
```

## 2. Backend API Endpoints

### Content Retrieval Endpoint
```typescript
// /tracker/content
app.post('/tracker/content', async (req, res) => {
  try {
    const { url, siteId, userAgent, referrer, timestamp } = req.body;
    
    // 1. Validate site ID and URL
    const site = await db.select().from(sites).where(eq(sites.trackerId, siteId));
    if (!site.length) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // 2. Normalize URL for lookup
    const normalizedUrl = normalizeUrl(url);
    
    // 3. Get deployed content for this URL
    const content = await db
      .select()
      .from(deployedContent)
      .where(
        and(
          eq(deployedContent.siteId, site[0].id),
          eq(deployedContent.pageUrl, normalizedUrl),
          eq(deployedContent.isActive, true)
        )
      )
      .orderBy(deployedContent.priority);

    // 4. Track the request
    await trackScriptEvent(site[0].id, url, 'content_request', {
      userAgent,
      referrer,
      contentFound: content.length > 0
    });

    // 5. Return formatted content
    const formattedContent = content.map(item => ({
      type: item.contentType,
      data: item.contentData
    }));

    res.json({ content: formattedContent });
  } catch (error) {
    console.error('Content retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Event Tracking Endpoint
```typescript
// /tracker/event
app.post('/tracker/event', async (req, res) => {
  try {
    const { siteId, eventType, eventData, sessionId, url, timestamp } = req.body;
    
    // 1. Validate site
    const site = await db.select().from(sites).where(eq(sites.trackerId, siteId));
    if (!site.length) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // 2. Store event
    await db.insert(scriptEvents).values({
      siteId: site[0].id,
      pageUrl: url,
      eventType,
      eventData,
      sessionId,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      timestamp: new Date(timestamp)
    });

    // 3. Update page analytics if it's a page view
    if (eventType === 'page_view') {
      await updatePageAnalytics(site[0].id, url, eventData);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## 3. Dashboard Integration

### Content Management API
```typescript
// Create/Update deployed content
app.post('/api/sites/:siteId/content', auth, async (req, res) => {
  const { pageUrl, contentType, contentData, isActive = true } = req.body;
  
  try {
    await db
      .insert(deployedContent)
      .values({
        siteId: req.params.siteId,
        pageUrl: normalizeUrl(pageUrl),
        contentType,
        contentData,
        isActive,
        deployedAt: new Date()
      })
      .onConflict((site_id, page_url, content_type))
      .doUpdate({
        contentData,
        isActive,
        updatedAt: new Date(),
        deployedAt: isActive ? new Date() : null
      });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get page analytics
app.get('/api/sites/:siteId/analytics', auth, async (req, res) => {
  const { startDate, endDate, pageUrl } = req.query;
  
  try {
    let query = db
      .select()
      .from(pageAnalytics)
      .where(eq(pageAnalytics.siteId, req.params.siteId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          gte(pageAnalytics.visitDate, new Date(startDate)),
          lte(pageAnalytics.visitDate, new Date(endDate))
        )
      );
    }
    
    if (pageUrl) {
      query = query.where(eq(pageAnalytics.pageUrl, pageUrl));
    }
    
    const analytics = await query.orderBy(desc(pageAnalytics.visitDate));
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 4. Performance & SEO Optimization

### Script Loading Strategy
```html
<!-- Asynchronous loading -->
<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://cdn.llmoptimizer.com/tracker/v1/tracker.js?site={{SITE_ID}}';
  script.async = true;
  script.defer = true;
  
  script.onerror = function() {
              console.warn('Clever Search script failed to load');
  };
  
  var firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode.insertBefore(script, firstScript);
})();
</script>
```

### SEO Considerations
1. **Server-Side Rendering**: For critical content (title, meta description), consider server-side injection
2. **Hydration Strategy**: Ensure injected content is crawlable by search engines
3. **Schema Markup**: Add structured data for FAQ and other content types
4. **Performance**: Minimize script size and loading impact
5. **Caching**: Implement CDN caching for tracker script

## 5. Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- Database schema migration
- Basic API endpoints
- Simple script with page view tracking

### Phase 2: Content Injection (Week 3-4)
- Content storage and retrieval
- DOM manipulation for title/meta
- Dashboard content management UI

### Phase 3: Advanced Features (Week 5-6)
- FAQ injection with schema markup
- Performance tracking
- Analytics dashboard

### Phase 4: Optimization (Week 7-8)
- Performance optimization
- Error handling improvements
- Advanced analytics features

## 6. Security & Privacy

### Data Protection
- No PII collection
- Anonymized session tracking
- IP address hashing for privacy
- GDPR compliance considerations

### Security Measures
- Rate limiting for API endpoints
- Input validation and sanitization
- CSP (Content Security Policy) compatibility
- XSS protection for injected content

## 7. Testing Strategy

### Unit Tests
- Content injection functions
- URL normalization
- Error handling

### Integration Tests  
- End-to-end content deployment
- Analytics tracking accuracy
- Dashboard functionality

### Performance Tests
- Script loading impact
- API response times
- Database query optimization

This implementation plan provides a robust foundation for the JavaScript tracking script feature while ensuring performance, security, and SEO best practices. 