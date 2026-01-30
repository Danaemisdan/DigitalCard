import React, { useState, useEffect } from 'react';
import { Download, Eye, Search, Filter, Calendar, Loader2 } from 'lucide-react';
import API_URL from '../config';

const AdminDashboard = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await fetch(`${API_URL}/api/applications`);
            if (res.ok) {
                const data = await res.json();
                // Map backend data to frontend format if needed, but we can just use backend fields directly
                // Backend: _id, personalDetails.fullName, applicationType, status, paymentStatus, createdAt
                setApplications(data);
            }
        } catch (err) {
            console.error("Failed to fetch applications", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (id) => {
        window.open(`${API_URL}/api/applications/${id}/download`, '_blank');
    };

    const filteredApps = applications.filter(app => {
        const name = app.personalDetails?.fullName || '';
        const email = app.personalDetails?.email || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'All' || app.applicationType === typeFilter;
        return matchesSearch && matchesType;
    });

    const totalRevenue = applications.reduce((acc, curr) => {
        return acc + (curr.paymentStatus === 'Paid' ? 999 : 0);
    }, 0);
    const premiumCount = applications.filter(a => a.applicationType === 'Premium').length;
    const freeCount = applications.filter(a => a.applicationType === 'Free').length;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">Dashboard</h1>
                        <p className="text-slate-500 mt-1">Overview of card applications and revenue.</p>
                    </div>
                    <div className="flex space-x-3">
                        <button className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-teal hover:border-brand-teal transition-all shadow-sm">
                            <Calendar className="h-5 w-5" />
                        </button>
                        <button onClick={fetchApplications} className="flex items-center bg-brand-teal text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-900 shadow-lg shadow-brand-teal/20 transition-all">
                            Refresh Data
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <StatCard title="Total Applications" value={applications.length} trend="+12%" />
                    <StatCard title="Premium Users" value={premiumCount} highlight trend="+5%" />
                    <StatCard title="Free Users" value={freeCount} trend="+8%" />
                    <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} trend="+24%" money />
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search applicants..."
                                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-teal focus:border-brand-teal sm:text-sm transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-4 w-full md:w-auto">
                            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                <Filter className="h-4 w-4 text-slate-500" />
                                <select
                                    className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 p-0 pr-6"
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                >
                                    <option value="All">All Types</option>
                                    <option value="Premium">Premium</option>
                                    <option value="Free">Free</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Applied On
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Plan
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Verification
                                    </th>
                                    <th scope="col" className="relative px-6 py-4">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {filteredApps.map((app) => (
                                    <tr key={app._id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm">
                                                        {app.personalDetails?.fullName?.charAt(0) || '?'}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-slate-900">{app.personalDetails?.fullName}</div>
                                                    <div className="text-sm text-slate-500">{app.personalDetails?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900 font-medium">{new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                            <div className="text-xs text-slate-500">{new Date(app.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${app.applicationType === 'Premium'
                                                ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'
                                                : 'bg-brand-teal/10 text-brand-teal border-brand-teal/20'
                                                }`}>
                                                {app.applicationType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`h-2.5 w-2.5 rounded-full mr-2 ${app.status === 'Verified' || app.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'
                                                    }`}></div>
                                                <span className="text-sm text-slate-700 font-medium">
                                                    {app.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-xs font-bold ${app.verificationStatus === 'Passed' ? 'text-green-600' :
                                                app.verificationStatus === 'Review Required' ? 'text-amber-600' : 'text-slate-500'
                                                }`}>
                                                {app.verificationStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="text-brand-teal hover:text-teal-900 p-2 hover:bg-teal-50 rounded-lg transition-colors">
                                                    <Eye className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(app._id)}
                                                    className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Download Card"
                                                >
                                                    <Download className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, highlight, trend, money }) => (
    <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <dt className="text-sm font-medium text-slate-500 truncate">{title}</dt>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${highlight ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                {trend}
            </span>
        </div>
        <dd className={`text-3xl font-display font-bold ${highlight || money ? 'text-brand-orange' : 'text-slate-900'}`}>
            {value}
        </dd>
    </div>
);

export default AdminDashboard;
