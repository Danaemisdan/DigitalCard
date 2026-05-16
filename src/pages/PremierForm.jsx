import React, { useState } from 'react';
import { ArrowRight, CreditCard, Shield, CheckCircle, Loader2, AlertCircle, Download, User, MapPin, Building2, Camera } from 'lucide-react';
import API_URL from '../config';
import FileUpload from '../components/FileUpload';
import imageCompression from 'browser-image-compression';

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-brand-orange" />
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

const PremierForm = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobile: '',
        gender: '',
        dob: '',
        address: '',
        city: '',
        pinCode: '',
        state: '',
        aadhaarNumber: '',
        panNumber: '',
        employeeName: '',
        bankName: '',
        ifscCode: '',
        accountNumber: '',
        referralCode: '',
    });
    const [files, setFiles] = useState({
        aadhaar: null,
        aadhaarBack: null,
        pan: null,
        photo: null,
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [applicationId, setApplicationId] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileSelect = async (field, file) => {
        if (!file) { setFiles(prev => ({ ...prev, [field]: null })); return; }
        try {
            const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/jpeg' };
            let processedFile = file;
            if (file.type.startsWith('image/')) {
                try {
                    const blob = await imageCompression(file, options);
                    processedFile = new File([blob], file.name, { type: blob.type || file.type });
                } catch (e) { console.warn(e); }
            }
            setFiles(prev => ({ ...prev, [field]: processedFile }));
        } catch (e) { setFiles(prev => ({ ...prev, [field]: file })); }
    };

    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        if (!formData.aadhaarNumber.trim()) {
            setErrorMessage('Aadhaar number is mandatory.');
            return;
        }
        setLoading(true); setStatus('idle'); setErrorMessage('');
        try {
            const data = new FormData();
            data.append('fullName', formData.fullName);
            data.append('email', formData.email);
            data.append('mobile', formData.mobile);
            if (formData.gender) data.append('gender', formData.gender);
            if (formData.dob) data.append('dob', formData.dob);
            data.append('address', formData.address);
            data.append('city', formData.city);
            data.append('pinCode', formData.pinCode);
            if (formData.state) data.append('state', formData.state);
            data.append('aadhaarNumber', formData.aadhaarNumber);
            if (formData.panNumber) data.append('panNumber', formData.panNumber);
            data.append('employeeName', formData.employeeName);
            if (formData.bankName) data.append('bankName', formData.bankName);
            if (formData.ifscCode) data.append('ifscCode', formData.ifscCode);
            if (formData.accountNumber) data.append('accountNumber', formData.accountNumber);
            if (formData.referralCode) data.append('referralCode', formData.referralCode);
            data.append('applicationType', 'Premier');
            if (files.aadhaar) data.append('aadhaar', files.aadhaar);
            if (files.aadhaarBack) data.append('aadhaarBack', files.aadhaarBack);
            if (files.pan) data.append('pan', files.pan);
            if (files.photo) data.append('photo', files.photo);

            const response = await fetch(`${API_URL}/api/applications`, { method: 'POST', body: data });
            const result = await response.json();
            if (response.ok) {
                setApplicationId(result.applicationId || result.data._id);
                if (result.data?.personalDetails) {
                    setFormData(prev => ({
                        ...prev,
                        dob: result.data.personalDetails.dob || prev.dob,
                        gender: result.data.personalDetails.gender || prev.gender,
                        address: result.data.personalDetails.address || prev.address,
                        aadhaarNumber: result.data.personalDetails.aadhaarNumber || prev.aadhaarNumber,
                    }));
                }
                setStep(2);
            } else {
                setStatus('error');
                setErrorMessage(result.error || result.message || 'Submission failed');
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage('Network error during upload.');
        } finally { setLoading(false); }
    };

    const handleFinalize = async () => {
        setLoading(true); setStatus('idle'); setErrorMessage('');
        try {
            const response = await fetch(`${API_URL}/api/applications/${applicationId}/finalize`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dob: formData.dob, gender: formData.gender, address: formData.address,
                    aadhaarNumber: formData.aadhaarNumber, panNumber: formData.panNumber,
                    pinCode: formData.pinCode, employeeName: formData.employeeName,
                    bankName: formData.bankName, ifscCode: formData.ifscCode, accountNumber: formData.accountNumber,
                })
            });
            const result = await response.json();
            if (response.ok) { setStep(3); }
            else { setStatus('error'); setErrorMessage(result.error || result.message || 'Finalization failed'); }
        } catch (e) { setStatus('error'); setErrorMessage('Network error during finalization.'); }
        finally { setLoading(false); }
    };

    const handlePayment = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            // 1. Create a Razorpay order on the server
            const orderRes = await fetch(`${API_URL}/api/payments/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId }),
            });
            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create payment order');

            // 2. Load Razorpay script if not already loaded
            if (!window.Razorpay) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = resolve;
                    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
                    document.body.appendChild(script);
                });
            }

            // 3. Open Razorpay Checkout
            const rzp = new window.Razorpay({
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                order_id: orderData.orderId,
                name: 'Bharatpeak Business Services',
                description: 'Premier Digital Identity Card (1 Year)',
                image: `${window.location.origin}/logo.png`,
                prefill: {
                    name: orderData.applicantName,
                    email: orderData.applicantEmail,
                    contact: orderData.applicantPhone,
                },
                theme: { color: '#d97706' },
                handler: async (response) => {
                    // 4. Payment done — verify server-side
                    setStatus('processing_payment');
                    try {
                        const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                applicationId,
                            }),
                        });
                        const verifyData = await verifyRes.json();
                        if (!verifyRes.ok || !verifyData.success) {
                            throw new Error(verifyData.error || 'Payment verification failed');
                        }
                        setStatus('success');
                    } catch (verifyErr) {
                        setStatus('idle');
                        setErrorMessage(verifyErr.message || 'Payment verification failed. Contact support.');
                    } finally {
                        setLoading(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        setStatus('idle');
                    },
                },
            });
            rzp.open();
        } catch (error) {
            setLoading(false);
            setErrorMessage(error.message || 'Payment initiation failed. Please try again.');
        }
    };

    if (status === 'success') {
        return (
            <div className="max-w-4xl mx-auto py-16 px-4 text-center">
                <div className="bg-white rounded-[2rem] shadow-xl p-12 flex flex-col items-center animate-fadeIn">
                    <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="h-10 w-10 text-brand-orange" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Payment Successful!</h2>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        Your Premier application has been submitted and payment of ₹500.00 received.
                    </p>
                    <button
                        onClick={() => window.open(`${API_URL}/api/applications/${applicationId}/download`, '_blank')}
                        className="bg-brand-orange text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-600 transition-all mb-4 shadow-lg flex items-center justify-center mx-auto"
                    >
                        <Download className="mr-2 h-5 w-5" /> Download Your Card (PDF)
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
                <div className="inline-flex items-center gap-2 bg-brand-orange/10 text-brand-orange text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wide">
                    ★ Premier Card
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-3">
                    Apply for <span className="text-brand-orange">Premier Card</span>
                </h1>
                <p className="text-slate-500 max-w-xl mx-auto">
                    Complete the details below to unlock your premium digital identity from Bharatpeak Business Services.
                </p>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-brand-orange/5 border border-slate-100 overflow-hidden">
                {/* Progress Bar */}
                <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center justify-center">
                    <div className="flex items-center space-x-2 md:space-x-4">
                        {[['1', 'Details'], ['2', 'Review'], ['3', 'Payment']].map(([num, label], i) => (
                            <React.Fragment key={num}>
                                {i > 0 && <div className="w-8 md:w-16 h-px bg-slate-200" />}
                                <div className={`flex items-center space-x-2 ${step >= i + 1 ? 'text-brand-orange' : 'text-slate-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold ${step >= i + 1 ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-slate-300'}`}>{num}</div>
                                    <span className="font-medium hidden sm:block">{label}</span>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="p-8 md:p-10">
                    {errorMessage && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100 text-sm">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />{errorMessage}
                        </div>
                    )}

                    {/* ===== STEP 1: Full Form ===== */}
                    {step === 1 && (
                        <form onSubmit={handleInitialSubmit} className="space-y-10 animate-fadeIn">

                            {/* Personal */}
                            <section>
                                <SectionHeader icon={User} title="Personal Information" subtitle="Enter details as per your Aadhaar card" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <FormField label="Employee Name" required>
                                            <input type="text" name="employeeName" value={formData.employeeName} onChange={handleChange} required placeholder="As per official records" className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange" />
                                        </FormField>
                                    </div>
                                    <div className="md:col-span-2">
                                        <FormField label="Full Name" required>
                                            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="As on Aadhaar card" className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange" />
                                        </FormField>
                                    </div>
                                    <FormField label="Mobile Number" required>
                                        <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required placeholder="+91 9876543210" className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange" />
                                    </FormField>
                                    <FormField label="Email Address">
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange" />
                                    </FormField>
                                    <FormField label="Date of Birth" required>
                                        <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange" />
                                    </FormField>
                                    <FormField label="Gender">
                                        <select name="gender" value={formData.gender} onChange={handleChange} className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange">
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </FormField>
                                </div>
                            </section>

                            {/* Address */}
                            <section>
                                <SectionHeader icon={MapPin} title="Address Details" subtitle="Your current residential address" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <FormField label="Street Address" required>
                                            <textarea name="address" rows="2" value={formData.address} onChange={handleChange} required placeholder="House No., Street, Locality" className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange resize-none" />
                                        </FormField>
                                    </div>
                                    <FormField label="City" required>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="Your city" className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange" />
                                    </FormField>
                                    <FormField label="Pin Code" required>
                                        <input type="text" name="pinCode" value={formData.pinCode} onChange={handleChange} required maxLength={6} placeholder="6-digit Pin Code" className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange" />
                                    </FormField>
                                    <FormField label="State">
                                        <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="E.g., Maharashtra" className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange" />
                                    </FormField>
                                </div>
                            </section>

                            {/* IDs */}
                            <section>
                                <SectionHeader icon={CreditCard} title="Identity Details" subtitle="Enter your ID numbers" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Aadhaar Number" required hint="12-digit Aadhaar number">
                                        <input type="text" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} required maxLength={14} placeholder="XXXX XXXX XXXX" className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange font-mono tracking-wider" />
                                    </FormField>
                                    <FormField label="PAN Number" hint="Optional — 10-character PAN">
                                        <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} maxLength={10} placeholder="ABCDE1234F" className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange font-mono uppercase" />
                                    </FormField>
                                </div>
                            </section>

                            {/* Documents */}
                            <section>
                                <SectionHeader icon={Camera} title="Document Uploads" subtitle="All uploads are optional for Premier card" />
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FileUpload label="Profile Photo" accept="image/*" onFileSelect={(f) => handleFileSelect('photo', f)} hint="Optional — clear face photo" />
                                    <FileUpload label="Aadhaar Card (Front)" onFileSelect={(f) => handleFileSelect('aadhaar', f)} hint="Optional — for auto-fill" />
                                    <FileUpload label="Aadhaar Card (Back)" onFileSelect={(f) => handleFileSelect('aadhaarBack', f)} hint="Optional" />
                                    <FileUpload label="PAN Card" onFileSelect={(f) => handleFileSelect('pan', f)} hint="Optional" />
                                </div>
                            </section>

                            {/* Bank */}
                            <section>
                                <SectionHeader icon={Building2} title="Bank Account Details" subtitle="Optional — for payment & verification" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <FormField label="Bank Name">
                                            <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="E.g., State Bank of India" className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange" />
                                        </FormField>
                                    </div>
                                    <FormField label="IFSC Code">
                                        <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} placeholder="E.g., SBIN0001234" maxLength={11} className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange font-mono uppercase" />
                                    </FormField>
                                    <FormField label="Account Number">
                                        <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="Your account number" className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange font-mono" />
                                    </FormField>
                                </div>
                            </section>

                            <button type="submit" disabled={loading} className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-brand-orange/20 transition-all flex items-center justify-center hover:scale-[1.01] disabled:opacity-50">
                                {loading ? <><Loader2 className="animate-spin mr-2" /> Processing...</> : <>Upload & Review Details <ArrowRight className="ml-2 h-5 w-5" /></>}
                            </button>
                        </form>
                    )}

                    {/* ===== STEP 2: Review ===== */}
                    {step === 2 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 animate-fadeIn">
                            <h3 className="text-xl font-bold text-brand-orange mb-2 flex items-center">
                                <Shield className="w-6 h-6 mr-2" /> Verify Your Details
                            </h3>
                            <p className="text-sm text-slate-600 mb-6">Review and correct any details before proceeding to payment.</p>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField label="Aadhaar Number" required>
                                        <input type="text" name="aadhaarNumber" value={formData.aadhaarNumber || ''} onChange={handleChange} className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange font-mono" />
                                    </FormField>
                                    <FormField label="Date of Birth">
                                        <input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange" />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField label="PAN Number">
                                        <input type="text" name="panNumber" value={formData.panNumber || ''} onChange={handleChange} maxLength={10} className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange font-mono uppercase" />
                                    </FormField>
                                    <FormField label="Gender">
                                        <select name="gender" value={formData.gender || ''} onChange={handleChange} className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange">
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </FormField>
                                </div>
                                <FormField label="Address">
                                    <textarea name="address" rows="2" value={formData.address || ''} onChange={handleChange} className="glass-input w-full px-4 py-3 rounded-xl focus:border-brand-orange focus:ring-brand-orange resize-none" />
                                </FormField>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <button type="button" onClick={handleFinalize} disabled={loading} className="bg-brand-orange text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center justify-center w-full md:w-auto">
                                    {loading ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Generating Card...</> : <>Confirm & Proceed to Pay <ArrowRight className="ml-2 h-5 w-5" /></>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 3: Payment ===== */}
                    {step === 3 && (
                        <div className="max-w-md mx-auto text-center animate-fadeIn">
                            {status === 'processing_payment' ? (
                                <div className="py-12">
                                    <Loader2 className="h-16 w-16 text-brand-orange animate-spin mx-auto mb-6" />
                                    <h3 className="text-xl font-bold text-slate-900">Verifying Payment...</h3>
                                    <p className="text-slate-500">Please do not close this window.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-amber-200">
                                        <CreditCard className="h-10 w-10 text-brand-orange" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Complete Payment</h3>
                                    <p className="text-slate-500 mb-8">Secure payment via Razorpay</p>

                                    {errorMessage && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100 text-sm">
                                            <AlertCircle className="h-5 w-5 flex-shrink-0" />{errorMessage}
                                        </div>
                                    )}

                                    <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200">
                                        <div className="flex justify-between mb-2 text-slate-500 text-sm"><span>Premier Fee</span><span>₹423.73</span></div>
                                        <div className="flex justify-between mb-4 text-slate-500 text-sm"><span>GST (18%)</span><span>₹76.27</span></div>
                                        <div className="border-t border-slate-200 pt-4 flex justify-between text-slate-900 font-bold text-lg"><span>Total (1 Year)</span><span>₹500.00</span></div>
                                    </div>

                                    <button
                                        onClick={handlePayment}
                                        disabled={loading}
                                        className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-brand-orange/20 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {loading ? <><Loader2 className="animate-spin mr-2 h-5 w-5" />Initiating...</> : 'Pay ₹500.00 via Razorpay'}
                                    </button>
                                    <p className="mt-3 text-xs text-slate-400">🔒 Secured by Razorpay. Your card details are never stored.</p>
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
