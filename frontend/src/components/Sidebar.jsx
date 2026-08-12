import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Shield, LayoutDashboard, Package, MapPin, ShoppingCart, ArrowLeftRight, UserCheck, Receipt, BarChart3, FileClock, Users, Settings, LogOut, Wrench } from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);

    const navItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { label: 'Assets', path: '/assets', icon: Package, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { label: 'Bases', path: '/bases', icon: MapPin, roles: ['ADMIN'] },
        { label: 'Purchases', path: '/purchases', icon: ShoppingCart, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { label: 'Transfers', path: '/transfers', icon: ArrowLeftRight, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { label: 'Approvals', path: '/approvals', icon: UserCheck, roles: ['ADMIN', 'BASE_COMMANDER'] },
        { label: 'Assignments', path: '/assignments', icon: UserCheck, roles: ['ADMIN', 'BASE_COMMANDER'] },
        { label: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { label: 'Expenditures', path: '/expenditures', icon: Receipt, roles: ['ADMIN', 'BASE_COMMANDER'] },
        { label: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { label: 'Audit Logs', path: '/audit', icon: FileClock, roles: ['ADMIN'] },
        { label: 'Users', path: '/users', icon: Users, roles: ['ADMIN'] },
        { label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
    ];

    return (
        <div className="w-64 bg-military-800 h-full flex flex-col text-slate-300 shadow-xl z-20">
            <div className="h-16 flex items-center gap-3 px-5 border-b border-military-700 bg-military-900 shrink-0">
                <Shield className="text-military-400" size={24} />
                <div className="flex flex-col">
                    <span className="font-bold text-white tracking-widest text-sm leading-tight">M.A.M.S.</span>
                    <span className="text-[10px] text-military-400 uppercase tracking-wide leading-tight">Asset Management</span>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                <ul className="space-y-1 px-3">
                    {navItems.filter(item => item.roles.includes(user?.role)).map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-sm font-medium ${isActive ? 'bg-military-500 text-white shadow-sm' : 'text-gray-300 hover:bg-military-700 hover:text-white'}`
                                }
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-military-700 shrink-0">
                <div className="bg-military-900 rounded-lg p-3 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-military-600 flex items-center justify-center text-white font-bold text-sm">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold text-white truncate">{user?.username}</span>
                            <span className="text-[10px] text-gray-400 truncate">{user?.role}</span>
                        </div>
                    </div>
                    <button onClick={logout} className="flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-white hover:bg-military-700 py-1.5 px-2 rounded transition-colors w-full border border-military-700">
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
