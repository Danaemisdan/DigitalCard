import React, { useState } from 'react';
import { ArrowRight, Shield, Loader2, CheckCircle, Download, User, CreditCard, MapPin, Building2, Camera } from 'lucide-react';
import API_URL from '../config';
import FileUpload from '../components/FileUpload';
import imageCompression from 'browser-image-compression';

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-brand-teal/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-brand-teal" />
        </div>
        <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

const FormField = ({ label, required, children, hint }) => (
    <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
);

const FreeForm = () => {
    const [formData, setFormData] = useState({
        // Personal
        fullName: '',
        email: '',
        mobile: '',
        gender: '',
        dob: '',
        // Address
        address: '',
        city: '',
        pinCode: '',
        state: '',
        // IDs
        aadhaarNumber: '',
        panNumber: '',
        // Employment
        employeeName: '',
        // Bank (optional)
        bankName: '',
        ifscCode: '',
        accountNumber: '',
        // Misc
        referralCode: '',
    });

    const [files, setFiles] = useState({
        aadhaar: null,
        aadhaarBack: null,
        photo: null,
    });

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle');
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
            const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/jpeg' };
            let processedFile = file;
            if (file.type.startsWith('image/')) {
                try {
                    const compressedBlob = await imageCompression(file, options);
                    processedFile = new File([compressedBlob], file.name, { type: compressedBlob.type || file.type });
                } catch (compErr) {
                    console.warn('Compression warning:', compErr);
                }
            }
            setFiles(prev => ({ ...prev, [field]: processedFile }));
        } catch (error) {
            setFiles(prev => ({ ...prev, [field]: file }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Frontend validation
        if (!files.photo) {
            setStatus('error');
            setErrorMessage('Profile photo is mandatory. Please upload your photo.');
            return;
        }
        if (!formData.aadhaarNumber.trim()) {
            setStatus('error');
            setErrorMessage('Aadhaar number is mandatory. Please enter your 12-digit Aadhaar number.');
            return;
        }

        setLoading(true);
        setStatus('idle');
        setErrorMessage('');

        try {
            const data = new FormData();
            // Personal
            data.append('fullName', formData.fullName);
            data.append('email', formData.email);
            data.append('mobile', formData.mobile);
            if (formData.gender) data.append('gender', formData.gender);
            if (formData.dob) data.append('dob', formData.dob);
            // Address
            data.append('address', formData.address);
            data.append('city', formData.city);
            data.append('pinCode', formData.pinCode);
            if (formData.state) data.append('state', formData.state);
            // IDs
            data.append('aadhaarNumber', formData.aadhaarNumber);
            if (formData.panNumber) data.append('panNumber', formData.panNumber);
            // Employment
            data.append('employeeName', formData.employeeName);
            // Bank (optional)
            if (formData.bankName) data.append('bankName', formData.bankName);
            if (formData.ifscCode) data.append('ifscCode', formData.ifscCode);
            if (formData.accountNumber) data.append('accountNumber', formData.accountNumber);
            // Misc
            if (formData.referralCode) data.append('referralCode', formData.referralCode);
            data.append('applicationType', 'Free');

            // Files
            if (files.aadhaar) data.append('aadhaar', files.aadhaar);
            if (files.aadhaarBack) data.append('aadhaarBack', files.aadhaarBack);
            if (files.photo) data.append('photo', files.photo);

            const response = await fetch(`${API_URL}/api/applications`, {
                method: 'POST',
                body: data,
            });

            const result = await response.json();

            if (response.ok) {
                setApplicationId(result.applicationId || result.data._id);
                if (result.data && result.data.personalDetails) {
                    setFormData(prev => ({
                        ...prev,
                        dob: result.data.personalDetails.dob || prev.dob,
                        gender: result.data.personalDetails.gender || prev.gender,
                        address: result.data.personalDetails.address || prev.address,
                        aadhaarNumber: result.data.personalDetails.aadhaarNumber || prev.aadhaarNumber,
                    }));
                }
                setStep(2);
                setStatus('idle');
            } else {
                setStatus('error');
                setErrorMessage(result.error || result.message || 'Submission failed. Please try again.');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMessage('Network error. Please ensure the server is running and try again.');
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
                    aadhaarNumber: formData.aadhaarNumber,
                    panNumber: formData.panNumber,
                    pinCode: formData.pinCode,
                    employeeName: formData.employeeName,
                    bankName: formData.bankName,
                    ifscCode: formData.ifscCode,
                    accountNumber: formData.accountNumber,
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
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        Your free card application has been received. Your documents are being verified.
                    </p>
                    <button
                        onClick={() => window.open(`${API_URL}/api/applications/${applicationId}/download`, '_blank')}
                        className="bg-brand-teal text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-900 transition-all mb-4 shadow-lg flex items-center justify-center mx-auto"
                    >
                        <Download className="mr-2 h-5 w-5" />
                        Download Your Card (PDF)
                    </button>
                    <button onClick={() => window.location.href = '/'} className="text-slate-500 hover:text-slate-900 font-medium mt-2">
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-brand-teal/10 text-brand-teal text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wide">
                    Free Card
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-3">
                    Apply for <span className="text-brand-teal">Free Card</span>
                </h1>
                <p className="text-slate-500 max-w-xl mx-auto">
                    Fill in your details to get your free digital identity card from Bharatpeak Business Services.
                </p>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-brand-teal/5 border border-slate-100 overflow-hidden">

                {/* Step 1: Main Form */}
                {step === 1 && (
                    <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-10 animate-fadeIn">

                        {status === 'error' && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
                                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                {errorMessage}
                            </div>
                        )}

                        {/* === SECTION 1: Personal Information === */}
                        <section>
                            <SectionHeader icon={User} title="Personal Information" subtitle="Enter your personal details as per Aadhaar" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <FormField label="Employee Name" required>
                                        <input
                                            type="text"
                                            name="employeeName"
                                            value={formData.employeeName}
                                            onChange={handleChange}
                                            required
                                            placeholder="As per official records"
                                            className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                        />
                                    </FormField>
                                </div>
                                <div className="md:col-span-2">
                                    <FormField label="Full Name" required>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            required
                                            placeholder="As on Aadhaar card"
                                            className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                        />
                                    </FormField>
                                </div>
                                <FormField label="Mobile Number" required>
                                    <input
                                        type="tel"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        required
                                        placeholder="+91 9876543210"
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                    />
                                </FormField>
                                <FormField label="Email Address">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                    />
                                </FormField>
                                <FormField label="Date of Birth" required>
                                    <input
                                        type="date"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        required
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                    />
                                </FormField>
                                <FormField label="Gender">
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </FormField>
                            </div>
                        </section>

                        {/* === SECTION 2: Address === */}
                        <section>
                            <SectionHeader icon={MapPin} title="Address Details" subtitle="Your current residential address" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <FormField label="Street Address" required>
                                        <textarea
                                            name="address"
                                            rows="2"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                            placeholder="House No., Street, Locality"
                                            className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal resize-none"
                                        />
                                    </FormField>
                                </div>
                                <FormField label="City" required>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                        placeholder="Your city"
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                    />
                                </FormField>
                                <FormField label="Pin Code" required>
                                    <input
                                        type="text"
                                        name="pinCode"
                                        value={formData.pinCode}
                                        onChange={handleChange}
                                        required
                                        maxLength={6}
                                        placeholder="6-digit Pin Code"
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                    />
                                </FormField>
                                <FormField label="State">
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="E.g., Maharashtra"
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                    />
                                </FormField>
                            </div>
                        </section>

                        {/* === SECTION 3: Identity Documents === */}
                        <section>
                            <SectionHeader icon={CreditCard} title="Identity Details" subtitle="Enter your ID numbers manually" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormField label="Aadhaar Number" required hint="12-digit Aadhaar number">
                                    <input
                                        type="text"
                                        name="aadhaarNumber"
                                        value={formData.aadhaarNumber}
                                        onChange={handleChange}
                                        required
                                        maxLength={14}
                                        placeholder="XXXX XXXX XXXX"
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal font-mono tracking-wider"
                                    />
                                </FormField>
                                <FormField label="PAN Number" hint="10-character PAN (optional)">
                                    <input
                                        type="text"
                                        name="panNumber"
                                        value={formData.panNumber}
                                        onChange={handleChange}
                                        maxLength={10}
                                        placeholder="ABCDE1234F"
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal font-mono tracking-wider uppercase"
                                    />
                                </FormField>
                            </div>
                        </section>

                        {/* === SECTION 4: Document Uploads === */}
                        <section>
                            <SectionHeader icon={Camera} title="Document Uploads" subtitle="Upload supporting documents (Aadhaar optional, Photo mandatory)" />
                            <div className="grid md:grid-cols-2 gap-6">
                                <FileUpload
                                    label="Profile Photo"
                                    required
                                    accept="image/*"
                                    onFileSelect={(f) => handleFileSelect('photo', f)}
                                    hint="Compulsory — clear face photo"
                                />
                                <FileUpload
                                    label="Aadhaar Card (Front)"
                                    onFileSelect={(f) => handleFileSelect('aadhaar', f)}
                                    hint="Optional — for faster verification"
                                />
                                <FileUpload
                                    label="Aadhaar Card (Back)"
                                    onFileSelect={(f) => handleFileSelect('aadhaarBack', f)}
                                    hint="Optional"
                                />
                            </div>
                        </section>

                        {/* === SECTION 5: Bank Details (Optional) === */}
                        <section>
                            <SectionHeader icon={Building2} title="Bank Account Details" subtitle="Optional — for payment & verification purposes" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <FormField label="Bank Name">
                                        <input
                                            type="text"
                                            name="bankName"
                                            value={formData.bankName}
                                            onChange={handleChange}
                                            placeholder="E.g., State Bank of India"
                                            className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                        />
                                    </FormField>
                                </div>
                                <FormField label="IFSC Code">
                                    <input
                                        type="text"
                                        name="ifscCode"
                                        value={formData.ifscCode}
                                        onChange={handleChange}
                                        placeholder="E.g., SBIN0001234"
                                        maxLength={11}
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal font-mono uppercase"
                                    />
                                </FormField>
                                <FormField label="Account Number">
                                    <input
                                        type="text"
                                        name="accountNumber"
                                        value={formData.accountNumber}
                                        onChange={handleChange}
                                        placeholder="Your account number"
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal font-mono"
                                    />
                                </FormField>
                            </div>
                        </section>

                        {/* === SECTION 6: Referral === */}
                        <section>
                            <div className="bg-brand-teal/5 rounded-xl p-5 border border-brand-teal/10">
                                <FormField label="Referral Code">
                                    <input
                                        type="text"
                                        name="referralCode"
                                        value={formData.referralCode}
                                        onChange={handleChange}
                                        placeholder="Enter referral code (if any)"
                                        className="bg-white border border-brand-teal/20 text-slate-900 w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all placeholder-slate-400"
                                    />
                                </FormField>
                            </div>
                        </section>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-teal hover:bg-teal-900 text-white font-bold py-4 rounded-xl shadow-xl shadow-brand-teal/20 transition-all flex items-center justify-center hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                            ) : (
                                <>Submit Application <ArrowRight className="ml-2 h-5 w-5" /></>
                            )}
                        </button>
                    </form>
                )}

                {/* Step 2: Review & Confirm */}
                {step === 2 && (
                    <div className="p-8 md:p-10 animate-fadeIn">
                        <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-xl p-8 mb-6">
                            <h3 className="text-xl font-bold text-brand-teal mb-2 flex items-center">
                                <Shield className="w-6 h-6 mr-2" /> Review Your Details
                            </h3>
                            <p className="text-sm text-slate-600 mb-6">
                                Please verify and correct any details before generating your card.
                            </p>

                            {status === 'error' && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 border border-red-100">
                                    {errorMessage}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField label="Aadhaar Number" required>
                                        <input
                                            type="text"
                                            name="aadhaarNumber"
                                            value={formData.aadhaarNumber || ''}
                                            onChange={handleChange}
                                            className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal font-mono"
                                        />
                                    </FormField>
                                    <FormField label="Date of Birth" required>
                                        <input
                                            type="date"
                                            name="dob"
                                            value={formData.dob || ''}
                                            onChange={handleChange}
                                            className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal"
                                        />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField label="PAN Number">
                                        <input
                                            type="text"
                                            name="panNumber"
                                            value={formData.panNumber || ''}
                                            onChange={handleChange}
                                            maxLength={10}
                                            className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal font-mono uppercase"
                                        />
                                    </FormField>
                                    <FormField label="Gender">
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
                                    </FormField>
                                </div>
                                <FormField label="Street Address" required>
                                    <textarea
                                        name="address"
                                        rows="2"
                                        value={formData.address || ''}
                                        onChange={handleChange}
                                        className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-teal focus:ring-brand-teal resize-none"
                                    />
                                </FormField>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleFinalize}
                                    disabled={loading}
                                    className="bg-brand-teal text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-900 transition-all flex items-center justify-center w-full md:w-auto"
                                >
                                    {loading ? (
                                        <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Generating Card...</>
                                    ) : (
                                        <>Confirm & Generate Card <ArrowRight className="ml-2 h-5 w-5" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FreeForm;
