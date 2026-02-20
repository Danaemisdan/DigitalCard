const Tesseract = require('tesseract.js');
const path = require('path');
const sharp = require('sharp');

async function run() {
    const img = path.join(__dirname, 'uploads/aadhaar-1769632708416.JPG');

    // Preprocess like in ocrService
    const buffer = await sharp(img)
        .resize({ width: 1800, withoutEnlargement: false })
        .grayscale()
        .normalize()
        .gamma(2.0)
        .sharpen()
        .toBuffer();

    const res = await Tesseract.recognize(buffer, 'eng');
    console.log("--- FULL RAW TEXT ---");
    console.log(res.data.text);
    console.log("-----------------------");
}
run();
