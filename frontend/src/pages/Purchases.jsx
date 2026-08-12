import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { ShoppingCart, Plus, X, Search } from 'lucide-react';
import ExportCSV from '../components/ExportCSV';

const Purchases = () => {
    const { user } = useContext(AuthContext);
    const [purchases, setPurchases] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ baseId: '', equipmentTypeId: '', quantity: '', referenceNumber: '' });
    const [bases, setBases] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, eRes] = await Promise.all([
                api.get('/purchases'),
                api.get('/equipment-types')
            ]);
            setPurchases(pRes.data);
            setEquipment(eRes.data);

            if (user?.role === 'ADMIN') {
                const bRes = await api.get('/bases');
                setBases(bRes.data);
            } else if (user?.baseId) {
                const bRes = await api.get(`/bases/${user.baseId}`);
                setBases([bRes.data]);
                setForm(prev => ({ ...prev, baseId: bRes.data.id }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await api.post('/purchases', { ...form, quantity: parseInt(form.quantity) });
            setShowModal(false);
            setForm({ baseId: user?.role === 'ADMIN' ? '' : user?.baseId || '', equipmentTypeId: '', quantity: '', referenceNumber: '' });

            // Show toast visually (in a real app we'd use a toast library context)
            alert('Purchase recorded successfully.');

            fetchData();
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to record purchase.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredPurchases = purchases.filter(p =>
        (p.referenceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.equipmentType?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.base?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const csvColumns = [
        { label: 'Date', value: (row) => new Date(row.purchaseDate).toLocaleDateString() },
        { label: 'Reference Number', value: (row) => row.referenceNumber },
        { label: 'Base', value: (row) => row.base?.name },
        { label: 'Equipment', value: (row) => row.equipmentType?.name },
        { label: 'Quantity', value: (row) => row.quantity },
        { label: 'Created By', value: (row) => row.createdBy?.username || '' }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <ShoppingCart size={24} className="text-military-600" /> Purchases
                    </h2>
                    <p className="text-text-secondary mt-1">Record and manage incoming military assets</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <ExportCSV data={filteredPurchases} filename="purchases-report" columns={csvColumns} />
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        <Plus size={18} /> Record Purchase
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-text-main">Record New Purchase</h3>
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

                            {user?.role !== 'ADMIN' && !user?.baseId && (
                                <div className="bg-orange-50 text-orange-700 p-3 rounded-md border border-orange-200 mb-6 text-sm">
                                    Warning: Your account has no Installation Base permanently assigned to it. Please contact an Administrator.
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="input-label">Destination Base</label>
                                    <select
                                        className="input-field"
                                        value={form.baseId}
                                        onChange={e => setForm({ ...form, baseId: e.target.value })}
                                        required
                                        disabled={user?.role !== 'ADMIN'}
                                    >
                                        <option value="">Select Base...</option>
                                        {bases.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="input-label">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="input-field"
                                            placeholder="e.g. 100"
                                            value={form.quantity}
                                            onChange={e => setForm({ ...form, quantity: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="input-label">Date</label>
                                        <input
                                            type="date"
                                            className="input-field text-sm"
                                            value={form.purchaseDate || new Date().toISOString().split('T')[0]}
                                            onChange={e => setForm({ ...form, purchaseDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="input-label">Reference Number (PO ID)</label>
                                    <input
                                        type="text"
                                        className="input-field font-mono"
                                        placeholder="e.g. PO-2026-XYZ"
                                        value={form.referenceNumber}
                                        onChange={e => setForm({ ...form, referenceNumber: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submitting} className="btn-primary">
                                        {submitting ? 'Recording...' : 'Submit Purchase'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <div className="card !p-0">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search records..."
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
                            Loading purchase history...
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="table-header">
                                    <th className="py-3 px-4 font-semibold uppercase">Date</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Reference</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Base</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Equipment</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-right">Quantity</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Created By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPurchases.length > 0 ? filteredPurchases.map(p => (
                                    <tr key={p.id} className="table-row">
                                        <td className="table-cell whitespace-nowrap">
                                            {new Date(p.purchaseDate).toLocaleDateString()}
                                        </td>
                                        <td className="table-cell">
                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">
                                                {p.referenceNumber}
                                            </span>
                                        </td>
                                        <td className="table-cell font-medium text-text-main">
                                            {p.base?.name || 'Unknown'}
                                        </td>
                                        <td className="table-cell">
                                            {p.equipmentType?.name}
                                        </td>
                                        <td className="table-cell text-right">
                                            <span className="text-status-success font-bold bg-green-50 px-2 py-1 rounded">
                                                +{p.quantity}
                                            </span>
                                        </td>
                                        <td className="table-cell text-text-secondary text-xs">
                                            {p.createdBy?.username || '-'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-text-secondary bg-gray-50">
                                            No purchase records found.
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

export default Purchases;
