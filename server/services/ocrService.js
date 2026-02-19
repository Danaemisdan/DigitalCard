const Tesseract = require('tesseract.js');
const fs = require('fs');
const sharp = require('sharp');

// Preprocess image to improve OCR accuracy
const preprocessImage = async (filePath) => {
    try {
        console.log('Preprocessing image for better OCR...');
        const buffer = await sharp(filePath)
            .resize({ width: 1800, withoutEnlargement: false })
            .grayscale()
            .normalize()
            .gamma(2.0)
            .sharpen()
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

        const imageSource = await preprocessImage(filePath);

        // Run OCR in BOTH English and Telugu to handle regional language Aadhaar cards
        // (e.g. cards that show "ఆధార్" instead of "AADHAAR")
        const [engResult, telResult] = await Promise.all([
            Tesseract.recognize(imageSource, 'eng'),
            type === 'aadhaar'
                ? Tesseract.recognize(imageSource, 'tel').catch(() => ({ data: { text: '' } }))
                : Promise.resolve({ data: { text: '' } }),
        ]);

        const combinedText = `${engResult.data.text} ${telResult.data.text}`;
        console.log(`OCR (eng) for ${type}:`, engResult.data.text.substring(0, 200));

        const cleanText = combinedText.toLowerCase();
        let isVerified = false;
        let extractedData = {};

        if (type === 'aadhaar') {
            // --- 12-digit Aadhaar number ---
            const aadhaarMatch = cleanText.match(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/);
            if (aadhaarMatch) {
                console.log('Extracted Aadhaar Number:', aadhaarMatch[0]);
                extractedData.aadhaarNumber = aadhaarMatch[0].replace(/[\s-]/g, ' ');
            }

            // --- Gender ---
            if (cleanText.match(/female|mahila|స్త్రీ|பெண்|महिला/)) {
                extractedData.gender = 'Female';
            } else if (cleanText.match(/male|purush|పురుషుడు|ஆண்|पुरुष/)) {
                extractedData.gender = 'Male';
            }

            // --- Name extraction ---
            const lines = engResult.data.text.split('\n').map(l => l.trim()).filter(l => l.length > 2);

            // Strategy 1: Line before DOB
            const dobIndex = lines.findIndex(l =>
                l.toLowerCase().includes('dob') ||
                l.toLowerCase().includes('year of birth') ||
                l.match(/\d{2}\/\d{2}\/\d{4}/) ||
                l.match(/DOB:\s*\d/)
            );
            if (dobIndex > 0) {
                let candidate = lines[dobIndex - 1];
                if (candidate.match(/[a-zA-Z]{3,}/)) {
                    extractedData.name = candidate;
                } else if (dobIndex > 1) {
                    candidate = lines[dobIndex - 2];
                    if (candidate.match(/[a-zA-Z]{3,}/)) extractedData.name = candidate;
                }
            }

            // Strategy 2: Line after "GOVERNMENT OF INDIA" header
            if (!extractedData.name) {
                for (let i = 0; i < lines.length; i++) {
                    const lineBlob = lines[i].toLowerCase();
                    if (lineBlob.includes('government of india') || lineBlob.includes('govt of india')) {
                        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                            if (lines[j].match(/^[A-Z][a-zA-Z\s\.]{2,}$/) && !lines[j].match(/\d/)) {
                                extractedData.name = lines[j];
                                break;
                            }
                        }
                    }
                }
            }

            // Cleanup name
            if (extractedData.name) {
                extractedData.name = extractedData.name.replace(/[^a-zA-Z\s\.]/g, '').trim();
                console.log('Extracted Name:', extractedData.name);
            }

            // --- VERIFICATION LOGIC ---
            // A card is valid Aadhaar if:
            //   (a) it has a 12-digit number (the most reliable signal), OR
            //   (b) it contains known English/regional keywords
            const hasAadhaarNumber = !!aadhaarMatch;
            const hasEnglishKeyword =
                cleanText.includes('government of india') ||
                cleanText.includes('aadhaar') ||
                cleanText.includes('unique identification') ||
                cleanText.includes('uid');
            // Telugu: ఆధార్ → Tesseract may render as random chars, check English portion only
            // The 12-digit number is the strongest signal

            if (hasAadhaarNumber || hasEnglishKeyword) {
                isVerified = true;
            } else {
                console.log('REJECTING: No Aadhaar number or keywords found. Text sample:', cleanText.substring(0, 300));
                isVerified = false;
            }

        } else if (type === 'pan') {
            // PAN: 5 letters + 4 digits + 1 letter (e.g. QDVPS4950R)
            const panMatch = cleanText.match(/\b[a-z]{5}\d{4}[a-z]{1}\b/i);
            if (panMatch) {
                console.log('Extracted PAN Number:', panMatch[0].toUpperCase());
                extractedData.panNumber = panMatch[0].toUpperCase();
            }

            if (
                cleanText.includes('income tax') ||
                cleanText.includes('permanent account number') ||
                cleanText.includes('pan') ||
                panMatch
            ) {
                isVerified = true;
            } else {
                console.log('REJECTING: PAN keywords and pattern missing. Text sample:', cleanText.substring(0, 300));
                isVerified = false;
            }
        }

        return { isVerified, extractedData };
    } catch (error) {
        console.error(`OCR Error for ${type}:`, error);
        return { isVerified: false, extractedData: {} };
    }
};

module.exports = { verifyDocument };
