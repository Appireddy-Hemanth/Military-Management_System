import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Package, ArrowRightLeft, ShieldAlert, FileText, CheckCircle2, Activity, X } from 'lucide-react';

const Dashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [distribution, setDistribution] = useState([]);
    const [showNetMovementModal, setShowNetMovementModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mRes, dRes, aRes] = await Promise.all([
                api.get('/dashboard/metrics'),
                api.get('/dashboard/distribution'),
                api.get('/dashboard/alerts')
            ]);
            setMetrics(mRes.data);
            setDistribution(dRes.data);
            setAlerts(aRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !metrics) return (
        <div className="flex flex-col h-full justify-center items-center text-text-secondary h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-military-500 mb-4"></div>
            <p>Loading dashboard metrics...</p>
        </div>
    );

    const COLORS = ['#365314', '#4D7C0F', '#65A30D', '#D97706', '#2563EB', '#16A34A'];

    // In a real scenario, this would come from a chart history API. 
    // Using a simple representation for UI as requested in the prompt.
    const movementData = [
        { name: 'Last Month', in: metrics.purchases * 0.2, out: metrics.transfersOut * 0.1 },
        { name: 'Week 1', in: metrics.purchases * 0.3, out: metrics.transfersOut * 0.2 },
        { name: 'Week 2', in: metrics.purchases * 0.1, out: metrics.transfersOut * 0.3 },
        { name: 'Week 3', in: metrics.purchases * 0.2, out: metrics.transfersOut * 0.2 },
        { name: 'Current', in: metrics.purchases + metrics.transfersIn, out: metrics.transfersOut + metrics.expended },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-text-main">Dashboard</h2>
                    <p className="text-text-secondary">Overview of military assets and operations</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="btn-secondary text-sm h-10 px-4">
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card border-l-4 border-l-military-600 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-military-100 text-military-600">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Total Assets</p>
                            <p className="text-2xl font-bold text-text-main">{metrics.totalAvailable + metrics.totalAssigned}</p>
                        </div>
                    </div>
                </div>

                <div
                    className="card border-l-4 border-l-status-info hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer"
                    onClick={() => setShowNetMovementModal(true)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-50 text-status-info">
                                <ArrowRightLeft size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Net Movement</p>
                                <p className="text-2xl font-bold text-text-main">{metrics.netMovement > 0 ? `+${metrics.netMovement}` : metrics.netMovement}</p>
                            </div>
                        </div>
                        <div className="text-xs text-status-info font-medium px-2 py-1 bg-blue-50 rounded-md">View Breakdown</div>
                    </div>
                </div>

                <div className="card border-l-4 border-l-status-warning hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-amber-50 text-status-warning">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Assigned</p>
                            <p className="text-2xl font-bold text-text-main">{metrics.assigned}</p>
                        </div>
                    </div>
                </div>

                <div className="card border-l-4 border-l-status-success hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-green-50 text-status-success">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Closing Balance</p>
                            <p className="text-2xl font-bold text-text-main">{metrics.closingBalance}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card lg:col-span-2 shadow-sm border-gray-200">
                    <div className="border-b border-gray-100 pb-4 mb-4">
                        <h3 className="font-semibold text-text-main flex items-center gap-2 text-lg">
                            <Activity size={20} className="text-military-600" />
                            Movement Trends
                        </h3>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={movementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Area type="monotone" name="Incoming (Purchases & Transfers In)" dataKey="in" stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                                <Area type="monotone" name="Outgoing (Expended & Transfers Out)" dataKey="out" stroke="#DC2626" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alerts Section (Optional to put here or another grid) */}
                {alerts.length > 0 && (
                    <div className="card shadow-sm border-gray-200 lg:col-span-3 flex flex-col border-l-4 border-l-status-danger">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h3 className="font-semibold text-text-main flex items-center gap-2 text-lg">
                                <ShieldAlert size={20} className="text-status-danger" />
                                Active Inventory Alerts
                            </h3>
                        </div>
                        <div className="flex-1 max-h-64 overflow-y-auto">
                            <div className="space-y-3">
                                {alerts.map((a, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-status-danger"></div>
                                            <div>
                                                <p className="font-medium text-text-main">{a.equipmentType.name}</p>
                                                <p className="text-xs text-text-secondary">Base: {a.base.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-status-danger">{a.quantity} IN STOCK</p>
                                            <p className="text-xs text-text-secondary">CRITICAL: {a.crit}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="card shadow-sm border-gray-200 flex flex-col">
                    <div className="border-b border-gray-100 pb-4 mb-4">
                        <h3 className="font-semibold text-text-main flex items-center gap-2 text-lg">
                            <PieChart size={20} className="text-military-600" />
                            Asset Distribution
                        </h3>
                    </div>
                    <div className="flex-1 min-h-[250px]">
                        {distribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distribution}
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-text-secondary text-sm">
                                No distribution data available.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Net Movement Modal */}
            {showNetMovementModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-text-main w-full text-center">Net Movement Breakdown</h3>
                            <button onClick={() => setShowNetMovementModal(false)} className="text-gray-400 hover:text-gray-600 absolute right-6">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="space-y-4 font-mono text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">Purchases</span>
                                    <span className="text-status-success font-medium">+{metrics.purchases}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">Transfers In</span>
                                    <span className="text-status-success font-medium">+{metrics.transfersIn}</span>
                                </div>
                                <div className="flex justify-between items-center text-status-danger">
                                    <span className="text-text-secondary">Transfers Out</span>
                                    <span className="font-medium">-{metrics.transfersOut}</span>
                                </div>

                                <div className="border-t-2 border-dashed border-gray-200 my-4 pt-4"></div>

                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span className="text-text-main font-sans">Net Movement</span>
                                    <span className={metrics.netMovement >= 0 ? "text-status-success" : "text-status-danger"}>
                                        {metrics.netMovement > 0 ? `+${metrics.netMovement}` : metrics.netMovement}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 bg-blue-50 p-4 rounded-md border border-blue-100">
                                <p className="text-xs text-status-info text-center font-medium">
                                    Formula: Purchases + Transfers In - Transfers Out
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button onClick={() => setShowNetMovementModal(false)} className="btn-secondary text-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
