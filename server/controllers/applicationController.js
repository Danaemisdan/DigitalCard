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
        const { fullName, email, mobile, city, state, gender, dob, aadhaarNumber, applicationType, referralCode, panNumber, pinCode, employeeName, bankName, ifscCode, accountNumber } = req.body;



        // File paths from Multer - with null safety
        const files = req.files || {};
        const documentPaths = {
            aadhaarPath: (files.aadhaar && files.aadhaar[0]) ? files.aadhaar[0].path : null,
            aadhaarBackPath: (files.aadhaarBack && files.aadhaarBack[0]) ? files.aadhaarBack[0].path : null,
            panPath: (files.pan && files.pan[0]) ? files.pan[0].path : null,
            photoPath: (files.photo && files.photo[0]) ? files.photo[0].path : null,
        };

        // --- VALIDATION: Photo is mandatory for Free cards; For Premier, all optional uploads handled gracefully ---
        // Note: Documents are now optional - OCR runs only when uploaded

        // --- 1. Trigger OCR Verification (only when files are uploaded) ---
        let aadhaarVerified = false;
        let panVerified = false;
        let extractedAadhaar = {};
        let extractedPan = {};

        if (documentPaths.aadhaarPath) {
            try {
                const result = await verifyDocument(documentPaths.aadhaarPath, 'aadhaar');
                aadhaarVerified = result.isVerified;
                extractedAadhaar = result.extractedData || {};
            } catch (ocrErr) {
                console.warn('Aadhaar OCR warning:', ocrErr.message);
            }
        }
        if (documentPaths.panPath) {
            try {
                const result = await verifyDocument(documentPaths.panPath, 'pan');
                panVerified = result.isVerified;
                extractedPan = result.extractedData || {};
            } catch (ocrErr) {
                console.warn('PAN OCR warning:', ocrErr.message);
            }
        }

        // --- OCR Address from Aadhaar Back ---
        let extractedAddress = '';
        if (documentPaths.aadhaarBackPath) {
            try {
                const backResult = await verifyDocument(documentPaths.aadhaarBackPath, 'aadhaar_back');
                extractedAddress = (backResult.extractedData && backResult.extractedData.address) || '';
                console.log('Extracted Address from Aadhaar Back:', extractedAddress);
            } catch (addrErr) {
                console.error('Address extraction failed:', addrErr.message);
            }
        }

        // Auto-fill from OCR if valid (Protect against React FormData stringifying undefined)
        const safeGender = (gender && gender.trim() !== '' && gender !== 'undefined') ? gender.trim() : null;
        const safeDob = (dob && dob.trim() !== '' && dob !== 'undefined') ? dob.trim() : null;

        const finalGender = safeGender || extractedAadhaar.gender || 'Other';
        const finalAadhaarNumber = aadhaarNumber || extractedAadhaar.aadhaarNumber || 'PENDING';
        const finalDOB = safeDob || extractedAadhaar.dob || extractedPan.dob || '';

        // Generate Unique Code
        const mobileLast4 = mobile ? mobile.slice(-4) : '0000';
        const aadhaarLast4 = finalAadhaarNumber !== 'PENDING' ? finalAadhaarNumber.replace(/\s/g, '').slice(-4) : '0000';
        const uniqueCode = `M-${mobileLast4}-A-${aadhaarLast4}`;

        // Name Validation (If OCR extracted a name)
        if (extractedAadhaar.name && fullName) {
            const enteredName = fullName.toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
            const documentName = extractedAadhaar.name.toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim();

            const enteredWords = enteredName.split(' ').filter(w => w.length > 2);
            const hasMatch = enteredWords.some(word => documentName.includes(word));

            if (enteredWords.length > 0 && !hasMatch) {
                console.log(`REJECTING: Name Mismatch. Entered: '${enteredName}', Doc: '${documentName}'`);
                // Cleanup files
                try {
                    fs.unlinkSync(documentPaths.aadhaarPath);
                    fs.unlinkSync(documentPaths.panPath);
                    fs.unlinkSync(documentPaths.photoPath);
                } catch (e) { }

                return res.status(400).json({
                    success: false,
                    message: 'Name Verification Failed',
                    error: `Name mismatch detected. The name '${fullName}' does not match the name on your Aadhaar card (${extractedAadhaar.name}).`
                });
            }
        }

        // --- 2. Create DB record ---
        const application = new Application({
            personalDetails: {
                fullName,
                email,
                mobile,
                city: city || '',
                state: state || '',
                gender: finalGender,
                dob: finalDOB,
                aadhaarNumber: finalAadhaarNumber,
                address: extractedAddress || (dob ? '' : ''), // prefer OCR back address
                pinCode: pinCode || '',
                panNumber: panNumber || extractedPan.panNumber || '',
                employeeName: employeeName || '',
                bankName: bankName || '',
                ifscCode: ifscCode || '',
                accountNumber: accountNumber || '',
            },
            uniqueCode,
            documents: documentPaths,
            applicationType,
            referralCode,
            status: 'Pending',
            paymentStatus: 'Paid', // MVP: Auto-mark as paid since we simulate payment on frontend
        });

        // Update Verification Status
        if (aadhaarVerified && panVerified) {
            application.verificationStatus = 'Passed';
        } else {
            application.verificationStatus = 'Pending';
        }

        // If Free card and verified, mark as ready
        if (application.applicationType === 'Free' && application.verificationStatus === 'Passed') {
            application.status = 'Verified';
        }

        await application.save();

        // --- 3. Pre-Generate PDF immediately (Performance Optimization) ---
        // This makes the "Download" button instant later.
        if (application.applicationType === 'Free' || application.paymentStatus === 'Paid') {
            try {
                console.log('Pre-generating PDF for application:', application._id);
                const pdfBuffer = await generateCardPDF(application);
                application.pdfData = Buffer.from(pdfBuffer);
                await application.save();
                console.log('PDF Pre-generated and saved.');
            } catch (pdfErr) {
                console.error('Background PDF Generation Failed:', pdfErr);
                // Non-blocking: User can still generate it on-demand later via the download endpoint fallback
            }
        }

        res.status(201).json({
            success: true,
            data: application,
            applicationId: application._id, // Explicitly return ID for frontend
            message: 'Application submitted successfully',
            verificationDetails: {
                aadhaar: aadhaarVerified,
                pan: panVerified
            }
        });

    } catch (error) {
        console.error('Create Application Error:', error);
        res.status(500).json({
            message: 'Server Error: ' + error.message,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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

        // Return stored PDF if available (INSTANT DOWNLOAD)
        if (application.pdfData) {
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=bharat-peak-card-${application.uniqueCode || 'card'}.pdf`,
                'Content-Length': application.pdfData.length,
            });
            return res.send(application.pdfData);
        }

        // Fallback: Generate if not found (e.g. old records) - Slower
        const generatedPdf = await generateCardPDF(application);
        const pdfBuffer = Buffer.from(generatedPdf);

        // Save for next time
        application.pdfData = pdfBuffer;
        await application.save();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=bharat-peak-card-${application.uniqueCode || 'card'}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error("PDF Download Error", error);
        res.status(500).json({
            message: 'Error generating PDF: ' + error.message,
            error: error.message
        });
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

// @desc    Delete Application
// @route   DELETE /api/applications/:id
// @access  Admin
const deleteApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        // Cleanup uploaded files
        const docs = application.documents || {};
        ['aadhaarPath', 'aadhaarBackPath', 'panPath', 'photoPath'].forEach(key => {
            if (docs[key]) {
                try { fs.unlinkSync(docs[key]); } catch (e) { /* file may not exist */ }
            }
        });
        await Application.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Application deleted successfully' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update and finalize application after User OCR review
// @route   PUT /api/applications/:id/finalize
// @access  Public
const finalizeApplication = async (req, res) => {
    try {
        const { dob, gender, address, aadhaarNumber, panNumber, pinCode, employeeName, bankName, ifscCode, accountNumber } = req.body;
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Update parsed fields from the frontend review
        if (dob !== undefined) application.personalDetails.dob = dob;
        if (gender !== undefined) application.personalDetails.gender = gender;
        if (address !== undefined) application.personalDetails.address = address;
        if (aadhaarNumber !== undefined) application.personalDetails.aadhaarNumber = aadhaarNumber;
        if (panNumber !== undefined) application.personalDetails.panNumber = panNumber;
        if (pinCode !== undefined) application.personalDetails.pinCode = pinCode;
        if (employeeName !== undefined) application.personalDetails.employeeName = employeeName;
        if (bankName !== undefined) application.personalDetails.bankName = bankName;
        if (ifscCode !== undefined) application.personalDetails.ifscCode = ifscCode;
        if (accountNumber !== undefined) application.personalDetails.accountNumber = accountNumber;

        // Ensure final status is Verified for Free cards once user confirms
        if (application.applicationType === 'Free') {
            application.status = 'Verified';
        }

        // Regenerate the PDF with the pristine user-reviewed data
        console.log('Regenerating PDF for finalized application:', application._id);
        const pdfBuffer = await generateCardPDF(application);
        // Explicitly cast to Node Buffer to prevent Mongoose CastError from Puppeteer's Uint8Array
        application.pdfData = Buffer.from(pdfBuffer);

        await application.save();

        res.json({
            success: true,
            message: 'Application finalized and card generated',
            data: application
        });
    } catch (error) {
        console.error('Finalize Application Error:', error);
        res.status(500).json({ message: 'Server Error during finalization', error: error.message });
    }
};


module.exports = { createApplication, getApplicationById, downloadCard, getAllApplications, extractOcrData, deleteApplication, finalizeApplication };
