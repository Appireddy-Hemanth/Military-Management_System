import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Plus, Search, Map as MapIcon, X } from 'lucide-react';
import Unauthorized from './Unauthorized';

const Bases = () => {
    const { user } = useContext(AuthContext);
    const [bases, setBases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Add Base Modal state
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ id: null, name: '', location: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (user?.role !== 'ADMIN') {
        return <Unauthorized />;
    }

    useEffect(() => {
        fetchBases();
    }, []);

    const fetchBases = () => {
        setLoading(true);
        api.get('/bases')
            .then(res => setBases(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleCreateBase = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            if (form.id) {
                await api.put(`/bases/${form.id}`, { name: form.name, location: form.location });
                alert('Base updated successfully.');
            } else {
                await api.post('/bases', { name: form.name, location: form.location });
                alert('Base commissioned successfully.');
            }
            setShowModal(false);
            setForm({ id: null, name: '', location: '' });
            fetchBases();
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to save base.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (base) => {
        setForm({ id: base.id, name: base.name, location: base.location });
        setShowModal(true);
    };

    const handleViewClick = (base) => {
        alert(`Base ID: BASE-${base.id.toString().padStart(3, '0')}\nName: ${base.name}\nLocation: ${base.location}\nStatus: OPERATIONAL`);
    };

    const filteredBases = bases.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <MapIcon size={24} className="text-military-600" /> Military Bases
                    </h2>
                    <p className="text-text-secondary mt-1">Manage military installations and base locations</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary flex-shrink-0">
                    <Plus size={18} /> Add Base
                </button>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-text-main">{form.id ? 'Edit Base Details' : 'Commission New Base'}</h3>
                            <button onClick={() => { setShowModal(false); setForm({ id: null, name: '', location: '' }); }} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="bg-red-50 text-status-danger p-3 rounded-md border border-red-200 mb-6 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleCreateBase} className="space-y-5">
                                <div>
                                    <label className="input-label">Base Designation</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. Fort Alpha"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="input-label">Geolocational Sector</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. Sector 7G, Northern Territory"
                                        value={form.location}
                                        onChange={e => setForm({ ...form, location: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                    <button type="button" onClick={() => { setShowModal(false); setForm({ id: null, name: '', location: '' }); }} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !form.name || !form.location}
                                        className="btn-primary"
                                    >
                                        {submitting ? 'Saving...' : (form.id ? 'Save Changes' : 'Commission Base')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <div className="card !p-0 border-t-0 shadow-sm border-gray-200">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search bases..."
                            className="input-field pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-text-secondary">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-military-500 mb-4"></div>
                            Loading installations...
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="table-header">
                                    <th className="py-3 px-4 font-semibold uppercase">Base ID</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Designation</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Location</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-center">Status</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBases.length > 0 ? filteredBases.map(b => (
                                    <tr key={b.id} className="table-row">
                                        <td className="table-cell">
                                            <span className="font-mono text-xs text-gray-500">BASE-{b.id.toString().padStart(3, '0')}</span>
                                        </td>
                                        <td className="table-cell font-bold text-text-main">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-military-500 hidden sm:block" />
                                                {b.name}
                                            </div>
                                        </td>
                                        <td className="table-cell text-text-secondary">{b.location}</td>
                                        <td className="table-cell text-center">
                                            <span className="badge-success">OPERATIONAL</span>
                                        </td>
                                        <td className="table-cell">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleViewClick(b)} className="text-military-600 hover:text-military-800 text-sm font-medium pr-2 border-r border-gray-200">View</button>
                                                <button onClick={() => handleEditClick(b)} className="text-military-600 hover:text-military-800 text-sm font-medium pl-2">Edit</button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-text-secondary bg-gray-50">
                                            No installations found.
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

export default Bases;
