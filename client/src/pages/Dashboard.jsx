import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, fmtTime, todayISO, statusClass, statusLabel } from '../utils.js';
import { CalendarDays, TrendingUp, UserPlus, Receipt, Instagram } from 'lucide-react';

function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: 'linear-gradient(145deg, #191919, #111111)',
        border: '1px solid rgba(201, 168, 76, 0.35)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 0 0px rgba(201,168,76,0.1)',
      }}>
      {/* gold corner glow */}
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at top right, rgba(201,168,76,0.15) 0%, transparent 70%)' }} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-widest"
            style={{ color: '#C9A84C' }}>{label}</span>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(201, 168, 76, 0.15)', border: '1px solid rgba(201, 168, 76, 0.35)' }}>
            <Icon className="w-4 h-4" style={{ color: '#E8C96D' }} />
          </div>
        </div>
        <p className="text-3xl font-serif font-bold leading-none" style={{ color: '#E8C96D' }}>{value}</p>
        {sub && <p className="text-xs mt-2 font-medium" style={{ color: 'rgba(245, 240, 232, 0.7)' }}>{sub}</p>}
      </div>

      {/* bottom gold line */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)' }} />
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
      <div className="w-6 h-6 rounded-full animate-spin"
        style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
    </div>
  );
  if (error) return (
    <div className="text-red-400 text-sm rounded-lg px-4 py-3"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
      {error}
    </div>
  );

  const { appointmentCount, revenue, newCustomers, avgBill, appointments } = data;
  const ig = settings.salon_instagram?.replace('@', '');
  const fb = settings.salon_facebook?.replace('facebook.com/', '');

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Date + social row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#C9A84C' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long' })}
          </p>
          <p className="font-serif text-xl font-semibold" style={{ color: '#F5F0E8' }}>{fmtDate(todayISO())}</p>
        </div>
        {(ig || fb) && (
          <div className="flex items-center gap-2">
            {ig && (
              <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-80"
                style={{
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  color: '#C9A84C',
                }}>
                <Instagram className="w-3.5 h-3.5" />
                Instagram
              </a>
            )}
            {fb && (
              <a href={`https://facebook.com/${fb}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-80"
                style={{
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  color: '#C9A84C',
                }}>
                <FacebookIcon className="w-3.5 h-3.5" />
                Facebook
              </a>
            )}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarDays} label="Appointments" value={appointmentCount} sub="booked today" />
        <StatCard icon={TrendingUp}   label="Revenue"      value={fmtRupee(revenue)} sub="from paid bills" />
        <StatCard icon={UserPlus}     label="New Guests"   value={newCustomers} sub="joined today" />
        <StatCard icon={Receipt}      label="Avg. Bill"    value={fmtRupee(avgBill)} sub="per visit" />
      </div>

      {/* Today's appointments */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: '#111111', border: '1px solid rgba(201, 168, 76, 0.15)' }}>
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.1)' }}>
          <h2 className="section-title">Today's Appointments</h2>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ color: 'rgba(201,168,76,0.85)', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
            {appointments.length} total
          </span>
        </div>
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}>
              <CalendarDays className="w-6 h-6" style={{ color: 'rgba(201,168,76,0.3)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'rgba(245,240,232,0.68)' }}>No appointments today</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.42)' }}>Enjoy the quiet day</p>
          </div>
        ) : (
          <div>
            {appointments.map((a, idx) => (
              <div key={a.id}
                className="px-4 sm:px-6 py-3 sm:py-3.5 transition-colors duration-100"
                style={{ borderBottom: idx < appointments.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Mobile layout */}
                <div className="flex items-start gap-2.5 sm:hidden">
                  <span className="text-xs font-mono py-1 px-1.5 rounded text-center flex-shrink-0 mt-0.5"
                    style={{ width: 52, color: '#C9A84C', background: 'rgba(201,168,76,0.08)' }}>
                    {fmtTime(a.time)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate" style={{ color: '#F5F0E8' }}>{a.customer_name}</p>
                      <span className="text-sm font-serif font-semibold flex-shrink-0" style={{ color: '#C9A84C' }}>{fmtRupee(a.total_price)}</span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(245,240,232,0.55)' }}>{a.services || '—'}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs" style={{ color: 'rgba(245,240,232,0.45)' }}>{a.staff_name || '—'}</p>
                      <span className={statusClass(a.status)}>{statusLabel(a.status)}</span>
                    </div>
                  </div>
                </div>
                {/* Desktop layout */}
                <div className="hidden sm:flex items-center gap-3">
                  <span className="text-xs font-mono flex-shrink-0 text-center py-1.5 rounded-lg"
                    style={{ width: 56, color: '#C9A84C', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                    {fmtTime(a.time)}
                  </span>
                  <p className="text-sm font-medium truncate flex-shrink-0" style={{ width: 150, color: '#F5F0E8' }}>{a.customer_name}</p>
                  <p className="text-xs truncate flex-1 min-w-0" style={{ color: 'rgba(245,240,232,0.68)' }}>{a.services || '—'}</p>
                  <p className="text-xs font-medium truncate flex-shrink-0" style={{ width: 120, color: 'rgba(245,240,232,0.55)' }}>{a.staff_name || '—'}</p>
                  <span className="text-sm font-semibold font-serif flex-shrink-0 text-right" style={{ width: 64, color: '#C9A84C' }}>{fmtRupee(a.total_price)}</span>
                  <span className={`${statusClass(a.status)} flex-shrink-0`} style={{ width: 72, textAlign: 'center' }}>{statusLabel(a.status)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
