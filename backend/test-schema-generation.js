const { AIRecommendationAgent } = require('./dist/utils/aiRecommendationAgent');

async function testSchemaGeneration() {
  console.log('🧪 Testing schema generation...');
  
  const testPageContent = {
    url: 'https://example.com',
    title: 'Test Website - Expert Solutions',
    metaDescription: 'We provide expert solutions for businesses.',
    bodyText: 'Our company specializes in providing innovative solutions for modern businesses. We offer consulting, software development, and digital marketing services.'
  };

  const testAnalysisData = {
    score: 85,
    keywordAnalysis: {
      primaryKeywords: ['solutions', 'business', 'consulting'],
      longTailKeywords: ['business consulting services', 'innovative solutions', 'digital marketing'],
      missingKeywords: ['expert advice', 'professional services']
    }
  };

  const testPageSummary = 'A business consulting website offering various professional services including software development and digital marketing.';

  try {
    console.log('📋 Test data prepared, generating schema...');
    
    const result = await AIRecommendationAgent.generateContentSuggestions(
      testPageContent,
      testAnalysisData,
      testPageSummary,
      'schema',
      1
    );

    console.log('✅ Schema generation completed!');
    console.log('📄 Generated schema:');
    console.log('=' * 50);
    console.log(result[0]);
    console.log('=' * 50);
    
    // Test if it's valid JSON
    try {
      const parsed = JSON.parse(result[0]);
      console.log('✅ Schema is valid JSON');
      console.log('🏷️ Schema type:', parsed['@type']);
      console.log('🌐 Schema context:', parsed['@context']);
    } catch (parseError) {
      console.error('❌ Schema is not valid JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('❌ Schema generation failed:', error.message);
  }
}

testSchemaGeneration();
