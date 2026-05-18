import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, todayISO, statusClass, statusLabel } from '../utils.js';
import { CalendarDays, TrendingUp, UserPlus, Receipt, Instagram, ExternalLink } from 'lucide-react';

function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data,     setData]     = useState(null);
  const [settings, setSettings] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    Promise.all([api.dashboard(), api.settings()])
      .then(([d, s]) => { setData(d); setSettings(s); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>;
  if (error)   return <div className="text-red-500 text-sm">{error}</div>;

  const { appointmentCount, revenue, newCustomers, avgBill, appointments } = data;
  const ig = settings.salon_instagram?.replace('@', '');
  const fb = settings.salon_facebook?.replace('facebook.com/', '');

  return (
    <div className="space-y-6">
      {/* Date heading */}
      <p className="text-sm text-gray-500">Today — {fmtDate(todayISO())}</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarDays} label="Appointments" value={appointmentCount} sub="today"        color="bg-brand-500"   />
        <StatCard icon={TrendingUp}   label="Revenue"      value={fmtRupee(revenue)} sub="paid bills" color="bg-emerald-500" />
        <StatCard icon={UserPlus}     label="New Customers" value={newCustomers}     sub="today"       color="bg-blue-500"    />
        <StatCard icon={Receipt}      label="Avg. Bill"    value={fmtRupee(avgBill)} sub="per bill"    color="bg-purple-500"  />
      </div>

      {/* Social media banner */}
      {(ig || fb) && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Follow Us</p>
          <div className="flex flex-wrap gap-3">
            {ig && (
              <a
                href={`https://instagram.com/${ig}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 flex-1 min-w-[200px] rounded-xl px-4 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white hover:opacity-90 transition-opacity"
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">@{ig}</p>
                  <p className="text-xs text-white/70">Instagram</p>
                </div>
                <ExternalLink className="w-4 h-4 ml-auto opacity-70 flex-shrink-0" />
              </a>
            )}
            {fb && (
              <a
                href={`https://facebook.com/${fb}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 flex-1 min-w-[200px] rounded-xl px-4 py-3 bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <FacebookIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{fb}</p>
                  <p className="text-xs text-white/70">Facebook</p>
                </div>
                <ExternalLink className="w-4 h-4 ml-auto opacity-70 flex-shrink-0" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Today's appointments */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Today's Appointments</h2>
        </div>
        {appointments.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">No appointments today</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {appointments.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-center gap-4">
                <span className="text-sm font-mono text-gray-500 w-14 flex-shrink-0">{a.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.customer_name}</p>
                  <p className="text-xs text-gray-400 truncate">{a.services || '—'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm text-gray-700">{fmtRupee(a.total_price)}</span>
                  <span className={statusClass(a.status)}>{statusLabel(a.status)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
