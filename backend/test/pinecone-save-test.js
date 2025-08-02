// Quick test to verify Pinecone is saving vectors
require('dotenv').config();
const axios = require('axios');

async function generateClerkToken(userId = 'user_30DWRB8aZws2cujeYUmyMli9Usp') {
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  
  try {
    const sessionResponse = await axios.post(
      'https://api.clerk.com/v1/sessions',
      { user_id: userId },
      { headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );
    
    const tokenResponse = await axios.post(
      `https://api.clerk.com/v1/sessions/${sessionResponse.data.id}/tokens`,
      { template: 'default' },
      { headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );
    
    return tokenResponse.data.jwt;
  } catch (error) {
    console.error('Token generation failed:', error.message);
    return null;
  }
}

async function testPineconeSaving() {
  console.log('🧪 Testing Pinecone Vector Saving\n');
  
  const token = await generateClerkToken();
  if (!token) {
    console.log('❌ Failed to get token');
    return;
  }
  
  const siteId = 'ca337a2f-a250-48e0-b363-1e2e5f290f70';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // 1. Check current statistics
    console.log('📊 Getting current statistics...');
    const statsResponse = await axios.get(`http://localhost:3001/api/v1/rag/statistics/${siteId}`, { headers });
    console.log('✅ Current stats:', statsResponse.data.statistics);
    
    // 2. Initialize/refresh knowledge base to trigger vector saving
    console.log('\n🔄 Refreshing knowledge base to save vectors...');
    const refreshResponse = await axios.post(`http://localhost:3001/api/v1/rag/refresh/${siteId}`, {}, { headers });
    console.log('✅ Refresh response:', refreshResponse.data);
    
    // 3. Wait a bit for processing
    console.log('\n⏳ Waiting 10 seconds for vector processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 4. Check statistics again to see if vectors were saved
    console.log('\n📊 Getting updated statistics...');
    const updatedStatsResponse = await axios.get(`http://localhost:3001/api/v1/rag/statistics/${siteId}`, { headers });
    console.log('✅ Updated stats:', updatedStatsResponse.data.statistics);
    
    // 5. Test a RAG query to see if vectors are accessible
    console.log('\n🔍 Testing RAG query...');
    const queryResponse = await axios.post(`http://localhost:3001/api/v1/rag/query`, {
      siteId,
      query: 'SEO optimization techniques',
      contextType: 'all',
      maxResults: 3
    }, { headers });
    
    console.log('✅ Query results:', {
      resultsCount: queryResponse.data.results?.length || 0,
      hasResults: (queryResponse.data.results?.length || 0) > 0,
      sampleResult: queryResponse.data.results?.[0] || 'No results'
    });
    
    if (queryResponse.data.results?.length > 0) {
      console.log('\n🎉 SUCCESS: Vectors are being saved and retrieved from Pinecone!');
      console.log('📝 Sample result:', queryResponse.data.results[0].metadata?.content?.substring(0, 100) + '...');
    } else {
      console.log('\n⚠️ No vectors found - might still be processing or indexing');
    }
    
  } catch (error) {
    console.error('❌ Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
  }
}

testPineconeSaving().catch(console.error);