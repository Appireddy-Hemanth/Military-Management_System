import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { UserCheck, CheckCircle, XCircle } from 'lucide-react';
import ExportCSV from '../components/ExportCSV';
import { io } from 'socket.io-client';

const Approvals = () => {
    const { user } = useContext(AuthContext);
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();

        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const socket = io(socketUrl);

        socket.on('connect', () => {
            if (user) {
                socket.emit('join', user.role);
            }
        });

        socket.on('approvalUpdate', (payload) => {
            fetchData();
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/approvals');
            setApprovals(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        if (!confirm(`Are you sure you want to ${action} this request?`)) return;
        try {
            await api.put(`/approvals/${id}/${action}`, action === 'reject' ? { reason: 'No specific reason' } : {});
            fetchData();
        } catch (e) {
            alert(e.response?.data?.error || `Failed to ${action}`);
        }
    }

    const getStatusStyle = (status) => {
        if (status === 'APPROVED') return 'badge-success';
        if (status === 'PENDING') return 'badge-warning';
        if (status === 'REJECTED') return 'badge-danger';
        return 'badge-gray';
    };

    if (loading) return <div className="text-center mt-12 text-gray-500">Loading Approvals...</div>;

    const formattedData = approvals.map(a => ({
        ID: a.id,
        Type: a.requestType,
        Status: a.status,
        Date: new Date(a.createdAt).toLocaleString()
    }));

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <UserCheck size={24} className="text-military-600" /> Approvals
                    </h2>
                    <p className="text-text-secondary mt-1">Review pending operations requests</p>
                </div>
                <div className="flex gap-2">
                    <ExportCSV data={formattedData} filename="Approvals_Report.csv" />
                </div>
            </div>

            <div className="card p-0">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead>
                            <tr className="table-header">
                                <th className="text-left font-semibold py-3 px-4 rounded-tl-lg">ID / Type</th>
                                <th className="text-left font-semibold py-3 px-4">Details</th>
                                <th className="text-left font-semibold py-3 px-4">Status</th>
                                <th className="text-left font-semibold py-3 px-4">Date</th>
                                <th className="text-right font-semibold py-3 px-4 rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvals.length > 0 ? (
                                approvals.map((app) => (
                                    <tr key={app.id} className="table-row">
                                        <td className="table-cell">
                                            <div className="font-medium text-text-main">REQ-{app.id}</div>
                                            <div className="text-xs text-text-secondary">{app.requestType}</div>
                                        </td>
                                        <td className="table-cell">
                                            {app.details ? (
                                                <div className="text-sm">
                                                    {app.requestType === 'TRANSFER' && (
                                                        <span>Transfer {app.details.quantity} x {app.details.equipmentType?.name} from {app.details.sourceBase?.name} to {app.details.destinationBase?.name}</span>
                                                    )}
                                                    {app.requestType === 'PURCHASE' && (
                                                        <span>Purchase {app.details.quantity} x {app.details.equipmentType?.name} for {app.details.base?.name}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">No details found</span>
                                            )}
                                        </td>
                                        <td className="table-cell">
                                            <span className={getStatusStyle(app.status)}>{app.status}</span>
                                        </td>
                                        <td className="table-cell text-text-secondary text-sm">
                                            {new Date(app.createdAt).toLocaleString()}
                                        </td>
                                        <td className="table-cell text-right">
                                            {app.status === 'PENDING' && (user.role === 'ADMIN' || user.role === 'BASE_COMMANDER') ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleAction(app.id, 'approve')} className="text-status-success hover:bg-green-50 p-1.5 rounded transition-colors" title="Approve">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button onClick={() => handleAction(app.id, 'reject')} className="text-status-danger hover:bg-red-50 p-1.5 rounded transition-colors" title="Reject">
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Reviewed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-text-secondary">
                                        No approval requests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Approvals;
