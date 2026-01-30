const Application = require('../models/Application');
const { verifyDocument } = require('../services/ocrService');
const { generateCardPDF } = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

// @desc    Get all applications
// @route   GET /api/applications
// @access  Public (should be Protected)
const getAllApplications = async (req, res) => {
    try {
        const applications = await Application.find({}).sort({ createdAt: -1 });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Submit new application
// @route   POST /api/applications
// @access  Public
const createApplication = async (req, res) => {
    try {
        const { fullName, email, mobile, city, state, gender, aadhaarNumber, applicationType, referralCode } = req.body;



        // File paths from Multer - with null safety
        const files = req.files || {};
        const documentPaths = {
            aadhaarPath: (files.aadhaar && files.aadhaar[0]) ? files.aadhaar[0].path : null,
            panPath: (files.pan && files.pan[0]) ? files.pan[0].path : null,
            photoPath: (files.photo && files.photo[0]) ? files.photo[0].path : null,
        };

        // --- 1. Trigger OCR Verification FIRST (before creating DB record) ---
        // --- 1. Trigger OCR Verification FIRST (before creating DB record) ---
        let aadhaarVerified = false;
        let panVerified = false;
        let extractedAadhaar = {};

        if (documentPaths.aadhaarPath) {
            const result = await verifyDocument(documentPaths.aadhaarPath, 'aadhaar');
            aadhaarVerified = result.isVerified;
            extractedAadhaar = result.extractedData || {};
        }
        if (documentPaths.panPath) {
            const result = await verifyDocument(documentPaths.panPath, 'pan');
            panVerified = result.isVerified;
        }

        // Auto-fill from OCR if not provided
        const finalGender = gender || extractedAadhaar.gender || 'Other';
        const finalAadhaarNumber = aadhaarNumber || extractedAadhaar.aadhaarNumber || 'PENDING';

        // Generate Unique Code: M-{MobileLast4}-A-{AadhaarLast4}
        const mobileLast4 = mobile ? mobile.slice(-4) : '0000';
        const aadhaarLast4 = finalAadhaarNumber !== 'PENDING' ? finalAadhaarNumber.replace(/\s/g, '').slice(-4) : '0000';
        const uniqueCode = `M-${mobileLast4}-A-${aadhaarLast4}`;

        // STRICT VALIDATION: Reject if documents are invalid
        const hasDocuments = documentPaths.aadhaarPath || documentPaths.panPath;
        const allDocumentsValid = (!documentPaths.aadhaarPath || aadhaarVerified) && (!documentPaths.panPath || panVerified);

        // Name Validation (If OCR extracted a name)
        if (extractedAadhaar.name && fullName) {
            const enteredName = fullName.toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
            const documentName = extractedAadhaar.name.toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim();

            const enteredWords = enteredName.split(' ').filter(w => w.length > 2);
            // Check if at least one significant word from entered name exists in the document name
            const hasMatch = enteredWords.some(word => documentName.includes(word));

            if (enteredWords.length > 0 && !hasMatch) {
                console.log(`REJECTING: Name Mismatch. Entered: '${enteredName}', Doc: '${documentName}'`);
                // Cleanup files
                try {
                    if (files.aadhaar && files.aadhaar[0]) fs.unlinkSync(files.aadhaar[0].path);
                    if (files.pan && files.pan[0]) fs.unlinkSync(files.pan[0].path);
                    if (files.photo && files.photo[0]) fs.unlinkSync(files.photo[0].path);
                } catch (e) { }

                return res.status(400).json({
                    success: false,
                    message: 'Name Verification Failed',
                    error: `Name mismatch detected. The name '${fullName}' does not match the name on your Aadhaar card (${extractedAadhaar.name}). Please match the card details exactly.`
                });
            }
        }

        console.log(`Validation Check - Has Documents: ${hasDocuments}, All Valid: ${allDocumentsValid}, Aadhaar: ${aadhaarVerified}, PAN: ${panVerified}`);

        if (hasDocuments && !allDocumentsValid) {
            // Cleanup uploaded files since we're rejecting
            try {
                if (files.aadhaar && files.aadhaar[0] && fs.existsSync(files.aadhaar[0].path)) {
                    fs.unlinkSync(files.aadhaar[0].path);
                }
                if (files.pan && files.pan[0] && fs.existsSync(files.pan[0].path)) {
                    fs.unlinkSync(files.pan[0].path);
                }
                if (files.photo && files.photo[0] && fs.existsSync(files.photo[0].path)) {
                    fs.unlinkSync(files.photo[0].path);
                }
            } catch (cleanupError) {
                console.error('File cleanup error:', cleanupError);
            }

            console.log('REJECTING APPLICATION - Invalid Documents');

            return res.status(400).json({
                success: false,
                message: 'Document Verification Failed',
                error: 'The uploaded documents could not be verified. Please ensure you upload valid Aadhaar and PAN card images.',
                verificationDetails: {
                    aadhaar: aadhaarVerified,
                    pan: panVerified
                }
            });
        }

        // --- 2. Create DB record ONLY if documents pass validation ---
        const application = new Application({
            personalDetails: { fullName, email, mobile, city, state, gender: finalGender, aadhaarNumber: finalAadhaarNumber },
            uniqueCode,
            documents: documentPaths,
            applicationType,
            referralCode,
            status: 'Pending',
            paymentStatus: 'Paid', // MVP: Auto-mark as paid since we simulate payment on frontend
        });

        // Update Verification Status
        if (allDocumentsValid && hasDocuments) {
            application.verificationStatus = 'Passed';
        } else {
            application.verificationStatus = 'Pending';
        }

        // If Free card and verified, mark as ready
        if (application.applicationType === 'Free' && application.verificationStatus === 'Passed') {
            application.status = 'Verified';
        }

        await application.save();

        res.status(201).json({
            success: true,
            data: application,
            message: 'Application submitted successfully',
            verificationDetails: {
                aadhaar: aadhaarVerified,
                pan: panVerified
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get application details
// @route   GET /api/applications/:id
// @access  Public (should be protected or secure link)
const getApplicationById = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (application) {
            res.json(application);
        } else {
            res.status(404).json({ message: 'Application not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Download Card PDF
// @route   GET /api/applications/:id/download
// @access  Public
const downloadCard = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Check logical gates
        if (application.paymentStatus !== 'Paid') {
            return res.status(400).json({ message: 'Payment required to download card.' });
        }
        if (application.verificationStatus === 'Failed') {
            return res.status(400).json({ message: 'Verification failed. Cannot generate card.' });
        }

        // Generate PDF
        const pdfBuffer = await generateCardPDF(application);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=bharat-peak-card-${application._id}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating PDF' });
    }
};

// @desc    Extract OCR data from uploaded file
// @route   POST /api/applications/extract-ocr
// @access  Public
const extractOcrData = async (req, res) => {
    try {
        if (!req.files || !req.files.document || !req.files.document[0]) {
            return res.status(400).json({ message: 'No document uploaded' });
        }

        const filePath = req.files.document[0].path;
        console.log('Processing standalone OCR for:', filePath);

        const result = await verifyDocument(filePath, 'aadhaar'); // Defaulting to aadhaar optimized extraction

        // Cleanup: We don't need to keep this temp file
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (cleanupError) {
            console.error('OCR Temp file cleanup error:', cleanupError);
        }

        res.json({
            success: true,
            extractedData: result.extractedData || {},
            isVerified: result.isVerified
        });

    } catch (error) {
        console.error('OCR Extraction API Error:', error);
        res.status(500).json({ message: 'OCR extraction failed', error: error.message });
    }
};

module.exports = { createApplication, getApplicationById, downloadCard, getAllApplications, extractOcrData };
