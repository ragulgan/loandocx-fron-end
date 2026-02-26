import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserType } from '../types';
import { useAuth } from '../AuthContext';


// Components
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

// Pages
import Login from '../pages/login';
import Dashboard from '../pages/Dashboard';
import PasswordChange from '../pages/PasswordChange';
import JobQueue from '../pages/JobQueue';
import LegalApprove from '../pages/LegalApprove';
import AdminApprovals from '../pages/AdminApprovals';
import Earnings from '../pages/Earnings';
import UserCreation from '../pages/UserCreation';
import UserPayoutList from '../pages/UserPayoutList';
import UpdatePaidStatus from '../pages/UpdatePaidStatus';
import CivilApprove from '../pages/CivilApprove';
import FetchUserDetails from '../pages/Fetchuserdetails';
import FetchPendingtranslist from '../pages/FetchPendingtranslist';
import CustomerDetails from '../pages/CustomerDetails';

const routes: React.FC = () => {
  const { user } = useAuth();

  const getDefaultPath = () => {
    if (!user || !user.screens || user.screens.length === 0) return "/login";
    // Check if user has dashboard in screens, prioritize it
    const hasDashboard = user.screens.find(s => s.screen_url.includes('dashboard'));
    if (hasDashboard) return hasDashboard.screen_url;
    return user.screens[0].screen_url;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {user && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {user && <Header user={user} />}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

            <Route path="/" element={user ? <Navigate to={getDefaultPath()} /> : <Navigate to="/login" />} />

            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/job-queue" element={user?.user_type === UserType.LEGAL_USER ? <JobQueue /> : <Navigate to="/" />} />
            <Route path="/legal-approve" element={user?.user_type === UserType.LEGAL_HEAD ? <LegalApprove /> : <Navigate to="/" />} />
            <Route path="/admin-approvals" element={user?.user_type === UserType.ADMIN ? <AdminApprovals /> : <Navigate to="/" />} />
            <Route path="/civil-approve" element={user?.user_type === UserType.CIVIL_USER ? <CivilApprove /> : <Navigate to="/" />} />

            <Route path="/earnings" element={user ? <Earnings /> : <Navigate to="/login" />} />
            <Route path="/password-change" element={user ? <PasswordChange /> : <Navigate to="/login" />} />
            <Route path="/user-creation" element={user?.user_type === UserType.ADMIN ? <UserCreation /> : <Navigate to="/" />} />
            <Route path="/user-payout-list" element={user?.user_type === UserType.ADMIN ? <UserPayoutList /> : <Navigate to="/" />} />
            <Route path="/update-paid-status" element={user?.user_type === UserType.ADMIN ? <UpdatePaidStatus /> : <Navigate to="/" />} />
            <Route path="/admin-console" element={user?.user_type === UserType.ADMIN ? <FetchUserDetails /> : <Navigate to="/" />} />
            <Route path="/pending-transactions" element={user?.user_type === UserType.ADMIN ? <FetchPendingtranslist /> : <Navigate to="/" />} />
             <Route path="/admin/customer-details" element={user?.user_type === UserType.ADMIN ? <CustomerDetails /> : <Navigate to="/" />} />


            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default routes;