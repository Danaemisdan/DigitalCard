const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');

async function testOCR(imagePath) {
    try {
        console.log('Testing raw OCR on:', imagePath);

        // Match the exact preprocess settings currently in ocrService.js
        const buffer = await sharp(imagePath)
            .resize({ width: 1800, withoutEnlargement: false })
            .grayscale()
            .normalize()
            .gamma(2.0)
            .sharpen()
            .toBuffer();

        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');

        console.log('\n--- RAW TESSERACT OUTPUT ---');
        console.log(text);
        console.log('----------------------------\n');

        let cleanText = text.toLowerCase();
        let extractedData = {};

        // TEST DOB MATCH
        let dobMatch = cleanText.match(/(?:dob|birth|yob|year|date)[^\d]*(\d{2}\s*[/\\-]\s*\d{2}\s*[/\\-]\s*\d{4}|\d{4})/i);
        if (!dobMatch) {
            dobMatch = cleanText.match(/\b(\d{2}\s*[/\\-]\s*\d{2}\s*[/\\-]\s*\d{4})\b/);
        }
        if (!dobMatch) {
            const yearMatch = cleanText.match(/\b(19[2-9]\d|200\d|2010)\b/);
            if (yearMatch) dobMatch = [yearMatch[0], yearMatch[0]];
        }

        if (dobMatch) {
            console.log('Extracted DOB:', dobMatch[1].replace(/\s+/g, ''));
        } else {
            console.log('DOB EXTRACTION FAILED');
        }

        // TEST ADDRESS MATCH
        const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 3);
        let addressLines = [];
        let capturing = false;

        const cleanLines = lines.map(l => l.replace(/[^\w\s,\-\/\.\:\&]/g, ' ').replace(/\s+/g, ' ').trim())
            .filter(l => l.length > 3);

        for (const line of cleanLines) {
            const lower = line.toLowerCase();
            const prefixMatch = lower.match(/\b(w\/o|s\/o|d\/o|c\/o|w\/0|s\/0|d\/0|c\/0|s\/c|s\/cr)\b/);

            if (lower.includes('address') || lower.includes('addres') || prefixMatch) {
                capturing = true;
                let cleaned = line.replace(/^.*address\s*:?\s*/i, '').trim();
                if (prefixMatch) {
                    const idx = lower.indexOf(prefixMatch[0]);
                    cleaned = line.substring(idx).trim();
                }
                if (cleaned.length > 2) addressLines.push(cleaned);
                continue;
            }
            if (capturing) {
                addressLines.push(line);
                if (/\d{6}/.test(line)) break;
            }
        }

        if (addressLines.length === 0) {
            let fallbackAddr = cleanLines.join(', ');
            if (fallbackAddr.indexOf(',') > 0 && fallbackAddr.split(',')[0].length < 10) {
                fallbackAddr = fallbackAddr.substring(fallbackAddr.indexOf(',') + 1).trim();
            }
            addressLines.push(fallbackAddr);
        }

        console.log('Extracted Address:', addressLines.join(', ').replace(/, \s*,/g, ',').replace(/\s+/g, ' ').trim());

    } catch (e) {
        console.error('OCR Error:', e);
    }
}

// Since I don't have the user's uploaded image on disk, I will create a dummy test script in the server directory
// that the user can theoretically run, but more importantly, I can use it to test against my own dummy image.
