import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import PlacementTeam from './pages/PlacementTeam';
import Companies from './pages/Companies';
import Reports from './pages/Reports';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'manager' && (activeTab === 'team' || activeTab === 'companies')) {
      setActiveTab('dashboard');
    }
  }, [activeTab, user]);

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header 
          activeTab={activeTab} 
          setMobileOpen={setMobileOpen} 
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'students' && <Students />}
          {activeTab === 'team' && user?.role !== 'manager' && <PlacementTeam />}
          {activeTab === 'companies' && user?.role !== 'manager' && <Companies />}
          {activeTab === 'reports' && <Reports />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
