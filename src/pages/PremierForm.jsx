import React, { useState } from 'react';
import { ArrowRight, CreditCard, Shield, CheckCircle, Loader2, AlertCircle, Download } from 'lucide-react';
import API_URL from '../config';
import FileUpload from '../components/FileUpload';

const PremierForm = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobile: '',
        gender: 'Male',
        aadhaarNumber: '',
        city: '',
        state: '',
    });
    const [files, setFiles] = useState({
        aadhaar: null,
        pan: null,
        photo: null
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, processing_payment, submitting, success, error
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
                        gender: result.extractedData.gender || prev.gender
                    }));
                }
            } catch (err) {
                console.error("Auto-extraction failed", err);
            }
        }
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        // Basic validation for Step 1
        if (!formData.fullName || !formData.email || !files.aadhaar || !files.pan || !files.photo) {
            setErrorMessage("Please fill all fields and upload all documents.");
            return;
        }
        setErrorMessage('');
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('processing_payment');
        setErrorMessage('');

        // Simulate Payment Delay
        setTimeout(async () => {
            try {
                // Payment "Success" -> Submit Data
                setStatus('submitting');

                const data = new FormData();
                data.append('fullName', formData.fullName);
                data.append('email', formData.email);
                data.append('mobile', formData.mobile);
                data.append('city', formData.city);
                data.append('state', formData.state);
                data.append('gender', formData.gender);
                data.append('aadhaarNumber', formData.aadhaarNumber || 'PENDING');
                data.append('applicationType', 'Premier');
                // In a real app, this would be handled via webhook, but for MVP we assume paid on submission
                // We'll need to update backend to allow this or just manually approve.
                // For now, let's submit.

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
            }
        }, 2000); // 2 second fake payment
    };

    if (status === 'success') {
        return (
            <div className="max-w-4xl mx-auto py-16 px-4 text-center">
                <div className="bg-white rounded-[2rem] shadow-xl p-12 flex flex-col items-center animate-fadeIn">
                    <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="h-10 w-10 text-brand-orange" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Payment Successful!</h2>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                        Your Premier application has been submitted and payment of ₹500.00 received. Your documents are being verified.
                    </p>
                    <button
                        onClick={() => window.open(`${API_URL}/api/applications/${applicationId}/download`, '_blank')}
                        className="bg-brand-orange text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-600 transition-all mb-4 shadow-lg flex items-center justify-center mx-auto"
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
                    Apply for <span className="text-brand-orange">Premier</span>
                </h1>
                <p className="text-slate-500 max-w-xl mx-auto">
                    Complete the details below to unlock your Premier digital identity.
                </p>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-brand-orange/5 border border-slate-100 overflow-hidden">
                {/* Progress */}
                <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-center">
                    <div className="flex items-center space-x-4">
                        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-brand-orange' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-brand-orange bg-orange-50 text-brand-orange font-bold' : 'border-slate-300'}`}>
                                1
                            </div>
                            <span className="font-medium hidden sm:block">Details</span>
                        </div>
                        <div className="w-16 h-px bg-slate-200"></div>
                        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-brand-orange' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-brand-orange bg-orange-50 text-brand-orange font-bold' : 'border-slate-300'}`}>
                                2
                            </div>
                            <span className="font-medium hidden sm:block">Payment</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-12">
                    {step === 1 ? (
                        <form onSubmit={handleNextStep} className="space-y-8 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange"
                                        placeholder="John Doe"
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
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange"
                                        placeholder="john@example.com"
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
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange"
                                        placeholder="+91 9876543210"
                                    />
                                </div>

                            </div>

                            {/* Extracted Details Display (Read-Only with Edit Option) */}
                            {(formData.aadhaarNumber || formData.gender !== 'Male') && !showManualEntry && (
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6 relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowManualEntry(true)}
                                        className="absolute top-4 right-4 text-xs font-bold text-orange-600 hover:text-orange-800 underline"
                                    >
                                        Edit Details
                                    </button>
                                    <h4 className="text-sm font-bold text-orange-800 mb-2 flex items-center">
                                        <Shield className="w-4 h-4 mr-1" /> Verified Details (From Card)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-orange-600 block text-xs uppercase font-bold">Aadhaar Number</span>
                                            <span className="font-mono font-medium text-slate-700">{formData.aadhaarNumber || 'Processing...'}</span>
                                        </div>
                                        <div>
                                            <span className="text-orange-600 block text-xs uppercase font-bold">Gender</span>
                                            <span className="font-medium text-slate-700">{formData.gender}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Manual Entry Fallback (Shown on Click) */}
                            {showManualEntry && (
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 animate-fadeIn">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-slate-700">Edit Verified Details</h4>
                                        <button type="button" onClick={() => setShowManualEntry(false)} className="text-xs text-slate-500 hover:text-slate-800">Cancel</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
                                            <select
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange bg-white"
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Aadhaar Number</label>
                                            <input
                                                type="text"
                                                name="aadhaarNumber"
                                                value={formData.aadhaarNumber}
                                                onChange={handleChange}
                                                className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange"
                                            />
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
                                    className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange"
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
                                    className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange"
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

                            {errorMessage && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center">
                                    <AlertCircle className="h-5 w-5 mr-2" />
                                    {errorMessage}
                                </div>
                            )}

                            <div>
                                <button type="submit" className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-brand-orange/20 transition-all flex items-center justify-center hover:scale-[1.01]">
                                    Continue to Payment <ArrowRight className="ml-2 h-5 w-5" />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="max-w-md mx-auto text-center animate-fadeIn">
                            {status === 'processing_payment' || status === 'submitting' ? (
                                <div className="py-12">
                                    <Loader2 className="h-16 w-16 text-brand-orange animate-spin mx-auto mb-6" />
                                    <h3 className="text-xl font-bold text-slate-900">
                                        {status === 'processing_payment' ? 'Processing Secure Payment...' : 'Submitting Application...'}
                                    </h3>
                                    <p className="text-slate-500">Please do not close this window.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CreditCard className="h-10 w-10 text-green-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Complete Payment</h3>
                                    <p className="text-slate-500 mb-8">Secure payment gateway</p>

                                    <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200">
                                        <div className="flex justify-between mb-2 text-slate-500 text-sm">
                                            <span>Premier Fee</span>
                                            <span>₹423.73</span>
                                        </div>
                                        <div className="flex justify-between mb-4 text-slate-500 text-sm">
                                            <span>GST (18%)</span>
                                            <span>₹76.27</span>
                                        </div>
                                        <div className="border-t border-slate-200 pt-4 flex justify-between text-slate-900 font-bold text-lg">
                                            <span>Total (1 Year)</span>
                                            <span>₹500.00</span>
                                        </div>
                                    </div>

                                    {status === 'error' && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center text-left">
                                            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                                            {errorMessage}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleSubmit}
                                        className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-brand-orange/20 transition-all mb-4 hover:scale-[1.01]"
                                    >
                                        Pay & Submit application
                                    </button>
                                    <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 text-sm font-medium">
                                        Go Back
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PremierForm;
