import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Users, Scissors,
  ReceiptText, UserCog, Package, X, Settings,
  BarChart2, MessageCircle,
} from 'lucide-react';

const links = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/appointments', icon: CalendarDays,    label: 'Appointments' },
  { to: '/customers',    icon: Users,           label: 'Customers'    },
  { to: '/services',     icon: Scissors,        label: 'Services'     },
  { to: '/billing',      icon: ReceiptText,     label: 'Billing'      },
  { to: '/staff',        icon: UserCog,         label: 'Staff'        },
  { to: '/inventory',    icon: Package,         label: 'Inventory'    },
  { divider: true },
  { to: '/reports',      icon: BarChart2,       label: 'Reports'      },
  { to: '/engagement',   icon: MessageCircle,   label: 'Engagement'   },
  { to: '/settings',     icon: Settings,        label: 'Settings'     },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col
        bg-slate-900 text-white
        transform transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo area */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/30 flex-shrink-0">
              <Scissors className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Sukh&Sen</p>
              <p className="text-slate-400 text-xs">Unisex Salon · Kakdwip</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-0.5">
          {links.map((item, i) => {
            if (item.divider) return <div key={i} className="my-2 border-t border-slate-700/40" />;
            const { to, icon: Icon, label } = item;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-500/20 text-brand-400 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-400' : ''}`} />
                    {label}
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-700/60">
          <p className="text-xs text-slate-500">Salon Management · v1.0</p>
        </div>
      </aside>
    </>
  );
}
