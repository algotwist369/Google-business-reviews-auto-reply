require('dotenv').config();
const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');

// Import configurations
const connectDB = require('./config/database');
const configurePassport = require('./config/passport');
const configureApp = require('./config/app');
const { errorHandler } = require('./utils/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const reviewsRoutes = require('./routes/reviewsRoutes');

// Initialize Express app
const app = express();

// Configure app middleware
configureApp(app);

// Initialize Passport
app.use(passport.initialize());
configurePassport();

// Connect to MongoDB
connectDB();

// Health check endpoint (before routes for better performance)
// Returns 200 if healthy, 503 if unhealthy (for load balancer/proxy health checks)
app.get('/health', async (req, res) => {
    try {
        // Check MongoDB connection
        const mongoStatus = mongoose.connection.readyState;
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        const isDbConnected = mongoStatus === 1;

        if (!isDbConnected) {
            return res.status(503).json({
                status: 'UNHEALTHY',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                checks: {
                    database: 'disconnected',
                    statusCode: mongoStatus
                }
            });
        }

        // All checks passed
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            checks: {
                database: 'connected'
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'UNHEALTHY',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            error: error.message
        });
    }
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/reviews', reviewsRoutes);

// 404 handler - must be after all routes
// Note: Express 5 doesn't support wildcard '*' pattern in app.use()
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`
    });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

module.exports = app;
