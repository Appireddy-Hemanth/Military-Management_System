import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { UserCheck, Plus, X, Search } from 'lucide-react';
import ExportCSV from '../components/ExportCSV';

const Assignments = () => {
    const { user } = useContext(AuthContext);
    const [assignments, setAssignments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ baseId: '', equipmentTypeId: '', personnelName: '', personnelId: '', quantity: '' });
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
            const [assRes, eRes, bRes, aRes] = await Promise.all([
                api.get('/assignments'),
                api.get('/equipment-types'),
                api.get('/bases').catch(() => ({ data: [] })),
                api.get('/assets')
            ]);
            setAssignments(assRes.data);
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
            setError("Assignment quantity exceeds available stock.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                baseId: form.baseId,
                equipmentTypeId: form.equipmentTypeId,
                quantity: parseInt(form.quantity),
                assignedTo: `${form.personnelName} (${form.personnelId})`,
                serialNumber: form.serialNumber || undefined
            };

            await api.post('/assignments', payload);
            setShowModal(false);
            setForm({ baseId: user?.role === 'ADMIN' ? '' : user?.baseId, equipmentTypeId: '', personnelName: '', personnelId: '', quantity: '', serialNumber: '' });
            setError('');
            alert('Assignment recorded successfully.');
            fetchData();
        } catch (e) {
            setError(e.response?.data?.error || 'Assignment failed');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredAssignments = assignments.filter(a =>
        (a.assignedTo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.personnelName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.personnelId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.equipmentType?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.base?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const csvColumns = [
        { label: 'Date', value: (row) => new Date(row.assignedDate).toLocaleDateString() },
        { label: 'Personnel', value: (row) => row.assignedTo || row.personnelName || '' },
        { label: 'Equipment', value: (row) => row.equipmentType?.name },
        { label: 'Serial Info', value: (row) => row.asset?.serialNumber || 'Bulk' },
        { label: 'Base', value: (row) => row.base?.name },
        { label: 'Quantity', value: (row) => row.quantity }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <UserCheck size={24} className="text-military-600" /> Assignments
                    </h2>
                    <p className="text-text-secondary mt-1">Track allocation of military assets to personnel</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <ExportCSV data={filteredAssignments} filename="personnel-assignments" columns={csvColumns} />
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        <Plus size={18} /> New Assignment
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-text-main">Allocate Assets</h3>
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
                                    <label className="input-label">Equipment to Assign</label>
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
                                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex justify-between items-center text-sm">
                                        <span className="text-status-info font-medium">Available Quantity:</span>
                                        <span className={`font-bold ${availableQuantity > 0 ? 'text-status-success' : 'text-status-danger'}`}>
                                            {availableQuantity} units
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <label className="input-label">Assign Quantity</label>
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
                                        <p className="text-xs text-status-danger mt-1">No available inventory to assign.</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="input-label flex justify-between">
                                            <span>Scan / Enter Barcode (Optional)</span>
                                            <span className="text-xs text-military-600 bg-military-100 px-2 rounded">Beta</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input-field text-military-900 font-mono tracking-widest"
                                            placeholder="||||||||||||||||||| | | || (Serial Number)"
                                            value={form.serialNumber || ''}
                                            onChange={e => setForm({ ...form, serialNumber: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="input-label">Personnel Name</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="John Doe"
                                            value={form.personnelName}
                                            onChange={e => setForm({ ...form, personnelName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="input-label">Service ID</label>
                                        <input
                                            type="text"
                                            className="input-field font-mono"
                                            placeholder="SRV-12345"
                                            value={form.personnelId}
                                            onChange={e => setForm({ ...form, personnelId: e.target.value })}
                                            required
                                        />
                                    </div>
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
                                        {submitting ? 'Recording...' : 'Assign Asset'}
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
                            placeholder="Search assignments..."
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
                            Loading active assignments...
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="table-header">
                                    <th className="py-3 px-4 font-semibold uppercase">Personnel</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Service ID</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Equipment</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Base</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-right">Quantity</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-center">Status</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssignments.length > 0 ? filteredAssignments.map(a => (
                                    <tr key={a.id} className="table-row">
                                        <td className="table-cell font-medium text-text-main">
                                            {a.assignedTo ? a.assignedTo.split(' (')[0] : 'Unknown'}
                                        </td>
                                        <td className="table-cell font-mono text-xs text-gray-500">
                                            {a.assignedTo && a.assignedTo.includes('(') ? a.assignedTo.split(' (')[1].replace(')', '') : 'N/A'}
                                        </td>
                                        <td className="table-cell">
                                            {a.equipmentType?.name}
                                        </td>
                                        <td className="table-cell text-text-secondary">
                                            {a.base?.name}
                                        </td>
                                        <td className="table-cell text-right font-bold text-status-info">
                                            {a.quantity}
                                        </td>
                                        <td className="table-cell text-center">
                                            <span className="badge-info">ACTIVE</span>
                                        </td>
                                        <td className="table-cell text-text-secondary text-xs">
                                            {new Date(a.assignedDate).toLocaleDateString()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-text-secondary bg-gray-50">
                                            No active assignments found.
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

export default Assignments;
