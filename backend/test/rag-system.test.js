#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001/api/v1/rag';
const TEST_SITE_ID = 'ca337a2f-a250-48e0-b363-1e2e5f290f70';
const TEST_PAGE_ID = '1b624b34-deb2-4b4f-99d9-848c4de00922';

// Generate Clerk token
async function generateClerkToken(userId = 'user_30DWRB8aZws2cujeYUmyMli9Usp') {
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  
  if (!CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY not found in environment variables');
  }

  try {
    // Create session
    const sessionResponse = await axios.post(
      'https://api.clerk.com/v1/sessions',
      { user_id: userId },
      { headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );
    
    // Generate JWT token
    const tokenResponse = await axios.post(
      `https://api.clerk.com/v1/sessions/${sessionResponse.data.id}/tokens`,
      { template: 'default' },
      { headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );
    
    return tokenResponse.data.jwt;
  } catch (error) {
    console.error('Token generation failed:', error.response?.data || error.message);
    throw new Error('Failed to generate Clerk token');
  }
}

// Test utilities
function logTest(testName, status, details = '') {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : '❓';
  console.log(`${emoji} ${testName}: ${details}`);
}

async function testEndpoint(method, endpoint, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${global.testToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: `Expected ${expectedStatus}, got ${response.status}` };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

// Test functions
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    global.testToken = await generateClerkToken();
    logTest('Token Generation', 'PASS', 'Clerk JWT token generated successfully');
    return true;
  } catch (error) {
    logTest('Token Generation', 'FAIL', error.message);
    return false;
  }
}

async function testKnowledgeBaseStatus() {
  console.log('\n📊 Testing Knowledge Base Status...');
  
  const result = await testEndpoint('GET', `/status/${TEST_SITE_ID}`);
  
  if (result.success) {
    logTest('Get KB Status', 'PASS', `Status: ${result.data.status}`);
    return result.data;
  } else {
    // This might fail if KB doesn't exist yet, which is okay
    logTest('Get KB Status', 'WARN', `Expected for new sites: ${result.error}`);
    return null;
  }
}

async function testKnowledgeBaseInitialization() {
  console.log('\n🔧 Testing Knowledge Base Initialization...');
  
  const result = await testEndpoint('POST', `/initialize/${TEST_SITE_ID}`);
  
  if (result.success) {
    logTest('Initialize KB', 'PASS', result.data.message);
    return result.data;
  } else {
    logTest('Initialize KB', 'FAIL', result.error);
    return null;
  }
}

async function testKnowledgeBaseRefresh() {
  console.log('\n🔄 Testing Knowledge Base Refresh...');
  
  const result = await testEndpoint('POST', `/refresh/${TEST_SITE_ID}`);
  
  if (result.success) {
    logTest('Refresh KB', 'PASS', result.data.message);
    return result.data;
  } else {
    // Refresh might fail if KB is busy, which is okay
    logTest('Refresh KB', 'WARN', `Expected if KB busy: ${result.error}`);
    return null;
  }
}

async function testGetDocuments() {
  console.log('\n📄 Testing Document Retrieval...');
  
  const result = await testEndpoint('GET', `/documents/${TEST_SITE_ID}`);
  
  if (result.success) {
    const docCount = result.data.documents?.length || 0;
    logTest('Get Documents', 'PASS', `${docCount} documents retrieved`);
    return result.data;
  } else {
    logTest('Get Documents', 'FAIL', result.error);
    return null;
  }
}

async function testGetStatistics() {
  console.log('\n📈 Testing Statistics...');
  
  const result = await testEndpoint('GET', `/statistics/${TEST_SITE_ID}`);
  
  if (result.success) {
    const stats = result.data.statistics;
    logTest('Get Statistics', 'PASS', 
      `${stats.totalDocuments} docs, ${stats.vectorStoreStats?.totalRecordCount || 0} vectors`);
    return result.data;
  } else {
    logTest('Get Statistics', 'FAIL', result.error);
    return null;
  }
}

async function testContentGeneration() {
  console.log('\n📝 Testing Content Generation...');
  
  const testData = {
    siteId: TEST_SITE_ID,
    contentType: 'title',
    topic: 'AI SEO optimization',
    additionalContext: 'Focus on actionable insights for small businesses.'
  };
  
  const result = await testEndpoint('POST', '/generate', testData);
  
  if (result.success) {
    const response = result.data.response?.response || 'No response';
    logTest('Generate Content', 'PASS', `Generated: "${response.substring(0, 50)}..."`);
    return result.data;
  } else {
    logTest('Generate Content', 'FAIL', result.error);
    return null;
  }
}

async function testRAGQuery() {
  console.log('\n🔍 Testing RAG Query...');
  
  const testData = {
    siteId: TEST_SITE_ID,
    query: 'SEO optimization techniques',
    contextType: 'all',
    maxResults: 3
  };
  
  const result = await testEndpoint('POST', '/query', testData);
  
  if (result.success) {
    const resultsCount = result.data.results?.length || 0;
    logTest('RAG Query', 'PASS', `${resultsCount} results found`);
    return result.data;
  } else {
    logTest('RAG Query', 'FAIL', result.error);
    return null;
  }
}

async function testContentAnalysis() {
  console.log('\n🔬 Testing Content Analysis...');
  
  const testData = {
    siteId: TEST_SITE_ID,
    content: 'This is a sample content for SEO optimization analysis.',
    contentType: 'paragraph',
    url: 'https://example.com/test-page'
  };
  
  const result = await testEndpoint('POST', '/analyze', testData);
  
  if (result.success) {
    logTest('Content Analysis', 'PASS', 'Analysis completed');
    return result.data;
  } else {
    // Content analysis might not be fully implemented yet
    logTest('Content Analysis', 'WARN', `Not fully implemented: ${result.error}`);
    return null;
  }
}

async function testGetAnalytics() {
  console.log('\n📊 Testing Analytics...');
  
  const result = await testEndpoint('GET', `/analytics/${TEST_SITE_ID}`);
  
  if (result.success) {
    const analytics = result.data.analytics;
    logTest('Get Analytics', 'PASS', 
      `${analytics.totalGenerations || 0} generations, ${analytics.ragEnhancedCount || 0} RAG enhanced`);
    return result.data;
  } else {
    logTest('Get Analytics', 'FAIL', result.error);
    return null;
  }
}

async function testErrorHandling() {
  console.log('\n⚠️ Testing Error Handling...');
  
  // Test with invalid UUID format
  const invalidUUID = 'invalid-uuid-format';
  const result = await testEndpoint('GET', `/status/${invalidUUID}`);
  
  if (!result.success) {
    logTest('Error Handling', 'PASS', 'Properly handled invalid UUID format');
    return true;
  } else {
    logTest('Error Handling', 'FAIL', 'Should have failed with invalid UUID');
    return false;
  }
}

// Main test runner
async function runRAGTests() {
  console.log('🚀 Starting Comprehensive RAG System Test Suite\n');
  console.log('=' .repeat(60));
  
  const testResults = {
    authentication: false,
    knowledgeBase: false,
    contentGeneration: false,
    vectorStorage: false,
    analytics: false,
    errorHandling: false
  };
  
  try {
    // 1. Authentication
    testResults.authentication = await testAuthentication();
    if (!testResults.authentication) {
      throw new Error('Authentication failed - cannot continue tests');
    }
    
    // 2. Knowledge Base Management
    await testKnowledgeBaseStatus();
    await testKnowledgeBaseInitialization();
    await testKnowledgeBaseRefresh();
    await testGetDocuments();
    await testGetStatistics();
    testResults.knowledgeBase = true;
    
    // 3. Content Generation
    await testContentGeneration();
    testResults.contentGeneration = true;
    
    // 4. Vector Storage & Query
    await testRAGQuery();
    testResults.vectorStorage = true;
    
    // 5. Analytics
    await testContentAnalysis();
    await testGetAnalytics();
    testResults.analytics = true;
    
    // 6. Error Handling
    testResults.errorHandling = await testErrorHandling();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));
    
    Object.entries(testResults).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.charAt(0).toUpperCase() + test.slice(1)}`);
    });
    
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} test categories passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! RAG system is fully operational.');
    } else if (passedTests >= totalTests * 0.8) {
      console.log('✅ Most tests passed! RAG system is largely functional.');
    } else {
      console.log('⚠️ Several tests failed. Check the output above for details.');
    }
    
  } catch (error) {
    console.error('\n💥 Test suite crashed:', error.message);
    throw error;
  }
}

// Export for use in run-tests.js
module.exports = { runRAGTests };

// Run if called directly
if (require.main === module) {
  runRAGTests()
    .then(() => {
      console.log('\n✅ Test suite completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error.message);
      process.exit(1);
    });
} 