import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { UserType } from '../types';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  // Filter screens for Admin to show only intended management screens plus Dashboard
  const screens = (user?.screens || []).filter(screen => {
    if (user?.user_type === UserType.ADMIN) {
      const n = screen.screen_name.toLowerCase();
      const u = screen.screen_url.toLowerCase();
      // Explicitly allow Dashboard and management screens
      return n.includes('dashboard') ||
        n.includes('approval') ||
        n.includes('user management') ||
        n.includes('user creation') ||
        n.includes('creation') ||
        n.includes('payout') ||
        n.includes('settlement') ||
        n.includes('status') ||
        n.includes('fetch') ||
        n.includes('details') ||
        u.includes('admin-console') ||
        u.includes('pending-transactions') ||
        u.includes('customer-details') ||
        n.includes('password');
    }
    return true;
  }).sort((a, b) => {
    const aDash = a.screen_name?.toLowerCase().includes('dashboard');
    const bDash = b.screen_name?.toLowerCase().includes('dashboard');

    if (aDash && !bDash) return -1;
    if (!aDash && bDash) return 1;
    return 0;
  });

  const getIcon = (name: string, url: string) => {
    const n = name.toLowerCase();
    const u = url.toLowerCase();

    if (n.includes('dashboard')) return 'fa-chart-line';
    if (n.includes('create') || n.includes('loan application')) return 'fa-plus-circle';
    if (n.includes('track')) return 'fa-magnifying-glass-chart';
    if (u.includes('customer-details')) return 'fa-id-card-clip';
    if (n.includes('fetch') || n.includes('details') || u.includes('admin-console')) return 'fa-address-book';
    if (u.includes('pending-transactions')) return 'fa-clock-rotate-left';
    if (n.includes('earning')) return 'fa-wallet';
    if (n.includes('password')) return 'fa-key';
    if (n.includes('user creation') || n.includes('user management') || n.includes('creation')) return 'fa-user-plus';
    if (n.includes('payment') || n.includes('settlement') || n.includes('payout')) return 'fa-file-invoice-dollar';
    if (n.includes('update paid') || n.includes('status')) return 'fa-check-double';
    if (n.includes('user')) return 'fa-users-gear';
    if (n.includes('loan')) return 'fa-file-invoice-dollar';
    if (n.includes('job') || n.includes('queue')) return 'fa-list-check';
    if (n.includes('approve') || n.includes('stamp')) return 'fa-stamp';
    if (n.includes('admin')) return 'fa-user-check';
    if (n.includes('doc')) return 'fa-file-shield';
    if (n.includes('civil')) return 'fa-solid fa-house-chimney';
    return 'fa-circle-dot';
  };

  const formatScreenName = (name: string, url: string) => {
    const n = name.toLowerCase();
    const u = url.toLowerCase();

    if (n.includes('dashboard')) {
      return 'Dashboard';
    }
    if (u.includes('customer-details')) {
      return 'Customer Details';
    }
    if (u.includes('pending-transactions')) {
      return 'Pending Transactions';
    }
    if (n.includes('fetch') || n.includes('details') || u.includes('admin-console')) {
      return 'User details';
    }
    if (n.includes('civil')) {
      return 'Civil Approval';
    }
    if (n.includes('admin')) {
      return 'Admin Approval';
    }
    if (n.includes('user creation') || n.includes('user management') || n.includes('creation')) {
      return 'User Management';
    }
    if (n.includes('payment settlement') || n.includes('payout settlement') || n.includes('userpayoutlist') || n.includes('userpaymentlist')) {
      return 'Payout Settlement';
    }
    if (n.includes('update paid') || n.includes('updatepaidstatus')) {
      return 'Update Payout Status';
    }
    if (n.includes('create') || n.includes('loan application')) {
      return 'Loan Application';
    }
    if (n.includes('job queue') || n.includes('job list') || n === 'job queue') {
      return 'Job List';
    }
    if (n === 'legalapprove' || n.includes('legal approval') || n.includes('approval')) {
      return 'Legal Approval';
    }

    return name;
  };

  const getRoleDisplayName = (type?: string) => {
    switch (type) {
      case UserType.AGENT: return 'Agent';
      case UserType.LEGAL_USER: return 'Legal';
      case UserType.ADMIN: return 'Admin';
      case UserType.LEGAL_HEAD: return 'Legal Head';
      case UserType.CIVIL_USER: return 'Civil';
      default: return '';
    }
  };

  return (
    <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-full transition-all duration-300">
      <div className="p-4 flex items-center justify-center md:justify-start md:space-x-3">
        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <i className="fa-solid fa-building-columns text-xl"></i>
        </div>
        <span className="text-xl font-bold tracking-tight uppercase tracking-[0.1em] hidden md:inline">LoanDocX</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {screens.map((screen) => (
          <NavLink
            key={screen.screen_url}
            to={screen.screen_url}
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <i className={`fa-solid ${getIcon(screen.screen_name, screen.screen_url)} w-6 text-center text-lg`}></i>
            <span className="font-semibold text-sm hidden md:inline">
              {formatScreenName(screen.screen_name, screen.screen_url)}
            </span>
          </NavLink>
        ))}

        {screens.length === 0 && (
          <div className="p-4 text-slate-500 text-xs text-center border border-dashed border-slate-700 rounded-lg">
            No active screens assigned to your role.
          </div>
        )}
      </nav>

      <div className="p-6 text-center border-t border-slate-800 space-y-1">
        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest hidden md:block">
          {getRoleDisplayName(user?.user_type)}
        </p>
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest hidden md:block">
          Version 1.2.2-PROD
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;