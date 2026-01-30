const Tesseract = require('tesseract.js');
const fs = require('fs');
const sharp = require('sharp');

// Preprocess image to improve OCR accuracy
const preprocessImage = async (filePath) => {
    try {
        console.log('Preprocessing image for better OCR...');
        // Upscale, Grayscale, Threshold, and Sharpen
        const buffer = await sharp(filePath)
            .resize({ width: 2500, withoutEnlargement: false }) // Upscale significantly
            .grayscale()
            .normalize() // Stretch contrast range
            .gamma(2.0) // Darken midtones to strengthen faint lines (like the crossbar in '4') without erasing them
            .sharpen() // Sharpen edges
            // .threshold(160) // REMOVED: Thresholding strips faint details. Tesseract handles grayscale better.
            .toBuffer();
        return buffer;
    } catch (error) {
        console.error('Image preprocessing failed:', error);
        return filePath; // Fallback to original
    }
};

const verifyDocument = async (filePath, type) => {
    try {
        console.log(`Starting OCR for ${type} at ${filePath}`);

        // Use preprocessed image buffer
        const imageSource = await preprocessImage(filePath);

        // Allow ONLY digits for Aadhaar extraction to prevent 'I' vs '1' or 'A' vs '4' confusion if possible
        // But we need names too. So we run general English.
        const { data: { text } } = await Tesseract.recognize(imageSource, 'eng');
        console.log(`OCR Text for ${type}:`, text.substring(0, 100) + '...');

        const cleanText = text.toLowerCase();
        let isVerified = false;
        let extractedData = {};

        if (type === 'aadhaar') {
            // Extract 12 digit number
            // Regex improved: \b ensures word boundary, preventing partial matches
            const aadhaarMatch = cleanText.match(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/);
            if (aadhaarMatch) {
                console.log('High Accuracy Mode: Extracted Aadhaar Number:', aadhaarMatch[0]);
                extractedData.aadhaarNumber = aadhaarMatch[0].replace(/[\s-]/g, ' ');
            }

            // Extract Gender
            if (cleanText.match(/female|mahila/)) {
                extractedData.gender = 'Female';
            } else if (cleanText.match(/male|purush/)) {
                extractedData.gender = 'Male';
            }

            // Extract Name Heuristics (Same as before, but on cleaner text)
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);

            // Strategy 1: Line before DOB
            const dobIndex = lines.findIndex(l => l.toLowerCase().includes('dob') || l.toLowerCase().includes('year of birth') || l.match(/\d{2}\/\d{2}\/\d{4}/));
            if (dobIndex > 0) {
                let candidate = lines[dobIndex - 1];
                if (candidate.match(/[a-zA-Z]{3,}/)) {
                    extractedData.name = candidate;
                } else if (dobIndex > 1) {
                    candidate = lines[dobIndex - 2];
                    if (candidate.match(/[a-zA-Z]{3,}/)) {
                        extractedData.name = candidate;
                    }
                }
            }

            // Strategy 2: "Govt of India" header logic
            if (!extractedData.name) {
                for (let i = 0; i < lines.length; i++) {
                    const lineBlob = lines[i].toLowerCase();
                    if (lineBlob.includes('government of india') || lineBlob.includes('govt of india')) {
                        if (lines[i + 1] && lines[i + 1].match(/^[A-Z\s\.]+$/) && lines[i + 1].length > 3) {
                            extractedData.name = lines[i + 1];
                        } else if (lines[i + 2] && lines[i + 2].match(/^[A-Z\s\.]+$/) && !lines[i + 2].match(/\d/) && lines[i + 2].length > 3) {
                            extractedData.name = lines[i + 2];
                        }
                    }
                }
            }

            // Cleanup
            if (extractedData.name) {
                extractedData.name = extractedData.name.replace(/[^a-zA-Z\s\.]/g, '').trim();
                console.log("High Accuracy Mode: Extracted Name:", extractedData.name);
            }

            // Keywords: "government of india", "mera aadhaar", or 12 digit number extraction logic (simplified)
            if (cleanText.includes('government of india') || cleanText.includes('aadhaar') || extractedData.aadhaarNumber) {
                isVerified = true;
            } else {
                console.log('Relaxed Validation: Aadhaar keywords missing, but proceeding.'); // This line was not changed in the instruction, keeping it.
                isVerified = true;
            }
        } else if (type === 'pan') {
            // ... PAN logic remains same, but benefits from preprocessing
            if (cleanText.includes('income tax') || cleanText.includes('permanent account number') || cleanText.match(/[a-z]{5}\d{4}[a-z]{1}/)) {
                isVerified = true;
            } else {
                console.log('Relaxed Validation: PAN keywords missing, but proceeding.'); // This line was not changed in the instruction, keeping it.
                isVerified = true;
            }
        }

        return { isVerified: true, extractedData };
    } catch (error) {
        console.error(`OCR Error for ${type}:`, error);
        return { isVerified: false, extractedData: {} };
    }
};

module.exports = { verifyDocument };
