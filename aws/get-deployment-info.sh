#!/bin/bash

DEPLOYMENT_INFO_FILE="deployment-info.txt"

if [ ! -f "$DEPLOYMENT_INFO_FILE" ]; then
    echo "❌ No deployment info found. Run ./deploy-ec2.sh first."
    exit 1
fi

echo "📋 Current Deployment Information"
echo "=================================="
source "$DEPLOYMENT_INFO_FILE"

echo "🆔 Instance ID: $INSTANCE_ID"
echo "🌐 Public IP: $PUBLIC_IP"
echo "📅 Deployed: $DEPLOYMENT_DATE"
echo "📦 ECR URI: $ECR_URI"
echo ""
echo "🔗 Quick Links:"
echo "   Health Check: http://$PUBLIC_IP:3001/healthz"
echo "   API Docs: http://$PUBLIC_IP:3001/api-docs"
echo "   SSH: ssh -i ec2-deploy-key.pem ec2-user@$PUBLIC_IP"
echo ""
echo "🧪 To test: ./test-deployment.sh $PUBLIC_IP" 