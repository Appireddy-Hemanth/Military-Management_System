import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Receipt, Plus, X, Search } from 'lucide-react';
import ExportCSV from '../components/ExportCSV';

const Expenditures = () => {
    const { user } = useContext(AuthContext);
    const [expenditures, setExpenditures] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ baseId: '', equipmentTypeId: '', reason: '', quantity: '' });
    const [bases, setBases] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [assets, setAssets] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            setForm(prev => ({ ...prev, baseId: user.baseId }));
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expRes, eRes, bRes, aRes] = await Promise.all([
                api.get('/expenditures'),
                api.get('/equipment-types'),
                api.get('/bases').catch(() => ({ data: [] })),
                api.get('/assets')
            ]);
            setExpenditures(expRes.data);
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
        if (!form.baseId || !form.equipmentTypeId) return 0;
        const matchingAssets = assets.filter(a =>
            a.baseId === parseInt(form.baseId) &&
            a.equipmentTypeId === parseInt(form.equipmentTypeId) &&
            a.status === 'AVAILABLE'
        );
        return matchingAssets.reduce((sum, a) => sum + a.quantity, 0);
    }, [form.baseId, form.equipmentTypeId, assets]);

    const handleQuantityChange = (e) => {
        const val = parseInt(e.target.value) || 0;
        setForm({ ...form, quantity: val });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.quantity > availableQuantity) {
            setError("Expenditure quantity exceeds available stock.");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/expenditures', { ...form, quantity: parseInt(form.quantity) });
            setShowModal(false);
            setForm({ baseId: user?.role === 'ADMIN' ? '' : user?.baseId, equipmentTypeId: '', reason: '', quantity: '' });
            setError('');
            alert('Expenditure recorded successfully.');
            fetchData();
        } catch (e) {
            setError(e.response?.data?.error || 'Expenditure failed');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredExpenditures = expenditures.filter(a =>
        (a.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.equipmentType?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.base?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const csvColumns = [
        { label: 'Date', value: (row) => new Date(row.expenditureDate).toLocaleDateString() },
        { label: 'Equipment', value: (row) => row.equipmentType?.name },
        { label: 'Base', value: (row) => row.base?.name },
        { label: 'Reason', value: (row) => row.reason },
        { label: 'Quantity Expended', value: (row) => row.quantity }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <Receipt size={24} className="text-military-600" /> Expenditures
                    </h2>
                    <p className="text-text-secondary mt-1">Record consumed or expended assets</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <ExportCSV data={filteredExpenditures} filename="expenditures-log" columns={csvColumns} />
                    <button onClick={() => setShowModal(true)} className="btn-danger">
                        <Plus size={18} /> Record Expenditure
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-text-main">Record Asset Expenditure</h3>
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
                                <div>
                                    <label className="input-label">Installation Base</label>
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
                                    <label className="input-label">Equipment Category</label>
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
                                {form.baseId && form.equipmentTypeId && (
                                    <div className="bg-military-100 p-4 rounded-lg border border-military-border flex justify-between items-center font-mono">
                                        <div className="text-center">
                                            <div className="text-xs text-text-secondary mb-1">AVAILABLE</div>
                                            <div className="text-lg font-bold text-text-main">{availableQuantity}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-text-secondary mb-1">EXPENDITURE</div>
                                            <div className="text-lg font-bold text-status-danger">-{form.quantity || 0}</div>
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
                                    <label className="input-label">Quantity Expended</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={availableQuantity || 1}
                                        className="input-field font-bold text-lg"
                                        placeholder="0"
                                        value={form.quantity}
                                        onChange={handleQuantityChange}
                                        required
                                        disabled={!form.baseId || !form.equipmentTypeId}
                                    />
                                    {availableQuantity === 0 && form.baseId && form.equipmentTypeId && (
                                        <p className="text-xs text-status-danger mt-1">No inventory left to expend.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="input-label">Reason / Justification</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. Consumed during training exercise"
                                        value={form.reason}
                                        onChange={e => setForm({ ...form, reason: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || availableQuantity === 0 || form.quantity <= 0 || form.quantity > availableQuantity}
                                        className="btn-danger"
                                    >
                                        {submitting ? 'Recording...' : 'Record Expenditure'}
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
                            Loading expenditure records...
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="table-header">
                                    <th className="py-3 px-4 font-semibold uppercase">Date</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Equipment</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Base</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Reason</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-right">Quantity Expended</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenditures.length > 0 ? filteredExpenditures.map(e => (
                                    <tr key={e.id} className="table-row">
                                        <td className="table-cell whitespace-nowrap text-text-secondary">
                                            {new Date(e.expenditureDate).toLocaleDateString()}
                                        </td>
                                        <td className="table-cell font-medium text-text-main">
                                            {e.equipmentType?.name}
                                        </td>
                                        <td className="table-cell text-text-secondary">
                                            {e.base?.name}
                                        </td>
                                        <td className="table-cell text-gray-600 italic">
                                            {e.reason}
                                        </td>
                                        <td className="table-cell text-right font-bold text-status-danger">
                                            -{e.quantity}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-text-secondary bg-gray-50">
                                            No expenditure records found.
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

export default Expenditures;
