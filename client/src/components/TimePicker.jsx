import { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

function pad(n) { return String(n).padStart(2, '0'); }

function parseTime(val) {
  if (!val) return { h: 10, m: 0 };
  const [h, m] = val.split(':').map(Number);
  return { h, m };
}

function toDisplay(h, m) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${pad(h12)}:${pad(m)} ${ampm}`;
}

const QUICK = [
  { label: '9 AM',  h: 9,  m: 0 },
  { label: '10 AM', h: 10, m: 0 },
  { label: '11 AM', h: 11, m: 0 },
  { label: '12 PM', h: 12, m: 0 },
  { label: '1 PM',  h: 13, m: 0 },
  { label: '2 PM',  h: 14, m: 0 },
  { label: '3 PM',  h: 15, m: 0 },
  { label: '4 PM',  h: 16, m: 0 },
  { label: '5 PM',  h: 17, m: 0 },
  { label: '6 PM',  h: 18, m: 0 },
  { label: '7 PM',  h: 19, m: 0 },
  { label: '8 PM',  h: 20, m: 0 },
];

export default function TimePicker({ value, onChange }) {
  const { h: initH, m: initM } = parseTime(value);
  const [open,   setOpen]   = useState(false);
  const [hour,   setHour]   = useState(initH);
  const [minute, setMinute] = useState(initM);
  const ref = useRef(null);

  useEffect(() => {
    const { h, m } = parseTime(value);
    setHour(h); setMinute(m);
  }, [value]);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function commit(h, m) { onChange(`${pad(h)}:${pad(m)}`); }

  function changeHour(delta) {
    const h = (hour + delta + 24) % 24;
    setHour(h); commit(h, minute);
  }
  function changeMinute(delta) {
    const m = (minute + delta + 60) % 60;
    setMinute(m); commit(hour, m);
  }
  function toggleAmPm() {
    const h = hour >= 12 ? hour - 12 : hour + 12;
    setHour(h); commit(h, minute);
  }

  const isAm = hour < 12;
  const h12  = hour % 12 || 12;

  const spinBtn = (onClick) => ({
    type: 'button',
    onClick,
    className: 'p-1.5 rounded-lg transition-colors flex items-center justify-center',
    style: { color: 'rgba(201,168,76,0.5)' },
    onMouseEnter: e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; },
    onMouseLeave: e => { e.currentTarget.style.color = 'rgba(201,168,76,0.5)'; e.currentTarget.style.background = 'transparent'; },
  });

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="input w-full flex items-center justify-between gap-2 text-left">
        <span style={{ color: '#F5F0E8' }}>{toDisplay(hour, minute)}</span>
        <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(201,168,76,0.55)' }} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 rounded-2xl"
          style={{
            background: '#0E0E0E',
            border: '1px solid rgba(201,168,76,0.22)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            width: 300,
          }}>

          {/* Header */}
          <div className="flex items-center justify-center gap-2 px-5 py-3"
            style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
            <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(201,168,76,0.5)' }} />
            <span className="text-sm font-serif font-semibold" style={{ color: '#E8C96D' }}>Select Time</span>
          </div>

          {/* Spinners row */}
          <div className="flex items-center justify-center gap-3 px-5 pt-4 pb-3">
            {/* Hour */}
            <div className="flex flex-col items-center gap-1">
              <button {...spinBtn(() => changeHour(1))}><ChevronUp className="w-4 h-4" /></button>
              <div className="w-16 h-14 flex items-center justify-center rounded-xl text-3xl font-bold font-serif"
                style={{ background: 'rgba(201,168,76,0.08)', color: '#E8C96D', border: '1px solid rgba(201,168,76,0.18)' }}>
                {pad(h12)}
              </div>
              <button {...spinBtn(() => changeHour(-1))}><ChevronDown className="w-4 h-4" /></button>
            </div>

            <span className="text-3xl font-bold font-serif" style={{ color: 'rgba(201,168,76,0.35)', paddingBottom: 4 }}>:</span>

            {/* Minute */}
            <div className="flex flex-col items-center gap-1">
              <button {...spinBtn(() => changeMinute(5))}><ChevronUp className="w-4 h-4" /></button>
              <div className="w-16 h-14 flex items-center justify-center rounded-xl text-3xl font-bold font-serif"
                style={{ background: 'rgba(201,168,76,0.08)', color: '#E8C96D', border: '1px solid rgba(201,168,76,0.18)' }}>
                {pad(minute)}
              </div>
              <button {...spinBtn(() => changeMinute(-5))}><ChevronDown className="w-4 h-4" /></button>
            </div>

            {/* AM / PM */}
            <div className="flex flex-col gap-2 ml-2">
              {['AM', 'PM'].map(period => {
                const active = isAm ? period === 'AM' : period === 'PM';
                return (
                  <button key={period} type="button"
                    onClick={() => (period === 'AM' ? !isAm : isAm) && toggleAmPm()}
                    className="w-14 h-[26px] rounded-lg text-xs font-bold transition-all"
                    style={active ? {
                      background: 'linear-gradient(135deg,#C9A84C,#E8C96D)',
                      color: '#0D0D0D',
                      boxShadow: '0 2px 10px rgba(201,168,76,0.3)',
                    } : {
                      background: 'rgba(201,168,76,0.06)',
                      color: 'rgba(201,168,76,0.4)',
                      border: '1px solid rgba(201,168,76,0.12)',
                    }}>
                    {period}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(201,168,76,0.08)', margin: '0 20px' }} />

          {/* Quick picks */}
          <div className="px-5 pt-3 pb-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2.5"
              style={{ color: 'rgba(201,168,76,0.4)' }}>Quick select</p>
            <div className="grid grid-cols-4 gap-1.5">
              {QUICK.map(({ label, h, m }) => {
                const active = h === hour && m === minute;
                return (
                  <button key={label} type="button"
                    onClick={() => { setHour(h); setMinute(m); commit(h, m); setOpen(false); }}
                    className="py-1.5 rounded-lg text-xs font-semibold transition-all text-center"
                    style={active ? {
                      background: 'rgba(201,168,76,0.18)',
                      color: '#E8C96D',
                      border: '1px solid rgba(201,168,76,0.35)',
                    } : {
                      background: 'rgba(255,255,255,0.03)',
                      color: 'rgba(245,240,232,0.55)',
                      border: '1px solid rgba(201,168,76,0.1)',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(201,168,76,0.1)'; e.currentTarget.style.color = '#C9A84C'; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(245,240,232,0.55)'; }}}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Done */}
          <div className="px-5 pb-4">
            <button type="button" onClick={() => setOpen(false)}
              className="w-full py-2 rounded-xl text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg,#C9A84C,#E8C96D)',
                color: '#0D0D0D',
                boxShadow: '0 2px 12px rgba(201,168,76,0.3)',
              }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
