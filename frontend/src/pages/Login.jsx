import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Shield, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, verify2FA, user } = useContext(AuthContext);

    // 2FA state
    const [requires2FA, setRequires2FA] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [token2FA, setToken2FA] = useState('');

    if (user) {
        return <Navigate to="/" />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await login(username, password);
            if (result && result.requires2FA) {
                setRequires2FA(true);
                setTempToken(result.tempToken);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid username or password.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await verify2FA(tempToken, token2FA);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid authentication code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-military-900 font-sans">
            {/* Left Side - Visual Concept */}
            <div className="md:w-1/2 lg:w-3/5 bg-military-900 text-white flex flex-col justify-between p-8 md:p-16 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#4D7C0F 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <Shield className="text-military-400" size={40} />
                    <div>
                        <h1 className="text-2xl font-bold tracking-widest">M.A.M.S.</h1>
                    </div>
                </div>

                <div className="relative z-10 space-y-6 max-w-lg mt-12 md:mt-0">
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                        MILITARY ASSET<br />MANAGEMENT SYSTEM
                    </h2>
                    <p className="text-xl text-military-400 font-medium tracking-wide">
                        "Secure. Track. Manage."
                    </p>

                    <div className="space-y-4 pt-8">
                        <div className="flex items-center gap-3 text-gray-300">
                            <CheckCircle2 size={20} className="text-military-400" />
                            <span>Secure Authentication</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                            <CheckCircle2 size={20} className="text-military-400" />
                            <span>Authorized Personnel Only</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                            <CheckCircle2 size={20} className="text-military-400" />
                            <span>All actions are logged and monitored</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-12 md:mt-0 text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Defense Logistics Command. All rights reserved.
                </div>
            </div>

            {/* Right Side - Auth Panel */}
            <div className="md:w-1/2 lg:w-2/5 bg-white flex flex-col justify-center p-8 md:p-16 shadow-2xl z-20 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none">
                <div className="w-full max-w-md mx-auto">
                    <div className="mb-10 block md:hidden flex items-center gap-2">
                        <Shield className="text-military-600" size={28} />
                        <h1 className="text-xl font-bold text-military-900 tracking-wider">M.A.M.S.</h1>
                    </div>

                    <h2 className="text-3xl font-bold text-text-main mb-2">Welcome Back</h2>
                    <p className="text-text-secondary mb-8">Sign in to continue to M.A.M.S.</p>

                    {error && (
                        <div className="bg-red-50 text-status-danger p-4 rounded-md border border-red-200 mb-6 text-sm flex items-start gap-2">
                            <div className="mt-0.5">⚠️</div>
                            <span>{error}</span>
                        </div>
                    )}

                    {!requires2FA ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="input-label" htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="input-field"
                                    placeholder="Enter your username"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="input-label" htmlFor="password">Password</label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input-field pr-10"
                                        placeholder="Enter your password"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded border-gray-300 text-military-600 focus:ring-military-500 rounded-sm cursor-pointer w-4 h-4" />
                                    <span className="text-sm text-text-secondary">Remember me</span>
                                </label>
                                <a href="#" className="text-sm text-military-600 hover:text-military-500 font-medium">Forgot password?</a>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !username || !password}
                                className="btn-primary w-full h-12 text-base transition-all duration-200 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <Lock size={18} />
                                        AUTHENTICATE SECURELY
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify2FA} className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-4">
                                <p className="text-sm text-status-info font-medium text-center">Multi-Factor Authentication Required.</p>
                            </div>
                            <div>
                                <label className="input-label" htmlFor="token2FA">Authentication Code</label>
                                <input
                                    id="token2FA"
                                    type="text"
                                    value={token2FA}
                                    onChange={(e) => setToken2FA(e.target.value)}
                                    className="input-field text-center text-2xl tracking-widest"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || token2FA.length !== 6}
                                className="btn-primary w-full h-12 text-base transition-all duration-200 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Shield size={18} />
                                        VERIFY CODE
                                    </>
                                )}
                            </button>

                            <div className="text-center mt-4">
                                <button type="button" onClick={() => setRequires2FA(false)} className="text-sm text-gray-500 hover:text-military-600 transition-colors">
                                    Return to Login
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div >
    );
};

export default Login;
