// Comprehensive RAG System Test Suite
// Tests all RAG functionality with automatic token generation
require('dotenv').config();

const axios = require('axios');
const { generateClerkToken } = require('../generate-clerk-token');

// Configuration
const BASE_URL = 'http://localhost:3001/api/v1';
const TEST_SITE_ID = 'ca337a2f-a250-48e0-b363-1e2e5f290f70';
const TEST_PAGE_ID = '1b624b34-deb2-4b4f-99d9-848c4de00922';
const TEST_USER_ID = 'user_30DWRB8aZws2cujeYUmyMli9Usp';

// Test tracking
let AUTH_TOKEN = null;
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  categories: {},
  details: []
};

// Helper functions
function getHeaders() {
  return {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function logTest(testName, category, success, data = null, error = null) {
  testResults.total++;
  
  if (!testResults.categories[category]) {
    testResults.categories[category] = { passed: 0, failed: 0, total: 0 };
  }
  testResults.categories[category].total++;
  
  if (success) {
    testResults.passed++;
    testResults.categories[category].passed++;
    console.log(`✅ ${testName}`);
    if (data) {
      if (typeof data === 'object') {
        console.log(`   ${JSON.stringify(data, null, 2)}`);
      } else {
        console.log(`   ${data}`);
      }
    }
  } else {
    testResults.failed++;
    testResults.categories[category].failed++;
    console.log(`❌ ${testName}`);
    if (error) console.log(`   Error: ${error}`);
  }
  
  testResults.details.push({ testName, category, success, data, error });
  console.log('');
}

function printSectionHeader(title) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🧪 ${title.toUpperCase()}`);
  console.log(`${'='.repeat(50)}\n`);
}

function printSubHeader(title) {
  console.log(`\n${'─'.repeat(30)}`);
  console.log(`📋 ${title}`);
  console.log(`${'─'.repeat(30)}\n`);
}

// Authentication setup
async function setupAuthentication() {
  printSectionHeader('Authentication Setup');
  
  try {
    console.log('🔐 Generating fresh Clerk token...');
    AUTH_TOKEN = await generateClerkToken(TEST_USER_ID);
    
    if (AUTH_TOKEN) {
      logTest('Token Generation', 'Auth', true, 'Successfully generated fresh JWT token');
      return true;
    } else {
      logTest('Token Generation', 'Auth', false, null, 'Failed to generate token');
      return false;
    }
  } catch (error) {
    logTest('Token Generation', 'Auth', false, null, error.message);
    return false;
  }
}

// Test Categories
async function testBasicConnectivity() {
  printSubHeader('Basic Connectivity Tests');

  // Test 1: Server health
  try {
    const response = await axios.get('http://localhost:3001/healthz');
    logTest('Server Health Check', 'Connectivity', true, {
      status: response.data.status?.status,
      redis: response.data.status?.redis,
      cache: response.data.status?.cache?.redis
    });
  } catch (error) {
    logTest('Server Health Check', 'Connectivity', false, null, error.message);
    return false;
  }

  // Test 2: RAG endpoint availability
  try {
    const response = await axios.get(`${BASE_URL}/rag/test`);
    logTest('RAG Endpoint Availability', 'Connectivity', true, response.data);
  } catch (error) {
    logTest('RAG Endpoint Availability', 'Connectivity', false, null, error.message);
  }

  // Test 3: Pinecone connection
  try {
    const response = await axios.get(`${BASE_URL}/rag/test-pinecone`);
    logTest('Pinecone Connection', 'Connectivity', response.data.pinecone === 'connected', {
      status: response.data.pinecone,
      result: response.data.result
    });
  } catch (error) {
    logTest('Pinecone Connection', 'Connectivity', false, null, error.message);
  }

  // Test 4: OpenAI embeddings
  try {
    const response = await axios.get(`${BASE_URL}/rag/test-embeddings`);
    logTest('OpenAI Embeddings', 'Connectivity', response.data.openai === 'connected', {
      status: response.data.openai,
      embeddingLength: response.data.embeddingLength
    });
  } catch (error) {
    logTest('OpenAI Embeddings', 'Connectivity', false, null, error.message);
  }

  return true;
}

async function testAuthentication() {
  printSubHeader('Authentication Tests');

  // Test 1: Valid token
  try {
    const response = await axios.get(`${BASE_URL}/rag/status/${TEST_SITE_ID}`, { headers: getHeaders() });
    logTest('Valid Token Authentication', 'Auth', true, {
      authenticated: true,
      siteId: response.data.status?.siteId
    });
  } catch (error) {
    logTest('Valid Token Authentication', 'Auth', false, null, 
      error.response?.data?.message || error.message);
  }

  // Test 2: Invalid token handling
  try {
    await axios.get(`${BASE_URL}/rag/status/${TEST_SITE_ID}`, {
      headers: { 'Authorization': 'Bearer invalid-token', 'Content-Type': 'application/json' }
    });
    logTest('Invalid Token Rejection', 'Auth', false, null, 'Should have rejected invalid token');
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Invalid Token Rejection', 'Auth', true, 'Correctly rejected invalid token');
    } else {
      logTest('Invalid Token Rejection', 'Auth', false, null, error.message);
    }
  }
}

async function testKnowledgeBaseOperations() {
  printSubHeader('Knowledge Base Operations');

  // Test 1: Get status
  try {
    const response = await axios.get(`${BASE_URL}/rag/status/${TEST_SITE_ID}`, { headers: getHeaders() });
    logTest('Get Knowledge Base Status', 'Knowledge Base', true, {
      status: response.data.status?.status,
      totalDocuments: response.data.status?.totalDocuments,
      ragEnabled: response.data.status?.ragEnabled
    });
  } catch (error) {
    logTest('Get Knowledge Base Status', 'Knowledge Base', false, null, 
      error.response?.data?.message || error.message);
  }

  // Test 2: Initialize knowledge base
  try {
    const response = await axios.post(`${BASE_URL}/rag/initialize/${TEST_SITE_ID}`, {}, { headers: getHeaders() });
    logTest('Initialize Knowledge Base', 'Knowledge Base', response.data.success === true, {
      success: response.data.success,
      message: response.data.message
    });
  } catch (error) {
    // This might fail if already initialized, which is okay
    const errorMsg = error.response?.data?.message || error.message;
    const isAlreadyExists = errorMsg.includes('already exists') || errorMsg.includes('already initialized');
    logTest('Initialize Knowledge Base', 'Knowledge Base', isAlreadyExists, 
      isAlreadyExists ? 'Already initialized (expected)' : null, 
      isAlreadyExists ? null : errorMsg);
  }

  // Test 3: Get documents
  try {
    const response = await axios.get(`${BASE_URL}/rag/documents/${TEST_SITE_ID}`, { headers: getHeaders() });
    logTest('Get Documents List', 'Knowledge Base', true, {
      totalDocuments: response.data.documents?.length || 0,
      hasDocuments: (response.data.documents?.length || 0) > 0
    });
  } catch (error) {
    logTest('Get Documents List', 'Knowledge Base', false, null, 
      error.response?.data?.message || error.message);
  }

  // Test 4: Get statistics
  try {
    const response = await axios.get(`${BASE_URL}/rag/statistics/${TEST_SITE_ID}`, { headers: getHeaders() });
    logTest('Get Statistics', 'Knowledge Base', true, response.data.statistics);
  } catch (error) {
    logTest('Get Statistics', 'Knowledge Base', false, null, 
      error.response?.data?.message || error.message);
  }

  // Test 5: Refresh knowledge base
  try {
    const response = await axios.post(`${BASE_URL}/rag/refresh/${TEST_SITE_ID}`, {}, { headers: getHeaders() });
    logTest('Refresh Knowledge Base', 'Knowledge Base', response.data.success === true, {
      success: response.data.success,
      message: response.data.message
    });
  } catch (error) {
    logTest('Refresh Knowledge Base', 'Knowledge Base', false, null, 
      error.response?.data?.message || error.message);
  }
}

async function testContentGeneration() {
  printSubHeader('RAG Content Generation');

  const contentTypes = [
    { type: 'title', topic: 'AI SEO Optimization Services', maxLength: 60 },
    { type: 'description', topic: 'Large Language Model Optimization', maxLength: 160 },
    { type: 'faq', topic: 'Answer Engine Optimization', maxLength: 500 },
    { type: 'paragraph', topic: 'Generative Engine Optimization', maxLength: 300 }
  ];

  for (const { type, topic, maxLength } of contentTypes) {
    try {
      const response = await axios.post(`${BASE_URL}/rag/generate`, {
        siteId: TEST_SITE_ID,
        contentType: type,
        topic: topic,
        additionalContext: 'Focus on technical SEO and user experience for AI search engines',
        useRAG: true,
        maxLength: maxLength,
      }, { headers: getHeaders() });

      const success = response.data.content && response.data.content.length > 0;
      logTest(`Generate ${type.toUpperCase()} Content`, 'Content Generation', success, {
        topic,
        contentLength: response.data.content?.length || 0,
        ragScore: response.data.ragScore,
        ragEnhanced: response.data.ragEnhanced,
        preview: response.data.content?.substring(0, 100) + '...'
      });
    } catch (error) {
      logTest(`Generate ${type.toUpperCase()} Content`, 'Content Generation', false, null, 
        error.response?.data?.message || error.message);
    }
  }
}

async function testRAGQuerying() {
  printSubHeader('RAG Query Processing');

  const queries = [
    {
      query: 'What are the best practices for AI SEO optimization?',
      contextType: 'all',
      description: 'General AI SEO Query'
    },
    {
      query: 'How to optimize content for ChatGPT citations?',
      contextType: 'content',
      description: 'ChatGPT Optimization Query'
    },
    {
      query: 'What is Answer Engine Optimization?',
      contextType: 'faq',
      description: 'AEO Definition Query'
    },
    {
      query: 'LLM optimization techniques for content creators',
      contextType: 'title',
      description: 'Content Creator Query'
    }
  ];

  for (const { query, contextType, description } of queries) {
    try {
      const response = await axios.post(`${BASE_URL}/rag/query`, {
        siteId: TEST_SITE_ID,
        query,
        contextType,
        maxResults: 5,
        similarityThreshold: 0.7,
      }, { headers: getHeaders() });

      logTest(`RAG Query: ${description}`, 'Query Processing', true, {
        query: query.substring(0, 50) + '...',
        resultsCount: response.data.results?.length || 0,
        responseTime: response.data.metadata?.responseTime || 'N/A',
        hasResults: (response.data.results?.length || 0) > 0
      });
    } catch (error) {
      logTest(`RAG Query: ${description}`, 'Query Processing', false, null, 
        error.response?.data?.message || error.message);
    }
  }
}

async function testAnalytics() {
  printSubHeader('RAG Analytics');

  // Test 1: Get RAG analytics
  try {
    const response = await axios.get(`${BASE_URL}/rag/analytics/${TEST_SITE_ID}`, { headers: getHeaders() });
    logTest('Get RAG Analytics', 'Analytics', true, {
      hasAnalytics: !!response.data.analytics,
      metricsAvailable: !!response.data.analytics?.metrics
    });
  } catch (error) {
    logTest('Get RAG Analytics', 'Analytics', false, null, 
      error.response?.data?.message || error.message);
  }

  // Test 2: Content analysis
  try {
    const response = await axios.post(`${BASE_URL}/rag/analyze`, {
      siteId: TEST_SITE_ID,
      content: 'This is a comprehensive guide to AI SEO optimization, covering large language model citation strategies, answer engine optimization techniques, and generative engine optimization best practices for modern content creators.',
      contentType: 'paragraph',
      url: 'https://example.com/ai-seo-guide'
    }, { headers: getHeaders() });

    logTest('Content Quality Analysis', 'Analytics', true, {
      hasAnalysis: !!response.data.analysis,
      score: response.data.analysis?.score,
      recommendationsCount: response.data.analysis?.recommendations?.length || 0,
      sampleRecommendation: response.data.analysis?.recommendations?.[0]?.substring(0, 50) + '...' || 'None'
    });
  } catch (error) {
    logTest('Content Quality Analysis', 'Analytics', false, null, 
      error.response?.data?.message || error.message);
  }
}

async function testPageIntegration() {
  printSubHeader('Page Content Integration');

  // Test 1: Generate page content
  try {
    const response = await axios.post(`${BASE_URL}/pages/${TEST_PAGE_ID}/rag-generate`, {
      contentType: 'title',
      topic: 'Advanced AI SEO Optimization Techniques',
      additionalContext: 'Focus on LLM citation and visibility strategies',
      useRAG: true,
    }, { headers: getHeaders() });

    logTest('Generate Page RAG Content', 'Page Integration', true, {
      hasContent: !!response.data.content,
      contentLength: response.data.content?.length || 0,
      ragScore: response.data.ragScore,
      success: response.data.success
    });
  } catch (error) {
    logTest('Generate Page RAG Content', 'Page Integration', false, null, 
      error.response?.data?.message || error.message);
  }

  // Test 2: Get page analytics
  try {
    const response = await axios.get(`${BASE_URL}/pages/${TEST_PAGE_ID}/rag-analytics`, { headers: getHeaders() });
    logTest('Get Page RAG Analytics', 'Page Integration', true, {
      hasAnalytics: !!response.data.analytics,
      metricsAvailable: !!response.data.analytics?.metrics
    });
  } catch (error) {
    logTest('Get Page RAG Analytics', 'Page Integration', false, null, 
      error.response?.data?.message || error.message);
  }
}

async function testErrorHandling() {
  printSubHeader('Error Handling');

  // Test 1: Invalid site ID
  try {
    await axios.get(`${BASE_URL}/rag/status/invalid-site-id`, { headers: getHeaders() });
    logTest('Invalid Site ID Handling', 'Error Handling', false, null, 'Should return error for invalid site ID');
  } catch (error) {
    if (error.response?.status >= 400) {
      logTest('Invalid Site ID Handling', 'Error Handling', true, 'Correctly handled invalid site ID');
    } else {
      logTest('Invalid Site ID Handling', 'Error Handling', false, null, error.message);
    }
  }

  // Test 2: Invalid content type
  try {
    await axios.post(`${BASE_URL}/rag/generate`, {
      siteId: TEST_SITE_ID,
      contentType: 'invalid-type',
      topic: 'Test topic',
    }, { headers: getHeaders() });
    logTest('Invalid Content Type Handling', 'Error Handling', false, null, 'Should return error for invalid content type');
  } catch (error) {
    if (error.response?.status >= 400) {
      logTest('Invalid Content Type Handling', 'Error Handling', true, 'Correctly handled invalid content type');
    } else {
      logTest('Invalid Content Type Handling', 'Error Handling', false, null, error.message);
    }
  }

  // Test 3: Empty query
  try {
    await axios.post(`${BASE_URL}/rag/query`, {
      siteId: TEST_SITE_ID,
      query: '',
      contextType: 'all',
    }, { headers: getHeaders() });
    logTest('Empty Query Handling', 'Error Handling', false, null, 'Should return error for empty query');
  } catch (error) {
    if (error.response?.status >= 400) {
      logTest('Empty Query Handling', 'Error Handling', true, 'Correctly handled empty query');
    } else {
      logTest('Empty Query Handling', 'Error Handling', false, null, error.message);
    }
  }
}

async function testPerformance() {
  printSubHeader('Performance Tests');

  const performanceTests = [
    { name: 'Status Check', method: 'GET', endpoint: `/rag/status/${TEST_SITE_ID}` },
    { name: 'Content Generation', method: 'POST', endpoint: `/rag/generate`, 
      data: { siteId: TEST_SITE_ID, contentType: 'title', topic: 'Performance Test', useRAG: true } },
    { name: 'RAG Query', method: 'POST', endpoint: `/rag/query`, 
      data: { siteId: TEST_SITE_ID, query: 'performance test query', contextType: 'all' } },
  ];

  for (const test of performanceTests) {
    try {
      const startTime = Date.now();
      
      if (test.method === 'GET') {
        await axios.get(`${BASE_URL}${test.endpoint}`, { headers: getHeaders() });
      } else {
        await axios.post(`${BASE_URL}${test.endpoint}`, test.data, { headers: getHeaders() });
      }
      
      const responseTime = Date.now() - startTime;
      const passed = responseTime < 10000; // 10 seconds threshold
      
      logTest(`Performance: ${test.name}`, 'Performance', passed, { 
        responseTime: `${responseTime}ms`,
        threshold: '10000ms',
        status: passed ? 'GOOD' : 'SLOW'
      });
    } catch (error) {
      logTest(`Performance: ${test.name}`, 'Performance', false, null, 
        error.response?.data?.message || error.message);
    }
  }
}

// Test results summary
function printTestSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE RAG TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\n🎯 Overall Results:`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   📊 Total: ${testResults.total}`);
  console.log(`   📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  console.log(`\n📋 Results by Category:`);
  Object.entries(testResults.categories).forEach(([category, results]) => {
    const successRate = ((results.passed / results.total) * 100).toFixed(1);
    console.log(`   ${category}: ${results.passed}/${results.total} (${successRate}%)`);
  });
  
  if (testResults.failed > 0) {
    console.log(`\n❌ Failed Tests:`);
    testResults.details
      .filter(test => !test.success)
      .forEach(test => console.log(`   - ${test.testName}: ${test.error || 'Unknown error'}`));
  }
  
  console.log('\n🎉 RAG System Test Suite Complete!');
  
  if (testResults.passed === testResults.total) {
    console.log('🌟 All tests passed! RAG system is fully functional.');
  } else if (testResults.passed / testResults.total >= 0.8) {
    console.log('✅ Most tests passed! RAG system is largely functional with minor issues.');
  } else {
    console.log('⚠️ Several tests failed. Please review the issues above.');
  }
  
  console.log(`\n⏰ Test completed at: ${new Date().toLocaleString()}`);
}

// Main test runner
async function runRAGTests() {
  console.log('🚀 COMPREHENSIVE RAG SYSTEM TEST SUITE');
  console.log('=====================================');
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`🎯 Target Site ID: ${TEST_SITE_ID}`);
  console.log(`📄 Target Page ID: ${TEST_PAGE_ID}`);
  console.log(`👤 Test User ID: ${TEST_USER_ID}\n`);

  try {
    // Step 1: Setup authentication
    const authSuccess = await setupAuthentication();
    if (!authSuccess) {
      console.log('❌ Cannot proceed without valid authentication. Exiting...');
      return;
    }

    // Step 2: Run all test categories
    await testBasicConnectivity();
    await testAuthentication();
    await testKnowledgeBaseOperations();
    await testContentGeneration();
    await testRAGQuerying();
    await testAnalytics();
    await testPageIntegration();
    await testErrorHandling();
    await testPerformance();

    // Step 3: Print comprehensive summary
    printTestSummary();

  } catch (error) {
    console.error('❌ Test suite execution failed:', error.message);
    process.exit(1);
  }
}

// Export for external usage
module.exports = {
  runRAGTests,
  testBasicConnectivity,
  testKnowledgeBaseOperations,
  testContentGeneration,
  testRAGQuerying,
  testAnalytics,
};

// Run if called directly
if (require.main === module) {
  runRAGTests().catch(console.error);
}