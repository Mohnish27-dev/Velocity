/**
 * Job Alert Socket Service
 * Handles real-time notifications for job alerts via Socket.IO
 */

import { getIO } from '../config/socket.js';

/**
 * Emit event when new jobs are found for a user's alert
 * @param {string} userId - User ID
 * @param {Object} data - Event data
 */
export const emitNewJobsFound = (userId, data) => {
    try {
        const io = getIO();
        io.to(`user:${userId}`).emit('job_alert_new_jobs', {
            alertId: data.alertId,
            alertTitle: data.alertTitle,
            jobCount: data.jobCount,
            jobs: data.jobs || [],
            timestamp: new Date()
        });
        console.log(`📡 Socket: New jobs notification sent to user:${userId}`);
        return true;
    } catch (error) {
        console.warn(`⚠️  Socket emit failed for user ${userId}:`, error.message);
        return false;
    }
};

/**
 * Emit event when email is successfully sent
 * @param {string} userId - User ID
 * @param {Object} data - Event data
 */
export const emitEmailSent = (userId, data) => {
    try {
        const io = getIO();
        io.to(`user:${userId}`).emit('job_alert_email_sent', {
            alertId: data.alertId,
            alertTitle: data.alertTitle,
            jobCount: data.jobCount,
            recipientEmail: data.recipientEmail,
            messageId: data.messageId,
            timestamp: new Date()
        });
        console.log(`📧 Socket: Email sent notification to user:${userId}`);
        return true;
    } catch (error) {
        console.warn(`⚠️  Socket emit failed for user ${userId}:`, error.message);
        return false;
    }
};

/**
 * Emit event when email sending fails
 * @param {string} userId - User ID
 * @param {Object} data - Event data
 */
export const emitEmailFailed = (userId, data) => {
    try {
        const io = getIO();
        io.to(`user:${userId}`).emit('job_alert_email_failed', {
            alertId: data.alertId,
            alertTitle: data.alertTitle,
            error: data.error,
            timestamp: new Date()
        });
        console.log(`❌ Socket: Email failed notification to user:${userId}`);
        return true;
    } catch (error) {
        console.warn(`⚠️  Socket emit failed for user ${userId}:`, error.message);
        return false;
    }
};

/**
 * Emit event when alert is being processed
 * @param {string} userId - User ID
 * @param {Object} data - Event data
 */
export const emitAlertProcessing = (userId, data) => {
    try {
        const io = getIO();
        io.to(`user:${userId}`).emit('job_alert_processing', {
            alertId: data.alertId,
            alertTitle: data.alertTitle,
            timestamp: new Date()
        });
        console.log(`⚙️  Socket: Alert processing notification to user:${userId}`);
        return true;
    } catch (error) {
        console.warn(`⚠️  Socket emit failed for user ${userId}:`, error.message);
        return false;
    }
};

/**
 * Emit general notification to user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
export const emitNotification = (userId, notification) => {
    try {
        const io = getIO();
        io.to(`user:${userId}`).emit('notification', {
            ...notification,
            timestamp: new Date()
        });
        console.log(`🔔 Socket: Notification sent to user:${userId}`);
        return true;
    } catch (error) {
        console.warn(`⚠️  Socket emit failed for user ${userId}:`, error.message);
        return false;
    }
};

export default {
    emitNewJobsFound,
    emitEmailSent,
    emitEmailFailed,
    emitAlertProcessing,
    emitNotification
};
