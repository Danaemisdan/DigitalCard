import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Download, Eye, Search, Filter, Loader2,
    TrendingUp, Users, CreditCard, IndianRupee, RefreshCw,
    Trash2, FileDown, X, AlertTriangle, CalendarDays
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import API_URL from '../config';

const PREMIUM_PRICE = 999;
const COLORS = ['#f97316', '#0d9488', '#6366f1', '#ec4899'];

// ----- HELPERS -----
const getRevenue = (apps) =>
    apps.reduce((sum, a) => {
        if (a.applicationType === 'Premium' && a.paymentStatus === 'Paid') return sum + PREMIUM_PRICE;
        return sum;
    }, 0);

const pct = (now, prev) => {
    if (prev === 0) return now > 0 ? '+100%' : '0%';
    const val = ((now - prev) / prev) * 100;
    return (val >= 0 ? '+' : '') + val.toFixed(0) + '%';
};

const isPositive = (str) => !str.startsWith('-');

const groupByDay = (apps) => {
    const map = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        map[key] = { date: key, total: 0, free: 0, premium: 0, revenue: 0 };
    }
    apps.forEach(a => {
        const d = new Date(a.createdAt);
        const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        if (map[key]) {
            map[key].total++;
            if (a.applicationType === 'Premium') {
                map[key].premium++;
                if (a.paymentStatus === 'Paid') map[key].revenue += PREMIUM_PRICE;
            } else {
                map[key].free++;
            }
        }
    });
    return Object.values(map);
};

const splitByMonth = (apps) => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = apps.filter(a => new Date(a.createdAt) >= startOfThisMonth);
    const lastMonth = apps.filter(a => {
        const d = new Date(a.createdAt);
        return d >= startOfLastMonth && d < startOfThisMonth;
    });
    return { thisMonth, lastMonth };
};

const exportToCSV = (apps, filename = 'applications.csv') => {
    const headers = ['Name', 'Email', 'Mobile', 'City', 'State', 'Type', 'Status', 'Verification', 'Referral Code', 'Applied On'];
    const rows = apps.map(a => [
        a.personalDetails?.fullName || '',
        a.personalDetails?.email || '',
        a.personalDetails?.mobile || '',
        a.personalDetails?.city || '',
        a.personalDetails?.state || '',
        a.applicationType || '',
        a.status || '',
        a.verificationStatus || '',
        a.referralCode || '',
        new Date(a.createdAt).toLocaleString('en-IN'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

// ---- MAIN ----
const AdminDashboard = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [activeTab, setActiveTab] = useState('overview');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null); // {id, name}
    const [viewTarget, setViewTarget] = useState(null); // Application object
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { fetchApplications(); }, []);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/applications`);
            if (res.ok) setApplications(await res.json());
        } catch (err) {
            console.error('Failed to fetch applications', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (id) => window.open(`${API_URL}/api/applications/${id}/download`, '_blank');

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_URL}/api/applications/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) {
                setApplications(prev => prev.filter(a => a._id !== deleteTarget.id));
            }
        } catch (err) {
            console.error('Delete failed', err);
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const filteredApps = useMemo(() => applications.filter(app => {
        const name = app.personalDetails?.fullName || '';
        const email = app.personalDetails?.email || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'All' || app.applicationType === typeFilter;
        const appDate = new Date(app.createdAt);
        const matchesFrom = !dateFrom || appDate >= new Date(dateFrom);
        const matchesTo = !dateTo || appDate <= new Date(dateTo + 'T23:59:59');
        return matchesSearch && matchesType && matchesFrom && matchesTo;
    }), [applications, searchTerm, typeFilter, dateFrom, dateTo]);

    const hasDateFilter = dateFrom || dateTo;

    const clearDateFilter = () => { setDateFrom(''); setDateTo(''); };

    const stats = useMemo(() => {
        const { thisMonth, lastMonth } = splitByMonth(applications);
        const total = applications.length;
        const premium = applications.filter(a => a.applicationType === 'Premium').length;
        const free = applications.filter(a => a.applicationType === 'Free').length;
        const revenue = getRevenue(applications);
        const verified = applications.filter(a => a.verificationStatus === 'Passed').length;
        return {
            total, totalTrend: pct(thisMonth.length, lastMonth.length),
            premium, premiumTrend: pct(thisMonth.filter(a => a.applicationType === 'Premium').length, lastMonth.filter(a => a.applicationType === 'Premium').length),
            free, freeTrend: pct(thisMonth.filter(a => a.applicationType === 'Free').length, lastMonth.filter(a => a.applicationType === 'Free').length),
            revenue, revenueTrend: pct(getRevenue(thisMonth), getRevenue(lastMonth)),
            conversionRate: total > 0 ? Math.round((verified / total) * 100) : 0,
            pending: applications.filter(a => a.status === 'Pending').length,
        };
    }, [applications]);

    const chartData = useMemo(() => groupByDay(applications), [applications]);
    const pieData = useMemo(() => [
        { name: 'Free', value: stats.free },
        { name: 'Premium', value: stats.premium },
    ].filter(d => d.value > 0), [stats]);
    const statusData = useMemo(() => {
        const counts = {};
        applications.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [applications]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen p-6 md:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Delete Confirmation Modal */}
                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-50 rounded-xl">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Delete Application</h3>
                            </div>
                            <p className="text-slate-600 mb-6">
                                Are you sure you want to delete the application for <span className="font-bold text-slate-900">{deleteTarget.name}</span>? This action cannot be undone and will also remove all uploaded documents.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={deleting}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-60"
                                >
                                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    {deleting ? 'Deleting…' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Details Modal */}
                {viewTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Application Details</h3>
                                    <p className="text-sm text-slate-500">View user documents and information</p>
                                </div>
                                <button onClick={() => setViewTarget(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X className="h-5 w-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Personal Info</h4>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                        <div className="text-slate-500">Full Name</div>
                                        <div className="text-slate-900 font-medium">{viewTarget.personalDetails?.fullName}</div>
                                        <div className="text-slate-500">Mobile</div>
                                        <div className="text-slate-900 font-medium">{viewTarget.personalDetails?.mobile}</div>
                                        <div className="text-slate-500">Email</div>
                                        <div className="text-slate-900 font-medium break-all">{viewTarget.personalDetails?.email}</div>
                                        <div className="text-slate-500">Gender</div>
                                        <div className="text-slate-900 font-medium">{viewTarget.personalDetails?.gender}</div>
                                        <div className="text-slate-500">Aadhaar No.</div>
                                        <div className="text-slate-900 font-medium">{viewTarget.personalDetails?.aadhaarNumber}</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Application Info</h4>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                        <div className="text-slate-500">Plan Type</div>
                                        <div className="text-slate-900 font-medium"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold">{viewTarget.applicationType}</span></div>
                                        <div className="text-slate-500">Unique Code</div>
                                        <div className="text-slate-900 font-medium font-mono text-xs bg-slate-50 px-2 py-1 rounded border">{viewTarget.uniqueCode || 'PENDING'}</div>
                                        <div className="text-slate-500">Status</div>
                                        <div className="text-slate-900 font-medium">{viewTarget.status}</div>
                                        <div className="text-slate-500">Applied On</div>
                                        <div className="text-slate-900 font-medium">{new Date(viewTarget.createdAt).toLocaleDateString('en-IN')}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Uploaded Documents</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Helper to get clean URL */}
                                    {['aadhaarPath', 'panPath', 'photoPath'].map((docKey) => {
                                        const pathVal = viewTarget.documents?.[docKey];
                                        const fileName = docKey.replace('Path', '');
                                        // Assume pathVal is 'uploads/filename.ext'
                                        // We need to verify if it has 'uploads/' prefix or not.  
                                        // If stored as 'uploads/file', and we serve '/uploads', then url is API_URL + '/' + pathVal
                                        const fileUrl = pathVal ? `${API_URL}/${pathVal.replace(/\\/g, '/')}` : null;

                                        return (
                                            <div key={docKey} className="border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-3 hover:border-brand-teal transition-colors bg-slate-50/50">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    {docKey.includes('photo') ? <Users className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-sm font-bold text-slate-700 capitalize">{fileName}</div>
                                                    <div className="text-xs text-slate-400">{pathVal ? 'Available' : 'Missing'}</div>
                                                </div>
                                                {pathVal ? (
                                                    <a
                                                        href={fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Download className="h-3 w-3" /> Download
                                                    </a>
                                                ) : (
                                                    <button disabled className="w-full py-2 bg-slate-100 text-slate-300 text-xs font-bold rounded-lg cursor-not-allowed">
                                                        Not Uploaded
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={() => setViewTarget(null)}
                                    className="px-6 py-2.5 bg-brand-teal text-white text-sm font-bold rounded-xl hover:bg-teal-900 transition-all shadow-lg shadow-brand-teal/20"
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">Dashboard</h1>
                        <p className="text-slate-500 mt-1">Real-time overview of card applications and revenue.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => exportToCSV(filteredApps, `applications-export-${Date.now()}.csv`)}
                            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 shadow-sm transition-all"
                            title="Export current filtered view as CSV"
                        >
                            <FileDown className="h-4 w-4" /> Export CSV
                        </button>
                        <button
                            onClick={fetchApplications}
                            className="flex items-center gap-2 bg-brand-teal text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-900 shadow-lg shadow-brand-teal/20 transition-all"
                        >
                            <RefreshCw className="h-4 w-4" /> Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <StatCard icon={<Users className="h-5 w-5 text-brand-teal" />} title="Total Applications" value={stats.total} trend={stats.totalTrend} iconBg="bg-teal-50" />
                    <StatCard icon={<CreditCard className="h-5 w-5 text-indigo-500" />} title="Premium Users" value={stats.premium} trend={stats.premiumTrend} iconBg="bg-indigo-50" valueColor="text-indigo-600" />
                    <StatCard icon={<Users className="h-5 w-5 text-emerald-500" />} title="Free Users" value={stats.free} trend={stats.freeTrend} iconBg="bg-emerald-50" />
                    <StatCard icon={<IndianRupee className="h-5 w-5 text-brand-orange" />} title="Total Revenue" value={`₹${stats.revenue.toLocaleString('en-IN')}`} trend={stats.revenueTrend} iconBg="bg-orange-50" valueColor="text-brand-orange" />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 w-fit mb-6 shadow-sm">
                    {['overview', 'applications'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${activeTab === tab ? 'bg-brand-teal text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Applications Over Time */}
                        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-1">Applications Over Time</h2>
                            <p className="text-sm text-slate-400 mb-6">Last 30 days</p>
                            {applications.length === 0 ? <EmptyChart message="No application data yet." /> : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorFree" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={4} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgb(0,0,0,0.08)' }} labelStyle={{ fontWeight: 700, color: '#1e293b' }} />
                                        <Legend />
                                        <Area type="monotone" dataKey="free" name="Free" stroke="#0d9488" strokeWidth={2} fill="url(#colorFree)" dot={false} activeDot={{ r: 5 }} />
                                        <Area type="monotone" dataKey="premium" name="Premium" stroke="#f97316" strokeWidth={2} fill="url(#colorPremium)" dot={false} activeDot={{ r: 5 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
                                <h2 className="text-lg font-bold text-slate-800 mb-1">Daily Revenue</h2>
                                <p className="text-sm text-slate-400 mb-6">₹ from Premium card sales</p>
                                {stats.revenue === 0 ? <EmptyChart message="No revenue recorded yet. Revenue is generated from paid Premium applications." /> : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={4} />
                                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} formatter={v => [`₹${v}`, 'Revenue']} />
                                            <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]} fill="#f97316" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
                                <h2 className="text-lg font-bold text-slate-800 mb-1">Plan Split</h2>
                                <p className="text-sm text-slate-400 mb-4">Free vs Premium</p>
                                {pieData.length === 0 ? <EmptyChart message="No data yet." /> : (
                                    <>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                                                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="mt-2 space-y-2">
                                            {pieData.map((d, i) => (
                                                <div key={d.name} className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: COLORS[i] }} />
                                                        <span className="text-sm text-slate-600">{d.name}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800">{d.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-1">Application Status Breakdown</h2>
                            <p className="text-sm text-slate-400 mb-6">Current status distribution</p>
                            {statusData.length === 0 ? <EmptyChart message="No status data yet." /> : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart layout="vertical" data={statusData} margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                        <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                                            {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <MiniStat label="Verification Rate" value={`${stats.conversionRate}%`} />
                            <MiniStat label="Premium Users" value={stats.premium} />
                            <MiniStat label="Avg Revenue/App" value={stats.total > 0 ? `₹${Math.round(stats.revenue / stats.total)}` : '₹0'} />
                            <MiniStat label="Pending Review" value={stats.pending} />
                        </div>
                    </div>
                )}

                {activeTab === 'applications' && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-5 border-b border-slate-100 space-y-3">
                            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                                {/* Search */}
                                <div className="relative w-full md:w-80">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by name or email…"
                                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-teal focus:border-brand-teal transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Type filter */}
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                        <Filter className="h-4 w-4 text-slate-500" />
                                        <select
                                            className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 p-0 pr-4"
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                        >
                                            <option value="All">All Types</option>
                                            <option value="Premium">Premium</option>
                                            <option value="Free">Free</option>
                                        </select>
                                    </div>
                                    {/* Export CSV */}
                                    <button
                                        onClick={() => exportToCSV(filteredApps, `applications-${new Date().toISOString().slice(0, 10)}.csv`)}
                                        className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-all"
                                    >
                                        <FileDown className="h-4 w-4" />
                                        Export CSV ({filteredApps.length})
                                    </button>
                                </div>
                            </div>

                            {/* Date Range Filter */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                                    <CalendarDays className="h-4 w-4" />
                                    Date Range:
                                </div>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal focus:bg-white transition-all"
                                />
                                <span className="text-slate-400 text-sm">to</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    min={dateFrom}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal focus:bg-white transition-all"
                                />
                                {hasDateFilter && (
                                    <button
                                        onClick={clearDateFilter}
                                        className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg transition-all"
                                    >
                                        <X className="h-3.5 w-3.5" /> Clear
                                    </button>
                                )}
                                {hasDateFilter && (
                                    <span className="text-xs text-slate-400 ml-1">{filteredApps.length} results</span>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        {['User', 'Applied On', 'Plan', 'Status', 'Verification', 'Actions'].map(h => (
                                            <th key={h} scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {filteredApps.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-16 text-slate-400">No applications found.</td>
                                        </tr>
                                    ) : filteredApps.map((app) => (
                                        <tr key={app._id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shadow-sm">
                                                        {app.personalDetails?.fullName?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900">{app.personalDetails?.fullName}</div>
                                                        <div className="text-xs text-slate-500">{app.personalDetails?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-800">{new Date(app.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                <div className="text-xs text-slate-400">{new Date(app.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${app.applicationType === 'Premium' ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/20' : 'bg-brand-teal/10 text-brand-teal border-brand-teal/20'}`}>
                                                    {app.applicationType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${app.status === 'Verified' || app.status === 'Paid' ? 'bg-emerald-500' : app.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                                    <span className="text-sm text-slate-700 font-medium">{app.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-xs font-bold ${app.verificationStatus === 'Passed' ? 'text-emerald-600' : app.verificationStatus === 'Review Required' ? 'text-amber-600' : 'text-slate-400'}`}>
                                                    {app.verificationStatus || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => setViewTarget(app)} className="text-brand-teal hover:text-teal-900 p-2 hover:bg-teal-50 rounded-lg transition-colors" title="View Details & Docs">
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDownload(app._id)} className="text-slate-400 hover:text-slate-700 p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Download Card">
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget({ id: app._id, name: app.personalDetails?.fullName || 'this applicant' })}
                                                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Application"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ---- SUB COMPONENTS ----
const StatCard = ({ icon, title, value, trend, iconBg = 'bg-slate-100', valueColor = 'text-slate-900' }) => {
    const positive = isPositive(trend);
    return (
        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`${iconBg} p-2.5 rounded-xl`}>{icon}</div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {trend}
                </span>
            </div>
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            <p className={`text-2xl font-display font-bold ${valueColor}`}>{value}</p>
        </div>
    );
};

const MiniStat = ({ label, value }) => (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
        <p className="text-xs text-slate-500 mb-1 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
);

const EmptyChart = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
        <TrendingUp className="h-8 w-8 opacity-30" />
        <p className="text-sm text-center max-w-xs">{message}</p>
    </div>
);

export default AdminDashboard;
