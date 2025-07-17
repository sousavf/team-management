# Quick Start Guide

## Option 1: Local Development (Recommended)

This runs the database in Docker and the apps locally for easier development.

```bash
# Start database + apps locally
./start-local.sh
```

## Option 2: Manual Setup

### 1. Start Database
```bash
docker-compose -f docker-compose.simple.yml up -d
```

### 2. Setup Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

### 3. Setup Frontend (in new terminal)
```bash
cd frontend
npm install
npm start
```

## Option 3: Full Docker (if you prefer)

```bash
# Clean up any existing containers
docker-compose down -v

# Build and start all services
docker-compose up --build
```

## Access the Application

- **Frontend**: http://localhost:3500
- **Backend API**: http://localhost:3501
- **Login**: admin@company.com / password123

## Default Users

All 20 developers are pre-loaded:
- Admin: admin@company.com / password123
- Developers: [firstname.lastname]@company.com / password123

Examples:
- first.lastname@company.com
- etc.

## Features

1. **Dashboard**: Team capacity overview with charts
2. **Capacity Management**: Weekly allocation planning
3. **Time Off**: Request and approve time-off
4. **Users**: Manage team members (Admin only)

## Troubleshooting

### Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.simple.yml ps

# View database logs
docker-compose -f docker-compose.simple.yml logs db
```

### Backend Issues
```bash
# Check backend logs
cd backend && npm run dev
```

### Frontend Issues
```bash
# Check frontend logs
cd frontend && npm start
```

### Reset Everything
```bash
# Stop all services
docker-compose down -v
docker-compose -f docker-compose.simple.yml down -v

# Remove node_modules if needed
rm -rf backend/node_modules frontend/node_modules

# Start fresh
./start-local.sh
```