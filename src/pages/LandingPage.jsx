import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Check, ArrowRight, Star, User, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="pb-32 pt-16">

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20 text-balance">
                <h1 className="text-5xl md:text-7xl font-display font-bold text-brand-teal mb-8 tracking-tight leading-[1.1]">
                    Your Identity, <br className="hidden md:block" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-orange to-amber-500">Digitally Reimagined.</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Join the future of digital identification. Secure, instant, and globally recognized. Choose the card that fits your lifestyle.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/apply/premier" className="w-full sm:w-auto px-8 py-4 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center shadow-xl shadow-brand-orange/20 hover:scale-[1.02] hover:shadow-brand-orange/30">
                        Get Premier Card
                    </Link>
                    <Link to="/apply/free" className="w-full sm:w-auto px-8 py-4 bg-white text-brand-teal font-bold rounded-xl hover:bg-brand-cream border-2 border-brand-teal/10 transition-all flex items-center justify-center shadow-lg shadow-slate-200/50 hover:border-slate-300">
                        Start for Free
                    </Link>
                </div>
            </div>

            {/* Cards Section */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-8 items-start">

                    {/* Free Card */}
                    <div className="group relative bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 border border-slate-200 p-3 rounded-2xl shadow-sm z-10 group-hover:scale-110 transition-transform duration-300">
                            <User className="h-8 w-8 text-slate-600" />
                        </div>

                        <div className="mt-6 text-center">
                            <h3 className="text-2xl font-display font-bold text-slate-900">Standard Access</h3>
                            <p className="text-slate-500 mt-2 text-sm">Essential digital identity features.</p>
                            <div className="mt-4 flex items-baseline justify-center">
                                <span className="text-4xl font-bold text-slate-900">₹0</span>
                                <span className="text-slate-500 ml-1">/lifetime</span>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            {['Instant ID Generation', 'Basic Digital Profile', 'Standard PDF Download', 'Email Support'].map((feature, i) => (
                                <div key={i} className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <Check className="h-5 w-5 text-green-500" />
                                    </div>
                                    <p className="ml-3 text-sm text-slate-600">{feature}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8">
                            <Link
                                to="/apply/free"
                                className="block w-full py-4 px-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center text-slate-900 font-bold transition-colors"
                            >
                                Get Free Card
                            </Link>
                        </div>
                    </div>

                    {/* Premier Card */}
                    <div className="relative group">
                        {/* Gradient Border Effect */}
                        <div className="absolute -inset-[2px] rounded-[2rem] bg-gradient-to-br from-brand-orange via-amber-500 to-brand-teal opacity-60 blur-sm group-hover:blur-md transition-all duration-500"></div>

                        <div className="relative bg-white rounded-[2rem] p-8 h-full shadow-2xl shadow-brand-orange/10">
                            {/* Badge */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="bg-gradient-to-r from-brand-orange to-orange-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-brand-orange/30 flex items-center space-x-1 uppercase tracking-wider">
                                    <Star className="h-3 w-3 fill-current" />
                                    <span>Most Popular</span>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <h3 className="text-3xl font-display font-bold text-slate-900">Premier Pro</h3>
                                <p className="text-slate-500 mt-2 text-sm">Unlock the full power of your identity.</p>
                                <div className="mt-4 flex items-baseline justify-center">
                                    <span className="text-5xl font-bold tracking-tight text-brand-teal">₹500</span>
                                    <span className="text-slate-500 ml-1">/year</span>
                                </div>
                            </div>

                            <div className="mt-8 space-y-5">
                                {[
                                    { text: 'Verified Green Badge', icon: ShieldCheck },
                                    { text: 'Priority Processing (Under 2 hrs)', icon: Check },
                                    { text: 'Custom Profile Dashboard', icon: Check },
                                    { text: 'Premium Support Channel', icon: Check },
                                    { text: 'Ad-free Experience', icon: Check }
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-start">
                                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-cream flex items-center justify-center">
                                            <feature.icon className="h-4 w-4 text-brand-orange" />
                                        </div>
                                        <p className="ml-3 text-sm font-bold text-slate-700">{feature.text}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10">
                                <Link
                                    to="/apply/premier"
                                    className="flex items-center justify-center w-full py-4 px-6 bg-brand-teal hover:bg-teal-900 text-white font-bold rounded-xl shadow-xl shadow-brand-teal/20 transition-all hover:scale-[1.02]"
                                >
                                    <span className="mr-2">Apply for Premier</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <p className="mt-4 text-xs text-center text-slate-400 font-medium">
                                    Secure one-time payment. No hidden fees.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LandingPage;
