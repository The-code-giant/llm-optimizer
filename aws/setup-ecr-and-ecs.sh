#!/bin/bash

# Setup script for ECR and ECS resources needed for GitHub Actions deployment

set -e

# Configuration
AWS_REGION="us-west-2"
ECR_REPOSITORY="ai-seo-backend"
ECS_CLUSTER="ai-seo-cluster"
ECS_SERVICE="ai-seo-backend-service"
ECS_TASK_DEFINITION="ai-seo-backend-task"

echo "🚀 Setting up AWS resources for GitHub Actions deployment..."

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"

# 1. Create ECR Repository
echo "📦 Creating ECR repository..."
aws ecr create-repository \
    --repository-name $ECR_REPOSITORY \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true \
    || echo "ECR repository already exists"

# Get ECR repository URI
ECR_URI=$(aws ecr describe-repositories \
    --repository-names $ECR_REPOSITORY \
    --region $AWS_REGION \
    --query 'repositories[0].repositoryUri' \
    --output text)

echo "ECR Repository URI: $ECR_URI"

# 2. Create ECS Cluster
echo "🏗️ Creating ECS cluster..."
aws ecs create-cluster \
    --cluster-name $ECS_CLUSTER \
    --region $AWS_REGION \
    || echo "ECS cluster already exists"

# 3. Create Task Definition (basic template)
echo "📋 Creating ECS task definition..."
cat > task-definition.json << EOF
{
  "family": "$ECS_TASK_DEFINITION",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "$ECR_URI:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/$ECS_TASK_DEFINITION",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Create CloudWatch log group
aws logs create-log-group \
    --log-group-name "/ecs/$ECS_TASK_DEFINITION" \
    --region $AWS_REGION \
    || echo "Log group already exists"

# Register task definition
aws ecs register-task-definition \
    --cli-input-json file://task-definition.json \
    --region $AWS_REGION

# Clean up
rm task-definition.json

echo "✅ AWS resources setup complete!"
echo ""
echo "📋 Summary:"
echo "- ECR Repository: $ECR_URI"
echo "- ECS Cluster: $ECS_CLUSTER"
echo "- Task Definition: $ECS_TASK_DEFINITION"
echo ""
echo "🚀 You can now run GitHub Actions deployment!"
echo "Note: You'll need to create an ECS service to complete the setup." 