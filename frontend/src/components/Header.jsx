import React, { useState } from 'react';
import { Menu, Shield, ChevronDown, Check, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ activeTab, setMobileOpen }) {
  const { user, logout, quickLogin, DEMO_CREDENTIALS } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Placement Analytics Dashboard';
      case 'students': return 'Student Management & Records';
      case 'team': return 'Placement Team & Lead Management';
      case 'companies': return 'Approved Companies & JD Intelligence';
      case 'reports': return 'Central Placement Reports';
      default: return 'Placement Management System';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'manager': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left Title & Mobile Hamburger */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800 capitalize leading-tight">{getTabTitle()}</h2>
          <p className="text-xs text-slate-500 hidden sm:block">Central Placement Operations & Intelligence Portal</p>
        </div>
      </div>

      {/* Right: Authenticated User & Quick Switch / Logout */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-left"
          >
            <Shield className="w-4 h-4 text-indigo-600" />
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Authorized User'}</p>
              <p className="text-[10px] text-slate-500 font-mono capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getRoleBadge(user?.role)}`}>
              {user?.role?.toUpperCase()}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Role Switcher & Logout Dropdown */}
          {roleDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setRoleDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Session</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>

                <div className="p-2 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Quick Switch Demo Role</p>
                  {Object.keys(DEMO_CREDENTIALS).map((key) => {
                    const r = DEMO_CREDENTIALS[key];
                    const isCurrent = user?.email === r.email;
                    return (
                      <button
                        key={key}
                        onClick={async () => {
                          await quickLogin(key);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                          isCurrent ? 'bg-indigo-50 font-bold text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{r.label}</p>
                          <p className="text-[10px] text-slate-400">{r.name}</p>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 px-2">
                  <button
                    onClick={() => {
                      logout();
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
