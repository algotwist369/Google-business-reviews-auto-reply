const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String },
    avatar: { type: String },
    // We store the access token to make API calls on behalf of the user
    googleAccessToken: { type: String },
    googleRefreshToken: { type: String }, // Refresh token for token renewal
}, { timestamps: true });

// Index for faster lookups
UserSchema.index({ googleId: 1 });
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);