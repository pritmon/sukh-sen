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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}
        style={{
          background: '#080808',
          borderRight: '1px solid rgba(201, 168, 76, 0.15)',
        }}
      >
        {/* Logo area */}
        <div className="px-6 py-6" style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.12)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C 0%, #E8C96D 100%)',
                  boxShadow: '0 0 16px rgba(201, 168, 76, 0.3)',
                }}>
                <Scissors style={{ width: '18px', height: '18px', color: '#0A0A0A' }} />
              </div>
              <div>
                <p className="font-serif font-semibold text-cream text-sm leading-tight tracking-wide">Sukh&Sen</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(201, 168, 76, 0.85)' }}>Unisex Salon · Kakdwip</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 rounded-lg transition-colors"
              style={{ color: 'rgba(245, 240, 232, 0.68)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-0.5">
          {links.map((item, i) => {
            if (item.divider) return (
              <div key={i} className="my-3 mx-2 gold-divider" />
            );
            const { to, icon: Icon, label } = item;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive ? 'active-nav' : 'inactive-nav'
                  }`
                }
                style={({ isActive }) => isActive ? {
                  background: 'rgba(201, 168, 76, 0.12)',
                  color: '#E8C96D',
                  border: '1px solid rgba(201, 168, 76, 0.2)',
                } : {
                  color: 'rgba(245, 240, 232, 0.72)',
                  border: '1px solid transparent',
                }}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? '#E8C96D' : 'rgba(245, 240, 232, 0.4)' }} />
                    {label}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: '#C9A84C', boxShadow: '0 0 6px rgba(201, 168, 76, 0.6)' }} />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(201, 168, 76, 0.12)' }}>
          <p className="text-xs" style={{ color: 'rgba(201, 168, 76, 0.65)' }}>Salon Management · v1.0</p>
        </div>
      </aside>
    </>
  );
}
