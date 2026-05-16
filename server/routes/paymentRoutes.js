const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Application = require('../models/Application');
const { generateCardPDF } = require('../services/pdfService');

const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay keys not configured in environment variables.');
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// @desc    Create a Razorpay order for a Premier application
// @route   POST /api/payments/create-order
// @access  Public
router.post('/create-order', async (req, res) => {
    try {
        const { applicationId } = req.body;

        if (!applicationId) {
            return res.status(400).json({ error: 'applicationId is required' });
        }

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (application.paymentStatus === 'Paid') {
            return res.status(400).json({ error: 'Payment already completed for this application.' });
        }

        const razorpay = getRazorpayInstance();

        const order = await razorpay.orders.create({
            amount: 50000, // ₹500 in paise
            currency: 'INR',
            receipt: `rcpt_${applicationId.toString().slice(-8)}`,
            notes: {
                applicationId: applicationId.toString(),
                applicantName: application.personalDetails.fullName || '',
            },
        });

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            applicantName: application.personalDetails.fullName || '',
            applicantEmail: application.personalDetails.email || '',
            applicantPhone: application.personalDetails.mobile || '',
        });

    } catch (error) {
        console.error('Create Razorpay Order Error:', error);
        res.status(500).json({ error: 'Failed to create payment order: ' + error.message });
    }
});

// @desc    Verify Razorpay payment signature and generate card
// @route   POST /api/payments/verify
// @access  Public
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !applicationId) {
            return res.status(400).json({ success: false, error: 'Missing required payment verification fields.' });
        }

        // Cryptographic signature verification — cannot be faked
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.error('Signature mismatch! Possible fraud attempt.');
            return res.status(400).json({ success: false, error: 'Payment verification failed. Invalid signature.' });
        }

        // Signature is valid — mark application as paid and generate card
        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        application.paymentStatus = 'Paid';
        application.status = 'Verified';
        application.razorpayOrderId = razorpay_order_id;
        application.razorpayPaymentId = razorpay_payment_id;

        // Generate the Premier card PDF now that payment is confirmed
        console.log('Generating Premier card PDF after payment verification:', applicationId);
        const pdfBuffer = await generateCardPDF(application);
        application.pdfData = Buffer.from(pdfBuffer);

        await application.save();

        res.json({
            success: true,
            message: 'Payment verified. Premier card generated successfully.',
            applicationId: application._id,
        });

    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ success: false, error: 'Payment verification failed: ' + error.message });
    }
});

module.exports = router;
