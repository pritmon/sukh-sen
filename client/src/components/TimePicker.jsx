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

  function commit(h, m) {
    onChange(`${pad(h)}:${pad(m)}`);
  }

  function changeHour(delta) {
    const h = (hour + delta + 24) % 24;
    setHour(h);
    commit(h, minute);
  }

  function changeMinute(delta) {
    const m = (minute + delta + 60) % 60;
    setMinute(m);
    commit(hour, m);
  }

  function toggleAmPm() {
    const h = hour >= 12 ? hour - 12 : hour + 12;
    setHour(h);
    commit(h, minute);
  }

  const isAm = hour < 12;
  const h12  = hour % 12 || 12;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input w-full flex items-center justify-between gap-2 text-left">
        <span style={{ color: '#F5F0E8' }}>{toDisplay(hour, minute)}</span>
        <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(201,168,76,0.55)' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: '#0E0E0E',
            border: '1px solid rgba(201,168,76,0.22)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)',
            width: 220,
          }}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-center gap-1"
            style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
            <Clock className="w-3.5 h-3.5 mr-1" style={{ color: 'rgba(201,168,76,0.5)' }} />
            <span className="text-sm font-serif font-semibold" style={{ color: '#E8C96D' }}>
              Select Time
            </span>
          </div>

          {/* Spinners */}
          <div className="flex items-center justify-center gap-2 px-4 py-4">

            {/* Hour */}
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={() => changeHour(1)}
                className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(201,168,76,0.5)' }}
                onMouseEnter={e => { e.currentTarget.style.color='#C9A84C'; e.currentTarget.style.background='rgba(201,168,76,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(201,168,76,0.5)'; e.currentTarget.style.background='transparent'; }}>
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="w-14 h-12 flex items-center justify-center rounded-xl text-2xl font-bold font-serif"
                style={{ background: 'rgba(201,168,76,0.08)', color: '#E8C96D', border: '1px solid rgba(201,168,76,0.18)' }}>
                {pad(h12)}
              </div>
              <button type="button" onClick={() => changeHour(-1)}
                className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(201,168,76,0.5)' }}
                onMouseEnter={e => { e.currentTarget.style.color='#C9A84C'; e.currentTarget.style.background='rgba(201,168,76,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(201,168,76,0.5)'; e.currentTarget.style.background='transparent'; }}>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <span className="text-2xl font-bold font-serif pb-1" style={{ color: 'rgba(201,168,76,0.4)' }}>:</span>

            {/* Minute */}
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={() => changeMinute(5)}
                className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(201,168,76,0.5)' }}
                onMouseEnter={e => { e.currentTarget.style.color='#C9A84C'; e.currentTarget.style.background='rgba(201,168,76,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(201,168,76,0.5)'; e.currentTarget.style.background='transparent'; }}>
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="w-14 h-12 flex items-center justify-center rounded-xl text-2xl font-bold font-serif"
                style={{ background: 'rgba(201,168,76,0.08)', color: '#E8C96D', border: '1px solid rgba(201,168,76,0.18)' }}>
                {pad(minute)}
              </div>
              <button type="button" onClick={() => changeMinute(-5)}
                className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(201,168,76,0.5)' }}
                onMouseEnter={e => { e.currentTarget.style.color='#C9A84C'; e.currentTarget.style.background='rgba(201,168,76,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(201,168,76,0.5)'; e.currentTarget.style.background='transparent'; }}>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* AM/PM toggle */}
            <div className="flex flex-col gap-1 ml-1">
              <button type="button" onClick={() => !isAm && toggleAmPm()}
                className="w-12 h-[52px] rounded-xl text-sm font-bold transition-all"
                style={isAm ? {
                  background: 'linear-gradient(135deg,#C9A84C,#E8C96D)',
                  color: '#0D0D0D',
                  boxShadow: '0 2px 12px rgba(201,168,76,0.35)',
                } : {
                  background: 'rgba(201,168,76,0.06)',
                  color: 'rgba(201,168,76,0.45)',
                  border: '1px solid rgba(201,168,76,0.12)',
                }}>
                AM
              </button>
              <button type="button" onClick={() => isAm && toggleAmPm()}
                className="w-12 h-[52px] rounded-xl text-sm font-bold transition-all"
                style={!isAm ? {
                  background: 'linear-gradient(135deg,#C9A84C,#E8C96D)',
                  color: '#0D0D0D',
                  boxShadow: '0 2px 12px rgba(201,168,76,0.35)',
                } : {
                  background: 'rgba(201,168,76,0.06)',
                  color: 'rgba(201,168,76,0.45)',
                  border: '1px solid rgba(201,168,76,0.12)',
                }}>
                PM
              </button>
            </div>
          </div>

          {/* Quick picks */}
          <div className="px-4 pb-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(201,168,76,0.4)' }}>Quick</p>
            <div className="grid grid-cols-4 gap-1.5">
              {['09:00','10:00','11:00','12:00','14:00','15:00','16:00','18:00'].map(t => {
                const [qh, qm] = t.split(':').map(Number);
                const active = qh === hour && qm === minute;
                return (
                  <button key={t} type="button"
                    onClick={() => { setHour(qh); setMinute(qm); commit(qh, qm); setOpen(false); }}
                    className="py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={active ? {
                      background: 'rgba(201,168,76,0.18)',
                      color: '#E8C96D',
                      border: '1px solid rgba(201,168,76,0.35)',
                    } : {
                      background: 'rgba(201,168,76,0.04)',
                      color: 'rgba(245,240,232,0.55)',
                      border: '1px solid rgba(201,168,76,0.1)',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(201,168,76,0.1)'; e.currentTarget.style.color='#C9A84C'; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background='rgba(201,168,76,0.04)'; e.currentTarget.style.color='rgba(245,240,232,0.55)'; }}}>
                    {toDisplay(qh, qm).replace(' ','').toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Done */}
          <div className="px-4 pb-4">
            <button type="button" onClick={() => setOpen(false)}
              className="w-full py-2 rounded-xl text-sm font-bold transition-all"
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
