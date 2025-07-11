#!/bin/bash

# AWS Setup Verification Script for Deploymaster Profile
# Run this script to verify your AWS configuration before deployment

set -e

# AWS Profile Configuration
export AWS_PROFILE=Deploymaster

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo_success() { echo -e "${GREEN}✅${NC} $1"; }
echo_warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
echo_error() { echo -e "${RED}❌${NC} $1"; }
echo_info() { echo -e "${BLUE}ℹ️${NC} $1"; }
echo_profile() { echo -e "${PURPLE}🔐${NC} $1"; }

echo ""
echo_info "🚀 AWS Setup Verification for Deploymaster Profile"
echo_info "=================================================="
echo ""

# Check if AWS CLI is installed
echo_info "1. Checking AWS CLI installation..."
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version 2>&1 | cut -d' ' -f1 | cut -d'/' -f2)
    echo_success "AWS CLI is installed (version: $AWS_VERSION)"
else
    echo_error "AWS CLI is not installed. Please install it first."
    echo_info "Install with: brew install awscli"
    exit 1
fi

# Check AWS Profile exists
echo ""
echo_info "2. Checking AWS Profile: $AWS_PROFILE"
if aws configure list --profile $AWS_PROFILE > /dev/null 2>&1; then
    echo_success "Profile '$AWS_PROFILE' exists"
else
    echo_error "Profile '$AWS_PROFILE' not found"
    echo_info "Available profiles:"
    aws configure list-profiles 2>/dev/null || echo "   No profiles found"
    echo ""
    echo_info "To create the profile, run:"
    echo "   aws configure --profile $AWS_PROFILE"
    exit 1
fi

# Show current configuration
echo ""
echo_info "3. Current AWS Configuration:"
aws configure list

# Test credentials
echo ""
echo_info "4. Testing AWS credentials..."
if CALLER_IDENTITY=$(aws sts get-caller-identity 2>/dev/null); then
    ACCOUNT_ID=$(echo $CALLER_IDENTITY | jq -r '.Account' 2>/dev/null || echo $CALLER_IDENTITY | grep -o '"Account":"[^"]*"' | cut -d'"' -f4)
    USER_ARN=$(echo $CALLER_IDENTITY | jq -r '.Arn' 2>/dev/null || echo $CALLER_IDENTITY | grep -o '"Arn":"[^"]*"' | cut -d'"' -f4)
    USER_ID=$(echo $CALLER_IDENTITY | jq -r '.UserId' 2>/dev/null || echo $CALLER_IDENTITY | grep -o '"UserId":"[^"]*"' | cut -d'"' -f4)
    
    echo_success "AWS credentials are valid"
    echo_profile "Account ID: $ACCOUNT_ID"
    echo_profile "User ARN: $USER_ARN"
    echo_profile "User ID: $USER_ID"
else
    echo_error "Failed to authenticate with AWS"
    echo_info "Please check your credentials with:"
    echo "   aws configure --profile $AWS_PROFILE"
    exit 1
fi

# Test basic permissions
echo ""
echo_info "5. Testing basic AWS permissions..."

# Test S3 access
if aws s3 ls > /dev/null 2>&1; then
    echo_success "S3 access: OK"
else
    echo_warning "S3 access: Limited or no access"
fi

# Test ECR access
if aws ecr describe-repositories --region us-west-2 > /dev/null 2>&1; then
    echo_success "ECR access: OK"
else
    echo_warning "ECR access: Limited or no access"
fi

# Test ECS access
if aws ecs list-clusters --region us-west-2 > /dev/null 2>&1; then
    echo_success "ECS access: OK"
else
    echo_warning "ECS access: Limited or no access"
fi

# Test CloudFormation access
if aws cloudformation list-stacks --region us-west-2 > /dev/null 2>&1; then
    echo_success "CloudFormation access: OK"
else
    echo_warning "CloudFormation access: Limited or no access"
fi

# Test Docker
echo ""
echo_info "6. Checking Docker..."
if docker info > /dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | sed 's/,//')
    echo_success "Docker is running (version: $DOCKER_VERSION)"
else
    echo_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Summary
echo ""
echo_info "🎉 Setup Verification Complete!"
echo_info "================================"
echo ""
echo_success "✅ AWS CLI: Installed and configured"
echo_success "✅ Profile: $AWS_PROFILE is ready"
echo_success "✅ Account: $ACCOUNT_ID"
echo_success "✅ Docker: Running"
echo ""
echo_info "🚀 You're ready to deploy!"
echo_info "Run one of these deployment scripts:"
echo "   • ./deploy.sh          # Full production deployment"
echo "   • ./quick-deploy.sh    # Quick deployment with CloudFormation"
echo "   • ./cheap-deploy.sh    # Minimal cost deployment (~\$9-12/month)"
echo "" 