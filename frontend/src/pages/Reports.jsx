import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { BarChart3, Filter, Download, Printer } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import ExportCSV from '../components/ExportCSV';

const Reports = () => {
    const [distribution, setDistribution] = useState([]);
    const [loading, setLoading] = useState(true);

    const [inventoryReport, setInventoryReport] = useState([]);
    const [purchasesReport, setPurchasesReport] = useState([]);
    const [transfersReport, setTransfersReport] = useState([]);

    const componentRef = useRef();

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const [dRes, iRes, pRes, tRes] = await Promise.all([
                    api.get('/dashboard/distribution'),
                    api.get('/reports/inventory'),
                    api.get('/reports/purchases'),
                    api.get('/reports/transfers')
                ]);
                setDistribution(dRes.data);

                // Format for CSV
                setInventoryReport(iRes.data.map(i => ({
                    ID: i.id, Type: i.equipmentType?.name, Base: i.base?.name, Status: i.status, Quantity: i.quantity
                })));
                setPurchasesReport(pRes.data.map(p => ({
                    ID: p.id, Reference: p.referenceNumber, Type: p.equipmentType?.name, Quantity: p.quantity, Date: new Date(p.purchaseDate).toLocaleDateString()
                })));
                setTransfersReport(tRes.data.map(t => ({
                    ID: t.id, From: t.sourceBase?.name, To: t.destinationBase?.name, Type: t.equipmentType?.name, Quantity: t.quantity, Status: t.status
                })));

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const COLORS = ['#365314', '#4D7C0F', '#65A30D', '#D97706', '#2563EB', '#16A34A'];

    const handlePrint = () => {
        window.print();
    };

    // Mock data for other charts since there are no specialized APIs for them
    const inventoryByBase = [
        { name: 'Fort Alpha', opening: 1000, movement: 200, closing: 1200 },
        { name: 'Fort Bravo', opening: 800, movement: -50, closing: 750 },
        { name: 'Fort Charlie', opening: 500, movement: 100, closing: 600 }
    ];

    const trendsData = [
        { name: 'Jan', purchases: 400, transfers: 240, expenditures: 240 },
        { name: 'Feb', purchases: 300, transfers: 139, expenditures: 221 },
        { name: 'Mar', purchases: 200, transfers: 980, expenditures: 229 },
        { name: 'Apr', purchases: 278, transfers: 390, expenditures: 200 },
        { name: 'May', purchases: 189, transfers: 480, expenditures: 218 },
        { name: 'Jun', purchases: 239, transfers: 380, expenditures: 250 },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto" ref={componentRef}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <BarChart3 size={24} className="text-military-600" /> Reports & Analytics
                    </h2>
                    <p className="text-text-secondary mt-1">Data-driven operational insights & official reporting</p>
                </div>
                <div className="flex gap-2 flex-wrap items-center no-print">
                    <button className="btn-secondary" onClick={handlePrint}>
                        <Printer size={16} /> Print / PDF
                    </button>
                    {inventoryReport.length > 0 && <ExportCSV data={inventoryReport} filename="MAMS_Inventory_Report.csv" className="text-xs py-1 px-3 h-9" />}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-text-secondary h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-military-500 mb-4"></div>
                    Loading analytics data...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Asset Distribution */}
                    <div className="card shadow-sm border-gray-200">
                        <h3 className="font-semibold text-text-main mb-4 border-b border-gray-100 pb-2">Asset Distribution</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distribution}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Inventory by Base */}
                    <div className="card shadow-sm border-gray-200">
                        <h3 className="font-semibold text-text-main mb-4 border-b border-gray-100 pb-2">Inventory by Base</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={inventoryByBase} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend iconType="circle" />
                                    <Bar dataKey="opening" name="Opening Balance" fill="#4D7C0F" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="closing" name="Closing Balance" fill="#2563EB" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Trends */}
                    <div className="card shadow-sm border-gray-200 md:col-span-2">
                        <h3 className="font-semibold text-text-main mb-4 border-b border-gray-100 pb-2">Operational Trends</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendsData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend iconType="circle" />
                                    <Line type="monotone" dataKey="purchases" name="Purchases" stroke="#16A34A" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="transfers" name="Transfers" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="expenditures" name="Expenditures" stroke="#DC2626" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
