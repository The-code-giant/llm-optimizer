#!/bin/bash

# Quick Deploy Script for AI SEO Optimizer Backend + Redis to AWS
# This script provides a simple way to deploy using CloudFormation

set -e

# AWS Profile Configuration
export AWS_PROFILE=Deploymaster

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }
echo_profile() { echo -e "${BLUE}[AWS]${NC} $1"; }

# Verify AWS Profile
echo_profile "🔍 Verifying AWS Profile: $AWS_PROFILE"
if ! aws configure list --profile $AWS_PROFILE > /dev/null 2>&1; then
    echo_error "AWS Profile '$AWS_PROFILE' not found or not configured."
    echo_error "Available profiles:"
    aws configure list-profiles 2>/dev/null || echo "No profiles found"
    exit 1
fi

# Check prerequisites
if ! command -v aws &> /dev/null; then
    echo_error "AWS CLI is not installed"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo_error "Docker is not running"
    exit 1
fi

# Default values
ENVIRONMENT=${1:-production}
AWS_REGION=${2:-us-west-2}
STACK_NAME="ai-seo-optimizer-${ENVIRONMENT}"

echo_info "Starting quick deployment..."
echo_info "Environment: $ENVIRONMENT"
echo_info "Region: $AWS_REGION"
echo_info "Stack: $STACK_NAME"
echo_info "AWS Profile: $AWS_PROFILE"

# Get account ID and verify credentials
echo_profile "🔐 Verifying AWS credentials..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$ACCOUNT_ID" ]; then
    echo_error "Failed to get AWS Account ID. Please check your AWS credentials for profile: $AWS_PROFILE"
    exit 1
fi

USER_ARN=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null)
echo_profile "✅ Authenticated as: $USER_ARN"

echo_info "Account ID: $ACCOUNT_ID"

# Create ECR repository
echo_info "Creating ECR repository..."
aws ecr describe-repositories --repository-names ai-seo-backend --region $AWS_REGION > /dev/null 2>&1 || \
aws ecr create-repository --repository-name ai-seo-backend --region $AWS_REGION

# Build and push image
echo_info "Building and pushing Docker image..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

cd ../backend
docker build -f Dockerfile.prod -t ai-seo-backend:latest .
docker tag ai-seo-backend:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ai-seo-backend:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ai-seo-backend:latest

cd ../aws

# Collect parameters
echo ""
echo_warn "Please provide the following information:"

read -p "Database URL (postgresql://user:pass@host:5432/dbname): " DATABASE_URL
read -s -p "JWT Secret: " JWT_SECRET
echo ""
read -s -p "Clerk Secret Key: " CLERK_SECRET_KEY
echo ""
read -p "OpenAI API Key (optional): " OPENAI_KEY
read -p "Anthropic API Key (optional): " ANTHROPIC_KEY
read -p "CORS Origin (https://yourdomain.com): " CORS_ORIGIN

IMAGE_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ai-seo-backend:latest"

# Deploy CloudFormation stack
echo_info "Deploying CloudFormation stack..."
aws cloudformation create-stack \
  --stack-name $STACK_NAME \
  --template-body file://infrastructure.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
    ParameterKey=DatabaseUrl,ParameterValue="$DATABASE_URL" \
    ParameterKey=JwtSecret,ParameterValue="$JWT_SECRET" \
    ParameterKey=ClerkSecretKey,ParameterValue="$CLERK_SECRET_KEY" \
    ParameterKey=OpenAIApiKey,ParameterValue="$OPENAI_KEY" \
    ParameterKey=AnthropicApiKey,ParameterValue="$ANTHROPIC_KEY" \
    ParameterKey=CorsOrigin,ParameterValue="$CORS_ORIGIN" \
    ParameterKey=ImageUri,ParameterValue="$IMAGE_URI" \
  --capabilities CAPABILITY_IAM \
  --region $AWS_REGION

echo_info "Stack creation initiated. Waiting for completion..."

# Wait for stack creation
aws cloudformation wait stack-create-complete \
  --stack-name $STACK_NAME \
  --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo_info "Stack created successfully!"
    
    # Get outputs
    BACKEND_URL=$(aws cloudformation describe-stacks \
      --stack-name $STACK_NAME \
      --query 'Stacks[0].Outputs[?OutputKey==`BackendURL`].OutputValue' \
      --output text \
      --region $AWS_REGION)
    
    echo ""
    echo_info "Deployment completed successfully!"
    echo_info "Backend URL: $BACKEND_URL"
    echo ""
    echo_warn "Next steps:"
    echo "1. Update your frontend configuration with the Backend URL"
    echo "2. Test the deployment: curl $BACKEND_URL/health"
    echo "3. Configure your domain and SSL certificate"
    echo "4. Set up monitoring and alerts"
    
else
    echo_error "Stack creation failed!"
    echo "Check CloudFormation console for details:"
    echo "https://console.aws.amazon.com/cloudformation/home?region=$AWS_REGION#/stacks"
    exit 1
fi 