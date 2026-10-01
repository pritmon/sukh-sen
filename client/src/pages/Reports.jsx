import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, todayISO } from '../utils.js';
import { Users, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';

const cardStyle = { background: '#111111', border: '1px solid rgba(201,168,76,0.15)' };

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
  const medalBg = ['linear-gradient(135deg,#f59e0b,#fbbf24)', 'linear-gradient(135deg,#9ca3af,#d1d5db)', 'linear-gradient(135deg,#C9A84C,#E8C96D)'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => shiftDate(-1)}
          className="p-2 rounded-xl transition-colors"
          style={{ border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(245,240,232,0.5)', background: '#161616' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = '#161616'}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="input max-w-[160px]" style={{ colorScheme: 'dark' }} />
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
      ) : (
        <div className="space-y-3">
          {data.staff.map((s, i) => (
            <div key={s.id} className="p-5 rounded-xl" style={cardStyle}>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: medalBg[Math.min(i, 2)], color: '#0A0A0A' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : (i + 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold" style={{ color: '#F5F0E8' }}>{s.name}</p>
                      <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>{s.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold font-serif" style={{ color: '#C9A84C' }}>{fmtRupee(s.revenue)}</p>
                      <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>{s.appointments} appts · {s.billed_count} billed</p>
                    </div>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(s.revenue / maxRevenue) * 100}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C96D)' }} />
                  </div>
                  {s.avg_bill > 0 && (
                    <p className="text-xs mt-1.5" style={{ color: 'rgba(245,240,232,0.3)' }}>Avg bill: {fmtRupee(Math.round(s.avg_bill))}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MonthlyReport() {
  const now   = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
  const [data,  setData]  = useState(null);
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
      <div className="flex items-center gap-3">
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="input max-w-[160px]" style={{ colorScheme: 'dark' }} />
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Revenue', value: fmtRupee(data.totalRevenue) },
              { label: 'Appointments',  value: data.totalAppts },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-xl" style={cardStyle}>
                <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.5)' }}>{label}</p>
                <p className="text-2xl font-bold font-serif mt-1" style={{ color: '#C9A84C' }}>{value}</p>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl" style={cardStyle}>
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'rgba(201,168,76,0.5)' }}>Daily Revenue</p>
            {data.days.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'rgba(245,240,232,0.35)' }}>No data for this month</p>
            ) : (
              <div className="space-y-2.5">
                {data.days.map(d => (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="text-xs font-mono w-20 flex-shrink-0" style={{ color: 'rgba(245,240,232,0.4)' }}>{fmtDate(d.date)}</span>
                    <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${(d.revenue / maxRev) * 100}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C96D)' }} />
                    </div>
                    <span className="text-xs font-serif font-semibold w-20 text-right" style={{ color: '#C9A84C' }}>{fmtRupee(d.revenue)}</span>
                    <span className="text-xs w-12 text-right" style={{ color: 'rgba(245,240,232,0.35)' }}>{d.appointments} appts</span>
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
