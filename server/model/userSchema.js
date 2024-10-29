const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    providerId: { type: String, required: true, unique: true },  // ID único del proveedor
    name: { type: String },
    email: { type: String, unique: true },
    profilePicture: { type: String },
    provider: { type: String, required: true },  // google, discord, facebook
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
