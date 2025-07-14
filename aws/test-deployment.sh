#!/bin/bash

# Test deployment script
# Usage: ./test-deployment.sh <PUBLIC_IP>

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <PUBLIC_IP>"
    echo "Example: $0 35.153.206.45"
    exit 1
fi

PUBLIC_IP=$1
BASE_URL="http://$PUBLIC_IP:3001"

echo "🧪 Testing AI SEO Optimizer Deployment"
echo "========================================"
echo "🌐 Testing: $BASE_URL"
echo ""

# Test health endpoint
echo "🏥 Testing health endpoint..."
if curl -s -f "$BASE_URL/healthz" > /dev/null; then
    echo "✅ Health endpoint is working"
    curl -s "$BASE_URL/healthz" | jq '.'
else
    echo "❌ Health endpoint failed"
    exit 1
fi

echo ""

# Test Swagger JSON
echo "📚 Testing Swagger API documentation..."
if curl -s -f "$BASE_URL/api-docs/swagger.json" > /dev/null; then
    echo "✅ Swagger JSON is working"
    curl -s "$BASE_URL/api-docs/swagger.json" | jq '.info'
else
    echo "❌ Swagger JSON failed"
    exit 1
fi

echo ""

# Test Swagger UI
echo "🖥️ Testing Swagger UI..."
if curl -s -f "$BASE_URL/api-docs/" | grep -q "Swagger UI"; then
    echo "✅ Swagger UI is working"
else
    echo "❌ Swagger UI failed"
    exit 1
fi

echo ""

# Test API endpoint (this might fail due to auth, but should not return 500)
echo "🔌 Testing API endpoint..."
response_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/sites")
if [ "$response_code" = "401" ] || [ "$response_code" = "200" ]; then
    echo "✅ API endpoint is responding correctly (HTTP $response_code)"
else
    echo "⚠️ API endpoint returned HTTP $response_code (this might be expected)"
fi

echo ""
echo "🎉 DEPLOYMENT TEST COMPLETE!"
echo "========================================"
echo "🌐 Application URL: $BASE_URL"
echo "🏥 Health Check: $BASE_URL/healthz"
echo "📚 API Docs: $BASE_URL/api-docs"
echo ""

if [ "$response_code" = "500" ]; then
    echo "⚠️ Warning: API returned 500 error. Check backend logs."
    exit 1
else
    echo "✅ All tests passed! Deployment is working correctly."
    exit 0
fi 