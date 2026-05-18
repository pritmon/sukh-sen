import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, todayISO, statusClass, statusLabel } from '../utils.js';
import { CalendarDays, TrendingUp, UserPlus, Receipt, Instagram } from 'lucide-react';

function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, sub, gradient }) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-lg ${gradient} relative overflow-hidden`}>
      {/* decorative circle */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/10" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">{label}</span>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <p className="text-3xl font-bold leading-none">{value}</p>
        {sub && <p className="text-xs text-white/60 mt-1.5">{sub}</p>}
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

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</div>;

  const { appointmentCount, revenue, newCustomers, avgBill, appointments } = data;
  const ig = settings.salon_instagram?.replace('@', '');
  const fb = settings.salon_facebook?.replace('facebook.com/', '');

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Date + social row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Today</p>
          <p className="text-base font-bold text-gray-900">{fmtDate(todayISO())}</p>
        </div>
        {(ig || fb) && (
          <div className="flex items-center gap-2">
            {ig && (
              <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm">
                <Instagram className="w-3.5 h-3.5" />
                Instagram
              </a>
            )}
            {fb && (
              <a href={`https://facebook.com/${fb}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1877F2] text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm">
                <FacebookIcon className="w-3.5 h-3.5" />
                Facebook
              </a>
            )}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CalendarDays} label="Appointments" value={appointmentCount} sub="booked today"
          gradient="bg-gradient-to-br from-brand-500 to-brand-700"
        />
        <StatCard
          icon={TrendingUp} label="Revenue" value={fmtRupee(revenue)} sub="from paid bills"
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
        />
        <StatCard
          icon={UserPlus} label="New Customers" value={newCustomers} sub="joined today"
          gradient="bg-gradient-to-br from-blue-500 to-indigo-700"
        />
        <StatCard
          icon={Receipt} label="Avg. Bill" value={fmtRupee(avgBill)} sub="per transaction"
          gradient="bg-gradient-to-br from-purple-500 to-violet-700"
        />
      </div>

      {/* Today's appointments */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="section-title">Today's Appointments</h2>
          <span className="text-xs text-gray-400 font-medium">{appointments.length} total</span>
        </div>
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <CalendarDays className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No appointments today</p>
            <p className="text-xs text-gray-300 mt-0.5">Enjoy the quiet day!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {appointments.map(a => (
              <div key={a.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <span className="text-xs font-bold font-mono text-gray-400 w-14 flex-shrink-0 bg-gray-100 rounded-lg px-2 py-1 text-center">{a.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{a.customer_name}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{a.services || '—'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-gray-800">{fmtRupee(a.total_price)}</span>
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
