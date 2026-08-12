import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Users as UsersIcon, Plus, X, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Users = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [bases, setBases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // UI states
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [form, setForm] = useState({ username: '', password: '', role: 'LOGISTICS_OFFICER', baseId: '' });

    if (user?.role !== 'ADMIN') {
        return <Navigate to="/unauthorized" />;
    }

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [uRes, bRes] = await Promise.all([
                api.get('/users'),
                api.get('/bases').catch(() => ({ data: [] }))
            ]);
            setUsers(uRes.data);
            setBases(bRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const payload = { ...form };
            if (payload.role === 'ADMIN') {
                delete payload.baseId;
            } else {
                payload.baseId = payload.baseId ? parseInt(payload.baseId) : null;
            }

            await api.post('/users', payload);
            setShowModal(false);
            setForm({ username: '', password: '', role: 'LOGISTICS_OFFICER', baseId: '' });
            showSuccess('User created successfully.');
            fetchData();
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to create user.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!showDeleteConfirm) return;
        try {
            await api.delete(`/users/${showDeleteConfirm.id}`);
            setShowDeleteConfirm(null);
            showSuccess('User deleted successfully.');
            fetchData();
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to delete user.');
            setShowDeleteConfirm(null);
        }
    };

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'ADMIN': return <span className="badge-danger text-xs">{role}</span>;
            case 'BASE_COMMANDER': return <span className="badge-warning text-xs">{role.replace('_', ' ')}</span>;
            case 'LOGISTICS_OFFICER': return <span className="badge-info text-xs">{role.replace('_', ' ')}</span>;
            default: return <span className="badge-gray text-xs">{role}</span>;
        }
    };

    const filteredUsers = users.filter(u =>
        (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto relative">

            {/* Success Toast */}
            {successMessage && (
                <div className="absolute top-0 right-0 bg-status-success text-white px-4 py-3 rounded shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 z-50">
                    <CheckCircle size={18} />
                    <span className="font-medium text-sm">{successMessage}</span>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <UsersIcon size={24} className="text-military-600" /> Users & Personnel
                    </h2>
                    <p className="text-text-secondary mt-1">Manage system access and roles</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary flex-shrink-0">
                    <Plus size={18} /> Add User
                </button>
            </div>

            {/* Error Message */}
            {error && !showModal && (
                <div className="bg-red-50 text-status-danger p-4 rounded-md border border-red-200 text-sm flex items-center gap-2">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 p-6">
                        <h3 className="text-lg font-bold text-text-main mb-2">Delete User</h3>
                        <p className="text-text-secondary text-sm mb-6">
                            Are you sure you want to permanently delete <strong>{showDeleteConfirm.username}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3 cursor-pointer">
                            <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">Cancel</button>
                            <button onClick={handleDeleteUser} className="btn-primary bg-status-danger hover:bg-red-700">Confirm Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-text-main">Provision New User</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            {error && (
                                <div className="bg-red-50 text-status-danger p-3 rounded-md border border-red-200 mb-6 text-sm flex items-center gap-2">
                                    <AlertTriangle size={16} /> {error}
                                </div>
                            )}
                            <form onSubmit={handleCreateUser} className="space-y-5">
                                <div>
                                    <label className="input-label">Username</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={form.username}
                                        onChange={e => setForm({ ...form, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Role</label>
                                    <select
                                        className="input-field"
                                        value={form.role}
                                        onChange={e => setForm({ ...form, role: e.target.value })}
                                        required
                                    >
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="BASE_COMMANDER">BASE COMMANDER</option>
                                        <option value="LOGISTICS_OFFICER">LOGISTICS OFFICER</option>
                                    </select>
                                </div>
                                {form.role !== 'ADMIN' && (
                                    <div>
                                        <label className="input-label">Assigned Base</label>
                                        <select
                                            className="input-field"
                                            value={form.baseId}
                                            onChange={e => setForm({ ...form, baseId: e.target.value })}
                                            required={form.role !== 'ADMIN'}
                                        >
                                            <option value="">Select Base...</option>
                                            {bases.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submitting} className="btn-primary">
                                        {submitting ? 'Creating...' : 'Create User'}
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
                            placeholder="Search users..."
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
                            Loading personnel data...
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="table-header">
                                    <th className="py-3 px-4 font-semibold uppercase">Username</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Role</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Assigned Base</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-center">Status</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Created At</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                    <tr key={u.id} className="table-row">
                                        <td className="table-cell font-medium text-text-main">{u.username}</td>
                                        <td className="table-cell">{getRoleBadge(u.role)}</td>
                                        <td className="table-cell text-text-secondary">
                                            {bases.find(b => b.id === u.baseId)?.name || (u.role === 'ADMIN' ? 'GLOBAL COMMAND' : '-')}
                                        </td>
                                        <td className="table-cell text-center">
                                            <span className="badge-success">ACTIVE</span>
                                        </td>
                                        <td className="table-cell text-text-secondary text-xs">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="table-cell">
                                            <button
                                                onClick={() => setShowDeleteConfirm({ id: u.id, username: u.username })}
                                                className="text-status-danger hover:text-red-800 text-sm font-medium"
                                                disabled={user.id === u.id}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-text-secondary bg-gray-50">
                                            No personnel found.
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

export default Users;
