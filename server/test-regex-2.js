const ocrTextBack = `an. 5: sromaeron -, s/c es 2er as, 0, so s/or nataraien, s-27, sre., by, rene, ardhra radesh - 500049 0, 55 sb - 500043 re`;
const ocrTextFront = `DANNY K DOB: N/A Gender: Male ID: M-1241-A-0000`; // Assuming standard format that failed above

let extractedData = {};
let cleanText = ocrTextFront.toLowerCase();

// ... existing logic ...

// ADDRESS
let lines = ocrTextBack.split('\\n').map(l => l.trim()).filter(l => l.length > 3);
let addressLines = [];
let capturing = false;

const cleanLines = lines.map(l => l.replace(/[^\w\s,\\-\\/\.\\:\&]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(l => l.length > 3);

for (const line of cleanLines) {
    const lower = line.toLowerCase();

    // NEW PREFIX MATCH: Added 's/c' and 's/cr' as we see 's/c' in the garbled text
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
        // relaxed pincode stop to avoid stopping too early
        if (/\d{6}/.test(line)) break;
    }
}

// SUPER FALLBACK: If we still didn't capture from prefixes, just clean it aggressively
if (addressLines.length === 0) {
    // We look for the first line that looks like it has state names or pincodes or S/O
    let fallbackAddr = cleanLines.join(', ');
    // slice off leading gibberish before first comma if it's super short
    if (fallbackAddr.indexOf(',') > 0 && fallbackAddr.split(',')[0].length < 10) {
        fallbackAddr = fallbackAddr.substring(fallbackAddr.indexOf(',') + 1).trim();
    }
    addressLines.push(fallbackAddr);
}

if (addressLines.length > 0) {
    let finalAddr = addressLines.join(', ').replace(/, \s*,/g, ',').replace(/\s+/g, ' ').trim();
    console.log('Extracted Address:', finalAddr);
}
