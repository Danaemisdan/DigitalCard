const mongoose = require('mongoose');

const applicationSchema = mongoose.Schema({
    personalDetails: {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        mobile: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: false, default: '' },
        gender: { type: String, enum: ['Male', 'Female', 'Other'], required: false, default: 'Other' },
        dob: { type: String, required: false, default: '' },
        aadhaarNumber: { type: String, required: false, default: '' },
        address: { type: String, required: false, default: '' },
        pinCode: { type: String, required: false, default: '' },
        panNumber: { type: String, required: false, default: '' },
        employeeName: { type: String, required: false, default: '' },
        bankName: { type: String, required: false, default: '' },
        ifscCode: { type: String, required: false, default: '' },
        accountNumber: { type: String, required: false, default: '' },
    },
    uniqueCode: { type: String, required: false },
    documents: {
        aadhaarPath: { type: String, required: false },
        aadhaarBackPath: { type: String, required: false },
        panPath: { type: String, required: false },
        photoPath: { type: String, required: false },
    },
    applicationType: {
        type: String,
        required: true,
        enum: ['Premium', 'Premier', 'Free'],
    },
    status: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected', 'Review Required'],
        default: 'Pending',
    },
    verificationStatus: {
        type: String,
        enum: ['Pending', 'Passed', 'Review Required', 'Failed'],
        default: 'Pending',
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid'],
        default: 'Pending',
    },
    referralCode: {
        type: String,
        required: false,
    },
    pdfData: {
        type: Buffer,
        required: false
    },
    razorpayOrderId: { type: String, required: false, default: '' },
    razorpayPaymentId: { type: String, required: false, default: '' },
}, {
    timestamps: true,
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
