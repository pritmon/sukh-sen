import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Scissors } from 'lucide-react';
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

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = titles[location.pathname] || 'Sukh&Sen';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">{title}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
