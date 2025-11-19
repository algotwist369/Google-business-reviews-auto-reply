const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verify JWT token and attach user to request
 */
const verifyToken = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('No token provided. Access denied.', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.SESSION_SECRET);
        
        // Get user from token
        const user = await User.findById(decoded.id).select('-__v');
        
        if (!user) {
            return next(new AppError('User not found.', 404));
        }

        // Check if user has valid access token
        if (!user.googleAccessToken) {
            return next(new AppError('Google access token not found. Please re-authenticate.', 401));
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token.', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Token expired.', 401));
        }
        return next(new AppError('Authentication failed.', 401));
    }
});

module.exports = { verifyToken };

