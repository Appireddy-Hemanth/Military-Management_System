import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Wrench, Plus, CheckCircle, Search, Filter } from 'lucide-react';
import ExportCSV from '../components/ExportCSV';

const Maintenance = () => {
    const { user } = useContext(AuthContext);
    const [maintenances, setMaintenances] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    const [form, setForm] = useState({
        assetId: '', type: 'PREVENTATIVE', priority: 'MEDIUM', description: '', scheduledDate: ''
    });

    useEffect(() => {
        fetchData();
        fetchAssets();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reports/maintenance'); // using report controller or maintenance controller
            // Wait, we have /maintenance endpoint!
            const mainRes = await api.get('/maintenance');
            setMaintenances(mainRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssets = async () => {
        try {
            const res = await api.get('/assets');
            setAssets(res.data);
        } catch (e) { }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/maintenance', {
                ...form, assetId: parseInt(form.assetId)
            });
            setShowModal(false);
            setForm({ assetId: '', type: 'PREVENTATIVE', priority: 'MEDIUM', description: '', scheduledDate: '' });
            fetchData();
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to schedule maintenance');
        }
    }

    const handleComplete = async (id) => {
        if (!confirm('Mark maintenance as completed?')) return;
        try {
            await api.put(`/maintenance/${id}`, { status: 'COMPLETED' });
            fetchData();
        } catch (e) { }
    }

    const getStatusStyle = (status) => {
        if (status === 'COMPLETED') return 'badge-success';
        if (status === 'IN_PROGRESS') return 'badge-info';
        if (status === 'OVERDUE') return 'badge-danger';
        if (status === 'CANCELLED') return 'badge-gray';
        return 'badge-warning'; // SCHEDULED
    };

    const getPriorityStyle = (priority) => {
        if (priority === 'CRITICAL') return 'text-red-700 bg-red-100 px-2 py-0.5 rounded text-xs font-bold';
        if (priority === 'HIGH') return 'text-orange-700 bg-orange-100 px-2 py-0.5 rounded text-xs font-bold';
        if (priority === 'MEDIUM') return 'text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-xs font-bold';
        return 'text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs font-bold';
    };

    const filteredRecords = maintenances.filter(m =>
        (m.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.asset?.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <Wrench size={24} className="text-military-600" /> Maintenance
                    </h2>
                    <p className="text-text-secondary mt-1">Schedule and track asset maintenance</p>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="input-field pl-9 h-10 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {user?.role !== 'ADMIN' && (
                        <button className="btn-primary h-10" onClick={() => setShowModal(true)}>
                            <Plus size={16} /> Schedule
                        </button>
                    )}
                </div>
            </div>

            <div className="card p-0">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead>
                            <tr className="table-header">
                                <th className="text-left font-semibold py-3 px-4 rounded-tl-lg">ID / Asset</th>
                                <th className="text-left font-semibold py-3 px-4">Task Details</th>
                                <th className="text-left font-semibold py-3 px-4">Priority</th>
                                <th className="text-left font-semibold py-3 px-4">Status</th>
                                <th className="text-left font-semibold py-3 px-4">Date scheduled</th>
                                <th className="text-right font-semibold py-3 px-4 rounded-tr-lg">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((m) => (
                                    <tr key={m.id} className="table-row">
                                        <td className="table-cell">
                                            <div className="font-medium text-text-main">MNT-{m.id}</div>
                                            <div className="text-xs text-text-secondary">{m.asset?.equipmentType?.name || `Asset #${m.assetId}`}</div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="font-medium">{m.type}</div>
                                            <div className="text-xs text-text-secondary truncate max-w-[200px]" title={m.description}>{m.description}</div>
                                        </td>
                                        <td className="table-cell">
                                            <span className={getPriorityStyle(m.priority)}>{m.priority}</span>
                                        </td>
                                        <td className="table-cell">
                                            <span className={getStatusStyle(m.status)}>{m.status}</span>
                                        </td>
                                        <td className="table-cell text-sm text-text-secondary">
                                            {m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString() : 'Unscheduled'}
                                        </td>
                                        <td className="table-cell text-right">
                                            {m.status !== 'COMPLETED' && m.status !== 'CANCELLED' && (
                                                <button onClick={() => handleComplete(m.id)} className="text-status-success hover:bg-green-50 p-1.5 rounded transition-colors" title="Mark Completed">
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-text-secondary">
                                        No maintenance records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-text-main">Schedule Maintenance</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="input-label">Asset</label>
                                <select
                                    className="input-field"
                                    value={form.assetId}
                                    onChange={e => setForm({ ...form, assetId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Asset</option>
                                    {assets.map(a => (
                                        <option key={a.id} value={a.id}>{a.equipmentType?.name || `Asset #${a.id}`} - {a.status}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="input-label">Type</label>
                                    <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="PREVENTATIVE">Preventative</option>
                                        <option value="REPAIR">Repair</option>
                                        <option value="INSPECTION">Inspection</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Priority</label>
                                    <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="CRITICAL">Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Scheduled Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={form.scheduledDate}
                                    onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="input-label">Description</label>
                                <textarea
                                    className="input-field h-24 resize-none"
                                    placeholder="Describe the maintenance task..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    required
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-2 border-t mt-4 border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Schedule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Maintenance;
