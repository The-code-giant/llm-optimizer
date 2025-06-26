# LLM Optimizer Backend Implementation Guide

**Version:** 1.0
**Date:** June 25, 2025

**Note:** As of July 2024, the backend will be implemented in **TypeScript (Node.js)** using **Drizzle ORM** and **PostgreSQL**. The frontend will use **Next.js (TypeScript)**. All Python/Flask/SQLAlchemy references below should be interpreted as implementation patterns, not literal code. Code examples will be updated to TypeScript/Node.js as the project progresses.

## 1. API Design

The backend exposes a RESTful API for the User Dashboard and a dedicated endpoint for the client-side Tracker Script.

**Base URL:** `/api/v1`

**Authentication:** JWT (JSON Web Tokens) for dashboard endpoints. Tracker endpoints use a unique site `trackerId`.

### Dashboard Endpoints

*   **Auth**
    *   `POST /auth/login`
        *   **Description:** Authenticates a user.
        *   **Payload:** `{ "email": "user@example.com", "password": "password" }`
        *   **Response:** `{ "token": "jwt_token", "refreshToken": "refresh_token", "user": { "id": ..., "email": ... } }`
    *   `POST /auth/refresh`
        *   **Description:** Refreshes an expired JWT token.
        *   **Payload:** `{ "refreshToken": "refresh_token" }`
        *   **Response:** `{ "token": "new_jwt_token" }`

*   **Sites**
    *   `POST /sites`
        *   **Description:** Creates a new website project.
        *   **Payload:** `{ "name": "My Website", "url": "https://www.mywebsite.com" }`
        *   **Response:** `{ "id": "site_id", "name": "My Website", "url": "https://www.mywebsite.com", "trackerId": "uuid_tracker_id", ... }`
    *   `GET /sites`
        *   **Description:** Lists sites belonging to the authenticated user.
        *   **Response:** `[{ "id": ..., "name": ..., "url": ..., "status": ..., ... }]`
    *   `GET /sites/{siteId}`
        *   **Description:** Gets details for a specific site.
        *   **Response:** `{ "id": ..., "name": ..., "url": ..., "trackerId": "uuid_tracker_id", "status": ..., "settings": {}, ... }`
    *   `PUT /sites/{siteId}`
        *   **Description:** Updates site settings (e.g., name, URL, configuration).
        *   **Payload:** `{ "name": "New Name", "settings": { ... } }`
        *   **Response:** Updated site object.
    *   `DELETE /sites/{siteId}`
        *   **Description:** Deletes a site and all associated data.

*   **Sitemap & Pages**
    *   `POST /sites/{siteId}/sitemap/import`
        *   **Description:** Initiates sitemap import for the site. Runs asynchronously.
        *   **Payload:** `{ "sitemapUrl": "https://www.mywebsite.com/sitemap.xml" }` (Optional, can default to `/sitemap.xml`)
        *   **Response:** `{ "message": "Sitemap import started", "jobId": "..." }`
    *   `GET /sites/{siteId}/pages`
        *   **Description:** Lists pages for a site. Supports filtering/pagination later.
        *   **Query Params:** `?status=analyzed`, `?search=keyword`, `?page=1`, `?pageSize=20`
        *   **Response:** `[{ "id": ..., "url": ..., "title": ..., "llmReadinessScore": ..., "lastAnalysisAt": ..., ... }]`
    *   `GET /pages/{pageId}`
        *   **Description:** Gets detailed information for a specific page, including content snapshot and latest analysis results.
        *   **Response:** `{ "id": ..., "url": ..., "title": ..., "contentSnapshot": "...", "analysisResults": { "score": ..., "recommendations": [...], "rawOutput": "..." }, ... }`

*   **AI Analysis**
    *   `POST /sites/{siteId}/analysis`
        *   **Description:** Triggers analysis for all pages in a site. Runs asynchronously.
        *   **Response:** `{ "message": "Analysis started", "jobId": "..." }`
    *   `POST /pages/{pageId}/analysis`
        *   **Description:** Triggers analysis for a specific page. Runs asynchronously.
        *   **Response:** `{ "message": "Analysis started", "jobId": "..." }`

*   **Injected Content**
    *   `GET /sites/{siteId}/injected-content`
        *   **Description:** Lists injected content snippets for a site.
        *   **Response:** `[{ "id": ..., "name": ..., "type": "faq", "status": "active", "targetPageIds": [...] }, ...]`
    *   `POST /sites/{siteId}/injected-content`
        *   **Description:** Creates a new injected content snippet.
        *   **Payload:** `{ "name": "My FAQ", "type": "faq", "content": "<p>What is LLM Op?</p><p>...</p>", "targetPageIds": ["page_id_1", "page_id_2"] }`
        *   **Response:** Created injected content object.
    *   `GET /injected-content/{contentId}`
        *   **Description:** Gets details of an injected content snippet.
        *   **Response:** `{ "id": ..., "name": ..., "type": ..., "content": "...", "status": ..., "targetPageIds": [...] }`
    *   `PUT /injected-content/{contentId}`
        *   **Description:** Updates an injected content snippet.
        *   **Payload:** `{ "name": "Updated FAQ", "content": "...", "targetPageIds": [...] }`
        *   **Response:** Updated injected content object.
    *   `DELETE /injected-content/{contentId}`
        *   **Description:** Deletes an injected content snippet.

### Tracker Script Endpoints

*   `POST /tracker/{trackerId}/data`
    *   **Description:** Receives tracking data (page views, basic events) from the client-side script. Should be very fast.
    *   **Payload:** `{ "pageUrl": "https://www.mywebsite.com/page", "eventType": "pageview", "timestamp": "ISO_STRING", "referrer": "...", "userAgent": "...", "screenWidth": ..., ... }`
    *   **Response:** `200 OK` (or `204 No Content`)
*   `GET /tracker/{trackerId}/content`
    *   **Description:** Fetches active injected content for the current page URL.
    *   **Query Params:** `?pageUrl=https://www.mywebsite.com/page`
    *   **Response:** `[{ "id": "content_id_1", "type": "faq", "content": "<p>...</p>" }, { "id": "content_id_2", "type": "schema", "content": "<script type='application/ld+json'>...</script>" }]` (Returns an empty array if no content is active for the page).

## 2. Data Models

Using a relational database (e.g., PostgreSQL) is suitable.

*   **`users`**
    *   `id` (UUID/Serial PK)
    *   `email` (VARCHAR, Unique)
    *   `password_hash` (VARCHAR)
    *   `created_at` (TIMESTAMP)
    *   `updated_at` (TIMESTAMP)

*   **`sites`**
    *   `id` (UUID/Serial PK)
    *   `user_id` (UUID/Integer FK to `users`)
    *   `name` (VARCHAR)
    *   `url` (VARCHAR, Unique, Index) - Base URL of the site
    *   `tracker_id` (UUID, Unique, Index) - Public identifier for the tracker script
    *   `status` (VARCHAR) - e.g., 'created', 'importing', 'analyzing', 'ready', 'error'
    *   `settings` (JSONB/TEXT) - Site-specific configuration
    *   `created_at` (TIMESTAMP)
    *   `updated_at` (TIMESTAMP)

*   **`pages`**
    *   `id` (UUID/Serial PK)
    *   `site_id` (UUID/Integer FK to `sites`, Index)
    *   `url` (VARCHAR, Unique within site: `site_id`, `url` composite index)
    *   `title` (VARCHAR) - Snapshot
    *   `content_snapshot` (TEXT/BLOB) - HTML/rendered content fetched for analysis
    *   `last_scanned_at` (TIMESTAMP)
    *   `last_analysis_at` (TIMESTAMP)
    *   `llm_readiness_score` (FLOAT) - Latest analysis score
    *   `created_at` (TIMESTAMP)
    *   `updated_at` (TIMESTAMP)

*   **`analysis_results`**
    *   `id` (UUID/Serial PK)
    *   `page_id` (UUID/Integer FK to `pages`, Index)
    *   `analyzed_at` (TIMESTAMP)
    *   `llm_model_used` (VARCHAR)
    *   `score` (FLOAT)
    *   `recommendations` (JSONB/TEXT) - Structured recommendations
    *   `raw_llm_output` (TEXT/BLOB) - Full output from LLM for debugging/reference
    *   `created_at` (TIMESTAMP)

*   **`injected_content`**
    *   `id` (UUID/Serial PK)
    *   `site_id` (UUID/Integer FK to `sites`, Index)
    *   `name` (VARCHAR)
    *   `type` (VARCHAR) - e.g., 'faq', 'schema', 'custom_html'
    *   `content` (TEXT/JSONB) - The content to be injected (HTML, JSON-LD, etc.)
    *   `status` (VARCHAR) - e.g., 'draft', 'active', 'archived'
    *   `created_at` (TIMESTAMP)
    *   `updated_at` (TIMESTAMP)

*   **`page_injected_content`** (Join Table)
    *   `page_id` (UUID/Integer FK to `pages`, Index)
    *   `injected_content_id` (UUID/Integer FK to `injected_content`, Index)
    *   `created_at` (TIMESTAMP)
    *   *Composite PK:* (`page_id`, `injected_content_id`)

*   **`tracker_data`** (Optional for MVP, depends on level of detail required for basic stats)
    *   `id` (UUID/Serial PK)
    *   `site_id` (UUID/Integer FK to `sites`, Index)
    *   `page_url` (VARCHAR, Index)
    *   `event_type` (VARCHAR) - e.g., 'pageview'
    *   `timestamp` (TIMESTAMP)
    *   `session_id` (UUID, Optional for basic session tracking)
    *   `anonymous_user_id` (UUID, Optional)
    *   `created_at` (TIMESTAMP)

## 3. Business Logic

The core business logic orchestrates data flow, interacts with external services (LLMs, websites), and manages the state of sites and pages.

1.  **Site Creation:**
    *   Receive request from Dashboard (`POST /sites`).
    *   Validate input (name, valid URL).
    *   Generate a unique `tracker_id` (UUID).
    *   Create a new `site` record in the database, associating it with the authenticated user.
    *   Return site details including the generated `tracker_id`.

2.  **Sitemap Import:**
    *   Receive request from Dashboard (`POST /sites/{siteId}/sitemap/import`).
    *   Verify user owns `siteId`.
    *   Update site status to 'importing'.
    *   Dispatch an asynchronous job (using a job queue like Celery, RabbitMQ, or similar).
    *   The job:
        *   Fetch sitemap XML from the specified or default URL.
        *   Parse the XML to extract URLs.
        *   For each unique URL:
            *   Fetch the HTML content of the page. Use a library that handles potential issues (e.g., `requests`, or a headless browser like Puppeteer/Playwright for JS-rendered sites - MVP might skip headless browser complexity initially). Respect `robots.txt`.
            *   Extract title and basic metadata.
            *   Store/update the page in the `pages` table (`url`, `title`, `content_snapshot`). If the page already exists for this site, update its content snapshot and `last_scanned_at`.
        *   Update site status to 'ready' or 'error' if parsing/fetching fails.

3.  **AI Analysis:**
    *   Receive request from Dashboard (`POST /sites/{siteId}/analysis` or `POST /pages/{pageId}/analysis`).
    *   Verify user ownership.
    *   Identify the pages to analyze (all pages for site, or a specific page).
    *   Update status of relevant pages to 'analyzing'.
    *   Dispatch an asynchronous job (or multiple jobs).
    *   The job:
        *   Retrieve the `content_snapshot` for the page(s).
        *   Prepare prompts for the LLM based on the content snapshot and the goal (LLM readability, citation likelihood).
        *   Call the external LLM API (e.g., OpenAI's GPT-4, Anthropic's Claude, Gemini). Handle API keys securely.
        *   Process the LLM's response. Parse the score, recommendations, and potentially extract raw output.
        *   Store the results in the `analysis_results` table, linked to the page.
        *   Update the `pages` table with the latest `llm_readiness_score` and `last_analysis_at`.
        *   Update page status to 'analyzed' or 'error'.

4.  **Content Injection Management:**
    *   Dashboard interacts with `/injected-content` endpoints using standard CRUD logic, ensuring `site_id` is associated with the user.
    *   Linking content to pages: `POST` or `PUT` on `/injected-content` receives `targetPageIds`. Backend updates the `page_injected_content` join table.

5.  **Content Fetch for Tracker:**
    *   Receive request from client-side Tracker script (`GET /tracker/{trackerId}/content`).
    *   Look up the `site_id` associated with the provided `trackerId`. Validate that the `trackerId` exists and is active.
    *   Use the `site_id` and the `pageUrl` provided in the query parameters.
    *   Query the database: Find all `injected_content` snippets that are `active`, associated with this `site_id`, and linked to the specific `pageUrl` via the `page_injected_content` table.
    *   Return a list of the active content snippets (`id`, `type`, `content`) for that page. Keep this endpoint very fast.

6.  **Tracker Data Collection:**
    *   Receive request from client-side Tracker script (`POST /tracker/{trackerId}/data`).
    *   Look up `site_id` by `trackerId`.
    *   Perform minimal validation.
    *   Queue the raw tracking data for later, asynchronous processing or storage in a dedicated analytics sink (e.g., Kafka, Kinesis, or a separate time-series DB table like `tracker_data`). Avoid heavy synchronous database writes here.

## 4. Security

*   **Authentication:**
    *   **Dashboard:** Use JWT for stateless authentication. Users log in (`/auth/login`) to receive a short-lived access token and a longer-lived refresh token. The access token is included in the `Authorization: Bearer <token>` header for subsequent requests. The refresh token is used to obtain new access tokens without re-logging in. Implement secure token storage (e.g., HttpOnly cookies for refresh tokens, memory/local storage for access tokens handled carefully on the frontend).
    *   **Tracker:** The `trackerId` acts as an API key/capability token. It allows *only* sending data to `/tracker/{trackerId}/data` and *only* fetching content from `/tracker/{trackerId}/content` for that specific site. It does *not* grant access to dashboard management endpoints. This ID should be treated as semi-public but regenerated if compromised.

*   **Authorization:**
    *   All dashboard endpoints (`/sites`, `/pages`, `/injected-content`, etc.) must verify that the requested resource (`siteId`, `pageId`, `contentId`) belongs to the authenticated user (`userId` on the `sites` table). This is a fundamental access control check.
    *   The Tracker endpoints `/tracker/{trackerId}/...` must verify the `trackerId` against the `sites` table and infer the `site_id`. All operations within these endpoints are then scoped to that `site_id`.

*   **Data Security:**
    *   Encrypt user passwords (`password_hash`) using strong, modern hashing algorithms (e.g., bcrypt).
    *   Sanitize all user inputs to prevent injection attacks (SQL injection - use parameterized queries/ORMs; XSS - less direct threat to backend APIs but sanitize data before storage if it could be rendered later).
    *   Handle `content_snapshot` and `raw_llm_output` potentially containing sensitive data carefully, although site content is typically public.
    *   Anonymize or hash sensitive tracker data (like IP addresses) if collected, in compliance with privacy regulations (GDPR, CCPA, etc.).

*   **Transport Security:** Enforce HTTPS for all API endpoints to encrypt data in transit.

*   **API Key Management:** Securely store external LLM API keys (environment variables, secrets management). Do not expose them client-side.

## 5. Performance

*   **Asynchronous Processing:** Sitemap import and AI analysis are time-consuming operations. They *must* be handled as background jobs using a reliable queue system (Celery with Redis/RabbitMQ, AWS SQS/Lambda, etc.) to avoid blocking the main API thread and ensure scalability.
*   **Database Indexing:** Create indexes on columns used in `WHERE` clauses and `JOIN` conditions, particularly:
    *   `sites.user_id`
    *   `sites.tracker_id`
    *   `pages.site_id`
    *   Composite index on `pages` (`site_id`, `url`)
    *   `analysis_results.page_id`
    *   `injected_content.site_id`
    *   Composite PK on `page_injected_content` (`page_id`, `injected_content_id`) and individual indexes if querying frequently by one FK alone.
    *   `tracker_data.site_id`, `tracker_data.page_url` (if implemented).
*   **Database Queries:** Use an ORM (e.g., SQLAlchemy for Python, Sequelize for Node.js) or build queries carefully to select only necessary columns. Implement pagination for list endpoints (`/sites/{siteId}/pages`, `/sites/{siteId}/injected-content`).
*   **Caching:**
    *   Cache frequently accessed dashboard data (e.g., site list, page list for a site). Redis is a good choice.
    *   Cache responses for `/tracker/{trackerId}/content`. Since injected content changes less frequently than page views, caching this response based on `trackerId` and `pageUrl` can significantly reduce database load on high-traffic sites. Implement cache invalidation when injected content is updated or linked pages change.
*   **Tracker Endpoint Optimization:** The `/tracker/{trackerId}/data` endpoint must be exceptionally fast and robust. Accept data and immediately queue it for processing *offline*. Do not perform complex logic or synchronous database writes on the request path.
*   **Efficient Content Fetching (Sitemap/Analysis):** When fetching website content, set reasonable timeouts. For large sites, consider limiting the number of pages imported initially or fetching content in batches. Use efficient HTTP libraries. Handle potential network errors gracefully.
*   **LLM API Rate Limiting:** Implement logic to handle rate limits from external LLM providers. Use retry mechanisms with exponential backoff for API calls. Process LLM analysis in batches where possible.

## 6. Code Examples

Using Python with Flask/SQLAlchemy concepts for illustration.

### Example 1: Site Creation Endpoint

```python
# Assuming Flask, SQLAlchemy, and a database connection `db`

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid
from models import Site, User # Assuming Data Models defined in models.py

site_bp = Blueprint('sites', __name__, url_prefix='/api/v1/sites')

@site_bp.route('/', methods=['POST'])
@jwt_required() # Requires a valid JWT token
def create_site():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id) # Fetch user to ensure they exist

    if not user:
        return jsonify({"msg": "User not found"}), 404

    data = request.json
    name = data.get('name')
    url = data.get('url')

    if not name or not url:
        return jsonify({"msg": "Missing name or url"}), 400

    # Validate URL format - basic check
    if not url.startswith('http://') and not url.startswith('https://'):
         return jsonify({"msg": "Invalid URL format. Must start with http:// or https://"}), 400

    # Generate unique tracker ID
    tracker_id = str(uuid.uuid4())

    new_site = Site(
        user_id=user.id,
        name=name,
        url=url,
        tracker_id=tracker_id,
        status='created',
        settings={} # Default settings
    )

    try:
        db.session.add(new_site)
        db.session.commit()
        # Return relevant data, possibly using a schema for serialization
        return jsonify({
            "id": new_site.id,
            "name": new_site.name,
            "url": new_site.url,
            "trackerId": new_site.tracker_id,
            "status": new_site.status
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating site: {e}") # Log the error
        return jsonify({"msg": "Failed to create site", "error": str(e)}), 500

# Need to register this blueprint in the main Flask app
# app.register_blueprint(site_bp)
```

### Example 2: Triggering Sitemap Import (Async)

```python
# Assuming a job queue setup (e.g., with Celery)
# and a task function `tasks.import_sitemap`

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Site, User
from tasks import import_sitemap # Assuming Celery task is defined elsewhere

sitemap_bp = Blueprint('sitemap', __name__, url_prefix='/api/v1/sites/<uuid:site_id>/sitemap')

@sitemap_bp.route('/import', methods=['POST'])
@jwt_required()
def trigger_sitemap_import(site_id):
    current_user_id = get_jwt_identity()

    # Authorization: Check if site belongs to user
    site = Site.query.filter_by(id=site_id, user_id=current_user_id).first()
    if not site:
        return jsonify({"msg": "Site not found or unauthorized"}), 404

    data = request.json
    sitemap_url = data.get('sitemapUrl') or f"{site.url}/sitemap.xml" # Default sitemap URL

    # Optional: Add basic URL validation for sitemap_url

    try:
        # Update site status (optional but good practice)
        site.status = 'importing'
        db.session.commit()

        # Dispatch the asynchronous task
        # `delay()` is a Celery method to send a task to the queue
        job = import_sitemap.delay(site_id, sitemap_url)

        return jsonify({
            "message": "Sitemap import started",
            "jobId": job.id # Return task ID for potential status checking
        }), 202 # 202 Accepted

    except Exception as e:
        # Revert status if dispatch fails or handle in task error handler
        site.status = 'ready' # Or 'error_import_dispatch'
        db.session.commit()
        print(f"Error dispatching sitemap import job: {e}")
        return jsonify({"msg": "Failed to start sitemap import", "error": str(e)}), 500

# Celery task example (in tasks.py or similar)
# @celery.task
# def import_sitemap(site_id, sitemap_url):
#     # ... job implementation fetches, parses, stores pages, updates site status ...
#     pass

```

### Example 3: Fetching Injected Content for Tracker Script

```python
# Assuming Flask, SQLAlchemy, and database connection `db`
from flask import Blueprint, request, jsonify
from models import Site, InjectedContent, Page, PageInjectedContent

tracker_bp = Blueprint('tracker', __name__, url_prefix='/tracker/<uuid:tracker_id>')

@tracker_bp.route('/content', methods=['GET'])
def get_injected_content(tracker_id):
    # Find site by tracker_id
    site = Site.query.filter_by(tracker_id=tracker_id).first()
    if not site:
        # Return 200 OK with empty list rather than 404 for tracker script resilience
        print(f"Warning: Tracker ID not found: {tracker_id}")
        return jsonify([]), 200

    page_url = request.args.get('pageUrl')
    if not page_url:
        return jsonify([]), 200 # Need page URL to find content

    # Find the specific page using site_id and pageUrl
    # Case-insensitive match might be needed depending on URL handling
    page = Page.query.filter_by(site_id=site.id, url=page_url).first()

    if not page:
        # Page not found in our records, return empty content
        return jsonify([]), 200

    # Query for active injected content linked to this page
    active_content = db.session.query(InjectedContent)\
        .join(PageInjectedContent)\
        .filter(
            PageInjectedContent.page_id == page.id,
            InjectedContent.site_id == site.id, # Redundant due to join via page, but adds clarity/safety
            InjectedContent.status == 'active'
        )\
        .all()

    # Format response
    content_list = []
    for item in active_content:
        content_list.append({
            "id": item.id,
            "type": item.type,
            "content": item.content # Ensure content is suitable for JSON (e.g., string)
        })

    return jsonify(content_list), 200

# Need to register this blueprint
# app.register_blueprint(tracker_bp)
```

This implementation guide provides a solid foundation for building the backend of the LLM Optimizer, covering key aspects from API design and data modeling to business logic, security, performance, and practical code examples for core functionalities. The focus on asynchronous processing for heavy tasks and careful consideration of tracker script performance and security are crucial for a successful MVP.
```
