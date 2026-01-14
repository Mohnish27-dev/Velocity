import mongoose from 'mongoose';

const fellowshipProfileSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    role: {
        type: String,
        enum: ['student', 'corporate'],
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedEmail: {
        type: String,
        default: null
    },
    verificationCode: {
        type: String,
        default: null
    },
    verificationCodeExpiry: {
        type: Date,
        default: null
    },
    companyName: {
        type: String,
        default: null
    },
    collegeName: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        default: null
    },
    skills: [{
        type: String
    }],
    proposalCount: {
        type: Number,
        default: 0
    },
    challengeCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

fellowshipProfileSchema.pre('save', function () {
    this.updatedAt = new Date();
});

const FellowshipProfile = mongoose.model('FellowshipProfile', fellowshipProfileSchema);

export default FellowshipProfile;
