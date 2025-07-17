#!/bin/bash

echo "Testing application setup..."

# Test database
echo "Testing database connection..."
if docker-compose -f docker-compose.simple.yml ps | grep -q "healthy"; then
    echo "Database is healthy"
else
    echo "Database is not healthy"
    exit 1
fi

# Test backend
echo "Testing backend API..."
sleep 2
if curl -s http://localhost:3501/api/health > /dev/null; then
    echo "Backend is responding"
    echo "   Response: $(curl -s http://localhost:3501/api/health)"
else
    echo "Backend is not responding"
    echo "   Make sure backend is running: cd backend && npm run dev"
fi

# Test frontend build
echo "Testing frontend build..."
cd frontend
if npm run build > /dev/null 2>&1; then
    echo "Frontend builds successfully"
else
    echo "Frontend build failed"
    echo "   Try: cd frontend && npm install && npm run build"
fi

echo ""
echo "Status Summary:"
echo "   Database: $(docker-compose -f docker-compose.simple.yml ps --format 'table {{.Status}}' | tail -1)"
echo "   Backend: http://localhost:3501"
echo "   Frontend: http://localhost:3500"
echo ""
echo "To run the full application:"
echo "   1. Database: docker-compose -f docker-compose.simple.yml up -d"
echo "   2. Backend: cd backend && npm run dev"
echo "   3. Frontend: cd frontend && npm start"