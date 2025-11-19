require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const configureApp = (app) => {
    // Security middleware
    app.use(helmet());
    
    // Compression middleware for better performance
    app.use(compression());

    // CORS configuration
    const corsOptions = {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
        optionsSuccessStatus: 200
    };
    app.use(cors(corsOptions));

    // Body parser middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware (optional, for debugging)
    if (process.env.NODE_ENV === 'development') {
        app.use((req, res, next) => {
            console.log(`${req.method} ${req.path}`);
            next();
        });
    }
};

module.exports = configureApp;

