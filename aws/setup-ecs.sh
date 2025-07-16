#!/bin/bash

# Exit on error
set -e

echo "🚀 Setting up ECS infrastructure..."

# Variables
CLUSTER_NAME="ai-seo-cluster"
SERVICE_NAME="ai-seo-backend-service"
TASK_FAMILY="ai-seo-backend-task"
REGION="us-east-1"

# Get AWS account ID dynamically
echo "Getting AWS account information..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region $REGION)
echo "Using AWS Account: $ACCOUNT_ID"

# Get VPC ID
echo "Getting VPC information..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $REGION)
echo "Using VPC: $VPC_ID"

# Check if cluster exists
echo "Checking if ECS cluster exists..."
if aws ecs describe-clusters --clusters $CLUSTER_NAME --region $REGION &>/dev/null; then
    echo "✅ ECS cluster '$CLUSTER_NAME' already exists"
else
    echo "Creating ECS cluster..."
    aws ecs create-cluster \
      --cluster-name $CLUSTER_NAME \
      --capacity-providers FARGATE \
      --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
      --region $REGION
    echo "✅ Created ECS cluster '$CLUSTER_NAME'"
fi

# Check if security group exists
echo "Checking if security group exists..."
SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=ecs-ai-seo-sg" "Name=vpc-id,Values=$VPC_ID" \
  --query "SecurityGroups[0].GroupId" \
  --output text \
  --region $REGION 2>/dev/null || echo "None")

if [ "$SG_ID" = "None" ] || [ "$SG_ID" = "null" ]; then
    echo "Creating security group..."
    SG_ID=$(aws ec2 create-security-group \
      --group-name "ecs-ai-seo-sg" \
      --description "Security group for AI SEO ECS tasks" \
      --vpc-id $VPC_ID \
      --query 'GroupId' \
      --output text \
      --region $REGION)
    
    # Add inbound rules
    aws ec2 authorize-security-group-ingress \
      --group-id $SG_ID \
      --protocol tcp \
      --port 3001 \
      --cidr 0.0.0.0/0 \
      --region $REGION
    echo "✅ Created security group: $SG_ID"
else
    echo "✅ Security group already exists: $SG_ID"
fi

# Get subnet IDs
echo "Getting subnet information..."
SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].SubnetId' \
  --output text \
  --region $REGION)
echo "Using subnets: $SUBNET_IDS"

# Create a temporary task definition without EFS volume for now
echo "Creating simplified task definition..."
cat > temp-task-def.json << EOF
{
    "family": "$TASK_FAMILY",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "1024",
    "memory": "3072",
    "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole",
    "containerDefinitions": [
        {
            "name": "backend",
            "image": "452100239402.dkr.ecr.us-east-1.amazonaws.com/ai-seo-backend:latest",
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
                },
                {
                    "name": "REDIS_HOST",
                    "value": "localhost"
                },
                {
                    "name": "REDIS_PORT",
                    "value": "6379"
                },
                {
                    "name": "POSTGRES_HOST",
                    "value": "localhost"
                },
                {
                    "name": "POSTGRES_PORT",
                    "value": "5432"
                },
                {
                    "name": "POSTGRES_USER",
                    "value": "postgres"
                },
                                 {
                     "name": "POSTGRES_DB",
                     "value": "cleaver_search_prod"
                 }
             ],
             "secrets": [
                 {
                     "name": "POSTGRES_PASSWORD",
                     "valueFrom": "arn:aws:ssm:us-east-1:$ACCOUNT_ID:parameter/postgres-password"
                 }
             ],
             "logConfiguration": {
                 "logDriver": "awslogs",
                 "options": {
                     "awslogs-group": "/ecs/ai-seo-backend",
                     "awslogs-create-group": "true",
                     "awslogs-region": "us-east-1",
                     "awslogs-stream-prefix": "backend"
                 }
             }
        },
        {
            "name": "redis",
            "image": "redis:7-alpine",
            "essential": true,
            "portMappings": [
                {
                    "containerPort": 6379,
                    "protocol": "tcp"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/ai-seo-backend",
                    "awslogs-create-group": "true",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "redis"
                }
            }
        },
        {
            "name": "postgres",
            "image": "postgres:15",
            "essential": true,
            "portMappings": [
                {
                    "containerPort": 5432,
                    "protocol": "tcp"
                }
            ],
                         "environment": [
                 {
                     "name": "POSTGRES_USER",
                     "value": "postgres"
                 },
                 {
                     "name": "POSTGRES_DB",
                     "value": "cleaver_search_prod"
                 }
             ],
             "secrets": [
                 {
                     "name": "POSTGRES_PASSWORD",
                     "valueFrom": "arn:aws:ssm:us-east-1:$ACCOUNT_ID:parameter/postgres-password"
                 }
             ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/ai-seo-backend",
                    "awslogs-create-group": "true",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "postgres"
                }
            }
        }
    ]
}
EOF

# Register task definition
echo "Registering task definition..."
aws ecs register-task-definition \
  --cli-input-json file://temp-task-def.json \
  --region $REGION

# Check if service exists
echo "Checking if ECS service exists..."
SERVICE_EXISTS=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION --query 'services[0].serviceName' --output text 2>/dev/null || echo "None")

if [ "$SERVICE_EXISTS" != "None" ] && [ "$SERVICE_EXISTS" != "null" ]; then
    echo "✅ ECS service '$SERVICE_NAME' already exists"
    echo "Updating service with new task definition..."
    aws ecs update-service \
      --cluster $CLUSTER_NAME \
      --service $SERVICE_NAME \
      --task-definition $TASK_FAMILY \
      --region $REGION
else
    echo "Creating ECS service..."
    # Convert space-separated subnet IDs to comma-separated format
    SUBNET_LIST=$(echo $SUBNET_IDS | tr ' ' ',')
    
    aws ecs create-service \
      --cluster $CLUSTER_NAME \
      --service-name $SERVICE_NAME \
      --task-definition $TASK_FAMILY \
      --desired-count 1 \
      --launch-type FARGATE \
      --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_LIST],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
      --region $REGION
    echo "✅ Created ECS service '$SERVICE_NAME'"
fi

# Clean up temporary file
rm -f temp-task-def.json

echo "✅ ECS infrastructure setup complete!"
echo ""
echo "🔍 Resources created/verified:"
echo "  - Cluster: $CLUSTER_NAME"
echo "  - Service: $SERVICE_NAME"
echo "  - Task Definition: $TASK_FAMILY"
echo "  - Security Group: $SG_ID"
echo ""
echo "📝 Next steps:"
echo "1. Your backend will be deployed without persistent storage for now"
echo "2. To add persistent PostgreSQL storage, create an EFS volume and update the task definition"
echo "3. Deploy your application using the GitHub Actions workflow" 