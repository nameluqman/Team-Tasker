# 🎯 TeamTasker - Professional Team Management Platform

A **full-stack web application** for team collaboration and task management, built with modern technologies and professional design.

## 🚀 Features

- **🔐 Secure Authentication**: Session-based auth with bcrypt password hashing
- **👥 Team Management**: Create teams, manage members, role-based access control
- **📋 Task Management**: Create, assign, track tasks with status management
- **🎨 Professional UI**: Modern, responsive design with Tailwind CSS
- **🌐 Cross-Origin Support**: Configured for separate domain deployment
- **📱 Mobile Responsive**: Works perfectly on all device sizes
- **🎨 Colorful Logging**: Enhanced backend with beautiful console output

## 🛠 Tech Stack

### Frontend
- **React 18** with Vite ⚡
- **Tailwind CSS** for professional styling
- **React Router** for navigation
- **Axios** for API communication
- **Lucide React** for beautiful icons

### Backend
- **Node.js** with Express
- **Passport.js** authentication
- **PostgreSQL** database (Neon)
- **Express-session** with secure storage
- **Colorful console logging** 🎨

### Database
- **PostgreSQL** on Neon (free tier)
- **Connection pooling** for performance
- **Session storage** in database

## 📁 Project Structure

```
TeamTasker/
├── 📄 .env (environment variables)
├── 📄 .gitignore (colorful & comprehensive)
├── 📄 README.md (this file)
├── 📄 package.json (root configuration)
├── 📁 backend/ (Node.js API)
│   ├── index.js (colorful server)
│   ├── routes/ (API endpoints)
│   ├── middleware/ (auth middleware)
│   ├── config/ (passport config)
│   ├── db/ (database config)
│   └── scripts/ (migration scripts)
└── 📁 frontend/ (React app)
    ├── src/
    │   ├── components/ (Layout.jsx)
    │   ├── pages/ (Dashboard, Teams, Tasks, etc.)
    │   ├── contexts/ (AuthContext)
    │   └── utils/ (API utilities)
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (Neon recommended)
- Git for version control

### 1. Clone & Install
```bash
git clone <your-repository-url>
cd TeamTasker

# Install all dependencies
npm run install:all
```

### 2. Environment Setup
Create a `.env` file in the root:

```env
# Database Configuration
DATABASE_URL=postgresql://neondb_owner:npg_XCxZOLfw6BQ4@ep-withered-recipe-ahuc4uuu-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Environment
NODE_ENV=development

# Frontend API URL
VITE_API_URL=http://localhost:3001/api
```

### 3. Database Setup
```bash
cd backend
npm run migrate
npm run seed  # Optional: Add sample data
```

### 4. Run Development Servers
```bash
# Run both frontend and backend
npm run dev

# Or run separately:
npm run dev:backend  # Port 3001
npm run dev:frontend # Port 5173
```

## 🗄️ Database Schema

### Core Tables
```sql
-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams Table
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members Table
CREATE TABLE team_members (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, team_id)
);

-- Tasks Table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo',
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Production Deployment

### Quick Deploy with Vercel

#### 1. Database Setup (Neon)
1. Create free account at [Neon](https://neon.tech)
2. Create new PostgreSQL database
3. Copy connection string

#### 2. Backend Deployment
1. Connect repository to Vercel
2. Set environment variables:
   ```
   DATABASE_URL=your_neon_connection_string
   SESSION_SECRET=generate_secure_random_string
   FRONTEND_URL=your_frontend_vercel_url
   NODE_ENV=production
   ```
3. Deploy backend

#### 3. Frontend Deployment
1. Connect same repository to Vercel
2. Set environment variable:
   ```
   VITE_API_URL=your_backend_vercel_url/api
   ```
3. Deploy frontend

#### 4. Run Migrations
After deployment, run database migrations:
```bash
cd backend
DATABASE_URL=your_production_db_url npm run migrate
```

### Environment Variables Reference

#### Backend
```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
SESSION_SECRET=your_secure_random_string
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

#### Frontend
```env
VITE_API_URL=https://your-backend.vercel.app/api
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Teams
- `GET /api/teams` - Get user's teams
- `GET /api/teams/:id` - Get team details
- `POST /api/teams` - Create new team
- `POST /api/teams/:id/members` - Add member
- `DELETE /api/teams/:id/members/:userId` - Remove member
- `DELETE /api/teams/:id` - Delete team (owner only)

### Tasks
- `GET /api/tasks` - Get tasks with filtering
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🔐 Security Features

- **🔒 Secure Authentication**: bcrypt with 12 salt rounds
- **🍪 HTTP-only Cookies**: Secure session storage
- **🌐 CORS Configuration**: Cross-origin support
- **✅ Input Validation**: express-validator protection
- **🛡️ SQL Injection Prevention**: Parameterized queries
- **🔐 Session Security**: PostgreSQL session storage

## 🎨 Enhanced Features

### Colorful Backend Logging
The backend features beautiful, colorful console output:
- 🎯 Startup banners
- 📊 Health check status
- 📝 Request logging with timing
- 💥 Enhanced error reporting
- 🗄️ Database connection status

### Professional UI Design
- **Modern Layout**: Clean, professional interface
- **Responsive Design**: Works on all devices
- **Color Scheme**: Professional slate/indigo theme
- **Smooth Animations**: Polished interactions
- **Accessibility**: Proper contrast and navigation

## 🧪 Development Commands

```bash
# Development
npm run dev              # Run both servers
npm run dev:backend       # Backend only (port 3001)
npm run dev:frontend      # Frontend only (port 5173)

# Production
npm run build            # Build frontend
npm run start             # Production servers

# Setup
npm run install:all       # Install all dependencies
npm run setup            # Full setup with migrations

# Database
cd backend && npm run migrate  # Create tables
cd backend && npm run seed     # Add sample data
```

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` matches deployed URL exactly
   - Check URL includes `https://` and no trailing slash

2. **Database Connection**
   - Verify `DATABASE_URL` is correct and accessible
   - Ensure SSL mode is enabled (`sslmode=require`)

3. **Session Issues**
   - Ensure `SESSION_SECRET` is set and consistent
   - Check cookies are being set with correct attributes

4. **Build Failures**
   - Check all environment variables are set
   - Verify dependencies are properly installed

### Debugging Steps

1. **Check Logs**: Look at console output for colorful error messages
2. **Test API**: Use curl or Postman to test endpoints
3. **Verify Database**: Connect to database directly
4. **Check Environment**: Ensure all variables are correct

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support:
- Open an issue in the GitHub repository
- Check the colorful console logs for debugging
- Verify all environment variables are set correctly

---

**🎯 Built with ❤️ for modern team collaboration**

*Last updated: 2026-02-06*  
*Total files: 31 | Status: Production Ready ✅*
