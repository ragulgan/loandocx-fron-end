
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // This call hits your actual MySQL database via the Node.js backend
      const response = await fetch('https://loandocx.shenll.in/login/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });

      const data = await response.json();

      if (data.code === 200) {
        login(data?.data);
      } else {
        setError(data.message || "Login invalid: Incorrect ID or Password.");
      }
    } catch (err) {
      console.error("Login request failed", err);
      setError("Backend server not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <i className="fa-solid fa-building-columns text-white text-3xl"></i>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">LoanDocX</h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in zoom-in duration-300">
              <i className="fa-solid fa-circle-exclamation text-sm"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">User ID</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <i className="fa-solid fa-hashtag"></i>
                </span>
                <input
                  type="text"
                  required
                  disabled={loading}
                  className="appearance-none relative block w-full pl-5 px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all disabled:bg-slate-50"
                  placeholder="Enter ID"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <i className="fa-solid fa-lock"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  className="appearance-none relative block w-full pl-5 px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all disabled:bg-slate-50"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <i
                    className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"
                      }`}
                  ></i>
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading && <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>}
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
