# AWS EC2 Docker Compose Deployment

This directory contains scripts to deploy the backend application and its dependencies (PostgreSQL, Redis) to a single AWS EC2 instance using Docker Compose.

This method is cost-effective, transparent, and gives you full control over the server environment.

## Prerequisites

- **AWS CLI:** Installed and configured with a user/profile that has EC2 and IAM permissions.
  - The script uses the `default` AWS profile. Edit `deploy-ec2.sh` to add `--profile yourprofilename` to each `aws` command if you need to use a different one.
- **Local Tools:** `curl`, `scp`, and `ssh` must be installed on your local machine.
- **Docker:** Docker must be running locally for the backend image build step (though the script doesn't use it directly, Docker is part of the `backend` build process defined in its own Dockerfile).

## Scripts

- `deploy-ec2.sh`: The main deployment script. Provisions all infrastructure, copies files, and starts the application.
- `teardown-ec2.sh`: The cleanup script. **Run this when you are finished to avoid incurring costs.**
- `docker-compose.prod.yml`: The production configuration for the services.
- `prod.env`: Environment variables for the services. You can modify this file to change passwords or other settings before deploying.
- `install-docker.sh`: A setup script that runs on the EC2 instance upon creation.

## How to Deploy

1.  **Review Configuration:** Open `deploy-ec2.sh` and `prod.env` to check the default settings. You can change the region, instance type, or passwords if you wish.
2.  **Make Scripts Executable:**
    ```sh
    chmod +x deploy-ec2.sh teardown-ec2.sh install-docker.sh
    ```
3.  **Run the Deployment Script:**
    ```sh
    ./deploy-ec2.sh
    ```
The script will output the public IP address of your running application.

## How to Clean Up

When you are done with the deployment and want to avoid further charges:

1.  **Run the Teardown Script:**
    ```sh
    ./teardown-ec2.sh
    ```
This will terminate the instance and delete the security group and key pair. 