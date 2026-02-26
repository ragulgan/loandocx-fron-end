import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

const PasswordChange: React.FC = () => {
  const { user } = useAuth();
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd || pwd.length < 4) {
      setErrorMsg("Password must be at least 4 characters long.");
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('https://loandocx.shenll.in/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          userId: user?.user_id,
          userType: user?.user_type,
          newPassword: pwd
        })
      });

      const data = await res.json();

      if ( data.code === 200) {
        setSuccessMsg(data.message || "Password updated successfully.");
        setPwd('');
        // Clear message after 5 seconds
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(data.message || "Failed to update password. Please try again.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Server connection error.";
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-xl space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-key text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Security Settings</h2>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center space-x-3 animate-in fade-in zoom-in duration-300">
            <i className="fa-solid fa-circle-check text-lg"></i>
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center space-x-3 animate-in fade-in zoom-in duration-300">
            <i className="fa-solid fa-circle-exclamation text-lg"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={update} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <i className="fa-solid fa-lock"></i>
              </span>
              <input
                required
                type="password"
                placeholder="Minimum 4 characters"
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-medium"
                value={pwd}
                onChange={e => setPwd(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-shield-halved"></i>}
            <span>{loading ? 'Committing to Database...' : 'Update Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordChange;