// Clerk Token Generator
// Generates a fresh JWT token using Clerk's REST API
require('dotenv').config();

const axios = require('axios');

async function generateClerkToken(userId = 'user_30DWRB8aZws2cujeYUmyMli9Usp') {
  console.log('🚀 Generating Clerk JWT Token\n');

  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  
  if (!CLERK_SECRET_KEY) {
    console.log('❌ CLERK_SECRET_KEY not found in environment variables');
    return null;
  }

  try {
    // Step 1: Create a session via Clerk REST API
    console.log('📋 Creating session...');
    
    const sessionResponse = await axios.post(
      'https://api.clerk.com/v1/sessions',
      { user_id: userId },
      {
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('✅ Session created:', sessionResponse.data.id);
    console.log(`📅 Expires: ${new Date(sessionResponse.data.expire_at).toLocaleString()}`);
    
    // Step 2: Get JWT token from the session
    console.log('\n🎫 Generating JWT token...');
    
    const tokenResponse = await axios.post(
      `https://api.clerk.com/v1/sessions/${sessionResponse.data.id}/tokens`,
      { template: 'default' },
      {
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const token = tokenResponse.data.jwt;
    console.log('\n🎉 SUCCESS! JWT Token Generated:');
    console.log(`Bearer ${token}`);
    
    return token;
    
  } catch (error) {
    console.error(`❌ Token generation failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    
    if (error.response?.data) {
      console.log('📋 Error details:', JSON.stringify(error.response.data, null, 2));
    }
    
    return null;
  }
}

// Alternative method: Try to get token from existing sessions
async function getTokenFromExistingSessions(userId = 'user_30DWRB8aZws2cujeYUmyMli9Usp') {
  try {
    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
    
    console.log('🔄 Trying to get token from existing sessions...');
    
    const sessionsResponse = await axios.get(
      'https://api.clerk.com/v1/sessions',
      {
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        }
      }
    );
    
    console.log(`📱 Found ${sessionsResponse.data.length} total sessions`);
    
    // Find sessions for our user
    const userSessions = sessionsResponse.data.filter(s => s.user_id === userId);
    console.log(`👤 User sessions: ${userSessions.length}`);
    
    if (userSessions.length > 0) {
      const activeSession = userSessions.find(s => s.status === 'active') || userSessions[0];
      console.log(`🎫 Using session: ${activeSession.id} (status: ${activeSession.status})`);
      
      // Get token from existing session
      const tokenResponse = await axios.post(
        `https://api.clerk.com/v1/sessions/${activeSession.id}/tokens`,
        { template: 'default' },
        {
          headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      const token = tokenResponse.data.jwt;
      console.log('\n✅ Token from existing session:');
      console.log(`Bearer ${token}`);
      
      return token;
    } else {
      console.log('❌ No sessions found for user');
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Failed to get token from existing sessions: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    return null;
  }
}

// Main function
async function main() {
  console.log('🔐 Clerk Token Generator');
  console.log('========================\n');
  
  // Try to generate fresh token first
  let token = await generateClerkToken();
  
  // If that fails, try existing sessions
  if (!token) {
    console.log('\n🔄 Falling back to existing sessions...');
    token = await getTokenFromExistingSessions();
  }
  
  if (token) {
    console.log('\n📋 Usage:');
    console.log('Copy the Bearer token above and use it in your API requests like this:');
    console.log('curl -H "Authorization: Bearer <token>" <your-api-endpoint>');
    console.log('\n⚠️ Note: Clerk tokens expire quickly (usually within 1 hour)');
  } else {
    console.log('\n💡 Alternative: Get token from browser');
    console.log('1. Open your frontend: http://localhost:3002');
    console.log('2. Sign in to your account');
    console.log('3. Open browser console and run:');
    console.log('   await window.Clerk.session.getToken()');
    console.log('4. Copy the returned token');
  }
}

// Export functions for external use
module.exports = {
  generateClerkToken,
  getTokenFromExistingSessions,
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}