import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, todayISO } from '../utils.js';
import { TrendingUp, Users, ChevronLeft, ChevronRight, Award, BarChart2 } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => shiftDate(-1)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="input max-w-[160px]" />
        <button onClick={() => shiftDate(1)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => setDate(todayISO())} className="btn-secondary px-3 py-2 text-xs">Today</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {data.staff.map((s, i) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                  i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : 'bg-brand-500'
                }`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : (i + 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand-600">{fmtRupee(s.revenue)}</p>
                      <p className="text-xs text-gray-400">{s.appointments} appointments · {s.billed_count} billed</p>
                    </div>
                  </div>
                  {/* Revenue bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(s.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  {s.avg_bill > 0 && (
                    <p className="text-xs text-gray-400 mt-1.5">Avg bill: {fmtRupee(Math.round(s.avg_bill))}</p>
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

  if (loading) return <div className="flex items-center justify-center h-32"><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  const maxRev = data ? Math.max(...data.days.map(d => d.revenue), 1) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="input max-w-[160px]" />
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Revenue</p>
              <p className="text-2xl font-bold text-brand-600 mt-1">{fmtRupee(data.totalRevenue)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Appointments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalAppts}</p>
            </div>
          </div>

          <div className="card p-5">
            <p className="section-title mb-4">Daily Revenue</p>
            {data.days.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No data for this month</p>
            ) : (
              <div className="space-y-2">
                {data.days.map(d => (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400 w-20 flex-shrink-0">{fmtDate(d.date)}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${(d.revenue / maxRev) * 100}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-20 text-right">{fmtRupee(d.revenue)}</span>
                    <span className="text-xs text-gray-400 w-12 text-right">{d.appointments} appts</span>
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
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[['staff', 'Staff Performance', Users], ['monthly', 'Monthly Revenue', BarChart2]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'staff' ? <StaffPerformance /> : <MonthlyReport />}
    </div>
  );
}
