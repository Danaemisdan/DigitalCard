import React, { useState, useEffect, useMemo } from 'react';
import {
    Download, Eye, Search, Filter, Calendar, Loader2,
    TrendingUp, Users, CreditCard, IndianRupee, RefreshCw
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

// Group apps by day (last 30 days)
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

// Split apps: this month vs last month
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

// ---- MAIN ----
const AdminDashboard = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [activeTab, setActiveTab] = useState('overview');

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

    const filteredApps = useMemo(() => applications.filter(app => {
        const name = app.personalDetails?.fullName || '';
        const email = app.personalDetails?.email || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'All' || app.applicationType === typeFilter;
        return matchesSearch && matchesType;
    }), [applications, searchTerm, typeFilter]);

    const stats = useMemo(() => {
        const { thisMonth, lastMonth } = splitByMonth(applications);

        const total = applications.length;
        const totalPrev = lastMonth.length;

        const premium = applications.filter(a => a.applicationType === 'Premium').length;
        const premiumPrev = lastMonth.filter(a => a.applicationType === 'Premium').length;

        const free = applications.filter(a => a.applicationType === 'Free').length;
        const freePrev = lastMonth.filter(a => a.applicationType === 'Free').length;

        const revenue = getRevenue(applications);
        const revenuePrev = getRevenue(lastMonth);

        const verified = applications.filter(a => a.verificationStatus === 'Passed').length;
        const conversionRate = total > 0 ? Math.round((verified / total) * 100) : 0;

        return {
            total, totalTrend: pct(thisMonth.length, totalPrev),
            premium, premiumTrend: pct(thisMonth.filter(a => a.applicationType === 'Premium').length, premiumPrev),
            free, freeTrend: pct(thisMonth.filter(a => a.applicationType === 'Free').length, freePrev),
            revenue, revenueTrend: pct(getRevenue(thisMonth), revenuePrev),
            conversionRate,
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

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">Dashboard</h1>
                        <p className="text-slate-500 mt-1">Real-time overview of card applications and revenue.</p>
                    </div>
                    <button
                        onClick={fetchApplications}
                        className="flex items-center gap-2 bg-brand-teal text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-900 shadow-lg shadow-brand-teal/20 transition-all"
                    >
                        <RefreshCw className="h-4 w-4" /> Refresh Data
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <StatCard
                        icon={<Users className="h-5 w-5 text-brand-teal" />}
                        title="Total Applications"
                        value={stats.total}
                        trend={stats.totalTrend}
                        iconBg="bg-teal-50"
                    />
                    <StatCard
                        icon={<CreditCard className="h-5 w-5 text-indigo-500" />}
                        title="Premium Users"
                        value={stats.premium}
                        trend={stats.premiumTrend}
                        iconBg="bg-indigo-50"
                        valueColor="text-indigo-600"
                    />
                    <StatCard
                        icon={<Users className="h-5 w-5 text-emerald-500" />}
                        title="Free Users"
                        value={stats.free}
                        trend={stats.freeTrend}
                        iconBg="bg-emerald-50"
                    />
                    <StatCard
                        icon={<IndianRupee className="h-5 w-5 text-brand-orange" />}
                        title="Total Revenue"
                        value={`₹${stats.revenue.toLocaleString('en-IN')}`}
                        trend={stats.revenueTrend}
                        iconBg="bg-orange-50"
                        valueColor="text-brand-orange"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 w-fit mb-6 shadow-sm">
                    {['overview', 'applications'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${activeTab === tab
                                    ? 'bg-brand-teal text-white shadow'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
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
                            {applications.length === 0 ? (
                                <EmptyChart message="No application data yet." />
                            ) : (
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
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={4}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgb(0,0,0,0.08)' }}
                                            labelStyle={{ fontWeight: 700, color: '#1e293b' }}
                                        />
                                        <Legend />
                                        <Area type="monotone" dataKey="free" name="Free" stroke="#0d9488" strokeWidth={2} fill="url(#colorFree)" dot={false} activeDot={{ r: 5 }} />
                                        <Area type="monotone" dataKey="premium" name="Premium" stroke="#f97316" strokeWidth={2} fill="url(#colorPremium)" dot={false} activeDot={{ r: 5 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Bottom row charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            {/* Revenue Chart */}
                            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
                                <h2 className="text-lg font-bold text-slate-800 mb-1">Daily Revenue</h2>
                                <p className="text-sm text-slate-400 mb-6">₹ from Premium card sales</p>
                                {applications.length === 0 || stats.revenue === 0 ? (
                                    <EmptyChart message="No revenue recorded yet. Revenue is generated from paid Premium applications." />
                                ) : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={4} />
                                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                                formatter={v => [`₹${v}`, 'Revenue']}
                                            />
                                            <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]} fill="#f97316" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* Plan split */}
                            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
                                <h2 className="text-lg font-bold text-slate-800 mb-1">Plan Split</h2>
                                <p className="text-sm text-slate-400 mb-4">Free vs Premium</p>
                                {pieData.length === 0 ? (
                                    <EmptyChart message="No data yet." />
                                ) : (
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

                        {/* Status Breakdown */}
                        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-1">Application Status Breakdown</h2>
                            <p className="text-sm text-slate-400 mb-6">Current status distribution</p>
                            {statusData.length === 0 ? (
                                <EmptyChart message="No status data yet." />
                            ) : (
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

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <MiniStat label="Verification Rate" value={`${stats.conversionRate}%`} />
                            <MiniStat label="Premium Users" value={stats.premium} />
                            <MiniStat label="Avg. Revenue/App" value={stats.total > 0 ? `₹${Math.round(stats.revenue / stats.total)}` : '₹0'} />
                            <MiniStat label="Pending Review" value={applications.filter(a => a.status === 'Pending').length} />
                        </div>
                    </div>
                )}

                {activeTab === 'applications' && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-96">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search applicants..."
                                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-teal focus:border-brand-teal transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
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
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        {['User', 'Applied On', 'Plan', 'Status', 'Verification', ''].map(h => (
                                            <th key={h} scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                {h}
                                            </th>
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
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${app.applicationType === 'Premium'
                                                        ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'
                                                        : 'bg-brand-teal/10 text-brand-teal border-brand-teal/20'
                                                    }`}>
                                                    {app.applicationType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${app.status === 'Verified' || app.status === 'Paid' ? 'bg-emerald-500' :
                                                            app.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'
                                                        }`} />
                                                    <span className="text-sm text-slate-700 font-medium">{app.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-xs font-bold ${app.verificationStatus === 'Passed' ? 'text-emerald-600' :
                                                        app.verificationStatus === 'Review Required' ? 'text-amber-600' : 'text-slate-400'
                                                    }`}>
                                                    {app.verificationStatus || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="text-brand-teal hover:text-teal-900 p-2 hover:bg-teal-50 rounded-lg transition-colors" title="View">
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDownload(app._id)} className="text-slate-400 hover:text-slate-700 p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Download Card">
                                                        <Download className="h-4 w-4" />
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
                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                    }`}>
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
