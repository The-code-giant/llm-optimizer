#!/bin/bash
set -e

# Configuration
REGION="us-east-1"
PROFILE="Deploymaster"
VPC_NAME="ec2-deploy-vpc"
SG_NAME="ec2-deploy-sg"
SUBNET_NAME="ec2-deploy-subnet"
IGW_NAME="ec2-deploy-igw"
RT_NAME="ec2-deploy-rt"
KEY_NAME="ec2-deploy-key"
ROLE_NAME="EC2-ECR-Role"

echo "🧹 Starting Complete AWS Cleanup"
echo "================================="

# 1. Terminate all EC2 instances with our key
echo "🗑️  Terminating EC2 instances..."
INSTANCES=$(aws ec2 describe-instances \
    --filters "Name=instance-state-name,Values=running,pending,stopped" \
              "Name=key-name,Values=$KEY_NAME" \
    --region "$REGION" --profile "$PROFILE" \
    --query 'Reservations[*].Instances[*].InstanceId' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$INSTANCES" ]; then
    echo "   Terminating instances: $INSTANCES"
    aws ec2 terminate-instances --instance-ids $INSTANCES --region "$REGION" --profile "$PROFILE"
    echo "   Waiting for instances to terminate..."
    aws ec2 wait instance-terminated --instance-ids $INSTANCES --region "$REGION" --profile "$PROFILE"
    echo "✅ Instances terminated"
else
    echo "✅ No instances to terminate"
fi

# 2. Delete Security Group
echo "🔒 Deleting security group..."
SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$SG_NAME" \
    --region "$REGION" --profile "$PROFILE" \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null || echo "None")

if [ "$SG_ID" != "None" ] && [ ! -z "$SG_ID" ]; then
    aws ec2 delete-security-group --group-id "$SG_ID" --region "$REGION" --profile "$PROFILE"
    echo "✅ Security group deleted: $SG_ID"
else
    echo "✅ No security group to delete"
fi

# 3. Get VPC ID
VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=tag:Name,Values=$VPC_NAME" \
    --region "$REGION" --profile "$PROFILE" \
    --query "Vpcs[0].VpcId" \
    --output text 2>/dev/null || echo "None")

if [ "$VPC_ID" != "None" ] && [ ! -z "$VPC_ID" ]; then
    echo "🌐 Found VPC to clean up: $VPC_ID"
    
    # 4. Disassociate and delete route table
    echo "🛣️  Cleaning up route table..."
    RT_ID=$(aws ec2 describe-route-tables \
        --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=$RT_NAME" \
        --region "$REGION" --profile "$PROFILE" \
        --query "RouteTables[0].RouteTableId" \
        --output text 2>/dev/null || echo "None")
    
    if [ "$RT_ID" != "None" ] && [ ! -z "$RT_ID" ]; then
        # Get subnet associations
        ASSOCIATIONS=$(aws ec2 describe-route-tables \
            --route-table-ids "$RT_ID" \
            --region "$REGION" --profile "$PROFILE" \
            --query "RouteTables[0].Associations[?Main==\`false\`].RouteTableAssociationId" \
            --output text 2>/dev/null || echo "")
        
        # Disassociate subnets
        for assoc in $ASSOCIATIONS; do
            if [ ! -z "$assoc" ]; then
                aws ec2 disassociate-route-table --association-id "$assoc" --region "$REGION" --profile "$PROFILE"
                echo "   Disassociated route table: $assoc"
            fi
        done
        
        # Delete route table
        aws ec2 delete-route-table --route-table-id "$RT_ID" --region "$REGION" --profile "$PROFILE"
        echo "✅ Route table deleted: $RT_ID"
    fi
    
    # 5. Delete subnet
    echo "🏠 Deleting subnet..."
    SUBNET_ID=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=$SUBNET_NAME" \
        --region "$REGION" --profile "$PROFILE" \
        --query "Subnets[0].SubnetId" \
        --output text 2>/dev/null || echo "None")
    
    if [ "$SUBNET_ID" != "None" ] && [ ! -z "$SUBNET_ID" ]; then
        aws ec2 delete-subnet --subnet-id "$SUBNET_ID" --region "$REGION" --profile "$PROFILE"
        echo "✅ Subnet deleted: $SUBNET_ID"
    fi
    
    # 6. Detach and delete internet gateway
    echo "🌉 Deleting internet gateway..."
    IGW_ID=$(aws ec2 describe-internet-gateways \
        --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
        --region "$REGION" --profile "$PROFILE" \
        --query "InternetGateways[0].InternetGatewayId" \
        --output text 2>/dev/null || echo "None")
    
    if [ "$IGW_ID" != "None" ] && [ ! -z "$IGW_ID" ]; then
        aws ec2 detach-internet-gateway --internet-gateway-id "$IGW_ID" --vpc-id "$VPC_ID" --region "$REGION" --profile "$PROFILE"
        aws ec2 delete-internet-gateway --internet-gateway-id "$IGW_ID" --region "$REGION" --profile "$PROFILE"
        echo "✅ Internet gateway deleted: $IGW_ID"
    fi
    
    # 7. Delete VPC
    echo "🌐 Deleting VPC..."
    aws ec2 delete-vpc --vpc-id "$VPC_ID" --region "$REGION" --profile "$PROFILE"
    echo "✅ VPC deleted: $VPC_ID"
else
    echo "✅ No VPC to delete"
fi

# 8. Delete key pair
echo "🔑 Deleting key pair..."
aws ec2 delete-key-pair --key-name "$KEY_NAME" --region "$REGION" --profile "$PROFILE" 2>/dev/null || echo "Key pair already deleted"
if [ -f "$KEY_NAME.pem" ]; then
    rm "$KEY_NAME.pem"
    echo "✅ Local key file deleted"
fi

# 9. Clean up IAM role and instance profile
echo "👤 Cleaning up IAM role..."
aws iam remove-role-from-instance-profile --instance-profile-name "$ROLE_NAME" --role-name "$ROLE_NAME" --profile "$PROFILE" 2>/dev/null || echo "Role already removed from instance profile"
aws iam delete-instance-profile --instance-profile-name "$ROLE_NAME" --profile "$PROFILE" 2>/dev/null || echo "Instance profile already deleted"
aws iam detach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly" --profile "$PROFILE" 2>/dev/null || echo "Policy already detached"
aws iam delete-role --role-name "$ROLE_NAME" --profile "$PROFILE" 2>/dev/null || echo "Role already deleted"
echo "✅ IAM resources cleaned up"

# 10. Clean up local files
echo "📁 Cleaning up local files..."
rm -f deployment-info.txt
rm -f docker-compose.ecr.yml
rm -f setup-database.sh
rm -f deploy-commands.sh
rm -f /tmp/copy-command.json
rm -f /tmp/exec-command.json
echo "✅ Local files cleaned up"

echo ""
echo "🎉 CLEANUP COMPLETE!"
echo "==================="
echo "✅ All EC2 instances terminated"
echo "✅ VPC and networking components deleted"
echo "✅ Security groups removed"
echo "✅ IAM roles cleaned up"
echo "✅ Key pairs deleted"
echo "✅ Local files cleaned up"
echo ""
echo "Ready for fresh deployment!" 