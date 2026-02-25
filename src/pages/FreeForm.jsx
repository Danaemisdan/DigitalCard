import React, { useState } from 'react';
import { ArrowRight, Gift, Shield, Loader2, CheckCircle, Download } from 'lucide-react';
import API_URL from '../config';
import FileUpload from '../components/FileUpload';
import imageCompression from 'browser-image-compression';

const FreeForm = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobile: '',
        gender: '',
        aadhaarNumber: '',
        city: '',
        state: '',
        referralCode: '',
        dob: '',
        address: '',
    });
    const [files, setFiles] = useState({
        aadhaar: null,
        aadhaarBack: null,
        pan: null,
        photo: null
    });
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const [applicationId, setApplicationId] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };



    const handleFileSelect = async (field, file) => {
        if (!file) {
            setFiles(prev => ({ ...prev, [field]: null }));
            return;
        }

        try {
            const options = {
                maxSizeMB: 0.8, // Compress to ~800KB
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: 'image/jpeg'
            };

            // Only compress images, pass PDFs as is
            let processedFile = file;
            if (file.type.startsWith('image/')) {
                console.log(`Compressing ${field}... Original: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                try {
                    const compressedBlob = await imageCompression(file, options);
                    // Reconstruction to ensure filename/type are preserved exactly as Multer expects
                    processedFile = new File([compressedBlob], file.name, { type: compressedBlob.type || file.type });
                    console.log(`Compressed ${field}: ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);
                } catch (compErr) {
                    console.error("Compression warning:", compErr);
                    // Fallback to original
                }
            }

            setFiles(prev => ({ ...prev, [field]: processedFile }));

            // Interactive OCR Extraction for Aadhaar
            if (field === 'aadhaar' && processedFile) {
                try {
                    const ocrData = new FormData();
                    ocrData.append('document', processedFile);

                    const res = await fetch(`${API_URL}/api/applications/extract-ocr`, {
                        method: 'POST',
                        body: ocrData
                    });
                    const result = await res.json();

                    if (result.success && result.extractedData) {
                        setFormData(prev => ({
                            ...prev,
                            aadhaarNumber: prev.aadhaarNumber || result.extractedData.aadhaarNumber || '',
                            gender: prev.gender || result.extractedData.gender || '',
                            dob: prev.dob || result.extractedData.dob || '',
                        }));
                    }
                } catch (err) {
                    console.error("Auto-extraction failed", err);
                }
            }
        } catch (error) {
            console.error("Compression failed", error);
            // Fallback to original file
            setFiles(prev => ({ ...prev, [field]: file }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- Added Frontend Validation ---
        if (!files.aadhaar || !files.pan || !files.photo) {
            setStatus('error');
            setErrorMessage('All documents (Aadhaar, PAN, and Photo) are mandatory. Please upload them before submitting.');
            return;
        }

        setLoading(true);
        setStatus('idle');
        setErrorMessage('');

        try {
            const data = new FormData();
            data.append('fullName', formData.fullName);
            data.append('email', formData.email);
            data.append('mobile', formData.mobile);
            data.append('city', formData.city);
            data.append('state', formData.state);
            data.append('referralCode', formData.referralCode);
            if (formData.gender) data.append('gender', formData.gender);
            if (formData.dob) data.append('dob', formData.dob);
            if (formData.address) data.append('address', formData.address);
            data.append('aadhaarNumber', formData.aadhaarNumber || 'PENDING'); // Allow manual override
            data.append('applicationType', 'Free');

            if (files.aadhaar) data.append('aadhaar', files.aadhaar);
            if (files.aadhaarBack) data.append('aadhaarBack', files.aadhaarBack);
            if (files.pan) data.append('pan', files.pan);
            if (files.photo) data.append('photo', files.photo);

            const response = await fetch(`${API_URL}/api/applications`, {
                method: 'POST',
                body: data,
            });

            const result = await response.json();

            if (response.ok) {
                setApplicationId(result.applicationId || result.data._id);
                // Pre-fill form with extracted OCR data for the review step
                if (result.data && result.data.personalDetails) {
                    setFormData(prev => ({
                        ...prev,
                        dob: result.data.personalDetails.dob || '',
                        gender: result.data.personalDetails.gender || '',
                        address: result.data.personalDetails.address || '',
                        aadhaarNumber: result.data.personalDetails.aadhaarNumber || prev.aadhaarNumber
                    }));
                }
                setStep(2);
                setStatus('idle');
            } else {
                setStatus('error');
                setErrorMessage(result.error || result.message || 'Submission failed');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMessage('Network error. Please ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');
        setErrorMessage('');

        try {
            const response = await fetch(`${API_URL}/api/applications/${applicationId}/finalize`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dob: formData.dob,
                    gender: formData.gender,
                    address: formData.address,
                    aadhaarNumber: formData.aadhaarNumber
                })
            });

            const result = await response.json();

            if (response.ok) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(result.error || result.message || 'Finalization failed');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMessage('Network error during finalization.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="max-w-4xl mx-auto py-16 px-4 text-center">
                <div className="bg-white rounded-[2rem] shadow-xl p-12 flex flex-col items-center animate-fadeIn">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Submitted!</h2>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                        Your free card application has been received and your documents are being verified.
                    </p>
                    <button
                        onClick={() => window.open(`${API_URL}/api/applications/${applicationId}/download`, '_blank')}
                        className="bg-brand-teal text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-900 transition-all mb-4 shadow-lg flex items-center justify-center mx-auto"
                    >
                        <Download className="mr-2 h-5 w-5" />
                        Download Your Card (PDF)
                    </button>
                    <button onClick={() => window.location.href = '/'} className="text-slate-500 hover:text-slate-900 font-medium">
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">

                <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
                    Apply for <span className="text-brand-teal">Free Card</span>
                </h1>
                <p className="text-slate-500 max-w-xl mx-auto">
                    Join thousands of others. No credit card required.
                </p>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-brand-teal/5 border border-slate-100 overflow-hidden p-8 md:p-12">
                <form onSubmit={handleSubmit} className="space-y-8 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Mobile</label>
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                required
                                className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                            />
                        </div>

                    </div>

                    {/* Step 2: OCR Review / Finalize */}
                    {step === 2 && (
                        <div className="bg-brand-cream border border-brand-teal/20 rounded-xl p-8 mb-6 animate-fadeIn">
                            <h3 className="text-xl font-bold text-brand-teal mb-4 flex items-center">
                                <Shield className="w-6 h-6 mr-2" /> Verify Extracted Details
                            </h3>
                            <p className="text-sm text-slate-600 mb-6">
                                We've scanned your documents. Due to glare or surface dirt, the AI might miss some details.
                                Please review and correct any incorrect or missing information below before generating your card.
                            </p>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Aadhaar Number</label>
                                        <input
                                            type="text"
                                            name="aadhaarNumber"
                                            value={formData.aadhaarNumber || ''}
                                            onChange={handleChange}
                                            className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Date of Birth</label>
                                        <input
                                            type="text"
                                            name="dob"
                                            value={formData.dob || ''}
                                            onChange={handleChange}
                                            placeholder="DD/MM/YYYY"
                                            className="glass-input w-full px-4 py-3 rounded-xl border-orange-300 focus:border-brand-teal focus:ring-brand-teal bg-orange-50"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.gender || ''}
                                            onChange={handleChange}
                                            className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
                                    <textarea
                                        name="address"
                                        rows="3"
                                        value={formData.address || ''}
                                        onChange={handleChange}
                                        className="glass-input w-full px-4 py-3 rounded-xl border-orange-300 focus:border-brand-teal focus:ring-brand-teal bg-orange-50 resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleFinalize}
                                    disabled={loading}
                                    className="bg-brand-teal text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-900 transition-all flex items-center justify-center w-full md:w-auto"
                                >
                                    {loading ? (
                                        <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Generating Final Card...</>
                                    ) : (
                                        <>Confirm & Generate Card <ArrowRight className="ml-2 h-5 w-5" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Document Upload */}
                    {step === 1 && (
                        <>

                            {/* Location Details */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                    className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-brand-teal mb-2">State *</label>
                                <input
                                    type="text"
                                    name="state"
                                    required
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="E.g., Maharashtra"
                                    className="bg-white border border-brand-teal/20 text-slate-900 w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all placeholder-slate-400"
                                />
                            </div>


                            <div className="bg-brand-cream rounded-xl p-6 border border-brand-teal/10 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-brand-teal mb-2">Referral Code (Mandatory)</label>
                                    <input
                                        type="text"
                                        name="referralCode"
                                        value={formData.referralCode}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter code"
                                        className="bg-white border border-brand-teal/20 text-slate-900 w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all placeholder-slate-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-brand-teal mb-2">Aadhaar Number (Optional)</label>
                                    <input
                                        type="text"
                                        name="aadhaarNumber"
                                        value={formData.aadhaarNumber || ''}
                                        onChange={handleChange}
                                        placeholder="Enter Aadhaar Number if manually known"
                                        className="bg-white border border-brand-teal/20 text-slate-900 w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all placeholder-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                                    <Shield className="h-5 w-5 text-brand-teal mr-2" />
                                    Required Documents
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FileUpload label="Aadhaar Card (Front)" required onFileSelect={(f) => handleFileSelect('aadhaar', f)} />
                                    <FileUpload label="Aadhaar Card (Back)" required onFileSelect={(f) => handleFileSelect('aadhaarBack', f)} />
                                    <FileUpload label="PAN Card" required onFileSelect={(f) => handleFileSelect('pan', f)} />
                                    <FileUpload label="Photo" required accept="image/*,.pdf" onFileSelect={(f) => handleFileSelect('photo', f)} />
                                </div>
                            </div>

                            {status === 'error' && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium">
                                    {errorMessage}
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-brand-orange/20 transition-all flex items-center justify-center hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                                    ) : (
                                        <>Submit Application <ArrowRight className="ml-2 h-5 w-5" /></>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default FreeForm;
