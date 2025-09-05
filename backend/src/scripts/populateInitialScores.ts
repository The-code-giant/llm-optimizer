#!/usr/bin/env tsx

/**
 * Script to populate initial cached scores for existing pages
 * This should be run after applying the database migration
 * 
 * Usage: npm run populate-scores
 */

import { db } from '../db/client';
import { pages, sites } from '../db/schema';
import { ScoreUpdateService } from '../services/scoreUpdateService';
import { sql } from 'drizzle-orm';

async function populateInitialScores() {
  console.log('🚀 Starting initial score population...');
  
  try {
    // Get all sites that are not deleted
    const allSites = await db.select({ 
      id: sites.id, 
      name: sites.name,
      url: sites.url 
    })
    .from(sites)
    .where(sql`${sites.deletedAt} IS NULL`);

    console.log(`📊 Found ${allSites.length} active sites`);

    let totalPagesProcessed = 0;
    let totalPagesWithScores = 0;
    let totalSitesProcessed = 0;

    for (const site of allSites) {
      console.log(`\n🔄 Processing site: ${site.name} (${site.url})`);
      
      // Get all pages for this site
      const sitePages = await db.select({ 
        id: pages.id,
        url: pages.url,
        llmReadinessScore: pages.llmReadinessScore,
        pageScore: pages.pageScore
      })
      .from(pages)
      .where(sql`${pages.siteId} = ${site.id}`);

      console.log(`  📄 Found ${sitePages.length} pages`);

      let sitePagesWithScores = 0;

      // Process each page
      for (const page of sitePages) {
        totalPagesProcessed++;
        
        // Skip if page already has a cached score
        if (page.pageScore != null) {
          console.log(`  ✅ Page ${page.url} already has cached score: ${page.pageScore}%`);
          sitePagesWithScores++;
          totalPagesWithScores++;
          continue;
        }

        // Try to update the score from section ratings
        const newScore = await ScoreUpdateService.updatePageScore(page.id);
        
        if (newScore !== null) {
          console.log(`  ✅ Updated page ${page.url}: ${newScore}%`);
          sitePagesWithScores++;
          totalPagesWithScores++;
        } else if (page.llmReadinessScore != null && page.llmReadinessScore > 0) {
          // Fallback: use legacy score as cached score
          await db.update(pages)
            .set({
              pageScore: page.llmReadinessScore,
              lastScoreUpdate: new Date()
            })
            .where(sql`${pages.id} = ${page.id}`);
          
          console.log(`  📋 Used legacy score for ${page.url}: ${page.llmReadinessScore}%`);
          sitePagesWithScores++;
          totalPagesWithScores++;
        } else {
          console.log(`  ⚠️ No score available for ${page.url}`);
        }
      }

      // Update site metrics after processing all pages
      if (sitePagesWithScores > 0) {
        await ScoreUpdateService.updateSiteMetrics(site.id);
        console.log(`  📊 Updated site metrics (${sitePagesWithScores}/${sitePages.length} pages with scores)`);
      }

      totalSitesProcessed++;
    }

    console.log('\n🎉 Initial score population completed!');
    console.log(`📈 Summary:`);
    console.log(`  - Sites processed: ${totalSitesProcessed}`);
    console.log(`  - Total pages processed: ${totalPagesProcessed}`);
    console.log(`  - Pages with scores: ${totalPagesWithScores}`);
    console.log(`  - Success rate: ${Math.round((totalPagesWithScores / totalPagesProcessed) * 100)}%`);

  } catch (error) {
    console.error('❌ Error during score population:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🔧 Populating initial cached scores for existing pages...');
  console.log('This may take a while depending on the number of pages.\n');

  // Confirm before proceeding
  const args = process.argv.slice(2);
  if (!args.includes('--confirm')) {
    console.log('⚠️  This script will update all pages in the database.');
    console.log('Add --confirm flag to proceed: npm run populate-scores -- --confirm');
    process.exit(0);
  }

  await populateInitialScores();
  
  console.log('\n✅ Script completed successfully!');
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ Script interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Script terminated');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

export { populateInitialScores };
