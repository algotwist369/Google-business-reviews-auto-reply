const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String },
    avatar: { type: String },
    // We store the access token to make API calls on behalf of the user
    googleAccessToken: { type: String },
    googleRefreshToken: { type: String }, // Refresh token for token renewal

    autoReplySettings: {
        enabled: { type: Boolean, default: false },
        delayMinutes: { type: Number, default: 30 },
        tone: {
            type: String,
            enum: ['friendly', 'empathetic', 'professional', 'concise'],
            default: 'friendly'
        },
        respondToPositive: { type: Boolean, default: true },
        respondToNeutral: { type: Boolean, default: true },
        respondToNegative: { type: Boolean, default: true },
        lastRunAt: { type: Date },
        lastManualRunAt: { type: Date }
    }
}, { timestamps: true });

// Index for faster lookups
UserSchema.index({ googleId: 1 });
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);