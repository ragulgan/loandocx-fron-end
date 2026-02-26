
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { UserType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DashboardStats {
  payouts: {
    agent: number;
    legalUser: number;
    legalHead: number;
    civilUser: number;
  };
  pending: {
    admin: number;
    legal: number;
    civil: number;
  };
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b'];

const StatCard: React.FC<{ title: string; value: string; icon: string; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300">
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    </div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} text-white text-xl shadow-lg transition-transform group-hover:scale-110`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.user_type === UserType.ADMIN) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await fetch('https://loandocx.shenll.in/customer-loan-details/admin/dashboard', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        }
      });
      const data = await res.json();
      setStats(data?.data || []);
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.user_type !== UserType.ADMIN) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-10 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-sm">
          <i className="fa-solid fa-lock text-4xl text-indigo-500 mb-4"></i>
          <h2 className="text-xl font-bold text-slate-800">Standard Dashboard</h2>
          <p className="text-slate-500 text-sm mt-2">Welcome to LoanDocX. Use the sidebar to access your assigned tools and earnings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-600"></i>
        <p className="font-bold text-[10px] uppercase tracking-[0.3em] text-slate-400">Loading System Metrics</p>
      </div>
    );
  }

  const chartData = stats ? [
    { name: 'Admin', value: Number(stats.pending.admin) },
    { name: 'Legal (LU+LH)', value: Number(stats.pending.legal) },
    { name: 'Civil', value: Number(stats.pending.civil) }
  ].filter(d => d.value > 0) : [];


  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-end justify-between border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">LoanDocx Dashboard</h2>
        </div>
        <button onClick={fetchStats} className="bg-slate-900 text-white p-3 rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95">
          <i className="fa-solid fa-rotate"></i>
        </button>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payout Liabilities (Pending Settlement)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Agent Payouts" value={`₹${stats?.payouts.agent.toLocaleString() || '0'}`} icon="fa-user-tie" color="bg-indigo-600" />
          <StatCard title="Legal User Payouts" value={`₹${stats?.payouts.legalUser.toLocaleString() || '0'}`} icon="fa-user-shield" color="bg-emerald-600" />
          <StatCard title="Legal Head Payouts" value={`₹${stats?.payouts.legalHead.toLocaleString() || '0'}`} icon="fa-stamp" color="bg-violet-600" />
          <StatCard title="Civil User Payouts" value={`₹${stats?.payouts.civilUser.toLocaleString() || '0'}`} icon="fa-house-circle-check" color="bg-amber-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-4">Workload Distribution</h4>
          <div className="h-[250px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 italic text-xs uppercase tracking-widest">
                No pending tasks
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-gavel"></i>
              </div>
              <h4 className="font-bold text-slate-800">Pending with Admin</h4>
            </div>
            <p className="text-4xl font-black text-slate-900">{stats?.pending.admin || '0'}</p>
          </div>

          <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-users"></i>
              </div>
              <h4 className="font-bold text-slate-800">Pending with Legal Team</h4>
            </div>
            <p className="text-4xl font-black text-slate-900">{stats?.pending.legal || '0'}</p>
          </div>

          <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-xl space-y-4 sm:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-house"></i>
              </div>
              <h4 className="font-bold text-slate-800">Pending with Civil Team</h4>
            </div>
            <p className="text-4xl font-black text-slate-900">{stats?.pending.civil || '0'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
