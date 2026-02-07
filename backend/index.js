const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');
const taskRoutes = require('./routes/tasks');
const { pool } = require('./db/config');

const app = express();

// 🎨 Colorful console logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const log = (message, color = 'white') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// 🚀 Startup banner
log('🎯 TeamTasker Backend Server Starting...', 'cyan');
log('═══════════════════════════════════════════════════════════════', 'cyan');
log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`, 'yellow');
log(`🗄️  Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}`, 
  process.env.DATABASE_URL ? 'green' : 'red');
log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`, 'blue');
log(`🔐 Session Secret: ${process.env.SESSION_SECRET ? '✅ Set' : '⚠️  Using default'}`, 
  process.env.SESSION_SECRET ? 'green' : 'yellow');
log('═══════════════════════════════════════════════════════════════', 'cyan');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration for cross-origin cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for serverless environment
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'teamtasker.sid'
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// 🏥 Health check endpoint with enhanced logging
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const dbTest = await pool.query('SELECT NOW()');
    
    log(`📊 Health check requested from ${req.ip}`, 'blue');
    log(`🗄️  Database status: ✅ Connected`, 'green');
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    log(`❌ Database health check failed: ${error.message}`, 'red');
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message 
    });
  }
});

// 📝 Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  log(`📝 ${req.method} ${req.path} - ${timestamp}`, 'magenta');
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? 'red' : 
                       res.statusCode >= 300 ? 'yellow' : 'green';
    log(`✅ ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, statusColor);
  });
  
  next();
});

// API routes with logging
log('🔗 Registering API routes...', 'blue');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
log('✅ All API routes registered', 'green');

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Global error handler with enhanced logging
app.use((err, req, res, next) => {
  log(`💥 Error occurred: ${err.message}`, 'red');
  log(`📍 Path: ${req.method} ${req.path}`, 'red');
  log(`🔍 Stack: ${err.stack}`, 'red');
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Export for Vercel serverless
module.exports = app;

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  log(' Server started successfully!', 'green');
  log('═══════════════════════════════════════════════════════════════', 'green');
  log(` Server running on: ${colors.cyan}http://localhost:${PORT}${colors.reset}`, 'cyan');
  log(` Health check: ${colors.cyan}http://localhost:${PORT}/api/health${colors.reset}`, 'cyan');
  log(` API Base URL: ${colors.cyan}http://localhost:${PORT}/api${colors.reset}`, 'cyan');
  log('═══════════════════════════════════════════════════════════════', 'green');
  log(' Ready to accept connections!', 'green');
});
