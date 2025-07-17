# Team Management Application

A comprehensive web application for managing software development teams, built with modern technologies and fully containerized with Docker.

If you like this software, feel free to [buy me a coffee](https://coff.ee/sousavf).

## Features

### 🧑‍💻 Team Capacity Management
- Weekly capacity planning for 20 developers
- Individual allocation tracking across 6 categories:
  - Backend Development
  - Frontend Development  
  - Code Review
  - Release Management
  - UX Design
  - Technical Analysis
- Configurable team pace factor (default: 80%)
- Multi-week timeline view with easy navigation
- Real-time capacity calculations in hours and percentages

### 🗓️ Time Off Management
- User-friendly time-off request system
- Support for multiple request types (Vacation, Sick Leave, Personal, Conference, Other)
- Manager approval workflow
- Conflict detection for overlapping requests
- Holiday and absence tracking
- Email notifications for status updates

### 👥 User Management
- Role-based access control (Admin, Manager, Developer)
- User profile management
- Team member directory
- Secure authentication with JWT tokens

### 📊 Analytics & Reporting
- Team capacity dashboard with visual charts
- Utilization trends and forecasting
- Category-wise allocation breakdowns
- Pending request notifications
- Export capabilities for planning

## Technology Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** database
- **Prisma ORM** for database management
- **JWT** authentication
- **bcrypt** for password hashing
- **express-rate-limit** for API protection

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Recharts** for data visualization
- **Hero Icons** for UI icons
- **React Hot Toast** for notifications
- **Axios** for API communication

### Infrastructure
- **Docker** & **Docker Compose** for containerization
- **Nginx** for frontend serving and reverse proxy
- **PostgreSQL** containerized database

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git for cloning the repository

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd management-app
```

2. Start the application:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3500
- Backend API: http://localhost:3501

### Default Login
- **Admin**: admin@company.com / password123
- **Developers**: [firstname.lastname]@company.com / password123

## Development

### Local Development Setup

1. **Backend Setup**:
```bash
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

2. **Frontend Setup**:
```bash
cd frontend
npm install
npm start
```

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Users
- `GET /api/users` - Get all users
- `GET /api/users/me` - Get current user
- `POST /api/users` - Create user (Admin/Manager)
- `PUT /api/users/:id` - Update user (Admin/Manager)
- `DELETE /api/users/:id` - Delete user (Admin)

### Capacity Management
- `GET /api/capacity/allocations` - Get allocations
- `GET /api/capacity/team-overview` - Get team capacity overview
- `PUT /api/capacity/allocations/:userId/:weekStart` - Update allocation

### Time Off
- `GET /api/time-off` - Get time-off requests
- `POST /api/time-off` - Create time-off request
- `PUT /api/time-off/:id` - Approve/reject request (Manager/Admin)
- `DELETE /api/time-off/:id` - Delete request

## Configuration

### Environment Variables

**Backend (.env)**:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/team_management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3501
NODE_ENV=development
PACE_FACTOR=0.8
```

**Frontend**:
```
REACT_APP_API_URL=http://localhost:3501/api
```

### Customization

- **Pace Factor**: Adjust the `PACE_FACTOR` environment variable (0.8 = 80% of 40h work week)
- **Working Hours**: Modify `WORKING_HOURS_PER_DAY` and `WORKING_DAYS_PER_WEEK` in settings
- **Allocation Categories**: Update the schema and add new categories as needed

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Rate limiting on authentication endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers

## Deployment

### Docker Production Deployment

1. Update environment variables for production
2. Build and run with Docker Compose:
```bash
docker-compose -f docker-compose.yml up --build -d
```

### Manual Deployment

1. Build the frontend:
```bash
cd frontend && npm run build
```

2. Build the backend:
```bash
cd backend && npm run build
```

3. Deploy to your preferred hosting platform

## Database Schema

### Key Tables
- **users**: User accounts with roles and authentication
- **allocations**: Weekly capacity allocations by category
- **time_off_requests**: Time-off requests with approval workflow
- **settings**: Application configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## Additional Features

The application includes several enhancements beyond the basic requirements:

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live data synchronization
- **Advanced Filtering**: Filter by status, user, date range
- **Data Export**: Export capacity and time-off data
- **Audit Trail**: Track changes and approvals
- **Notification System**: Toast notifications for user actions
- **Search Functionality**: Search users and requests
- **Bulk Operations**: Manage multiple items at once
- **Calendar Integration**: Visual calendar view for time-off
- **Team Analytics**: Detailed team performance metrics

## Future Enhancements

- Email notification system
- Slack/Teams integration  
- Mobile app with React Native
- Advanced reporting and analytics
- Resource forecasting and planning
- Integration with JIRA/GitHub
- Time tracking integration
- Holiday calendar synchronization
