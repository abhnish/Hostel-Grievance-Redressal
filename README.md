# Smart Public Service CRM

AI-enabled municipal public service complaint and transparency platform (forked & extended from Hostel-Grievance-Redressal)

## Overview

Smart Public Service CRM is a modern web application that enables citizens to submit public service requests, track their status, and provides transparency into municipal operations. The platform features AI-powered request classification, priority scoring, and real-time analytics.

## Features

- **Citizen Portal**: Submit and track public service requests
- **Officer Dashboard**: Manage and assign requests efficiently
- **Transparency Dashboard**: Real-time KPIs and ward-wise statistics
- **AI Classification**: Automatic categorization and priority scoring
- **Role-based Access**: Citizen, Officer, and Admin roles
- **Real-time Updates**: Live status tracking and notifications

## Technology Stack

### Frontend
- React.js with modern hooks
- Tailwind CSS for styling
- React Router for navigation
- Axios for API communication

### Backend
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- bcrypt for password hashing
- RESTful API design

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Smart-Public-Service-CRM
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create database
   createdb municipal
   
   # Import schema
   psql -U <username> -d municipal -f database.sql
   ```

4. **Environment Configuration**
   ```bash
   # Copy and configure environment variables
   cp .env.example .env
   # Update DATABASE_URL and JWT_SECRET
   ```

5. **Start Backend**
   ```bash
   npm start
   ```

6. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

7. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Docker Setup

Using Docker Compose for easy development:

```bash
docker-compose up -d
```

This will start both frontend and backend services along with PostgreSQL database.

## User Roles

### Citizen
- Submit public service requests
- Track request status
- View personal request history
- Access transparency dashboard

### Officer
- View and manage assigned requests
- Update request status
- Access ward-wise analytics
- Generate reports

### Admin
- Full system access
- User management
- System configuration
- Advanced analytics

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /register` - User registration

### Requests
- `GET /complaints` - Get all requests
- `POST /complaints` - Create new request
- `PUT /complaints/:id` - Update request status

### Masters
- `GET /wards` - Get all wards
- `GET /departments` - Get all departments

### Transparency
- `GET /transparency` - Public transparency data

## Database Schema

The application uses a unified `users` table with role-based access control:

- **users**: Core user information with roles
- **wards**: Municipal wards/divisions
- **departments**: Service departments
- **complaints**: Service requests and their status
- **officers**: Officer assignments and workload

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Attribution

**Forked and extended from Chinmay-Ankolekar/Hostel-Grievance-Redressal**

Major changes:
- Municipal schema with unified users table
- Complete UI rebrand to Smart Public Service CRM
- Admin transparency dashboard
- AI-powered request classification
- Enhanced role-based access control

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Smart Public Service CRM** - Building transparent and efficient municipal services.
