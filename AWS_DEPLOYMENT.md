# 🚀 AI SEO Optimizer - AWS Deployment Guide

This guide covers the **fully automated deployment** of the AI SEO Optimizer to AWS using EC2, ECR, PostgreSQL, and Redis.

## 📋 Prerequisites

1. **AWS CLI configured** with a profile named `Deploymaster`
2. **Docker installed** and running
3. **Required permissions** in AWS:
   - EC2 (create instances, VPC, security groups)
   - ECR (create repositories, push images)
   - IAM (create roles and policies)

## 🎯 One-Command Deployment

The deployment is **completely automated**. Just run:

```bash
cd aws/
./deploy-ec2.sh
```

## 🔧 What the Deployment Script Does

### 1. **🏗️ Infrastructure Setup**
- Creates ECR repository for Docker images
- Sets up VPC with proper networking (if needed)
- Creates IAM roles for EC2-ECR access
- Configures security groups
- Launches EC2 instance with Docker pre-installed

### 2. **📦 Application Deployment**
- Builds and pushes Docker image to ECR
- Copies configuration files to EC2
- Starts containers with health checks
- **Automatically runs database migrations**
- Verifies deployment health

### 3. **🗄️ Database Setup (Automated)**
- Waits for PostgreSQL to be ready
- Creates all required tables:
  - `users`, `sites`, `pages`, `tracker_data`
  - `analysis_results`, `injected_content`
  - `content_suggestions`, `page_analytics`, `page_content`
- Applies all schema migrations
- Verifies database integrity

## 📊 Deployment Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Docker Build  │───▶│   AWS ECR        │───▶│   EC2 Instance  │
│   (Local)       │    │   (Registry)     │    │   (Production)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │  Docker Compose │
                                               │  ┌─────────────┐│
                                               │  │  Backend    ││
                                               │  │  (Node.js)  ││
                                               │  └─────────────┘│
                                               │  ┌─────────────┐│
                                               │  │ PostgreSQL  ││
                                               │  │ (Database)  ││
                                               │  └─────────────┘│
                                               │  ┌─────────────┐│
                                               │  │   Redis     ││
                                               │  │  (Cache)    ││
                                               │  └─────────────┘│
                                               └─────────────────┘
```

## 🔍 Testing Your Deployment

After deployment completes, test it automatically:

```bash
./test-deployment.sh <PUBLIC_IP>
```

Example:
```bash
./test-deployment.sh 35.153.206.45
```

## 🌐 Access Points

Once deployed, your application will be available at:

- **🏠 Application:** `http://<PUBLIC_IP>:3001`
- **🏥 Health Check:** `http://<PUBLIC_IP>:3001/healthz`
- **📚 API Documentation:** `http://<PUBLIC_IP>:3001/api-docs`
- **📊 Metrics:** `http://<PUBLIC_IP>:3001/metrics`

## 🔧 Configuration

### Environment Variables (`prod.env`)

The deployment uses these key environment variables:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mysecretpass123
POSTGRES_DB=cleaver_search_dev
DATABASE_URL=postgresql://postgres:mysecretpass123@postgres:5432/cleaver_search_dev

# Services
REDIS_HOST=redis
REDIS_PORT=6379
PORT=3001

# Authentication (Update with your keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# AI Integration (Update with your key)
OPENAI_API_KEY=your-openai-api-key

# Environment
NODE_ENV=production
```

### 🔑 Important: Update API Keys

Before deployment, update these in `aws/prod.env`:
1. **Clerk API keys** (for authentication)
2. **OpenAI API key** (for AI features)

## 💰 Cost Breakdown

**Monthly AWS costs (~$3-4/month):**
- EC2 t2.micro: ~$8.50/month (Free tier eligible)
- ECR storage: ~$0.10/month
- Data transfer: ~$0.50/month

**Free tier eligible:** If you're within AWS free tier limits, costs will be significantly lower.

## 🛠️ Manual Operations

### SSH Access
```bash
ssh -i aws/ec2-deploy-key.pem ec2-user@<PUBLIC_IP>
```

### View Logs
```bash
# Backend logs
docker logs backend_prod -f

# Database logs
docker logs postgres_prod -f

# All container status
docker ps
```

### Database Access
```bash
# Connect to PostgreSQL
docker exec -it postgres_prod psql -U postgres -d cleaver_search_dev

# View tables
\dt

# Check specific table
\d users
```

## 🔄 Redeployment

To redeploy with code changes:

1. **Update code** in your local repository
2. **Run deployment script** again:
   ```bash
   ./deploy-ec2.sh
   ```

The script will:
- Rebuild and push the new Docker image
- Update the running containers
- Preserve database data
- Maintain zero downtime

## 🧹 Cleanup

To remove all AWS resources:

```bash
./teardown-ec2.sh
```

This will delete:
- EC2 instance
- Security groups
- VPC and networking (if created by the script)
- ECR repository
- IAM roles

## 🚨 Troubleshooting

### Common Issues

1. **Docker build fails**
   - Ensure Docker is running
   - Check disk space

2. **ECR authentication fails**
   - Verify AWS CLI profile `Deploymaster` exists
   - Check IAM permissions

3. **Database connection errors**
   - Database migrations run automatically
   - Check container logs: `docker logs backend_prod`

4. **Health check fails**
   - Wait 2-3 minutes for full startup
   - Check all containers are running: `docker ps`

### Debug Commands

```bash
# Check container status
docker ps -a

# View detailed logs
docker logs backend_prod --tail 50

# Test database connection
docker exec postgres_prod pg_isready -U postgres

# Check environment variables
docker exec backend_prod printenv | grep DATABASE
```

## ✅ Success Indicators

Your deployment is successful when:

1. **✅ Health endpoint returns 200**
   ```json
   {
     "status": "ok",
     "redis": true,
     "cache": {"redis": true, "operations": {}},
     "timestamp": "2025-01-11T20:47:04.525Z"
   }
   ```

2. **✅ Swagger documentation loads**
   - API docs available at `/api-docs`
   - JSON spec at `/api-docs/swagger.json`

3. **✅ Database has all tables**
   - 10 tables created
   - Foreign key constraints applied
   - No migration errors in logs

4. **✅ All containers healthy**
   ```bash
   docker ps
   # Should show 3 containers: backend_prod, postgres_prod, redis_prod
   ```

## 🎯 Next Steps

After successful deployment:

1. **Update API keys** in `prod.env` with your actual credentials
2. **Configure domain** (optional) using Route 53 or CloudFront
3. **Set up monitoring** using CloudWatch or external services
4. **Configure backups** for PostgreSQL data
5. **Set up CI/CD** for automated deployments

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review container logs for specific errors
3. Ensure all prerequisites are met
4. Verify AWS permissions and quotas

The deployment script provides detailed output with emojis to help track progress and identify any issues quickly. 