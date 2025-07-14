#!/bin/bash
set -e

# Configuration
REGION="us-east-1"
PROFILE="Deploymaster"
INSTANCE_ID="i-00acf244a068381e2"  # Current running instance
ECR_URI="452100239402.dkr.ecr.us-east-1.amazonaws.com/ai-seo-backend"

echo "🚀 Deploying via AWS Systems Manager"
echo "===================================="
echo "Instance: $INSTANCE_ID"

# Create deployment script
cat > deploy-commands.sh << 'EOF'
#!/bin/bash
set -e

echo "🔧 Installing required packages..."
sudo yum update -y
sudo yum install -y docker jq
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws

echo "✅ Installation complete"

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 452100239402.dkr.ecr.us-east-1.amazonaws.com

# Create docker-compose file
echo "📝 Creating docker-compose configuration..."
cat > /home/ec2-user/docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: postgres_prod
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=mysecretpass123
      - POSTGRES_DB=cleaver_search_dev
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d cleaver_search_dev"]
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
    image: 452100239402.dkr.ecr.us-east-1.amazonaws.com/ai-seo-backend:latest
    container_name: backend_prod
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://postgres:mysecretpass123@postgres:5432/cleaver_search_dev
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
      - ANTHROPIC_API_KEY=your-anthropic-key
      - OPENAI_API_KEY=your-openai-key
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres-data:
  redis-data:
COMPOSE_EOF

# Start containers
echo "🐳 Starting containers..."
cd /home/ec2-user
docker-compose up -d

# Wait for containers to be ready
echo "⏳ Waiting for containers to be ready..."
sleep 30

# Setup database
echo "🗄️ Setting up database..."
docker exec -e PGPASSWORD=mysecretpass123 postgres_prod psql -U postgres -d cleaver_search_dev -c "
CREATE TABLE IF NOT EXISTS users (
    id varchar(255) PRIMARY KEY NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    password_hash varchar(255),
    name varchar(255),
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id varchar(255) NOT NULL REFERENCES users(id),
    name varchar(255) NOT NULL,
    url varchar(512) NOT NULL UNIQUE,
    tracker_id uuid NOT NULL UNIQUE,
    status varchar(32) NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL REFERENCES sites(id),
    url varchar(1024) NOT NULL,
    title varchar(512),
    content_snapshot text,
    last_scanned_at timestamp,
    last_analysis_at timestamp,
    llm_readiness_score double precision,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tracker_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL REFERENCES sites(id),
    page_url varchar(1024),
    event_type varchar(64),
    timestamp timestamp DEFAULT now(),
    session_id varchar(255),
    anonymous_user_id varchar(255),
    event_data jsonb,
    user_agent varchar(500),
    ip_address varchar(45),
    referrer varchar(1024),
    created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analysis_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    page_id uuid NOT NULL REFERENCES pages(id),
    analyzed_at timestamp DEFAULT now(),
    llm_model_used varchar(128),
    score double precision,
    recommendations jsonb,
    raw_llm_output text,
    created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS injected_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL REFERENCES sites(id),
    name varchar(255) NOT NULL,
    type varchar(64) NOT NULL,
    content text,
    status varchar(32) NOT NULL,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_injected_content (
    page_id uuid NOT NULL REFERENCES pages(id),
    injected_content_id uuid NOT NULL REFERENCES injected_content(id),
    created_at timestamp DEFAULT now(),
    PRIMARY KEY (page_id, injected_content_id)
);

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
"

echo "✅ Database setup complete!"

# Test health endpoint
echo "🏥 Testing health endpoint..."
sleep 10
curl -f http://localhost:3001/healthz || echo "Health check will be available shortly..."

echo "🎉 Deployment complete!"
echo "Application is running on port 3001"

EOF

# Copy script to instance and execute via SSM
echo "📤 Copying and executing deployment script..."

# First copy the script
aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=[\"cat > /tmp/deploy-commands.sh << 'SCRIPT_EOF'
$(cat deploy-commands.sh)
SCRIPT_EOF\"]" \
    --region "$REGION" \
    --profile "$PROFILE" > /tmp/copy-command.json

COPY_COMMAND_ID=$(cat /tmp/copy-command.json | grep -o '"CommandId": "[^"]*"' | cut -d'"' -f4)
echo "📋 Copy command ID: $COPY_COMMAND_ID"

# Wait for copy to complete
echo "⏳ Waiting for script copy..."
sleep 10

# Now execute the script
aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["chmod +x /tmp/deploy-commands.sh && /tmp/deploy-commands.sh"]' \
    --region "$REGION" \
    --profile "$PROFILE" > /tmp/exec-command.json

EXEC_COMMAND_ID=$(cat /tmp/exec-command.json | grep -o '"CommandId": "[^"]*"' | cut -d'"' -f4)
echo "📋 Execution command ID: $EXEC_COMMAND_ID"

echo "✅ Deployment commands sent!"
echo "📋 Monitor progress with: aws ssm get-command-invocation --command-id $EXEC_COMMAND_ID --instance-id $INSTANCE_ID --region $REGION --profile $PROFILE"
echo "🌐 Application will be available at: http://52.206.82.213:3001" 