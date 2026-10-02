import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, todayISO } from '../utils.js';
import { Users, ChevronLeft, ChevronRight, BarChart2, TrendingUp, CalendarDays, CheckCircle2, AlertCircle, Star } from 'lucide-react';

function SummaryCard({ icon: Icon, label, value, sub, gold }) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-4 rounded-xl"
      style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.12)' }}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color: 'rgba(201,168,76,0.78)' }} />
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.78)' }}>{label}</span>
      </div>
      <p className="text-2xl font-bold font-serif" style={{ color: gold ? '#C9A84C' : '#F5F0E8' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'rgba(245,240,232,0.62)' }}>{sub}</p>}
    </div>
  );
}

function StaffPerformance() {
  const [date,    setDate]    = useState(todayISO());
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.staffPerformance(date).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [date]);

  function shiftDate(n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d.toISOString().split('T')[0]);
  }

  const staff      = data?.staff || [];
  const active     = staff.filter(s => s.appointments > 0);
  const idle       = staff.filter(s => s.appointments === 0);
  const totalRev   = active.reduce((s, r) => s + r.revenue, 0);
  const totalAppts = active.reduce((s, r) => s + r.appointments, 0);
  const totalBill  = active.reduce((s, r) => s + r.billed_count, 0);
  const convRate   = totalAppts > 0 ? Math.round((totalBill / totalAppts) * 100) : 0;
  const maxRevenue = active.length ? Math.max(...active.map(s => s.revenue), 1) : 1;
  const isToday    = date === todayISO();

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="flex items-center gap-2">
        <button onClick={() => shiftDate(-1)}
          className="p-2 rounded-xl transition-colors"
          style={{ border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(245,240,232,0.75)', background: '#161616' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = '#161616'}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="input flex-1 max-w-[160px]" style={{ colorScheme: 'dark' }} />
        <button onClick={() => shiftDate(1)}
          className="p-2 rounded-xl transition-colors"
          style={{ border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(245,240,232,0.75)', background: '#161616' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = '#161616'}>
          <ChevronRight className="w-4 h-4" />
        </button>
        {!isToday && (
          <button onClick={() => setDate(todayISO())} className="btn-secondary px-3 py-2 text-xs">Today</button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      ) : (
        <>
          {/* Day summary strip */}
          {totalAppts > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SummaryCard icon={TrendingUp}    label="Day Revenue"   value={fmtRupee(totalRev)} gold />
              <SummaryCard icon={CalendarDays}  label="Appointments"  value={totalAppts} sub={`${totalBill} billed`} />

              <SummaryCard icon={CheckCircle2}  label="Conversion"    value={`${convRate}%`} sub="appts billed" />
            </div>
          )}

          {active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Users className="w-10 h-10" style={{ color: 'rgba(201,168,76,0.2)' }} />
              <p className="text-sm" style={{ color: 'rgba(245,240,232,0.62)' }}>
                {staff.length ? 'No appointments on this date' : 'No staff data for this date'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden"
              style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
              {active.map((s, i) => {
                const pct      = Math.round((s.revenue / maxRevenue) * 100);
                const unbilled = s.appointments - s.billed_count;
                const services = s.services_done ? [...new Set(s.services_done.split(',').map(x => x.trim()).filter(Boolean))] : [];
                const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
                const rankBg    = i === 0
                  ? 'linear-gradient(135deg,#f59e0b,#fbbf24)'
                  : i === 1 ? 'linear-gradient(135deg,#9ca3af,#d1d5db)'
                  : i === 2 ? 'linear-gradient(135deg,#C9A84C,#E8C96D)'
                  : '#1e1e1e';

                return (
                  <div key={s.id}
                    className="px-5 py-4 transition-colors"
                    style={{ borderBottom: i < active.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* Top row */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                        style={{ background: rankBg, color: '#0A0A0A' }}>
                        {rankEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>{s.name}</p>
                        <p className="text-xs" style={{ color: 'rgba(245,240,232,0.62)' }}>{s.role}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold font-serif" style={{ color: '#C9A84C' }}>{fmtRupee(s.revenue)}</p>
                        {s.avg_bill > 0 && (
                          <p className="text-xs" style={{ color: 'rgba(245,240,232,0.55)' }}>avg {fmtRupee(Math.round(s.avg_bill))}</p>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 mb-2.5 ml-12 flex-wrap">
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(245,240,232,0.68)' }}>
                        <CalendarDays className="w-3 h-3" /> {s.appointments} appointment{s.appointments !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1 text-xs"
                        style={{ color: s.billed_count > 0 ? 'rgba(134,239,172,0.7)' : 'rgba(245,240,232,0.4)' }}>
                        <CheckCircle2 className="w-3 h-3" /> {s.billed_count} billed
                      </span>
                      {unbilled > 0 && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                          <AlertCircle className="w-3 h-3" /> {unbilled} unbilled
                        </span>
                      )}
                    </div>

                    {/* Services chips */}
                    {services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5 ml-12">
                        {services.slice(0, 6).map(sv => (
                          <span key={sv} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(201,168,76,0.08)', color: 'rgba(201,168,76,0.65)', border: '1px solid rgba(201,168,76,0.12)' }}>
                            {sv}
                          </span>
                        ))}
                        {services.length > 6 && (
                          <span className="text-xs self-center" style={{ color: 'rgba(245,240,232,0.55)' }}>+{services.length - 6} more</span>
                        )}
                      </div>
                    )}

                    {/* Revenue bar */}
                    <div className="ml-12">
                      <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-1.5 rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: i === 0
                              ? 'linear-gradient(90deg,#C9A84C,#E8C96D)'
                              : 'linear-gradient(90deg,rgba(201,168,76,0.45),rgba(232,201,109,0.45))',
                          }} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Idle staff footer */}
              {idle.length > 0 && (
                <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(201,168,76,0.06)', background: 'rgba(0,0,0,0.25)' }}>
                  <p className="text-xs" style={{ color: 'rgba(245,240,232,0.42)' }}>
                    No appointments: {idle.map(s => s.name).join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
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
    api.monthlyReport(month).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [month]);

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
    </div>
  );

  const days       = data?.days || [];
  const maxRev     = days.length ? Math.max(...days.map(d => d.revenue), 1) : 1;
  const activeDays = days.filter(d => d.revenue > 0).length;
  const avgRev     = activeDays > 0 ? Math.round(data.totalRevenue / activeDays) : 0;
  const avgAppts   = activeDays > 0 ? Math.round(data.totalAppts / activeDays) : 0;
  const bestDay    = days.reduce((b, d) => d.revenue > (b?.revenue || 0) ? d : b, null);

  return (
    <div className="space-y-4">
      <input type="month" value={month} onChange={e => setMonth(e.target.value)}
        className="input max-w-[180px]" style={{ colorScheme: 'dark' }} />

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard icon={TrendingUp}   label="Total Revenue"  value={fmtRupee(data.totalRevenue)} gold />
            <SummaryCard icon={CalendarDays} label="Appointments"   value={data.totalAppts} sub={`${activeDays} working day${activeDays !== 1 ? 's' : ''}`} />
            <SummaryCard icon={BarChart2}    label="Avg / Day"      value={fmtRupee(avgRev)} sub={`${avgAppts} appointments/day avg`} />
            <SummaryCard icon={Star}         label="Best Day"       value={bestDay && bestDay.revenue > 0 ? fmtRupee(bestDay.revenue) : '—'} sub={bestDay && bestDay.revenue > 0 ? fmtDate(bestDay.date) : 'No data yet'} />
          </div>

          {/* Daily bars */}
          <div className="rounded-xl overflow-hidden"
            style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.78)' }}>Daily Breakdown</p>
            </div>
            {days.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <BarChart2 className="w-8 h-8" style={{ color: 'rgba(201,168,76,0.2)' }} />
                <p className="text-sm" style={{ color: 'rgba(245,240,232,0.62)' }}>No data for this month</p>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-2.5">
                {days.map(d => {
                  const isBest = bestDay && d.date === bestDay.date && bestDay.revenue > 0;
                  return (
                    <div key={d.date} className="flex items-center gap-3">
                      <span className="text-xs font-mono flex-shrink-0 w-20" style={{ color: 'rgba(245,240,232,0.68)' }}>{fmtDate(d.date)}</span>
                      <div className="flex-1 rounded-full h-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${(d.revenue / maxRev) * 100}%`,
                            background: isBest
                              ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                              : 'linear-gradient(90deg,#C9A84C,#E8C96D)',
                          }} />
                      </div>
                      <span className="text-xs font-serif font-semibold w-20 text-right flex-shrink-0"
                        style={{ color: isBest ? '#fbbf24' : '#C9A84C' }}>{fmtRupee(d.revenue)}</span>
                      <span className="text-xs w-14 text-right flex-shrink-0"
                        style={{ color: 'rgba(245,240,232,0.55)' }}>{d.appointments} appointment{d.appointments !== 1 ? 's' : ''}</span>
                    </div>
                  );
                })}
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
              : { color: 'rgba(245,240,232,0.68)', border: '1px solid transparent' }}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'staff' ? <StaffPerformance /> : <MonthlyReport />}
    </div>
  );
}
