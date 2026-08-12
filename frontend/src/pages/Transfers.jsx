import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { ArrowRightLeft, Plus, X, Search, ArrowRight, Truck, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import ExportCSV from '../components/ExportCSV';

const Transfers = () => {
    const { user } = useContext(AuthContext);
    const [transfers, setTransfers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ sourceBaseId: '', destinationBaseId: '', equipmentTypeId: '', quantity: '' });
    const [bases, setBases] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [assets, setAssets] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionId, setActionId] = useState(null); // to track ongoing specific actions

    useEffect(() => {
        fetchData();

        // Setup Socket.io connection
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const socket = io(socketUrl);

        socket.on('connect', () => {
            if (user) {
                socket.emit('join', user.role);
            }
        });

        socket.on('transferUpdate', (payload) => {
            if (payload.type === 'CREATED') {
                setTransfers(prev => [payload.data, ...prev]);
                // Refresh assets to get updated inventory
                api.get('/assets').then(res => setAssets(res.data));
            } else if (payload.type === 'COMPLETED') {
                setTransfers(prev => prev.map(t => t.id === payload.data.id ? payload.data : t));
                api.get('/assets').then(res => setAssets(res.data));
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            setForm(prev => ({ ...prev, sourceBaseId: user.baseId }));
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tRes, eRes, bRes, aRes] = await Promise.all([
                api.get('/transfers'),
                api.get('/equipment-types'),
                api.get('/bases').catch(() => ({ data: [] })),
                api.get('/assets')
            ]);
            setTransfers(tRes.data);
            setEquipment(eRes.data);
            setAssets(aRes.data);

            if (user?.role === 'ADMIN') {
                setBases(bRes.data);
            } else if (user?.baseId) {
                setBases(bRes.data.length ? bRes.data : [{ id: user.baseId, name: 'Assigned Base' }]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const availableQuantity = React.useMemo(() => {
        if (!form.sourceBaseId || !form.equipmentTypeId) return 0;
        const matchingAssets = assets.filter(a =>
            a.baseId === parseInt(form.sourceBaseId) &&
            a.equipmentTypeId === parseInt(form.equipmentTypeId) &&
            a.status === 'AVAILABLE'
        );
        return matchingAssets.reduce((sum, a) => sum + a.quantity, 0);
    }, [form.sourceBaseId, form.equipmentTypeId, assets]);

    const handleQuantityChange = (e) => {
        const val = parseInt(e.target.value) || 0;
        setForm({ ...form, quantity: val });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.sourceBaseId === form.destinationBaseId) {
            setError("Source and destination bases cannot be the same.");
            return;
        }
        if (form.quantity > availableQuantity) {
            setError("Transfer quantity exceeds available stock.");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/transfers', { ...form, quantity: parseInt(form.quantity) });
            setShowModal(false);
            setForm({ sourceBaseId: user?.role === 'ADMIN' ? '' : user?.baseId, destinationBaseId: '', equipmentTypeId: '', quantity: '' });
            setError('');
            // Optional alert: alert('Transfer initiated successfully.');
            // fetchData not strictly required if socket handles the CREATE refresh, but kept as fallback if socket fails
            fetchData();
        } catch (e) {
            setError(e.response?.data?.error || 'Transfer failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCompleteTransfer = async (transferId) => {
        if (!confirm('Are you sure you want to mark this transfer as completed? This will add the assets to your inventory.')) return;

        setActionId(transferId);
        try {
            await api.post(`/transfers/${transferId}/complete`);
            // WebSocket will handle the UI update
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to complete transfer');
        } finally {
            setActionId(null);
        }
    };

    const getStatusStyle = (status) => {
        if (status === 'COMPLETED') return 'badge-success';
        if (status === 'PENDING' || status === 'IN_TRANSIT') return 'badge-purple';
        if (status === 'CANCELLED') return 'badge-danger';
        return 'badge-gray';
    };

    const filteredTransfers = transfers.filter(t =>
        (t.equipmentType?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.sourceBase?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.destinationBase?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const csvColumns = [
        { label: 'Transfer ID', value: (row) => `TRN-${row.id.toString().padStart(5, '0')}` },
        { label: 'Timestamp', value: (row) => new Date(row.timestamp).toLocaleDateString() },
        { label: 'Equipment', value: (row) => row.equipmentType?.name },
        { label: 'Quantity', value: (row) => row.quantity },
        { label: 'Source Base', value: (row) => row.sourceBase?.name },
        { label: 'Destination Base', value: (row) => row.destinationBase?.name },
        { label: 'Status', value: (row) => row.status }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <ArrowRightLeft size={24} className="text-military-600" /> Asset Transfers
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded animate-pulse w-fit ml-2 h-fit relative top-[2px]">Live</span>
                    </h2>
                    <p className="text-text-secondary mt-1">Manage movement of assets between military bases</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <ExportCSV data={filteredTransfers} filename="transfers-log" columns={csvColumns} />
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        <Plus size={18} /> New Transfer
                    </button>
                </div>
            </div>

            {/* Transfer Visualizations - Recent Active Transfers */}
            {transfers.filter(t => t.status === 'IN_TRANSIT' || t.status === 'PENDING').length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {transfers.filter(t => t.status === 'IN_TRANSIT' || t.status === 'PENDING').slice(0, 3).map(t => (
                        <div key={t.id} className="card bg-gray-50 border-blue-100 flex flex-col justify-center text-center p-4">
                            <div className="flex justify-between items-center w-full relative">
                                <div className="flex flex-col items-center w-1/3">
                                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 line-clamp-1">{t.sourceBase?.name}</span>
                                    <span className="text-xl font-bold text-status-warning">-{t.quantity}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center w-1/3 z-10">
                                    <div className="bg-white p-2 rounded-full border border-blue-200 text-blue-600 shadow-sm mb-1">
                                        <Truck size={16} className="animate-bounce" />
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-blue-600">{t.status}</span>
                                </div>
                                <div className="flex flex-col items-center w-1/3">
                                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 line-clamp-1">{t.destinationBase?.name}</span>
                                    <span className="text-xl font-bold text-gray-400">+{t.quantity}</span>
                                </div>
                                {/* Connecting line */}
                                <div className="absolute top-[40%] left-[20%] right-[20%] h-[2px] bg-gray-300 -z-0">
                                    <div className="h-full bg-blue-400 animate-pulse w-full"></div>
                                </div>
                            </div>
                            <div className="mt-3 text-sm font-medium text-text-main border-t border-gray-200 pt-2 flex items-center justify-between">
                                <span>{t.equipmentType?.name}</span>
                                {(user?.role === 'ADMIN' || user?.baseId === t.destinationBaseId) && (
                                    <button
                                        onClick={() => handleCompleteTransfer(t.id)}
                                        disabled={actionId === t.id}
                                        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors"
                                    >
                                        <CheckCircle size={14} /> {actionId === t.id ? 'Completing...' : 'Complete'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-text-main">Initiate Asset Transfer</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="bg-red-50 text-status-danger p-3 rounded-md border border-red-200 mb-6 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="input-label">Source Base</label>
                                        <select
                                            className="input-field"
                                            value={form.sourceBaseId}
                                            onChange={e => setForm({ ...form, sourceBaseId: e.target.value })}
                                            required
                                            disabled={user?.role !== 'ADMIN'}
                                        >
                                            <option value="">Select Origin...</option>
                                            {bases.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Destination Base</label>
                                        <select
                                            className="input-field"
                                            value={form.destinationBaseId}
                                            onChange={e => setForm({ ...form, destinationBaseId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Destination...</option>
                                            {bases.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="input-label">Equipment / Asset Type</label>
                                    <select
                                        className="input-field"
                                        value={form.equipmentTypeId}
                                        onChange={e => setForm({ ...form, equipmentTypeId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Equipment...</option>
                                        {equipment.map(e => (
                                            <option key={e.id} value={e.id}>{e.name} ({e.category})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Dynamic Inventory Box */}
                                {form.sourceBaseId && form.equipmentTypeId && (
                                    <div className="bg-military-100 p-4 rounded-lg border border-military-border flex justify-between items-center font-mono">
                                        <div className="text-center">
                                            <div className="text-xs text-text-secondary mb-1">AVAILABLE</div>
                                            <div className="text-lg font-bold text-text-main">{availableQuantity}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-text-secondary mb-1">TRANSFER</div>
                                            <div className="text-lg font-bold text-status-warning">-{form.quantity || 0}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-text-secondary mb-1">REMAINING</div>
                                            <div className={`text-lg font-bold ${availableQuantity - (form.quantity || 0) < 0 ? 'text-status-danger' : 'text-status-success'}`}>
                                                {availableQuantity - (form.quantity || 0)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="input-label">Transfer Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={availableQuantity || 1}
                                        className="input-field font-bold text-lg"
                                        placeholder="0"
                                        value={form.quantity}
                                        onChange={handleQuantityChange}
                                        required
                                        disabled={!form.sourceBaseId || !form.equipmentTypeId}
                                    />
                                    {availableQuantity === 0 && form.sourceBaseId && form.equipmentTypeId && (
                                        <p className="text-xs text-status-danger mt-1">No available inventory for selected equipment.</p>
                                    )}
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || availableQuantity === 0 || form.quantity <= 0 || form.quantity > availableQuantity}
                                        className="btn-primary"
                                    >
                                        {submitting ? 'Executing...' : 'Execute Transfer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <div className="card !p-0">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search transfers..."
                            className="input-field pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-text-secondary">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-military-500 mb-4"></div>
                            Loading transfer history...
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="table-header">
                                    <th className="py-3 px-4 font-semibold uppercase">Transfer ID</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-center">Route (Source → Dest)</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Equipment</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-right">Quantity</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-center">Status</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Date</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransfers.length > 0 ? filteredTransfers.map(t => (
                                    <tr key={t.id} className="table-row">
                                        <td className="table-cell">
                                            <span className="font-mono text-xs text-gray-500">TRN-{t.id.toString().padStart(5, '0')}</span>
                                        </td>
                                        <td className="table-cell">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="font-medium text-text-main truncate max-w-[120px]">{t.sourceBase?.name}</span>
                                                <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                                                <span className="font-medium text-text-main truncate max-w-[120px]">{t.destinationBase?.name}</span>
                                            </div>
                                        </td>
                                        <td className="table-cell font-medium">
                                            {t.equipmentType?.name}
                                        </td>
                                        <td className="table-cell text-right font-bold text-text-main">
                                            {t.quantity}
                                        </td>
                                        <td className="table-cell text-center">
                                            <span className={getStatusStyle(t.status)}>{t.status}</span>
                                        </td>
                                        <td className="table-cell text-text-secondary text-xs">
                                            {new Date(t.timestamp).toLocaleDateString()}
                                        </td>
                                        <td className="table-cell text-center">
                                            {t.status === 'IN_TRANSIT' && (user?.role === 'ADMIN' || user?.baseId === t.destinationBaseId) ? (
                                                <button
                                                    onClick={() => handleCompleteTransfer(t.id)}
                                                    disabled={actionId === t.id}
                                                    className="btn-primary py-1 px-3 text-xs w-full justify-center max-w-[100px] mx-auto"
                                                >
                                                    {actionId === t.id ? 'Working...' : 'Receive'}
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-text-secondary bg-gray-50">
                                            No transfer records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Transfers;
