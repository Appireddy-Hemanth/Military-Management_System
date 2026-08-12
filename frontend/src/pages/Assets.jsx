import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Package, Search, Filter, AlertTriangle } from 'lucide-react';
import ExportCSV from '../components/ExportCSV';

const Assets = () => {
    const { user } = useContext(AuthContext);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/assets');
            setAssets(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'AVAILABLE': return <span className="badge-success">AVAILABLE</span>;
            case 'ASSIGNED': return <span className="badge-info">ASSIGNED</span>;
            case 'MAINTENANCE': return <span className="badge-warning">MAINTENANCE</span>;
            case 'EXPENDED': return <span className="badge-danger">EXPENDED</span>;
            case 'IN_TRANSIT': return <span className="badge-purple">IN_TRANSIT</span>;
            default: return <span className="badge-gray">{status}</span>;
        }
    };

    const filteredAssets = assets.filter(a =>
        (a.equipmentType?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.equipmentType?.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.base?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const csvColumns = [
        { label: 'ID', value: (row) => row.id },
        { label: 'Category', value: (row) => row.equipmentType?.category },
        { label: 'Equipment', value: (row) => row.equipmentType?.name },
        { label: 'Serial Number', value: (row) => row.serialNumber || 'N/A' },
        { label: 'Base', value: (row) => row.base?.name },
        { label: 'Quantity', value: (row) => row.quantity },
        { label: 'Status', value: (row) => row.status }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <Package size={24} className="text-military-600" /> Asset Directory
                    </h2>
                    <p className="text-text-secondary mt-1">Manage and track military assets across {user?.role === 'ADMIN' ? 'all installations' : 'your jurisdiction'}</p>
                </div>
                <div className="flex gap-2 items-center">
                    <ExportCSV data={filteredAssets} filename="military-assets-inventory" columns={csvColumns} />
                </div>
            </div>

            {/* Quick Stats tailored to role */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card border-l-4 border-l-military-600">
                    <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Total Catalogued</p>
                    <p className="text-2xl font-bold text-text-main">{filteredAssets.reduce((sum, item) => sum + item.quantity, 0)}</p>
                </div>
                <div className="card border-l-4 border-l-green-500">
                    <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Available Stock</p>
                    <p className="text-2xl font-bold text-text-main">{filteredAssets.filter(a => a.status === 'AVAILABLE').reduce((sum, item) => sum + item.quantity, 0)}</p>
                </div>
                <div className="card border-l-4 border-l-amber-500">
                    <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">In Maintenance</p>
                    <p className="text-2xl font-bold text-text-main">{filteredAssets.filter(a => a.status === 'MAINTENANCE').reduce((sum, item) => sum + item.quantity, 0)}</p>
                </div>
                <div className="card bg-military-50 border border-military-100 flex items-center justify-center p-4">
                    {user?.role === 'ADMIN' ? (
                        <div className="text-center">
                            <span className="text-sm font-bold text-military-700 block">GLOBAL VIEW</span>
                            <span className="text-xs text-military-500">All military bases</span>
                        </div>
                    ) : (
                        <div className="text-center flex flex-col items-center">
                            <span className="text-sm font-bold text-military-700 block text-center uppercase">{user?.baseId ? `LOCAL VIEW (BASE ${user.baseId})` : 'RESTRICTED'}</span>
                            <span className="text-xs text-military-500">Command level filtering active</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="card !p-0">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search assets, categories, serials..."
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
                            Loading asset registry...
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="table-header">
                                    <th className="py-3 px-4 font-semibold uppercase">Equipment Details</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Serial / ID</th>
                                    <th className="py-3 px-4 font-semibold uppercase">Installation</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-right">Quantity</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-center">Status</th>
                                    <th className="py-3 px-4 font-semibold uppercase text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssets.length > 0 ? (
                                    filteredAssets.map(asset => (
                                        <tr key={asset.id} className="table-row">
                                            <td className="table-cell">
                                                <div className="font-bold text-text-main">{asset.equipmentType?.name}</div>
                                                <div className="text-xs text-text-secondary uppercase">{asset.equipmentType?.category}</div>
                                            </td>
                                            <td className="table-cell font-mono text-sm text-gray-600">
                                                {asset.serialNumber ? (
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{asset.serialNumber}</span>
                                                ) : <span className="text-gray-400">BULK_ITEM</span>}
                                            </td>
                                            <td className="table-cell font-medium text-military-800">{asset.base?.name || '-'}</td>
                                            <td className="table-cell text-right text-lg font-bold">{asset.quantity}</td>
                                            <td className="table-cell text-center">{getStatusBadge(asset.status)}</td>
                                            <td className="table-cell text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => alert(`View details for Asset ${asset.id}`)} className="text-military-600 hover:text-military-800 text-sm font-medium transition-colors border border-military-200 px-2 rounded bg-white hover:bg-military-50">View Details</button>

                                                    {/* Role-Specific Actions: Only ADMIN can directly alter core asset entries manually outside of standard operational flows */}
                                                    {user?.role === 'ADMIN' && (
                                                        <button onClick={() => alert(`Override activated for Asset ${asset.id}. Contacting command...`)} className="text-blue-600 hover:bg-blue-50 text-sm font-medium border border-blue-200 px-2 rounded">Override</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-text-secondary bg-gray-50">
                                            <div className="flex flex-col items-center justify-center">
                                                <AlertTriangle size={32} className="text-gray-300 mb-2" />
                                                <p>No matching assets found in the registry.</p>
                                            </div>
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

export default Assets;
