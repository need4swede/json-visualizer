#!/bin/bash

# Test script to verify Docker setup works correctly
echo "Testing Docker setup for JSON Parser..."

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Build and test the Docker image
echo "🔨 Building Docker image..."
if docker build -t json-parser-test .; then
    echo "✅ Docker image built successfully"
else
    echo "❌ Docker build failed"
    exit 1
fi

# Test running the container
echo "🚀 Testing container startup..."
CONTAINER_ID=$(docker run -d -p 7338:7337 json-parser-test)

# Wait a few seconds for startup
sleep 5

# Check if container is running
if docker ps | grep -q $CONTAINER_ID; then
    echo "✅ Container is running"
    
    # Test if port is responding
    if curl -f http://localhost:7338 > /dev/null 2>&1; then
        echo "✅ Application is responding on port 7338"
    else
        echo "❌ Application is not responding"
        docker logs $CONTAINER_ID
    fi
else
    echo "❌ Container failed to start"
    docker logs $CONTAINER_ID
fi

# Cleanup
echo "🧹 Cleaning up test container..."
docker stop $CONTAINER_ID > /dev/null 2>&1
docker rm $CONTAINER_ID > /dev/null 2>&1
docker rmi json-parser-test > /dev/null 2>&1

echo "✅ Docker test completed"