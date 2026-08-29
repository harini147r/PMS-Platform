import React, { useState } from 'react';
import { Sparkles, Shield, User, Users, Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';

export default function LoginPage() {
  const { login, quickLogin, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }
    setLocalError('');
    await login(email, password);
  };

  const handleQuick = async (key) => {
    setLocalError('');
    await quickLogin(key);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Placement Cell Enterprise System</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">College Placement Portal</h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Centralized student analytics, corporate leads, JD text extraction, and ATS resume matching intelligence.
          </p>
        </div>

        {/* Main Card Container */}
        <div className="grid grid-cols-1 md:grid-cols-12 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Left Column: 1-Click Role Logins */}
          <div className="md:col-span-5 p-6 bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Instant Demo Logins</p>
              <p className="text-xs text-slate-400 mb-4">Select a pre-configured role to inspect permissions & workflows:</p>

              <div className="space-y-2.5">
                {/* 1. Admin */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuick('admin')}
                  className="w-full p-3 bg-slate-900 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-purple-300">Head of Placement (Admin)</p>
                        <p className="text-[11px] text-slate-400">Dr. Rajesh Kumar</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 pl-8">Full oversight, approvals, user access control</p>
                </button>

                {/* 2. Manager */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuick('manager')}
                  className="w-full p-3 bg-slate-900 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-emerald-300">Placement Manager</p>
                        <p className="text-[11px] text-slate-400">Dr. Meenakshi Sundaram</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 pl-8">Student records, department analytics & reports</p>
                </button>

                {/* 3. Team Member */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuick('team_member')}
                  className="w-full p-3 bg-slate-900 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-blue-300">Placement Team Member</p>
                        <p className="text-[11px] text-slate-400">Prof. Ananya Sen</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 pl-8">Company leads, JD upload & drive completion</p>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Default Password:</span>
              <span className="font-mono text-slate-400 font-bold bg-slate-900 px-2 py-0.5 rounded">admin123 / manager123 / team123</span>
            </div>
          </div>

          {/* Right Column: Custom Login Form */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-white mb-1">Sign In to Your Account</h3>
            <p className="text-xs text-slate-400 mb-6">Enter your institutional placement cell credentials</p>

            {(error || localError) && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error || localError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Placement System</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
