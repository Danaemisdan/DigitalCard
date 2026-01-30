import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import Logo from './Logo';

const Layout = () => {
    return (
        <div className="min-h-screen flex flex-col font-sans bg-brand-cream text-slate-900 selection:bg-brand-orange selection:text-white">
            {/* Brand Gradient Background (Fixed) */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-brand-orange/40 mix-blend-multiply"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-brand-teal/40 mix-blend-multiply"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-brand-teal/10 bg-brand-cream/90 backdrop-blur-xl shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-3 group">
                        <Logo className="h-10 w-auto group-hover:scale-105 transition-transform" />
                        <span className="text-xl font-display font-bold tracking-tight text-brand-teal">
                            Bharat Peak Business
                        </span>
                    </Link>
                    <nav className="hidden md:flex space-x-8">
                        <Link to="/" className="text-sm font-medium text-slate-600 hover:text-brand-orange transition-colors">Home</Link>
                        <Link to="/apply/premium" className="text-sm font-medium text-slate-600 hover:text-brand-orange transition-colors">Premium</Link>
                        <Link to="/apply/free" className="text-sm font-medium text-slate-600 hover:text-brand-orange transition-colors">Free</Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow relative z-10">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t border-brand-teal/10 bg-white relative z-10">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-slate-500">
                    <div className="flex items-center space-x-2 mb-4 md:mb-0">
                        <ShieldCheck className="h-5 w-5 text-brand-teal" />
                        <span className="text-sm font-medium">Secure & Trusted Digital Identity</span>
                    </div>
                    <p className="text-sm">
                        &copy; {new Date().getFullYear()} Bharat Peak Business. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};


export default Layout;
