const express = require('express');
const router = express.Router();
const { createApplication, getApplicationById, downloadCard, getAllApplications, extractOcrData } = require('../controllers/applicationController');
const upload = require('../middleware/uploadMiddleware');

// Fields to upload
const uploadFields = upload.fields([
    { name: 'aadhaar', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
]);

router.route('/')
    .post(uploadFields, createApplication)
    .get(getAllApplications);

// Standalone OCR route
router.post('/extract-ocr', upload.fields([{ name: 'document', maxCount: 1 }]), extractOcrData);

router.get('/:id', getApplicationById);
router.get('/:id/download', downloadCard);

module.exports = router;
