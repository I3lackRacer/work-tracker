#!/bin/bash

# Exit on error
set -e

# Configuration
DOCKER_IMAGE="tim4308/work-tracker"

# Pull the new image
docker pull ${DOCKER_IMAGE}:latest

# Stop and remove existing container
docker compose down || true

# Create or update .env file with JWT secret
echo "JWT_SECRET=${JWT_SECRET}" > .env

# Start the new container
docker compose up -d

# Clean up old images
docker image prune -f

echo "Deployment completed successfully!" 