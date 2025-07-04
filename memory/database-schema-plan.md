# Database Schema Analysis for JavaScript Tracker Feature

## Current Database Schema Status ✅

### Existing Tables (Already Implemented)

#### 1. `page_content` Table ✅ (Similar to proposed `deployed_content`)
```sql
-- ALREADY EXISTS - Good for content storage but needs enhancement
CREATE TABLE page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id),
  content_type VARCHAR(64) NOT NULL, -- 'title', 'description', 'faq', 'paragraph', 'keywords'
  original_content TEXT,
  optimized_content TEXT NOT NULL,
  ai_model VARCHAR(128),
  generation_context TEXT,
  is_active INTEGER DEFAULT 1, -- 0 or 1 for boolean
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `tracker_data` Table ✅ (Basic tracking exists)
```sql
-- ALREADY EXISTS - Basic tracking but needs enhancement
CREATE TABLE tracker_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  page_url VARCHAR(1024),
  event_type VARCHAR(64),
  timestamp TIMESTAMP DEFAULT NOW(),
  session_id UUID,
  anonymous_user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `sites` Table ✅ (Has tracker_id field)
```sql
-- ALREADY EXISTS - Perfect for tracker authentication
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(512) NOT NULL UNIQUE,
  tracker_id UUID NOT NULL UNIQUE, -- ✅ Perfect for script authentication
  status VARCHAR(32) NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Required Schema Changes 🔄

### Issue 1: Content Lookup by URL
**Problem:** Current `page_content` table requires `page_id`, but JavaScript tracker only knows the URL.

**Solution:** Add URL-based lookup capability
```sql
-- ENHANCEMENT NEEDED: Add index and URL lookup
ALTER TABLE page_content ADD COLUMN page_url VARCHAR(1024);
UPDATE page_content SET page_url = (SELECT url FROM pages WHERE pages.id = page_content.page_id);
CREATE INDEX idx_page_content_url_type ON page_content(page_url, content_type) WHERE is_active = 1;
```

### Issue 2: Enhanced Analytics
**Current `tracker_data` is too basic.** We need detailed analytics:

```sql
-- NEW TABLE NEEDED
CREATE TABLE page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  page_url VARCHAR(1024) NOT NULL,
  visit_date DATE NOT NULL,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2),
  avg_session_duration INTEGER, -- seconds
  load_time_ms INTEGER,
  content_injected BOOLEAN DEFAULT false,
  content_types_injected TEXT[], -- Array of content types injected
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_site_url_date UNIQUE(site_id, page_url, visit_date)
);

CREATE INDEX idx_analytics_site_date ON page_analytics(site_id, visit_date);
CREATE INDEX idx_analytics_url ON page_analytics(page_url);
```

### Issue 3: Enhanced Event Tracking
**Current `tracker_data` lacks detailed event data:**

```sql
-- ENHANCEMENT: Expand tracker_data or create new table
ALTER TABLE tracker_data ADD COLUMN event_data JSONB;
ALTER TABLE tracker_data ADD COLUMN user_agent VARCHAR(500);
ALTER TABLE tracker_data ADD COLUMN ip_address INET;
ALTER TABLE tracker_data ADD COLUMN referrer VARCHAR(1024);

-- Add indexes for better performance
CREATE INDEX idx_tracker_data_site_time ON tracker_data(site_id, timestamp);
CREATE INDEX idx_tracker_data_event_type ON tracker_data(event_type);
CREATE INDEX idx_tracker_data_session ON tracker_data(session_id);
```

## Required Database Migration

### Migration Script for JavaScript Tracker Feature

```sql
-- Migration: 0003_tracker_enhancements.sql

-- 1. Enhance page_content table for URL-based lookup
ALTER TABLE page_content ADD COLUMN page_url VARCHAR(1024);
UPDATE page_content SET page_url = (
  SELECT url FROM pages WHERE pages.id = page_content.page_id
);
CREATE INDEX idx_page_content_url_active ON page_content(page_url, content_type, is_active);

-- 2. Create page_analytics table
CREATE TABLE page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  page_url VARCHAR(1024) NOT NULL,
  visit_date DATE NOT NULL,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2),
  avg_session_duration INTEGER,
  load_time_ms INTEGER,
  content_injected BOOLEAN DEFAULT false,
  content_types_injected TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_site_url_date UNIQUE(site_id, page_url, visit_date)
);

CREATE INDEX idx_analytics_site_date ON page_analytics(site_id, visit_date);
CREATE INDEX idx_analytics_url ON page_analytics(page_url);

-- 3. Enhance tracker_data table
ALTER TABLE tracker_data ADD COLUMN event_data JSONB;
ALTER TABLE tracker_data ADD COLUMN user_agent VARCHAR(500);
ALTER TABLE tracker_data ADD COLUMN ip_address INET;
ALTER TABLE tracker_data ADD COLUMN referrer VARCHAR(1024);

CREATE INDEX idx_tracker_data_site_time ON tracker_data(site_id, timestamp);
CREATE INDEX idx_tracker_data_event_type ON tracker_data(event_type);
CREATE INDEX idx_tracker_data_session ON tracker_data(session_id);
```

## API Query Examples with Current Schema

### Content Retrieval for JavaScript Tracker
```typescript
// Using existing page_content table with URL lookup
const getDeployedContent = async (siteId: string, pageUrl: string) => {
  const site = await db.select().from(sites).where(eq(sites.trackerId, siteId));
  if (!site.length) throw new Error('Site not found');

  const content = await db
    .select({
      contentType: pageContent.contentType,
      optimizedContent: pageContent.optimizedContent,
      metadata: pageContent.metadata
    })
    .from(pageContent)
    .where(
      and(
        eq(pageContent.pageUrl, normalizeUrl(pageUrl)),
        eq(pageContent.isActive, 1)
      )
    );

  return content.map(item => ({
    type: item.contentType,
    data: {
      optimized: item.optimizedContent,
      ...item.metadata
    }
  }));
};
```

### Analytics Tracking
```typescript
// Store page view in enhanced tracker_data
const trackPageView = async (data: TrackingData) => {
  await db.insert(trackerData).values({
    siteId: data.siteId,
    pageUrl: data.pageUrl,
    eventType: 'page_view',
    eventData: {
      loadTime: data.loadTime,
      title: data.title,
      contentInjected: data.contentInjected
    },
    sessionId: data.sessionId,
    userAgent: data.userAgent,
    ipAddress: data.ipAddress,
    referrer: data.referrer
  });

  // Update daily analytics
  await updatePageAnalytics(data.siteId, data.pageUrl, data);
};
```

## Schema Compatibility Assessment

### ✅ What Works Well
1. **Existing `sites.tracker_id`** - Perfect for script authentication
2. **Existing `page_content`** - Good foundation for content storage
3. **Existing `content_suggestions`** - Great for AI-generated content
4. **Existing `tracker_data`** - Basic tracking foundation

### 🔄 What Needs Enhancement
1. **URL-based content lookup** - Add `page_url` to `page_content`
2. **Detailed analytics** - New `page_analytics` table
3. **Enhanced event tracking** - Expand `tracker_data` columns
4. **Performance indexes** - Add indexes for tracker queries

### ❌ What's Not Needed
- ~~`deployed_content` table~~ (use existing `page_content`)
- ~~`script_events` table~~ (enhance existing `tracker_data`)

## Implementation Priority

1. **High Priority:** URL lookup enhancement for `page_content`
2. **High Priority:** Enhanced `tracker_data` with event data
3. **Medium Priority:** New `page_analytics` table
4. **Low Priority:** Performance indexes and optimization

This analysis shows we can leverage the existing schema with minimal changes rather than creating entirely new tables. 