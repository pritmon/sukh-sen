import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, todayISO } from '../utils.js';
import { Users, ChevronLeft, ChevronRight, BarChart2, TrendingUp, CalendarDays, Receipt } from 'lucide-react';

function StaffPerformance() {
  const [date,    setDate]    = useState(todayISO());
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.staffPerformance(date).then(setData).finally(() => setLoading(false));
  }, [date]);

  function shiftDate(n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d.toISOString().split('T')[0]);
  }

  const maxRevenue = data ? Math.max(...data.staff.map(s => s.revenue), 1) : 1;
  const rankColors = [
    { bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)', text: '#0A0A0A' },
    { bg: 'linear-gradient(135deg,#9ca3af,#d1d5db)', text: '#0A0A0A' },
    { bg: 'linear-gradient(135deg,#C9A84C,#E8C96D)', text: '#0A0A0A' },
  ];

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="flex items-center gap-2">
        <button onClick={() => shiftDate(-1)}
          className="p-2 rounded-xl transition-colors"
          style={{ border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(245,240,232,0.5)', background: '#161616' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = '#161616'}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="input flex-1 max-w-[160px]" style={{ colorScheme: 'dark' }} />
        <button onClick={() => shiftDate(1)}
          className="p-2 rounded-xl transition-colors"
          style={{ border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(245,240,232,0.5)', background: '#161616' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = '#161616'}>
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => setDate(todayISO())} className="btn-secondary px-3 py-2 text-xs">Today</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      ) : !data?.staff?.length ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Users className="w-10 h-10" style={{ color: 'rgba(201,168,76,0.2)' }} />
          <p className="text-sm" style={{ color: 'rgba(245,240,232,0.35)' }}>No staff data for this date</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden"
          style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
          {data.staff.map((s, i) => {
            const pct = Math.round((s.revenue / maxRevenue) * 100);
            const rc  = rankColors[Math.min(i, 2)];
            return (
              <div key={s.id}
                className="px-5 py-4 transition-colors"
                style={{ borderBottom: i < data.staff.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                <div className="flex items-center gap-4 mb-3">
                  {/* Rank */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{ background: rc.bg, color: rc.text }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i + 1}
                  </div>

                  {/* Name + role */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>{s.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>{s.role}</p>
                  </div>

                  {/* Revenue */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold font-serif" style={{ color: '#C9A84C' }}>{fmtRupee(s.revenue)}</p>
                    {s.avg_bill > 0 && (
                      <p className="text-xs" style={{ color: 'rgba(245,240,232,0.3)' }}>avg {fmtRupee(Math.round(s.avg_bill))}</p>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mb-2.5 ml-12">
                  <span className="flex items-center gap-1 text-xs"
                    style={{ color: 'rgba(245,240,232,0.4)' }}>
                    <CalendarDays className="w-3 h-3" /> {s.appointments} appts
                  </span>
                  <span className="flex items-center gap-1 text-xs"
                    style={{ color: 'rgba(245,240,232,0.4)' }}>
                    <Receipt className="w-3 h-3" /> {s.billed_count} billed
                  </span>
                </div>

                {/* Revenue bar */}
                <div className="ml-12">
                  <div className="w-full rounded-full h-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: i === 0
                          ? 'linear-gradient(90deg, #C9A84C, #E8C96D)'
                          : 'linear-gradient(90deg, rgba(201,168,76,0.5), rgba(232,201,109,0.5))',
                      }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MonthlyReport() {
  const now   = new Date();
  const [month,   setMonth]   = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.monthlyReport(month).then(setData).finally(() => setLoading(false));
  }, [month]);

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
    </div>
  );

  const maxRev = data ? Math.max(...data.days.map(d => d.revenue), 1) : 1;

  return (
    <div className="space-y-4">
      <input type="month" value={month} onChange={e => setMonth(e.target.value)}
        className="input max-w-[180px]" style={{ colorScheme: 'dark' }} />

      {data && (
        <>
          {/* Summary stats */}
          <div className="rounded-xl overflow-hidden"
            style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
            <div className="grid grid-cols-2 divide-x" style={{ borderColor: 'rgba(201,168,76,0.08)' }}>
              {[
                { icon: TrendingUp,   label: 'Total Revenue',  value: fmtRupee(data.totalRevenue), gold: true },
                { icon: CalendarDays, label: 'Appointments',   value: data.totalAppts, gold: false },
              ].map(({ icon: Icon, label, value, gold }) => (
                <div key={label} className="px-6 py-5 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color: 'rgba(201,168,76,0.5)' }} />
                    <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.5)' }}>{label}</span>
                  </div>
                  <p className="text-3xl font-bold font-serif" style={{ color: gold ? '#C9A84C' : '#F5F0E8' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Daily bars */}
          <div className="rounded-xl overflow-hidden"
            style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.5)' }}>Daily Breakdown</p>
            </div>
            {data.days.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <BarChart2 className="w-8 h-8" style={{ color: 'rgba(201,168,76,0.2)' }} />
                <p className="text-sm" style={{ color: 'rgba(245,240,232,0.35)' }}>No data for this month</p>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-3">
                {data.days.map(d => (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="text-xs font-mono flex-shrink-0 w-20" style={{ color: 'rgba(245,240,232,0.4)' }}>{fmtDate(d.date)}</span>
                    <div className="flex-1 rounded-full h-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(d.revenue / maxRev) * 100}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C96D)' }} />
                    </div>
                    <span className="text-xs font-serif font-semibold w-20 text-right flex-shrink-0" style={{ color: '#C9A84C' }}>{fmtRupee(d.revenue)}</span>
                    <span className="text-xs w-14 text-right flex-shrink-0" style={{ color: 'rgba(245,240,232,0.3)' }}>{d.appointments} appts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState('staff');

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ background: '#161616', border: '1px solid rgba(201,168,76,0.12)' }}>
        {[['staff', 'Staff Performance', Users], ['monthly', 'Monthly Revenue', BarChart2]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === key
              ? { background: 'rgba(201,168,76,0.15)', color: '#E8C96D', border: '1px solid rgba(201,168,76,0.25)' }
              : { color: 'rgba(245,240,232,0.4)', border: '1px solid transparent' }}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'staff' ? <StaffPerformance /> : <MonthlyReport />}
    </div>
  );
}
