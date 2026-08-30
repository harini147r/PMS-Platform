import React from 'react';
import { LayoutDashboard, GraduationCap, Users, Building2, FileText, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) {
  const { user } = useAuth();
  const role = user?.role || 'admin';

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'team_member', 'manager'] },
    { id: 'students', label: 'Students', icon: GraduationCap, roles: ['admin', 'team_member', 'manager'] },
    { id: 'team', label: 'Placement Team', icon: Users, roles: ['admin', 'team_member'] },
    { id: 'companies', label: 'Companies', icon: Building2, roles: ['admin', 'team_member'] },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['admin', 'team_member', 'manager'] },
  ];

  const permittedNavItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center shadow-md shrink-0">
              <svg viewBox="0 0 40 40" className="w-5 h-5" fill="none">
                <path d="M8 30 L20 8 L32 30" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 30 L20 17 L27 30" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"/>
                <circle cx="20" cy="34" r="2" fill="white" opacity="0.7"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-white text-sm leading-tight truncate">Placement Cell</h1>
              <p className="text-[10px] text-indigo-400 font-medium truncate">Rathinam College</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Authorized Navigation</div>
          {permittedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold' : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center space-x-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /><p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Signed In As</p></div>
            <p className="text-sm font-bold text-white truncate mt-1">{user?.name || 'Staff'}</p>
            <p className="text-xs text-indigo-400 capitalize font-medium">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
