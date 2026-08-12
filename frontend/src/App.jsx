import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bases from './pages/Bases';
import Purchases from './pages/Purchases';
import Transfers from './pages/Transfers';
import Assets from './pages/Assets';
import Assignments from './pages/Assignments';
import Expenditures from './pages/Expenditures';
import AuditLogs from './pages/AuditLogs';
import Unauthorized from './pages/Unauthorized';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Approvals from './pages/Approvals';
import Maintenance from './pages/Maintenance';

const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[60vh]">
    <div className="text-gray-400 mb-4">
      <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    </div>
    <h2 className="text-xl font-semibold text-text-main">{title}</h2>
    <p className="text-text-secondary mt-2">Module is currently under development.</p>
  </div>
);

const Layout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-military-100 font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-military-900 text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-military-400 mb-4"></div>
      <div className="text-lg tracking-widest">INITIALIZING M.A.M.S.</div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  return <Layout />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<Dashboard />} />
            <Route path="assets" element={<Assets />} />
            <Route path="bases" element={<Bases />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="expenditures" element={<Expenditures />} />
            <Route path="reports" element={<Reports />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
