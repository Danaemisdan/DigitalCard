import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, LayoutDashboard } from 'lucide-react';
import Logo from '../components/Logo';

const AdminLogin = () => {
    const [email, setEmail] = useState('admin@cardsys.com');
    const [password, setPassword] = useState('admin123');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        console.log('Logging in with:', email, password);
        navigate('/admin/dashboard');
    };

    return (
        <div className="min-h-screen flex bg-white font-sans">

            {/* Visual Side (Left) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-brand-teal overflow-hidden flex-col justify-between p-12 text-white">
                {/* Abstract Background Pattern */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-brand-orange/20 rounded-full blur-[100px] mix-blend-screen"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-teal-800/40 rounded-full blur-[80px] mix-blend-screen"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-8">
                        <Logo className="h-10 w-auto text-white" />
                        <span className="font-display font-bold text-2xl tracking-tight">Bharat Peak Business</span>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-display font-bold mb-6 leading-tight">
                        Manage your digital ecosystem.
                    </h1>
                    <p className="text-lg text-teal-100 leading-relaxed mb-8">
                        Gain real-time insights, manage applications, and oversee card issuance from one centralized, secure dashboard.
                    </p>
                    <div className="flex items-center space-x-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-10 w-10 rounded-full border-2 border-brand-teal bg-teal-800 flex items-center justify-center text-xs font-bold">
                                    {i}
                                </div>
                            ))}
                        </div>
                        <div className="text-sm text-teal-200">
                            <span className="text-white font-bold">2.4k+</span> Cards Issued
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-xs text-teal-200 uppercase tracking-widest font-semibold">
                    Enterprise Grade Security
                </div>
            </div>

            {/* Form Side (Right) */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative bg-white">
                <div className="mx-auto w-full max-w-sm lg:w-[420px]">
                    <div className="mb-10">
                        <div className="h-12 w-12 bg-brand-cream rounded-xl flex items-center justify-center mb-6">
                            <Lock className="h-6 w-6 text-brand-teal" />
                        </div>
                        <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight mb-2">Welcome back</h2>
                        <p className="text-slate-500">
                            Sign in to access your admin dashboard.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full px-4 py-3.5 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange text-slate-900 sm:text-sm transition-all"
                                placeholder="admin@company.com"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-sm font-bold text-slate-700">
                                    Password
                                </label>
                                <a href="#" className="font-semibold text-brand-orange hover:text-orange-600 text-sm">
                                    Forgot password?
                                </a>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-4 py-3.5 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange text-slate-900 sm:text-sm transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-brand-orange focus:ring-brand-orange border-slate-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-500">
                                Keep me logged in for 30 days
                            </label>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-orange/20 text-sm font-bold text-white bg-brand-orange hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange transition-all hover:scale-[1.01]"
                            >
                                Sign in to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                            </button>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-xs text-slate-400">
                        Protected by Bharat Business Secure Gateway • v2.0.1
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
