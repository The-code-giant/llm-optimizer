#!/bin/bash

DEPLOYMENT_INFO_FILE="deployment-info.txt"

if [ ! -f "$DEPLOYMENT_INFO_FILE" ]; then
    echo "❌ No deployment info found. Run ./deploy-ec2.sh first."
    exit 1
fi

# Load deployment info
source "$DEPLOYMENT_INFO_FILE"

echo "🧪 Running quick test on current deployment"
echo "==========================================="
echo "🌐 Testing: http://$PUBLIC_IP:3001"
echo ""

# Run the test with the current IP
./test-deployment.sh "$PUBLIC_IP" 