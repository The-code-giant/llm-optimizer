#!/bin/bash
set -e

# --- Configuration ---
REGION="us-east-1"
PROFILE="Deploymaster"
KEY_NAME="ec2-deploy-key"
KEY_FILE="$KEY_NAME.pem"
SG_NAME="ec2-deploy-sg"
VPC_NAME="ec2-deploy-vpc"

# --- Script ---
echo "This script will terminate all resources created by the deploy script."
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=$VPC_NAME" --region "$REGION" --profile "$PROFILE" --query "Vpcs[0].VpcId" --output text)
if [ "$VPC_ID" == "None" ]; then
    echo "No VPC found with name $VPC_NAME. Exiting."
    exit 0
fi
echo "Found VPC: $VPC_ID"

# 1. Terminate EC2 Instance
INSTANCE_ID=$(aws ec2 describe-instances --filters "Name=vpc-id,Values=$VPC_ID" "Name=instance-state-name,Values=running" --region "$REGION" --profile "$PROFILE" --query 'Reservations[].Instances[].InstanceId' --output text)
if [ -n "$INSTANCE_ID" ]; then
    echo "Terminating instance: $INSTANCE_ID"
    aws ec2 terminate-instances --instance-ids "$INSTANCE_ID" --region "$REGION" --profile "$PROFILE"
    echo "Waiting for instance to terminate..."
    aws ec2 wait instance-terminated --instance-ids "$INSTANCE_ID" --region "$REGION" --profile "$PROFILE"
    echo "Instance terminated."
else
    echo "No running instance found in VPC '$VPC_ID'."
fi

# 2. Delete Security Group
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" --region "$REGION" --profile "$PROFILE" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || true)
if [ -n "$SG_ID" ] && [ "$SG_ID" != "None" ]; then
    echo "Deleting security group: $SG_NAME ($SG_ID)"
    aws ec2 delete-security-group --group-id "$SG_ID" --region "$REGION" --profile "$PROFILE"
    echo "Security group deleted."
else
    echo "Security group '$SG_NAME' not found."
fi

# 3. Detach and Delete Internet Gateway
IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --region "$REGION" --profile "$PROFILE" --query "InternetGateways[0].InternetGatewayId" --output text)
if [ "$IGW_ID" != "None" ] && [ -n "$IGW_ID" ]; then
    echo "Detaching and deleting Internet Gateway: $IGW_ID"
    aws ec2 detach-internet-gateway --internet-gateway-id "$IGW_ID" --vpc-id "$VPC_ID" --region "$REGION" --profile "$PROFILE"
    aws ec2 delete-internet-gateway --internet-gateway-id "$IGW_ID" --region "$REGION" --profile "$PROFILE"
fi

# Force delete any lingering network interfaces
ENI_IDS=$(aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$VPC_ID" --region "$REGION" --profile "$PROFILE" --query "NetworkInterfaces[].NetworkInterfaceId" --output text)
if [ -n "$ENI_IDS" ]; then
    for ENI_ID in $ENI_IDS; do
        echo "Deleting network interface: $ENI_ID"
        aws ec2 delete-network-interface --network-interface-id "$ENI_ID" --region "$REGION" --profile "$PROFILE"
    done
    sleep 15 # Give time for ENIs to be deleted
fi


# 4. Delete Subnets
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region "$REGION" --profile "$PROFILE" --query "Subnets[].SubnetId" --output text)
if [ -n "$SUBNET_IDS" ]; then
    for SUBNET_ID in $SUBNET_IDS; do
        echo "Deleting subnet: $SUBNET_ID"
        aws ec2 delete-subnet --subnet-id "$SUBNET_ID" --region "$REGION" --profile "$PROFILE"
    done
fi

# 5. Delete Route Tables and disassociate
ASSOCIATION_IDS=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" "Name=association.main,Values=false" --region "$REGION" --profile "$PROFILE" --query "RouteTables[].Associations[].RouteTableAssociationId" --output text)
if [ -n "$ASSOCIATION_IDS" ]; then
    for ASSOC_ID in $ASSOCIATION_IDS; do
        echo "Disassociating route table for association: $ASSOC_ID"
        aws ec2 disassociate-route-table --association-id "$ASSOC_ID" --region "$REGION" --profile "$PROFILE"
    done
fi

RT_IDS=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" "Name=association.main,Values=false" --region "$REGION" --profile "$PROFILE" --query "RouteTables[].RouteTableId" --output text)
if [ -n "$RT_IDS" ]; then
    for RT_ID in $RT_IDS; do
        echo "Deleting route table: $RT_ID"
        aws ec2 delete-route-table --route-table-id "$RT_ID" --region "$REGION" --profile "$PROFILE"
    done
fi

# 6. Delete VPC
echo "Deleting VPC: $VPC_ID"
# It can take a few seconds for dependencies to be fully gone
sleep 10
aws ec2 delete-vpc --vpc-id "$VPC_ID" --region "$REGION" --profile "$PROFILE"
echo "VPC deleted."

# 7. Delete EC2 Key Pair
if [ -f "$KEY_FILE" ]; then
    echo "Deleting local key pair file: $KEY_FILE"
    rm "$KEY_FILE"
fi
echo "Deleting key pair from AWS: $KEY_NAME"
aws ec2 delete-key-pair --key-name "$KEY_NAME" --region "$REGION" --profile "$PROFILE"
echo "Key pair '$KEY_NAME' deleted from AWS."

# 8. Delete ECR Repository
ECR_REPO_NAME="backend-app"
echo "Deleting ECR repository: $ECR_REPO_NAME"
aws ecr delete-repository --repository-name "$ECR_REPO_NAME" --force --region "$REGION" --profile "$PROFILE" 2>/dev/null || echo "ECR repository not found or already deleted."

echo "--- Teardown Complete ---" 