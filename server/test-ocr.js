const { verifyDocument } = require('./services/ocrService');
const path = require('path');

async function test() {
    const file = path.join(__dirname, 'uploads/aadhaar-1769632708416.JPG');
    console.log('Testing OCR on:', file);
    const result = await verifyDocument(file, 'aadhaar');
    console.log('Final Result:', JSON.stringify(result, null, 2));
}
test();
