import React, { useState } from 'react';
import { ArrowRight, Gift, Shield, Loader2, CheckCircle, Download } from 'lucide-react';
import API_URL from '../config';
import FileUpload from '../components/FileUpload';

const FreeForm = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobile: '',
        gender: 'Male',
        aadhaarNumber: '',
        city: '',
        state: '',
        referralCode: '',
    });
    const [files, setFiles] = useState({
        aadhaar: null,
        pan: null,
        photo: null
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const [applicationId, setApplicationId] = useState(null);
    const [showManualEntry, setShowManualEntry] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileSelect = async (field, file) => {
        setFiles(prev => ({ ...prev, [field]: file }));

        // Interactive OCR Extraction for Aadhaar
        if (field === 'aadhaar' && file) {
            try {
                // Show some scanning indicator if possible, or just background do it
                const ocrData = new FormData();
                ocrData.append('document', file);

                const res = await fetch(`${API_URL}/api/applications/extract-ocr`, {
                    method: 'POST',
                    body: ocrData
                });
                const result = await res.json();

                if (result.success && result.extractedData) {
                    setFormData(prev => ({
                        ...prev,
                        aadhaarNumber: result.extractedData.aadhaarNumber || prev.aadhaarNumber,
                        gender: result.extractedData.gender || prev.gender,
                        // If we extract name later, we can add it here:
                        // fullName: result.extractedData.name || prev.fullName 
                    }));
                }
            } catch (err) {
                console.error("Auto-extraction failed", err);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            data.append('gender', formData.gender);
            data.append('aadhaarNumber', formData.aadhaarNumber || 'PENDING'); // Allow manual override
            data.append('applicationType', 'Free');

            if (files.aadhaar) data.append('aadhaar', files.aadhaar);
            if (files.pan) data.append('pan', files.pan);
            if (files.photo) data.append('photo', files.photo);

            const response = await fetch(`${API_URL}/api/applications`, {
                method: 'POST',
                body: data,
            });

            const result = await response.json();

            if (response.ok) {
                setStatus('success');
                setApplicationId(result.data._id);
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

                    {/* Extracted Details Display (Read-Only) */}
                    {(formData.aadhaarNumber || formData.gender !== 'Male') && (
                        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6">
                            <h4 className="text-sm font-bold text-teal-800 mb-2 flex items-center">
                                <Shield className="w-4 h-4 mr-1" /> Verified Details (From Card)
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-teal-600 block text-xs uppercase font-bold">Aadhaar Number</span>
                                    <span className="font-mono font-medium text-slate-700">{formData.aadhaarNumber || 'Processing...'}</span>
                                </div>
                                <div>
                                    <span className="text-teal-600 block text-xs uppercase font-bold">Gender</span>
                                    <span className="font-medium text-slate-700">{formData.gender}</span>
                                </div>
                            </div>
                        </div>
                    )}

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
                        <label className="block text-sm font-bold text-slate-700 mb-2">State</label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            required
                            className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                        />
                    </div>


                    <div className="bg-brand-cream rounded-xl p-6 border border-brand-teal/10">
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

                    <div className="border-t border-slate-100 pt-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                            <Shield className="h-5 w-5 text-brand-teal mr-2" />
                            Required Documents
                        </h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            <FileUpload label="Aadhaar Card" required onFileSelect={(f) => handleFileSelect('aadhaar', f)} />
                            <FileUpload label="PAN Card" required onFileSelect={(f) => handleFileSelect('pan', f)} />
                            <FileUpload label="Photo" required accept="image/*" onFileSelect={(f) => handleFileSelect('photo', f)} />
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
                </form>
            </div>
        </div>
    );
};

export default FreeForm;
