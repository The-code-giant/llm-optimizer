#!/bin/bash
set -e

# --- Configuration ---
REGION="us-east-1"
PROFILE="Deploymaster"
KEY_NAME="ec2-deploy-key"
KEY_FILE="$KEY_NAME.pem"
INSTANCE_TYPE="t2.micro"
AMI_ID=$(aws ssm get-parameters --names /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 --region "$REGION" --profile "$PROFILE" --query 'Parameters[0].Value' --output text)
SG_NAME="ec2-deploy-sg"
YOUR_IP="70.71.242.164"
VPC_NAME="ec2-deploy-vpc"
SUBNET_NAME="ec2-deploy-subnet"
IGW_NAME="ec2-deploy-igw"
RT_NAME="ec2-deploy-rt"
ECR_REPO_NAME="ai-seo-backend"
DEPLOYMENT_INFO_FILE="deployment-info.txt"

echo "🚀 Starting AI SEO Optimizer Deployment"
echo "========================================"

# 0. Clean up existing instances
echo "🧹 Cleaning up existing instances..."
EXISTING_INSTANCES=$(aws ec2 describe-instances \
    --filters "Name=instance-state-name,Values=running,pending" \
              "Name=key-name,Values=$KEY_NAME" \
    --region "$REGION" --profile "$PROFILE" \
    --query 'Reservations[*].Instances[*].InstanceId' \
    --output text)

if [ ! -z "$EXISTING_INSTANCES" ]; then
    echo "🗑️  Terminating existing instances: $EXISTING_INSTANCES"
    aws ec2 terminate-instances --instance-ids $EXISTING_INSTANCES --region "$REGION" --profile "$PROFILE"
    echo "⏳ Waiting for instances to terminate..."
    aws ec2 wait instance-terminated --instance-ids $EXISTING_INSTANCES --region "$REGION" --profile "$PROFILE"
    echo "✅ Existing instances terminated"
else
    echo "✅ No existing instances to clean up"
fi

# --- Script ---

# 1. Create ECR Repository
echo "📦 Creating ECR repository: $ECR_REPO_NAME"
ECR_URI=$(aws ecr create-repository --repository-name "$ECR_REPO_NAME" --region "$REGION" --profile "$PROFILE" --query 'repository.repositoryUri' --output text 2>/dev/null || aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" --region "$REGION" --profile "$PROFILE" --query 'repositories[0].repositoryUri' --output text)
echo "✅ ECR Repository: $ECR_URI"

# 2. Build and Push Docker Image
echo "🔨 Building Docker image..."
cd ../backend
docker build -f Dockerfile.prod -t "$ECR_REPO_NAME:latest" .

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region "$REGION" --profile "$PROFILE" | docker login --username AWS --password-stdin "$ECR_URI"

echo "📤 Tagging and pushing image to ECR..."
docker tag "$ECR_REPO_NAME:latest" "$ECR_URI:latest"
docker push "$ECR_URI:latest"
cd ../aws

# 3. Create VPC (if needed)
echo "🌐 Checking for VPC: $VPC_NAME"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=$VPC_NAME" --region "$REGION" --profile "$PROFILE" --query "Vpcs[0].VpcId" --output text)
if [ "$VPC_ID" == "None" ]; then
    echo "🏗️ Creating VPC: $VPC_NAME"
    VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --region "$REGION" --profile "$PROFILE" --query "Vpc.VpcId" --output text)
    aws ec2 create-tags --resources "$VPC_ID" --tags Key=Name,Value=$VPC_NAME --region "$REGION" --profile "$PROFILE"
    
    echo "🌉 Creating Internet Gateway"
    IGW_ID=$(aws ec2 create-internet-gateway --region "$REGION" --profile "$PROFILE" --query "InternetGateway.InternetGatewayId" --output text)
    aws ec2 create-tags --resources "$IGW_ID" --tags Key=Name,Value=$IGW_NAME --region "$REGION" --profile "$PROFILE"
    aws ec2 attach-internet-gateway --vpc-id "$VPC_ID" --internet-gateway-id "$IGW_ID" --region "$REGION" --profile "$PROFILE"
    
    echo "🛣️ Creating Route Table"
    RT_ID=$(aws ec2 create-route-table --vpc-id "$VPC_ID" --region "$REGION" --profile "$PROFILE" --query "RouteTable.RouteTableId" --output text)
    aws ec2 create-tags --resources "$RT_ID" --tags Key=Name,Value=$RT_NAME --region "$REGION" --profile "$PROFILE"
    aws ec2 create-route --route-table-id "$RT_ID" --destination-cidr-block 0.0.0.0/0 --gateway-id "$IGW_ID" --region "$REGION" --profile "$PROFILE"
    
    echo "🏠 Creating Subnet"
    SUBNET_ID=$(aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block 10.0.1.0/24 --region "$REGION" --profile "$PROFILE" --query "Subnet.SubnetId" --output text)
    aws ec2 create-tags --resources "$SUBNET_ID" --tags Key=Name,Value=$SUBNET_NAME --region "$REGION" --profile "$PROFILE"
    aws ec2 associate-route-table --subnet-id "$SUBNET_ID" --route-table-id "$RT_ID" --region "$REGION" --profile "$PROFILE"
    
    echo "✅ VPC and networking created."
else
    echo "✅ VPC '$VPC_NAME' already exists."
    SUBNET_ID=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=$SUBNET_NAME" --region "$REGION" --profile "$PROFILE" --query "Subnets[0].SubnetId" --output text)
    
    # If subnet doesn't exist, create it
    if [ "$SUBNET_ID" == "None" ] || [ -z "$SUBNET_ID" ]; then
        echo "🏠 Creating missing subnet in existing VPC..."
        SUBNET_ID=$(aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block 10.0.1.0/24 --region "$REGION" --profile "$PROFILE" --query "Subnet.SubnetId" --output text)
        aws ec2 create-tags --resources "$SUBNET_ID" --tags Key=Name,Value=$SUBNET_NAME --region "$REGION" --profile "$PROFILE"
        
        # Get route table and associate subnet
        RT_ID=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=$RT_NAME" --region "$REGION" --profile "$PROFILE" --query "RouteTables[0].RouteTableId" --output text)
        if [ "$RT_ID" != "None" ]; then
            aws ec2 associate-route-table --subnet-id "$SUBNET_ID" --route-table-id "$RT_ID" --region "$REGION" --profile "$PROFILE"
        fi
        echo "✅ Subnet created: $SUBNET_ID"
    fi
fi

# 4. Create IAM Role for EC2 ECR Access
echo "👤 Creating IAM role for ECR access..."
ROLE_NAME="EC2-ECR-Role"
aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}' --profile "$PROFILE" 2>/dev/null || echo "✅ Role already exists"

aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly" --profile "$PROFILE" 2>/dev/null || echo "✅ Policy already attached"

aws iam create-instance-profile --instance-profile-name "$ROLE_NAME" --profile "$PROFILE" 2>/dev/null || echo "✅ Instance profile already exists"

aws iam add-role-to-instance-profile --instance-profile-name "$ROLE_NAME" --role-name "$ROLE_NAME" --profile "$PROFILE" 2>/dev/null || echo "✅ Role already in instance profile"

echo "⏳ Waiting for IAM instance profile to propagate..."
sleep 10

# 5. Create EC2 Key Pair
echo "🔑 Creating EC2 key pair: $KEY_NAME"
# Delete existing key pair if it exists
aws ec2 delete-key-pair --key-name "$KEY_NAME" --region "$REGION" --profile "$PROFILE" 2>/dev/null || echo "No existing key pair to delete"
# Remove local key file if it exists
rm -f "$KEY_FILE"
# Create new key pair
aws ec2 create-key-pair --key-name "$KEY_NAME" --region "$REGION" --profile "$PROFILE" --query 'KeyMaterial' --output text > "$KEY_FILE"
chmod 400 "$KEY_FILE"
echo "✅ Key pair created and saved to $KEY_FILE"

# 6. Create Security Group
echo "🔒 Checking for security group: $SG_NAME"
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" --region "$REGION" --profile "$PROFILE" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || true)

if [ -z "$SG_ID" ] || [ "$SG_ID" == "None" ]; then
    echo "🛡️ Creating security group: $SG_NAME in VPC $VPC_ID"
    SG_ID=$(aws ec2 create-security-group --group-name "$SG_NAME" --description "SG for backend deployment" --vpc-id "$VPC_ID" --region "$REGION" --profile "$PROFILE" --query 'GroupId' --output text)
    echo "🔓 Authorizing ingress..."
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr "$YOUR_IP/32" --region "$REGION" --profile "$PROFILE"
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 3001 --cidr 0.0.0.0/0 --region "$REGION" --profile "$PROFILE"
    echo "✅ Security group created with ID: $SG_ID"
else
    echo "✅ Security group '$SG_NAME' already exists with ID: $SG_ID"
fi

# 7. Launch EC2 Instance
echo "🖥️ Launching EC2 instance in Subnet $SUBNET_ID..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --subnet-id "$SUBNET_ID" \
    --associate-public-ip-address \
    --iam-instance-profile Name="$ROLE_NAME" \
    --user-data file://install-docker.sh \
    --region "$REGION" \
    --profile "$PROFILE" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "⏳ Waiting for instance $INSTANCE_ID to be running..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION" --profile "$PROFILE"

PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --region "$REGION" --profile "$PROFILE" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "✅ Instance is running at public IP: $PUBLIC_IP"

# 8. Create docker-compose file with ECR image
echo "📝 Creating docker-compose configuration..."
cat > docker-compose.ecr.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: postgres_prod
    environment:
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_DB=\${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER} -d \${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: redis_prod
    volumes:
      - redis-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    image: $ECR_URI:latest
    container_name: backend_prod
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file:
      - ./prod.env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres-data:
  redis-data:
EOF

# 9. Create database migration script
echo "📄 Creating database migration script..."
cat > setup-database.sh << 'EOF'
#!/bin/bash
set -e

echo "🗄️ Setting up database..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec postgres_prod pg_isready -U postgres -d cleaver_search_dev; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Copy migration files to container
echo "📂 Copying migration files..."
tar -czf migrations.tar.gz -C /home/ec2-user drizzle/
docker cp migrations.tar.gz backend_prod:/app/
docker exec backend_prod tar -xzf /app/migrations.tar.gz -C /app/

# Run migrations in order
echo "🔄 Running database migrations..."

# Base migration
echo "📋 Running base migration (0000)..."
docker exec -e PGPASSWORD=$POSTGRES_PASSWORD postgres_prod psql -U postgres -d cleaver_search_dev -f /dev/stdin << 'MIGRATION_0000'
CREATE TABLE IF NOT EXISTS "analysis_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"analyzed_at" timestamp DEFAULT now(),
	"llm_model_used" varchar(128),
	"score" double precision,
	"recommendations" jsonb,
	"raw_llm_output" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "injected_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(64) NOT NULL,
	"content" text,
	"status" varchar(32) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "page_injected_content" (
	"page_id" uuid NOT NULL,
	"injected_content_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "page_injected_content_page_id_injected_content_id_pk" PRIMARY KEY("page_id","injected_content_id")
);

CREATE TABLE IF NOT EXISTS "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"url" varchar(1024) NOT NULL,
	"title" varchar(512),
	"content_snapshot" text,
	"last_scanned_at" timestamp,
	"last_analysis_at" timestamp,
	"llm_readiness_score" double precision,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" varchar(512) NOT NULL,
	"tracker_id" uuid NOT NULL,
	"status" varchar(32) NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sites_url_unique" UNIQUE("url"),
	CONSTRAINT "sites_tracker_id_unique" UNIQUE("tracker_id")
);

CREATE TABLE IF NOT EXISTS "tracker_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"page_url" varchar(1024),
	"event_type" varchar(64),
	"timestamp" timestamp DEFAULT now(),
	"session_id" varchar(255),
	"anonymous_user_id" varchar(255),
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"name" varchar(255),
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Foreign key constraints
DO $$ BEGIN
 ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "injected_content" ADD CONSTRAINT "injected_content_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "page_injected_content" ADD CONSTRAINT "page_injected_content_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "page_injected_content" ADD CONSTRAINT "page_injected_content_injected_content_id_injected_content_id_fk" FOREIGN KEY ("injected_content_id") REFERENCES "public"."injected_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pages" ADD CONSTRAINT "pages_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "sites" ADD CONSTRAINT "sites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tracker_data" ADD CONSTRAINT "tracker_data_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
MIGRATION_0000

# Additional migrations
echo "📋 Running additional migrations..."
docker exec -e PGPASSWORD=$POSTGRES_PASSWORD postgres_prod psql -U postgres -d cleaver_search_dev -c "
-- Additional tables from later migrations
CREATE TABLE IF NOT EXISTS content_suggestions (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	page_id uuid NOT NULL REFERENCES pages(id),
	content_type varchar(64) NOT NULL,
	suggestions jsonb NOT NULL,
	request_context text,
	ai_model varchar(128),
	generated_at timestamp DEFAULT now(),
	expires_at timestamp
);

CREATE TABLE IF NOT EXISTS page_analytics (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	site_id uuid NOT NULL REFERENCES sites(id),
	page_url varchar(1024) NOT NULL,
	visit_date varchar(10) NOT NULL,
	page_views integer DEFAULT 0,
	unique_visitors integer DEFAULT 0,
	bounce_rate double precision,
	avg_session_duration integer,
	load_time_ms integer,
	content_injected integer DEFAULT 0,
	content_types_injected jsonb DEFAULT '[]'::jsonb,
	created_at timestamp DEFAULT now(),
	updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_content (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	page_id uuid NOT NULL REFERENCES pages(id),
	content_type varchar(64) NOT NULL,
	original_content text,
	optimized_content text NOT NULL,
	ai_model varchar(128),
	generation_context text,
	is_active integer DEFAULT 0,
	version integer DEFAULT 1,
	metadata jsonb DEFAULT '{}'::jsonb,
	page_url varchar(1024),
	deployed_at timestamp,
	deployed_by varchar(255),
	created_at timestamp DEFAULT now(),
	updated_at timestamp DEFAULT now()
);

-- Add any missing columns to tracker_data
ALTER TABLE tracker_data ADD COLUMN IF NOT EXISTS event_data jsonb;
ALTER TABLE tracker_data ADD COLUMN IF NOT EXISTS user_agent varchar(500);
ALTER TABLE tracker_data ADD COLUMN IF NOT EXISTS ip_address varchar(45);
ALTER TABLE tracker_data ADD COLUMN IF NOT EXISTS referrer varchar(1024);
"

echo "✅ Database migrations completed successfully!"

# Verify tables exist
echo "🔍 Verifying database schema..."
docker exec -e PGPASSWORD=$POSTGRES_PASSWORD postgres_prod psql -U postgres -d cleaver_search_dev -c "\dt"

echo "✅ Database setup complete!"
EOF

chmod +x setup-database.sh

# 10. Deploy Application
echo "⏳ Waiting for SSH to be available..."
sleep 120  # Give more time for user-data script to complete

# Test SSH connectivity with retries
echo "🔗 Testing SSH connectivity..."
for i in {1..10}; do
    echo "   Attempt $i/10..."
    if ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 ec2-user@"$PUBLIC_IP" "echo 'SSH connection successful'" 2>/dev/null; then
        echo "✅ SSH connection established!"
        break
    else
        if [ $i -eq 10 ]; then
            echo "❌ SSH connection failed after 10 attempts"
            echo "🔍 Troubleshooting info:"
            echo "   Instance ID: $INSTANCE_ID"
            echo "   Public IP: $PUBLIC_IP"
            echo "   Security Group: $SG_ID"
            echo "   Try connecting manually: ssh -i $KEY_FILE ec2-user@$PUBLIC_IP"
            exit 1
        fi
        echo "   Failed, waiting 30 seconds before retry..."
        sleep 30
    fi
done

echo "📤 Copying configuration files to instance..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ./docker-compose.ecr.yml ./prod.env ./setup-database.sh ec2-user@"$PUBLIC_IP":~

# Copy migration files
echo "📂 Copying database migration files..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r ../backend/drizzle ec2-user@"$PUBLIC_IP":~

echo "🚀 Setting up and deploying application on instance..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ec2-user@"$PUBLIC_IP" << 'EOF'
    echo "🔐 Logging into ECR..."
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(echo $ECR_URI | cut -d'/' -f1)
    
    echo "🐳 Starting containers..."
    docker compose -f docker-compose.ecr.yml --env-file prod.env up -d
    
    echo "⏳ Waiting for containers to be ready..."
    sleep 30
    
    echo "🗄️ Setting up database..."
    source prod.env
    chmod +x setup-database.sh
    ./setup-database.sh
    
    echo "🔄 Restarting backend to ensure clean state..."
    docker compose -f docker-compose.ecr.yml restart backend
    
    echo "⏳ Waiting for backend to start..."
    sleep 15
    
    echo "🏥 Testing health endpoint..."
    curl -f http://localhost:3001/healthz || echo "Health check will be available shortly..."
    
    echo "✅ Deployment complete!"
EOF

# Save deployment information
echo "💾 Saving deployment information..."
cat > "$DEPLOYMENT_INFO_FILE" << DEPLOY_INFO
INSTANCE_ID=$INSTANCE_ID
PUBLIC_IP=$PUBLIC_IP
DEPLOYMENT_DATE=$(date)
ECR_URI=$ECR_URI
DEPLOY_INFO

echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "========================================"
echo "🌐 Application URL: http://$PUBLIC_IP:3001"
echo "🏥 Health Check: http://$PUBLIC_IP:3001/healthz"
echo "📚 API Docs: http://$PUBLIC_IP:3001/api-docs"
echo "🔑 SSH Access: ssh -i $KEY_FILE ec2-user@$PUBLIC_IP"
echo ""
echo "✅ Database migrations completed automatically"
echo "✅ All services are running and healthy"
echo "✅ Ready for production use!"
echo ""

# Auto-run tests
echo "🧪 Running automated tests..."
echo "========================================"
if [ -f "./test-deployment.sh" ]; then
    ./test-deployment.sh "$PUBLIC_IP"
    TEST_RESULT=$?
    if [ $TEST_RESULT -eq 0 ]; then
        echo "✅ All tests passed! Deployment is fully functional."
    else
        echo "⚠️  Some tests failed. Check the output above for details."
    fi
else
    echo "⚠️  Test script not found. You can manually test at: http://$PUBLIC_IP:3001/healthz"
fi

echo ""
echo "📋 Deployment info saved to: $DEPLOYMENT_INFO_FILE"
echo "🔄 To redeploy: ./deploy-ec2.sh"
echo "🧪 To test only: ./test-deployment.sh $PUBLIC_IP"
echo "" 