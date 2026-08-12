import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[80vh] text-center max-w-lg mx-auto">
            <div className="bg-red-50 p-6 rounded-full inline-block mb-6 shadow-sm border border-red-100">
                <ShieldAlert size={64} className="text-status-danger" />
            </div>
            <h1 className="text-4xl font-bold text-text-main mb-2 tracking-tight">ACCESS DENIED</h1>
            <p className="text-xl text-text-secondary mb-8">
                You do not have permission to access this resource.
            </p>
            <div className="bg-military-100 p-4 rounded-md border border-military-border text-sm font-mono text-left w-full mb-8">
                <div className="text-military-600 mb-1">SECURITY VIOLATION DETECTED</div>
                <div className="text-gray-600">This attempt has been logged in the system audit trail.</div>
            </div>
            <Link to="/" className="btn-primary w-full max-w-xs justify-center gap-2">
                <ArrowLeft size={18} />
                Return to Dashboard
            </Link>
        </div>
    );
};

export default Unauthorized;
