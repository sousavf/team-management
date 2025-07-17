#!/bin/bash

echo "Starting Team Management Application (Local Development)..."
echo "This will start the database in Docker and run the apps locally"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

# Start just the database
echo "Starting PostgreSQL database..."
docker-compose -f docker-compose.simple.yml up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Check if database is running
if docker-compose -f docker-compose.simple.yml ps | grep -q "Up"; then
    echo "Database is running!"
else
    echo "Database failed to start. Check logs with: docker-compose -f docker-compose.simple.yml logs"
    exit 1
fi

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Set up database
echo "Setting up database..."
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
cd ..

echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

echo "Waiting for backend to start..."
sleep 5

echo "Starting frontend server..."
cd frontend && npm start &
FRONTEND_PID=$!
cd ..

echo "Application is starting!"
echo ""
echo "Access the application at:"
echo "   Frontend: http://localhost:3500"
echo "   Backend API: http://localhost:3501"
echo ""
echo "Default login credentials:"
echo "   Admin: admin@company.com / password123"
echo "   Any developer: [firstname.lastname]@company.com / password123"
echo ""
echo "To stop the application:"
echo "   Press Ctrl+C to stop the servers"
echo "   Run: docker-compose -f docker-compose.simple.yml down"
echo ""
echo "Features available:"
echo "   • Team capacity management"
echo "   • Time-off request system"
echo "   • User management (Admin only)"
echo "   • Analytics dashboard"

# Wait for user to stop
wait