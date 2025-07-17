#!/bin/bash

echo "Starting Team Management Application..."
echo "This will build and start the application using Docker Compose"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start the application
echo "Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "Application is running!"
    echo ""
    echo "Access the application at:"
    echo "   Frontend: http://localhost:3500"
    echo "   Backend API: http://localhost:3501"
    echo ""
    echo "Default login credentials:"
    echo "   Admin: admin@company.com / password123"
    echo "   Any developer: [firstname.lastname]@company.com / password123"
    echo ""
    echo "The application includes:"
    echo "   • Team capacity management"
    echo "   • Time-off request system"
    echo "   • User management (Admin only)"
    echo "   • Analytics dashboard"
    echo ""
    echo "To stop the application: docker-compose down"
else
    echo "Some services failed to start. Check logs with: docker-compose logs"
fi