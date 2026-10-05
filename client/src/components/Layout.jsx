import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import Sidebar from './Sidebar.jsx';

const titles = {
  '/dashboard':    'Dashboard',
  '/appointments': 'Appointments',
  '/customers':    'Customers',
  '/services':     'Services',
  '/billing':      'Billing',
  '/staff':        'Staff',
  '/inventory':    'Inventory',
  '/reports':      'Reports',
  '/engagement':   'Engagement',
  '/settings':     'Settings',
};

export default function Layout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = titles[location.pathname] || 'Sukh&Sen';

  useEffect(() => { document.title = `${title} · Sukh&Sen`; }, [title]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0A0A0A' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
          style={{
            background: '#0A0A0A',
            borderBottom: '1px solid rgba(201, 168, 76, 0.1)',
          }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(201, 168, 76, 0.85)' }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-serif text-base font-semibold tracking-wide" style={{ color: '#F5F0E8' }}>{title}</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C', boxShadow: '0 0 6px rgba(201, 168, 76, 0.8)' }} />
              <span className="text-xs" style={{ color: 'rgba(201, 168, 76, 0.78)' }}>Live</span>
            </div>
            <button onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium"
              style={{ color: 'rgba(245,240,232,0.68)', border: '1px solid rgba(245,240,232,0.08)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,240,232,0.4)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(245,240,232,0.08)'; }}>
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
