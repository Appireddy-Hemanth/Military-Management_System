import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Bell, ShieldAlert, Search, Menu, ChevronDown, LogOut, Settings, UserCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Topbar = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Dynamic Title based on route
    const getPageTitle = (pathname) => {
        if (pathname === '/') return 'Dashboard';
        const path = pathname.split('/')[1];
        if (!path) return 'Dashboard';
        return path.charAt(0).toUpperCase() + path.slice(1);
    };

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    // Fetch Notifications
    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);

            const resCount = await api.get('/notifications/unread');
            setUnreadCount(resCount.data.count);
        } catch (e) {
            console.error('Failed to fetch notifications:', e);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Activate background polling to simulate live notifications since socket.io client isn't fully connected
            const intervalId = setInterval(fetchNotifications, 10000);
            return () => clearInterval(intervalId);
        }
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (e) { console.error(e); }
    };

    const markAllAsRead = async () => {
        try {
            await api.put(`/notifications/read-all`);
            fetchNotifications();
        } catch (e) { console.error(e); }
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
            if (notificationRef.current && !notificationRef.current.contains(event.target)) setShowNotifications(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigation = (path) => {
        setShowDropdown(false);
        navigate(path);
    };

    return (
        <header className="bg-white h-16 shadow-sm border-b border-gray-200 flex items-center justify-between px-6 z-10 w-full shrink-0">
            {/* Left side */}
            <div className="flex items-center gap-4">
                <button className="md:hidden text-gray-500 hover:text-military-600 transition-colors">
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-3 border-l-0 md:border-l-2 md:border-military-500 md:pl-3">
                    {user?.role === 'ADMIN' && <ShieldAlert size={18} className="text-red-500 hidden md:block" />}
                    <h1 className="font-bold text-xl text-text-main tracking-wide">
                        {getPageTitle(location.pathname)}
                    </h1>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4 md:gap-6">
                {/* Search */}
                <div className="hidden md:flex items-center bg-gray-100 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-military-500 focus-within:bg-white transition-all w-64 border border-transparent focus-within:border-gray-300">
                    <Search size={16} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search assets, personnel..."
                        className="bg-transparent border-none outline-none text-sm w-full ml-2 text-text-main placeholder-gray-500"
                    />
                </div>

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="text-gray-400 hover:text-military-600 transition-colors relative"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-status-danger text-white text-[10px] w-4 h-4 rounded-full flex justify-center items-center shadow-sm font-bold border border-white">{unreadCount}</span>}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-md shadow-lg border border-gray-100 flex flex-col z-50 overflow-hidden">
                            <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <span className="font-semibold text-sm text-text-main">Notifications</span>
                                <span onClick={markAllAsRead} className="text-xs text-military-600 cursor-pointer hover:underline">Mark all read</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`p-3 border-b border-gray-50 text-sm hover:bg-gray-50 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                                        onClick={() => markAsRead(n.id)}
                                    >
                                        <div className="font-medium text-text-main flex justify-between items-start">
                                            <span>{n.title}</span>
                                            {!n.isRead && <span className="w-2 h-2 rounded-full bg-military-500 mt-1 shrink-0"></span>}
                                        </div>
                                        <div className="text-gray-500 text-xs mt-1">{n.message}</div>
                                        <div className="text-gray-400 text-[10px] mt-2">
                                            {new Date(n.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                )) : <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-military-800 flex justify-center items-center text-white shadow-inner">
                            <User size={16} />
                        </div>
                        <div className="hidden md:block text-left">
                            <div className="font-semibold text-sm text-text-main leading-tight">{user?.username}</div>
                            <div className="text-[11px] font-medium text-military-600 uppercase tracking-wide leading-tight">{user?.role}</div>
                        </div>
                        <ChevronDown size={14} className="text-gray-400 hidden md:block" />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-50">
                            <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                                <div className="font-semibold text-sm text-text-main">{user?.username}</div>
                                <div className="text-[11px] font-medium text-military-600 uppercase">{user?.role}</div>
                            </div>
                            <button
                                onClick={() => handleNavigation('/settings')}
                                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-gray-50 flex items-center gap-2"
                            >
                                <UserCircle size={14} /> Profile
                            </button>
                            <button
                                onClick={() => handleNavigation('/settings')}
                                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Settings size={14} /> Account Settings
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                                onClick={logout}
                                className="w-full text-left px-4 py-2 text-sm text-status-danger hover:bg-red-50 flex items-center gap-2 font-medium"
                            >
                                <LogOut size={14} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
