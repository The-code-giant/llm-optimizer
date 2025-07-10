# SEO Optimizer Frontend

This is the frontend application for the SEO Optimizer, built with Next.js 15 and TypeScript.

## Features

- ✅ Modern Next.js 15 App Router
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ Clerk for authentication
- ✅ Responsive design
- ✅ SEO-optimized with sitemap and robots.txt
- ✅ Dashboard for managing sites and pages
- ✅ Real-time content optimization
- ✅ Comprehensive user profile management

## SEO Features

### Sitemap Generation
The application automatically generates a sitemap.xml file that includes:
- All marketing pages (about, contact, careers, etc.)
- Solutions pages (agencies, enterprise)
- Location-based service pages (Toronto, Vancouver, etc.)
- Blog and help sections
- Legal pages (privacy, terms, cookies)
- Documentation pages

The sitemap is accessible at `/sitemap.xml` and is automatically updated when the application is built.

### Robots.txt
The application includes a robots.txt file that:
- Allows crawling of all marketing pages
- Disallows crawling of dashboard, API, and admin areas
- References the sitemap.xml file
- Provides specific rules for different crawlers

## Marketing Pages

The application includes the following marketing pages:

### Main Pages
- `/` - Homepage
- `/about` - About us
- `/contact` - Contact information
- `/careers` - Career opportunities
- `/case-studies` - Customer case studies
- `/demo` - Product demo
- `/tutorials` - How-to guides
- `/webinars` - Webinar listings
- `/blog` - Blog posts
- `/help` - Help center

### Solutions
- `/solutions/agencies` - Agency solutions
- `/solutions/enterprise` - Enterprise solutions

### Services (Location-based)
- `/services` - Main services page
- `/services/toronto-ontario` - Toronto services
- `/services/vancouver-bc` - Vancouver services
- `/services/calgary-alberta` - Calgary services
- `/services/edmonton-alberta` - Edmonton services
- `/services/ottawa-ontario` - Ottawa services
- `/services/hamilton-ontario` - Hamilton services
- `/services/london-ontario` - London services
- `/services/surrey-bc` - Surrey services
- `/services/burnaby-bc` - Burnaby services
- `/services/victoria-bc` - Victoria services

### Legal
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/cookies` - Cookie policy

### Documentation
- `/docs` - API documentation

## Environment Variables

Make sure to set the following environment variables:

```bash
# Application URL (used in sitemap generation)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# API URL
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Sitemap Testing

To test the sitemap:

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000/sitemap.xml`
3. Verify all expected pages are listed
4. Check `http://localhost:3000/robots.txt` for robots directives

## Deployment

The application is configured for deployment on Vercel or any other Next.js-compatible platform. Make sure to set the `NEXT_PUBLIC_APP_URL` environment variable to your production domain.

## Technologies Used

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Clerk Authentication
- Radix UI Components
- Framer Motion
- Lucide Icons
