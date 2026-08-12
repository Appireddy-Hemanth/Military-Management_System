import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { FileClock, Search, Filter } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const AuditLogs = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    if (user?.role !== 'ADMIN') {
        return <Navigate to="/unauthorized" />;
    }

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/audit-logs');
            setLogs(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action) => {
        const type = action.split('_')[0];
        switch (type) {
            case 'LOGIN': return <span className="badge-info text-[10px]">{action}</span>;
            case 'PURCHASE': return <span className="badge-success text-[10px]">{action}</span>;
            case 'TRANSFER': return <span className="badge-purple text-[10px]">{action}</span>;
            case 'ASSIGNMENT': return <span className="badge-info text-[10px]">{action}</span>;
            case 'EXPENDITURE': return <span className="badge-danger text-[10px]">{action}</span>;
            case 'CREATE': return <span className="badge-success text-[10px]">{action}</span>;
            case 'UPDATE': return <span className="badge-warning text-[10px]">{action}</span>;
            case 'DELETE': return <span className="badge-danger text-[10px]">{action}</span>;
            default: return <span className="badge-gray text-[10px]">{action}</span>;
        }
    };

    const filteredLogs = logs.filter(l =>
        (l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.user?.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <FileClock size={24} className="text-military-600" /> Audit & Activity Logs
                    </h2>
                    <p className="text-text-secondary mt-1">Complete record of system activity</p>
                </div>
            </div>

            <div className="card !p-0">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search logs by user, action, or details..."
                            className="input-field pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-text-secondary">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-military-500 mb-4"></div>
                            Loading audit trail...
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="table-header">
                                    <th className="py-3 px-4 font-semibold uppercase">Timestamp</th>
                                    <th className="py-3 px-4 font-semibold uppercase">User</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Role</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Action</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Details</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map(log => (
                                        <tr key={log.id} className="table-row">
                                            <td className="table-cell whitespace-nowrap text-text-secondary font-mono text-xs">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="table-cell font-medium text-text-main">
                                                {log.user?.username || 'System'}
                                            </td>
                                            <td className="table-cell text-xs text-text-secondary">
                                                {log.user?.role || '-'}
                                            </td>
                                            <td className="table-cell">
                                                {getActionBadge(log.action)}
                                            </td>
                                            <td className="table-cell text-sm text-gray-600">
                                                {log.details}
                                            </td>
                                            <td className="table-cell text-center">
                                                <span className="text-status-success font-medium text-xs">SUCCESS</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-text-secondary bg-gray-50">
                                            No audit logs found matching your criteria.
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

export default AuditLogs;
