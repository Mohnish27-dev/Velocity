import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { 
    syncMongoToFirebase,
    saveUserToFirebase 
} from '../services/firebaseDataService.js';
import JobAlert from '../models/JobAlert.model.js';
import NotificationLog from '../models/NotificationLog.model.js';
import JobListing from '../models/JobListing.model.js';

const router = express.Router();

router.post('/sync-to-firebase', verifyToken, asyncHandler(async (req, res) => {
    console.log('🔄 Starting MongoDB to Firebase sync...');
    
    const result = await syncMongoToFirebase({
        JobAlert,
        NotificationLog,
        JobListing
    });
    
    res.json({
        success: result.success,
        message: result.success 
            ? 'Data synced to Firebase successfully' 
            : 'Sync failed',
        error: result.error || null,
        timestamp: new Date()
    });
}));

router.post('/save-my-profile', verifyToken, asyncHandler(async (req, res) => {
    const user = req.user;
    
    const result = await saveUserToFirebase({
        uid: user.uid,
        email: user.email,
        displayName: user.name || user.displayName,
        photoURL: user.picture || user.photoURL,
        ...req.body // Allow additional profile data
    });
    
    res.json({
        success: result.success,
        message: 'Profile saved to Firebase',
        userId: result.userId
    });
}));


router.get('/stats', verifyToken, asyncHandler(async (req, res) => {
    const [
        totalAlerts,
        activeAlerts,
        totalNotifications,
        totalJobs
    ] = await Promise.all([
        JobAlert.countDocuments(),
        JobAlert.countDocuments({ isActive: true }),
        NotificationLog.countDocuments(),
        JobListing.countDocuments()
    ]);
    
    res.json({
        success: true,
        stats: {
            totalAlerts,
            activeAlerts,
            totalNotifications,
            totalJobs,
            timestamp: new Date()
        }
    });
}));

export default router;
