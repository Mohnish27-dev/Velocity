import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance with test/live keys from environment
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a Razorpay order for escrow payment
 * @param {number} amount - Amount in INR (will be converted to paise)
 * @param {string} receipt - Unique receipt ID for tracking
 * @param {object} notes - Additional metadata
 * @returns {Promise<object>} Razorpay order object
 */
export const createOrder = async (amount, receipt, notes = {}) => {
    const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: receipt,
        notes: notes,
        payment_capture: 1 // Auto-capture payment
    };

    try {
        const order = await razorpay.orders.create(options);
        console.log('📦 Razorpay order created:', order.id);
        return order;
    } catch (error) {
        console.error('❌ Failed to create Razorpay order:', error);
        throw new Error(`Failed to create payment order: ${error.message}`);
    }
};

/**
 * Verify payment signature from Razorpay
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} Whether the signature is valid
 */
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    return expectedSignature === signature;
};

/**
 * Get order details from Razorpay
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<object>} Order details
 */
export const getOrder = async (orderId) => {
    try {
        return await razorpay.orders.fetch(orderId);
    } catch (error) {
        console.error('❌ Failed to fetch order:', error);
        throw new Error(`Failed to fetch order: ${error.message}`);
    }
};

/**
 * Get payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<object>} Payment details
 */
export const getPayment = async (paymentId) => {
    try {
        return await razorpay.payments.fetch(paymentId);
    } catch (error) {
        console.error('❌ Failed to fetch payment:', error);
        throw new Error(`Failed to fetch payment: ${error.message}`);
    }
};

export default razorpay;
