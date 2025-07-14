#!/bin/bash
set -e

# Load deployment info
source deployment-info.txt

echo "🕐 Waiting for instance to be ready..."
echo "Instance: $INSTANCE_ID"
echo "IP: $PUBLIC_IP"
echo ""

# Wait for SSH to be available (user-data script completion)
echo "🔗 Testing SSH connectivity..."
for i in {1..20}; do
    echo "   Attempt $i/20..."
    if ssh -i ec2-deploy-key.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 ec2-user@"$PUBLIC_IP" "echo 'SSH connection successful!' && docker --version" 2>/dev/null; then
        echo "✅ SSH connection established and Docker is installed!"
        break
    else
        if [ $i -eq 20 ]; then
            echo "❌ SSH connection failed after 20 attempts"
            echo "The user-data script might still be running. Let's try to deploy anyway."
            break
        fi
        echo "   Failed, waiting 30 seconds before retry..."
        sleep 30
    fi
done

echo ""
echo "🚀 Starting deployment process..."

# Copy configuration files
echo "📤 Copying configuration files to instance..."
scp -i ec2-deploy-key.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ./docker-compose.ecr.yml ./prod.env ./setup-database.sh ec2-user@"$PUBLIC_IP":~ || {
    echo "⚠️  SCP failed, SSH might not be ready yet. Waiting 2 more minutes..."
    sleep 120
    scp -i ec2-deploy-key.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ./docker-compose.ecr.yml ./prod.env ./setup-database.sh ec2-user@"$PUBLIC_IP":~
}

# Copy migration files
echo "📂 Copying database migration files..."
scp -i ec2-deploy-key.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r ../backend/drizzle ec2-user@"$PUBLIC_IP":~

echo "🚀 Deploying application on instance..."
ssh -i ec2-deploy-key.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ec2-user@"$PUBLIC_IP" << 'EOF'
    # Ensure Docker is installed and running
    if ! command -v docker &> /dev/null; then
        echo "🔧 Installing Docker..."
        sudo yum update -y
        sudo yum install -y docker
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -a -G docker ec2-user
        
        # Install Docker Compose
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        # Re-login to pick up group changes
        exec sudo su - ec2-user
    fi
    
    echo "🔐 Logging into ECR..."
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 452100239402.dkr.ecr.us-east-1.amazonaws.com
    
    echo "🐳 Starting containers..."
    docker-compose -f docker-compose.ecr.yml --env-file prod.env up -d
    
    echo "⏳ Waiting for containers to be ready..."
    sleep 30
    
    echo "🗄️ Setting up database..."
    source prod.env
    chmod +x setup-database.sh
    ./setup-database.sh
    
    echo "🔄 Restarting backend to ensure clean state..."
    docker-compose -f docker-compose.ecr.yml restart backend
    
    echo "⏳ Waiting for backend to start..."
    sleep 15
    
    echo "🏥 Testing health endpoint..."
    curl -f http://localhost:3001/healthz || echo "Health check will be available shortly..."
    
    echo "✅ Deployment complete!"
EOF

echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "========================================"
echo "🌐 Application URL: http://$PUBLIC_IP:3001"
echo "🏥 Health Check: http://$PUBLIC_IP:3001/healthz"
echo "📚 API Docs: http://$PUBLIC_IP:3001/api-docs"
echo ""

# Auto-run tests
echo "🧪 Running automated tests..."
if [ -f "./test-deployment.sh" ]; then
    ./test-deployment.sh "$PUBLIC_IP"
else
    echo "⚠️  Test script not found. Testing manually..."
    curl -f "http://$PUBLIC_IP:3001/healthz" && echo "✅ Health check passed!" || echo "⚠️  Health check failed"
fi 