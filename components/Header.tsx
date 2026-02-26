import React from 'react';
import { useAuth } from '../AuthContext';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const { logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-bold text-slate-800">
          Welcome back, <span className="text-indigo-600">{user.user_name}</span>
        </h1>
      </div>

      <div className="flex items-center space-x-6">
        {/* <button className="relative text-slate-400 hover:text-indigo-600 transition-colors">
          <i className="fa-solid fa-bell text-xl"></i>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">3</span>
        </button>
        
        <div className="h-8 w-px bg-slate-200"></div> */}
        
        <button 
          onClick={logout}
          className="flex items-center space-x-2 text-slate-500 hover:text-red-600 transition-colors"
        >
          <span className="font-medium text-sm">Sign Out</span>
          <i className="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;