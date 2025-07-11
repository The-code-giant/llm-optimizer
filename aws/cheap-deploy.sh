#!/bin/bash

# Cheapest Possible AWS Deployment Script
# This script deploys with minimal resources to minimize costs

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }
echo_cost() { echo -e "${BLUE}[COST]${NC} $1"; }

# Banner
echo_info "🚀 AI SEO Optimizer - MINIMAL COST Deployment"
echo_cost "💰 Estimated monthly cost: ~\$9-12 (excluding database)"

# Check prerequisites
if ! command -v aws &> /dev/null; then
    echo_error "AWS CLI is not installed"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo_error "Docker is not running"
    exit 1
fi

# Configuration
ENVIRONMENT="minimal"
AWS_REGION=${1:-us-east-1}
STACK_NAME="ai-seo-optimizer-${ENVIRONMENT}"

echo_info "Starting minimal cost deployment..."
echo_info "Environment: $ENVIRONMENT"
echo_info "Region: $AWS_REGION"
echo_info "Stack: $STACK_NAME"

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$ACCOUNT_ID" ]; then
    echo_error "Failed to get AWS Account ID"
    exit 1
fi

echo_info "Account ID: $ACCOUNT_ID"

# Create ECR repository
echo_info "Creating ECR repository..."
aws ecr describe-repositories --repository-names ai-seo-backend --region $AWS_REGION > /dev/null 2>&1 || \
aws ecr create-repository --repository-name ai-seo-backend --region $AWS_REGION

# Build and push minimal image
echo_info "Building minimal Docker image..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

cd ../backend
docker build -f Dockerfile.prod -t ai-seo-backend:minimal .
docker tag ai-seo-backend:minimal $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ai-seo-backend:minimal
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ai-seo-backend:minimal

cd ../aws

# Collect minimal parameters
echo ""
echo_warn "Please provide the following information for minimal deployment:"

read -p "Database URL (postgresql://user:pass@host:5432/dbname): " DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo_error "Database URL is required"
    exit 1
fi

read -s -p "JWT Secret (press enter for auto-generated): " JWT_SECRET
echo ""
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo_info "Auto-generated JWT secret"
fi

read -s -p "Clerk Secret Key: " CLERK_SECRET_KEY
echo ""
if [ -z "$CLERK_SECRET_KEY" ]; then
    echo_error "Clerk Secret Key is required"
    exit 1
fi

read -p "OpenAI API Key (optional, press enter to skip): " OPENAI_KEY
read -p "Anthropic API Key (optional, press enter to skip): " ANTHROPIC_KEY

IMAGE_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ai-seo-backend:minimal"

echo ""
echo_cost "💰 Cost Breakdown (estimated monthly):"
echo_cost "   • ECS Fargate (0.25 vCPU, 0.5GB RAM): ~\$9"
echo_cost "   • Secrets Manager: ~\$2"
echo_cost "   • CloudWatch Logs (3 days retention): ~\$1"
echo_cost "   • Data Transfer: ~\$1-5"
echo_cost "   • Total: ~\$13-17/month"
echo_cost "   • 💡 NO Load Balancer (saves \$16/month)"
echo ""

read -p "Continue with deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo_warn "Deployment cancelled"
    exit 0
fi

# Deploy minimal CloudFormation stack
echo_info "Deploying minimal CloudFormation stack..."
aws cloudformation create-stack \
  --stack-name $STACK_NAME \
  --template-body file://infrastructure-minimal.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
    ParameterKey=DatabaseUrl,ParameterValue="$DATABASE_URL" \
    ParameterKey=JwtSecret,ParameterValue="$JWT_SECRET" \
    ParameterKey=ClerkSecretKey,ParameterValue="$CLERK_SECRET_KEY" \
    ParameterKey=OpenAIApiKey,ParameterValue="$OPENAI_KEY" \
    ParameterKey=AnthropicApiKey,ParameterValue="$ANTHROPIC_KEY" \
    ParameterKey=CorsOrigin,ParameterValue="*" \
    ParameterKey=ImageUri,ParameterValue="$IMAGE_URI" \
  --capabilities CAPABILITY_IAM \
  --region $AWS_REGION

echo_info "Stack creation initiated. This will take 5-10 minutes..."

# Wait for stack creation
aws cloudformation wait stack-create-complete \
  --stack-name $STACK_NAME \
  --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo_info "✅ Minimal deployment completed successfully!"
    
    echo ""
    echo_warn "📋 Important Next Steps:"
    echo "1. Get the public IP of your ECS task:"
    echo "   aws ecs list-tasks --cluster ai-seo-optimizer-minimal --region $AWS_REGION"
    echo "   aws ecs describe-tasks --cluster ai-seo-optimizer-minimal --tasks TASK_ARN --region $AWS_REGION"
    echo ""
    echo "2. Or check in AWS Console:"
    echo "   ECS → Clusters → ai-seo-optimizer-minimal → Service → Tasks"
    echo ""
    echo "3. Access your backend at: http://PUBLIC_IP:3001"
    echo "   Test with: curl http://PUBLIC_IP:3001/health"
    echo ""
    echo "4. Update your frontend environment variables:"
    echo "   NEXT_PUBLIC_API_URL=http://PUBLIC_IP:3001/api/v1"
    echo ""
    echo_cost "💰 Your monthly cost should be around \$9-12"
    echo_warn "⚠️  Note: Using public IP directly (no domain/SSL)"
    echo_warn "⚠️  For production, consider adding a domain + CloudFlare for SSL"
    
else
    echo_error "Stack creation failed!"
    echo "Check CloudFormation console for details:"
    echo "https://console.aws.amazon.com/cloudformation/home?region=$AWS_REGION#/stacks"
    exit 1
fi

# Function to get public IP
get_public_ip() {
    echo ""
    echo_info "🔍 Attempting to get public IP..."
    
    CLUSTER_NAME="ai-seo-optimizer-minimal"
    
    # Get running tasks
    TASK_ARNS=$(aws ecs list-tasks --cluster $CLUSTER_NAME --region $AWS_REGION --query 'taskArns' --output text)
    
    if [ -n "$TASK_ARNS" ]; then
        for TASK_ARN in $TASK_ARNS; do
            PUBLIC_IP=$(aws ecs describe-tasks \
                --cluster $CLUSTER_NAME \
                --tasks $TASK_ARN \
                --region $AWS_REGION \
                --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
                --output text | xargs -I {} aws ec2 describe-network-interfaces \
                --network-interface-ids {} \
                --region $AWS_REGION \
                --query 'NetworkInterfaces[0].Association.PublicIp' \
                --output text)
            
            if [ "$PUBLIC_IP" != "None" ] && [ -n "$PUBLIC_IP" ]; then
                echo_info "🎉 Found public IP: $PUBLIC_IP"
                echo_info "🌐 Backend URL: http://$PUBLIC_IP:3001"
                echo_info "🔥 Health check: curl http://$PUBLIC_IP:3001/health"
                break
            fi
        done
    else
        echo_warn "No running tasks found. The service might still be starting..."
        echo_info "Check again in a few minutes or use the AWS Console"
    fi
}

# Try to get the public IP
get_public_ip 