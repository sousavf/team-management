#!/bin/bash

# Team Management System v1.3.0 Multi-Platform Build and Push Script
# This script builds multi-architecture images (ARM64 + AMD64) and pushes to Docker Hub

set -e  # Exit on any error

VERSION="1.3.0"
DOCKER_USERNAME="${DOCKER_USERNAME:-your-docker-username}"
PLATFORMS="linux/amd64,linux/arm64"

echo "🚀 Building Team Management System v${VERSION} for multiple platforms"
echo "Docker Username: ${DOCKER_USERNAME}"
echo "Target Platforms: ${PLATFORMS}"
echo "Current Architecture: $(uname -m)"

# Check if Docker username is set
if [ "$DOCKER_USERNAME" = "your-docker-username" ]; then
    echo "❌ Please set your Docker Hub username:"
    echo "export DOCKER_USERNAME=your-actual-username"
    echo "or run: DOCKER_USERNAME=your-username ./build-v1.3.sh"
    exit 1
fi

# Ensure we're logged into Docker Hub
echo "🔐 Checking Docker Hub authentication..."
if ! docker info | grep -q "Username:"; then
    echo "Please login to Docker Hub:"
    docker login
fi

# Check if buildx is available and setup multi-platform builder
echo "🔧 Setting up multi-platform builder..."
if ! docker buildx version > /dev/null 2>&1; then
    echo "❌ Docker Buildx is required for multi-platform builds"
    echo "Please update Docker Desktop to the latest version"
    exit 1
fi

# Create and use a new builder instance that supports multi-platform
BUILDER_NAME="team-management-v1.2-builder"
if ! docker buildx ls | grep -q "$BUILDER_NAME"; then
    echo "Creating new buildx builder: $BUILDER_NAME"
    docker buildx create --name $BUILDER_NAME --driver docker-container --bootstrap
fi

echo "Using buildx builder: $BUILDER_NAME"
docker buildx use $BUILDER_NAME

# Inspect the builder to ensure it supports our target platforms
echo "🔍 Verifying builder platforms..."
docker buildx inspect --bootstrap

# Build and push backend image for multiple platforms
echo "🏗️  Building and pushing backend image for ${PLATFORMS}..."
docker buildx build \
    --platform $PLATFORMS \
    --push \
    -t ${DOCKER_USERNAME}/team-management-backend:${VERSION} \
    -t ${DOCKER_USERNAME}/team-management-backend:latest \
    ./backend

# Build and push frontend image for multiple platforms
echo "🏗️  Building and pushing frontend image for ${PLATFORMS}..."
docker buildx build \
    --platform $PLATFORMS \
    --push \
    -t ${DOCKER_USERNAME}/team-management-frontend:${VERSION} \
    -t ${DOCKER_USERNAME}/team-management-frontend:latest \
    ./frontend

echo "✅ Successfully published Team Management System v${VERSION} to Docker Hub!"
echo ""
echo "🐳 Multi-platform images are available at:"
echo "   ${DOCKER_USERNAME}/team-management-backend:${VERSION}"
echo "   ${DOCKER_USERNAME}/team-management-frontend:${VERSION}"
echo ""
echo "🏗️  Supported architectures: AMD64, ARM64"
echo "💡 These images will work on:"
echo "   - Intel/AMD servers and workstations (x86_64)"
echo "   - Apple Silicon Macs (M1, M2, M3)"
echo "   - ARM-based cloud instances"
echo ""
echo "📝 To deploy v${VERSION}, users can run:"
echo "   docker run -d ${DOCKER_USERNAME}/team-management-backend:${VERSION}"
echo "   docker run -d ${DOCKER_USERNAME}/team-management-frontend:${VERSION}"
echo ""
echo "🆕 What's new in v1.3.0:"
echo "   - Historical capacity data extraction from Dashboard"
echo "   - Excel export with custom date ranges"
echo "   - Enhanced reporting for managers, admins, and view-only users"
echo "   - Multi-sheet Excel workbooks with detailed analytics"

# Clean up builder
echo "🧹 Cleaning up builder..."
docker buildx rm $BUILDER_NAME || true
