#!/bin/bash

# Exit on error
set -e

# Configuration
DOCKER_IMAGE="tim4308/work-tracker"
DOCKER_TAG="$1"  # First argument is the build number

# Pull the new image
docker pull ${DOCKER_IMAGE}:${DOCKER_TAG}

# Stop and remove existing container
docker compose down || true

# Start the new container
docker compose up -d

# Clean up old images
docker image prune -f

echo "Deployment completed successfully!" 