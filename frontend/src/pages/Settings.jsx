import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Settings as SettingsIcon, Shield, Bell, User, Monitor } from 'lucide-react';
import api from '../api/axios';

const Settings = () => {
    const { user } = useContext(AuthContext);

    // Quick pseudo-state: realistically you'd fetch if user has 2FA enabled globally.
    // For demo MVP, we will assume not enabled until generated.
    const [setup2FA, setSetup2FA] = useState(false); // boolean indicating if enabled
    const [qrCode, setQrCode] = useState('');
    const [token2FA, setToken2FA] = useState('');
    const [msg, setMsg] = useState('');
    const [activeTab, setActiveTab] = useState('profile');

    const handleSetup2FA = async () => {
        try {
            const res = await api.post('/auth/2fa/setup');
            setQrCode(res.data.qrCode);
            setMsg('');
        } catch (e) {
            setMsg('Failed to setup 2FA.');
        }
    }

    const handleVerify2FA = async () => {
        try {
            await api.post('/auth/2fa/verify', { token: token2FA });
            setSetup2FA(true);
            setQrCode('');
            setToken2FA('');
            setMsg('');
        } catch (e) {
            setMsg('Invalid code. Try again.');
        }
    }

    const handleDisable2FA = async () => {
        try {
            await api.post('/auth/2fa/disable');
            setSetup2FA(false);
            setMsg('');
        } catch (e) {
            setMsg('Failed to disable 2FA.');
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                    <SettingsIcon size={24} className="text-military-600" /> Account Settings
                </h2>
                <p className="text-text-secondary mt-1">Manage your account preferences and system parameters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 space-y-1">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full text-left px-4 py-2 font-medium rounded-md flex items-center gap-3 transition-colors ${activeTab === 'profile' ? 'bg-military-100 text-military-800' : 'text-text-secondary hover:bg-gray-50'}`}>
                        <User size={18} /> Account Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full text-left px-4 py-2 font-medium rounded-md flex items-center gap-3 transition-colors ${activeTab === 'security' ? 'bg-military-100 text-military-800' : 'text-text-secondary hover:bg-gray-50'}`}>
                        <Shield size={18} /> Security
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full text-left px-4 py-2 font-medium rounded-md flex items-center gap-3 transition-colors ${activeTab === 'notifications' ? 'bg-military-100 text-military-800' : 'text-text-secondary hover:bg-gray-50'}`}>
                        <Bell size={18} /> Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab('display')}
                        className={`w-full text-left px-4 py-2 font-medium rounded-md flex items-center gap-3 transition-colors ${activeTab === 'display' ? 'bg-military-100 text-military-800' : 'text-text-secondary hover:bg-gray-50'}`}>
                        <Monitor size={18} /> Display
                    </button>
                </div>

                <div className="md:col-span-3 space-y-6">
                    {activeTab === 'profile' && (
                        <div className="card shadow-sm border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h3 className="font-semibold text-lg text-text-main mb-4 border-b border-gray-100 pb-2 flex justify-between items-center">
                                Profile Information
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="input-label">Username</label>
                                    <input type="text" className="input-field bg-gray-50" value={user?.username || ''} disabled />
                                </div>
                                <div>
                                    <label className="input-label">Role Designation</label>
                                    <input type="text" className="input-field bg-gray-50" value={user?.role?.replace('_', ' ') || ''} disabled />
                                </div>
                                {user?.role !== 'ADMIN' && (
                                    <div>
                                        <label className="input-label">Assigned Base ID</label>
                                        <input type="text" className="input-field bg-gray-50" value={user?.baseId || 'Not Assigned'} disabled />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <>
                            <div className="card shadow-sm border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h3 className="font-semibold text-lg text-text-main mb-4 border-b border-gray-100 pb-2">Two-Factor Authentication (2FA)</h3>
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-50 text-blue-600 p-3 rounded-md">
                                        <Shield size={24} />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <h4 className="font-medium text-text-main">Protect your account with 2FA</h4>
                                        <p className="text-sm text-text-secondary mt-1 mb-3">
                                            Adds an extra layer of security to your military asset dashboard. Once configured, you'll be required to enter both your password and an authentication code from your mobile device.
                                        </p>

                                        {!setup2FA && !qrCode && (
                                            <button className="btn-secondary text-sm border-military-600 text-military-600" onClick={handleSetup2FA}>
                                                Configure 2FA
                                            </button>
                                        )}

                                        {qrCode && !setup2FA && (
                                            <div className="p-4 border border-gray-200 rounded text-center max-w-sm mx-auto">
                                                <p className="text-sm mb-2">Scan this QR Code with your Authenticator App:</p>
                                                <img src={qrCode} alt="2FA QR Code" className="mx-auto border border-gray-300 rounded mb-4" />
                                                <input
                                                    type="text"
                                                    placeholder="Enter generated code"
                                                    className="input-field mb-2 text-center text-lg tracking-widest"
                                                    value={token2FA}
                                                    onChange={e => setToken2FA(e.target.value)}
                                                />
                                                <button className="btn-primary w-full" onClick={handleVerify2FA}>
                                                    Verify & Enable 2FA
                                                </button>
                                                {msg && <p className="text-red-500 text-sm mt-2">{msg}</p>}
                                            </div>
                                        )}

                                        {setup2FA && (
                                            <div className="flex justify-between items-center bg-green-50 p-4 border border-green-200 rounded-md">
                                                <div className="text-green-800 font-medium text-sm">2FA is currently ENABLED.</div>
                                                <button className="btn-danger text-xs py-1" onClick={handleDisable2FA}>Disable 2FA</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="card shadow-sm border-gray-200">
                                <h3 className="font-semibold text-lg text-text-main mb-4 border-b border-gray-100 pb-2">Change Password</h3>
                                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Password updated (mock)"); }}>
                                    <div>
                                        <label className="input-label">Current Password</label>
                                        <input type="password" className="input-field" placeholder="Enter current password" required />
                                    </div>
                                    <div>
                                        <label className="input-label">New Password</label>
                                        <input type="password" className="input-field" placeholder="Enter new password" required />
                                    </div>
                                    <div>
                                        <label className="input-label">Confirm New Password</label>
                                        <input type="password" className="input-field" placeholder="Confirm new password" required />
                                    </div>
                                    <div className="pt-2">
                                        <button type="submit" className="btn-primary">Update Password</button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="card shadow-sm border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h3 className="font-semibold text-lg text-text-main mb-4 border-b border-gray-100 pb-2 flex justify-between items-center">
                                Notification Preferences
                            </h3>
                            <div className="p-8 text-center text-text-secondary">
                                <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                                <p>Notification preferences will be available in the next system update.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'display' && (
                        <div className="card shadow-sm border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h3 className="font-semibold text-lg text-text-main mb-4 border-b border-gray-100 pb-2 flex justify-between items-center">
                                Display Settings
                            </h3>
                            <div className="p-8 text-center text-text-secondary">
                                <Monitor size={48} className="mx-auto text-gray-300 mb-4" />
                                <p>Display themes and layout options will be available in the next system update.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
