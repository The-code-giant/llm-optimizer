#!/bin/bash

# AWS ECS Deployment Script for AI SEO Optimizer Backend + Redis
# Usage: ./deploy.sh [ENVIRONMENT] [AWS_REGION]

set -e

# Configuration
ENVIRONMENT=${1:-production}
AWS_REGION=${2:-us-east-1}
PROJECT_NAME="ai-seo-optimizer"
CLUSTER_NAME="${PROJECT_NAME}-${ENVIRONMENT}"
SERVICE_NAME="${PROJECT_NAME}-${ENVIRONMENT}"
REPOSITORY_NAME="${PROJECT_NAME}-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$ACCOUNT_ID" ]; then
    echo_error "Failed to get AWS Account ID. Please check your AWS credentials."
    exit 1
fi

echo_info "Starting deployment for environment: ${ENVIRONMENT}"
echo_info "AWS Region: ${AWS_REGION}"
echo_info "AWS Account ID: ${ACCOUNT_ID}"

# Step 1: Create ECR repository if it doesn't exist
echo_info "Creating ECR repository..."
aws ecr describe-repositories --repository-names $REPOSITORY_NAME --region $AWS_REGION > /dev/null 2>&1 || \
aws ecr create-repository --repository-name $REPOSITORY_NAME --region $AWS_REGION

# Step 2: Get ECR login token
echo_info "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Step 3: Build and tag Docker image
echo_info "Building Docker image..."
cd ../backend
docker build -f Dockerfile.prod -t $REPOSITORY_NAME:latest .
docker tag $REPOSITORY_NAME:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:latest
docker tag $REPOSITORY_NAME:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:$ENVIRONMENT

# Step 4: Push image to ECR
echo_info "Pushing image to ECR..."
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:$ENVIRONMENT

cd ../aws

# Step 5: Create CloudWatch Log Group
echo_info "Creating CloudWatch log group..."
aws logs create-log-group --log-group-name "/ecs/${PROJECT_NAME}" --region $AWS_REGION > /dev/null 2>&1 || echo_info "Log group already exists"

# Step 6: Update task definition with actual values
echo_info "Updating task definition..."
sed "s/{ACCOUNT_ID}/$ACCOUNT_ID/g; s/{AWS_REGION}/$AWS_REGION/g" ecs-task-definition.json > ecs-task-definition-${ENVIRONMENT}.json

# Step 7: Register task definition
echo_info "Registering task definition..."
TASK_DEFINITION_ARN=$(aws ecs register-task-definition \
    --cli-input-json file://ecs-task-definition-${ENVIRONMENT}.json \
    --region $AWS_REGION \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo_info "Task definition registered: $TASK_DEFINITION_ARN"

# Step 8: Create or update ECS cluster
echo_info "Creating ECS cluster..."
aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $AWS_REGION > /dev/null 2>&1 || echo_info "Cluster already exists"

# Step 9: Create or update ECS service
echo_info "Checking if service exists..."
if aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION > /dev/null 2>&1; then
    echo_info "Updating existing service..."
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $TASK_DEFINITION_ARN \
        --region $AWS_REGION
else
    echo_info "Creating new service..."
    echo_warn "You need to specify VPC subnets and security groups for the service."
    echo_warn "Please run the service creation manually or use the CloudFormation template."
    echo_info "Example command:"
    echo "aws ecs create-service \\"
    echo "  --cluster $CLUSTER_NAME \\"
    echo "  --service-name $SERVICE_NAME \\"
    echo "  --task-definition $TASK_DEFINITION_ARN \\"
    echo "  --desired-count 1 \\"
    echo "  --launch-type FARGATE \\"
    echo "  --network-configuration 'awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}' \\"
    echo "  --region $AWS_REGION"
fi

echo_info "Deployment script completed!"
echo_info "Next steps:"
echo "1. Set up your secrets in AWS Secrets Manager"
echo "2. Configure VPC, subnets, and security groups"
echo "3. Create the ECS service if not done automatically"
echo "4. Set up Application Load Balancer for external access" 