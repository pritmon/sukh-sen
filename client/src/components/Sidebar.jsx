import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, CalendarDays, Users, Scissors,
  ReceiptText, UserCog, Package, X, Settings, Instagram,
} from 'lucide-react';
import { api } from '../api.js';

// Simple Facebook icon (lucide doesn't have one)
function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const links = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/appointments', icon: CalendarDays,    label: 'Appointments' },
  { to: '/customers',    icon: Users,           label: 'Customers'    },
  { to: '/services',     icon: Scissors,        label: 'Services'     },
  { to: '/billing',      icon: ReceiptText,     label: 'Billing'      },
  { to: '/staff',        icon: UserCog,         label: 'Staff'        },
  { to: '/inventory',    icon: Package,         label: 'Inventory'    },
  { to: '/settings',     icon: Settings,        label: 'Settings'     },
];

export default function Sidebar({ open, onClose }) {
  const [social, setSocial] = useState({ salon_instagram: '', salon_facebook: '' });

  useEffect(() => {
    api.settings().then(s => setSocial(s)).catch(() => {});
  }, []);

  const ig = social.salon_instagram?.replace('@', '');
  const fb = social.salon_facebook?.replace('facebook.com/', '');

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-100 z-30 flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm leading-tight">
              Sukh&Sen<br />
              <span className="font-normal text-gray-500 text-xs">Unisex Salon, Kakdwip</span>
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Social footer */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-2">
          {ig && (
            <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-pink-500 hover:text-pink-600 font-medium transition-colors">
              <Instagram className="w-4 h-4" />
              @{ig}
            </a>
          )}
          {fb && (
            <a href={`https://facebook.com/${fb}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
              <FacebookIcon className="w-4 h-4" />
              {fb}
            </a>
          )}
          <p className="text-xs text-gray-400">Salon Management v1.0</p>
        </div>
      </aside>
    </>
  );
}
