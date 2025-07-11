# AWS Deployment Guide - Backend + Redis Only

This guide covers deploying the AI SEO Optimizer backend and Redis to AWS using ECS Fargate. The frontend can be deployed separately (e.g., on Vercel) or run locally.

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws configure
   ```

2. **Docker installed and running**

3. **PostgreSQL database** (can be AWS RDS, external provider, or existing instance)

4. **Required secrets**:
   - Database connection string
   - JWT secret key
   - Clerk secret key
   - OpenAI API key (optional)
   - Anthropic API key (optional)

## Deployment Options

### Option 1: CloudFormation (Recommended - Complete Infrastructure)

#### Step 1: Prepare Environment
```bash
# Navigate to aws directory
cd aws

# Make deployment script executable
chmod +x deploy.sh
```

#### Step 2: Build and Push Docker Image
```bash
# Run deployment script to build and push image
./deploy.sh production us-east-1
```

#### Step 3: Deploy Infrastructure
```bash
# Deploy using CloudFormation
aws cloudformation create-stack \
  --stack-name ai-seo-optimizer-production \
  --template-body file://infrastructure.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=DatabaseUrl,ParameterValue="postgresql://user:pass@host:5432/dbname" \
    ParameterKey=JwtSecret,ParameterValue="your-jwt-secret-here" \
    ParameterKey=ClerkSecretKey,ParameterValue="sk_test_..." \
    ParameterKey=OpenAIApiKey,ParameterValue="sk-..." \
    ParameterKey=AnthropicApiKey,ParameterValue="sk-ant-..." \
    ParameterKey=CorsOrigin,ParameterValue="https://yourdomain.com" \
    ParameterKey=ImageUri,ParameterValue="ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/ai-seo-backend:latest" \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

#### Step 4: Get Deployment URL
```bash
# Get the load balancer URL
aws cloudformation describe-stacks \
  --stack-name ai-seo-optimizer-production \
  --query 'Stacks[0].Outputs[?OutputKey==`BackendURL`].OutputValue' \
  --output text
```

### Option 2: Manual ECS Deployment

#### Step 1: Create ECR Repository
```bash
aws ecr create-repository --repository-name ai-seo-backend --region us-east-1
```

#### Step 2: Build and Push Image
```bash
# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push
cd ../backend
docker build -f Dockerfile.prod -t ai-seo-backend:latest .
docker tag ai-seo-backend:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ai-seo-backend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ai-seo-backend:latest
```

#### Step 3: Create Secrets
```bash
# Create secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "ai-seo/production/database-url" \
  --secret-string "postgresql://user:pass@host:5432/dbname"

aws secretsmanager create-secret \
  --name "ai-seo/production/jwt-secret" \
  --secret-string "your-jwt-secret"

aws secretsmanager create-secret \
  --name "ai-seo/production/clerk-secret" \
  --secret-string "sk_test_..."

aws secretsmanager create-secret \
  --name "ai-seo/production/openai-key" \
  --secret-string "sk-..."

aws secretsmanager create-secret \
  --name "ai-seo/production/anthropic-key" \
  --secret-string "sk-ant-..."
```

#### Step 4: Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name ai-seo-optimizer-production
```

#### Step 5: Register Task Definition
```bash
# Update ecs-task-definition.json with your account ID and region
# Then register it
aws ecs register-task-definition --cli-input-json file://ecs-task-definition-production.json
```

#### Step 6: Create ECS Service
```bash
# You'll need to create VPC, subnets, and security groups first
aws ecs create-service \
  --cluster ai-seo-optimizer-production \
  --service-name ai-seo-optimizer-production \
  --task-definition ai-seo-optimizer:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration 'awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}'
```

### Option 3: AWS Copilot (Simplified)

```bash
# Install AWS Copilot
curl -Lo copilot https://github.com/aws/copilot-cli/releases/latest/download/copilot-linux
chmod +x copilot && sudo mv copilot /usr/local/bin

# Initialize application
copilot app init ai-seo-optimizer

# Deploy backend service
copilot svc init --name backend --svc-type "Backend Service"
copilot svc deploy --name backend --env production
```

## Environment Configuration

### Frontend Configuration
When deploying the frontend separately, configure these environment variables:

```bash
# Frontend environment variables
NEXT_PUBLIC_API_URL=http://your-alb-dns-name.amazonaws.com/api/v1
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Database Setup
If using AWS RDS PostgreSQL:

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-name cleaver_search_prod \
  --db-instance-identifier ai-seo-db-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YourSecurePassword \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group
```

## Monitoring and Logs

### CloudWatch Logs
```bash
# View logs
aws logs tail /ecs/ai-seo-optimizer --follow
```

### Application Monitoring
The deployment includes health checks and CloudWatch integration. Monitor:
- ECS Service health
- Application Load Balancer metrics
- Container CPU/Memory usage
- Application logs

## Scaling

### Horizontal Scaling
```bash
# Scale ECS service
aws ecs update-service \
  --cluster ai-seo-optimizer-production \
  --service ai-seo-optimizer-production \
  --desired-count 3
```

### Vertical Scaling
Update the task definition with more CPU/Memory:
- CPU: 256, 512, 1024, 2048, 4096
- Memory: 512MB to 30GB (depending on CPU)

## Security Best Practices

1. **Use AWS Secrets Manager** for all sensitive data
2. **Configure security groups** to only allow necessary traffic
3. **Enable VPC Flow Logs** for network monitoring
4. **Use IAM roles** with least privilege access
5. **Enable CloudTrail** for audit logging
6. **Configure SSL/TLS** termination at the load balancer

## Costs Optimization

### Fargate Pricing (us-east-1)
- **CPU**: $0.04048 per vCPU per hour
- **Memory**: $0.004445 per GB per hour

### Estimated Monthly Costs
For 0.5 vCPU, 1GB memory running 24/7:
- CPU: 0.5 × $0.04048 × 24 × 30 = $14.57
- Memory: 1 × $0.004445 × 24 × 30 = $3.20
- **Total**: ~$18/month (plus ALB, data transfer)

### Cost Optimization Tips
1. Use **Spot instances** for non-critical environments
2. Configure **auto-scaling** based on metrics
3. Use **scheduled scaling** for predictable traffic patterns
4. Monitor and optimize **data transfer** costs

## Troubleshooting

### Common Issues

#### 1. Task Health Check Failures
```bash
# Check task logs
aws ecs describe-tasks --cluster CLUSTER_NAME --tasks TASK_ARN
```

#### 2. Service Not Starting
```bash
# Check service events
aws ecs describe-services --cluster CLUSTER_NAME --services SERVICE_NAME
```

#### 3. Load Balancer 502/503 Errors
- Verify health check endpoint (`/health`)
- Check security group configurations
- Ensure backend is listening on correct port (3001)

#### 4. Database Connection Issues
- Verify DATABASE_URL in secrets
- Check VPC/subnet configurations
- Ensure database security groups allow ECS access

### Debugging Commands
```bash
# Get service status
aws ecs describe-services --cluster ai-seo-optimizer-production --services ai-seo-optimizer-production

# Get task details
aws ecs list-tasks --cluster ai-seo-optimizer-production
aws ecs describe-tasks --cluster ai-seo-optimizer-production --tasks TASK_ARN

# View logs
aws logs tail /ecs/ai-seo-optimizer --follow --filter-pattern "ERROR"
```

## Backup and Disaster Recovery

1. **Database backups**: Enable automated RDS backups
2. **Application state**: Store in external database (PostgreSQL)
3. **Redis data**: Configure persistence and backups
4. **Infrastructure**: Use CloudFormation for reproducible deployments

## Updates and Deployments

### Zero-Downtime Deployments
```bash
# Build new image with new tag
docker build -f Dockerfile.prod -t ai-seo-backend:v2.0.0 .
docker tag ai-seo-backend:v2.0.0 ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/ai-seo-backend:v2.0.0
docker push ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/ai-seo-backend:v2.0.0

# Update task definition with new image
# Register new task definition
# Update service to use new task definition
aws ecs update-service --cluster CLUSTER --service SERVICE --task-definition NEW_TASK_DEF
```

The deployment will automatically perform rolling updates with zero downtime. 