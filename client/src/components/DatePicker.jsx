import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function parseISO(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

function toISO(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function todayParts() {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() };
}

export default function DatePicker({ value, onChange, readOnly, placeholder = 'Select date' }) {
  const parsed   = parseISO(value);
  const today    = todayParts();

  const [open,    setOpen]    = useState(false);
  const [viewY,   setViewY]   = useState(parsed?.y  ?? today.y);
  const [viewM,   setViewM]   = useState(parsed?.m  ?? today.m);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function prevMonth() {
    if (viewM === 1) { setViewM(12); setViewY(y => y - 1); }
    else setViewM(m => m - 1);
  }
  function nextMonth() {
    if (viewM === 12) { setViewM(1); setViewY(y => y + 1); }
    else setViewM(m => m + 1);
  }

  function selectDay(d) {
    onChange(toISO(viewY, viewM, d));
    setOpen(false);
  }

  // Build calendar grid
  const firstDow  = new Date(viewY, viewM - 1, 1).getDay();
  const daysInMonth = new Date(viewY, viewM, 0).getDate();
  const daysInPrev  = new Date(viewY, viewM - 1, 0).getDate();
  const cells = [];
  for (let i = firstDow - 1; i >= 0; i--)   cells.push({ d: daysInPrev - i, cur: false });
  for (let d = 1; d <= daysInMonth; d++)      cells.push({ d, cur: true });
  while (cells.length % 7 !== 0)              cells.push({ d: cells.length - daysInMonth - firstDow + 1, cur: false });

  const displayVal = parsed
    ? `${String(parsed.d).padStart(2,'0')} ${MONTHS[parsed.m - 1].slice(0,3)} ${parsed.y}`
    : '';

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        disabled={readOnly}
        onClick={() => !readOnly && setOpen(o => !o)}
        className="input w-full flex items-center justify-between gap-2 text-left"
        style={readOnly ? { opacity: 0.5, cursor: 'default' } : {}}>
        <span style={{ color: displayVal ? '#F5F0E8' : 'rgba(245,240,232,0.35)' }}>
          {displayVal || placeholder}
        </span>
        <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(201,168,76,0.55)' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: '#0E0E0E',
            border: '1px solid rgba(201,168,76,0.22)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)',
            width: 280,
          }}>

          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
            <button type="button" onClick={prevMonth}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(201,168,76,0.6)' }}
              onMouseEnter={e => { e.currentTarget.style.color='#C9A84C'; e.currentTarget.style.background='rgba(201,168,76,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(201,168,76,0.6)'; e.currentTarget.style.background='transparent'; }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-semibold font-serif" style={{ color: '#E8C96D' }}>
              {MONTHS[viewM - 1]} {viewY}
            </p>
            <button type="button" onClick={nextMonth}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(201,168,76,0.6)' }}
              onMouseEnter={e => { e.currentTarget.style.color='#C9A84C'; e.currentTarget.style.background='rgba(201,168,76,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(201,168,76,0.6)'; e.currentTarget.style.background='transparent'; }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold uppercase tracking-widest py-1"
                style={{ color: 'rgba(201,168,76,0.45)' }}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {cells.map((cell, i) => {
              const isToday    = cell.cur && cell.d === today.d && viewM === today.m && viewY === today.y;
              const isSelected = cell.cur && parsed && cell.d === parsed.d && viewM === parsed.m && viewY === parsed.y;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!cell.cur}
                  onClick={() => cell.cur && selectDay(cell.d)}
                  className="relative flex items-center justify-center rounded-xl text-sm font-medium transition-all"
                  style={{
                    height: 34,
                    color: isSelected
                      ? '#0D0D0D'
                      : isToday
                      ? '#E8C96D'
                      : cell.cur
                      ? 'rgba(245,240,232,0.85)'
                      : 'rgba(245,240,232,0.18)',
                    background: isSelected
                      ? 'linear-gradient(135deg,#C9A84C,#E8C96D)'
                      : isToday
                      ? 'rgba(201,168,76,0.1)'
                      : 'transparent',
                    boxShadow: isSelected
                      ? '0 2px 12px rgba(201,168,76,0.4)'
                      : isToday
                      ? '0 0 0 1px rgba(201,168,76,0.35)'
                      : 'none',
                    fontWeight: isSelected || isToday ? 700 : 500,
                    cursor: cell.cur ? 'pointer' : 'default',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected && cell.cur) {
                      e.currentTarget.style.background = 'rgba(201,168,76,0.1)';
                      e.currentTarget.style.color = '#E8C96D';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected && cell.cur) {
                      e.currentTarget.style.background = isToday ? 'rgba(201,168,76,0.1)' : 'transparent';
                      e.currentTarget.style.color = isToday ? '#E8C96D' : 'rgba(245,240,232,0.85)';
                    }
                  }}>
                  {cell.d}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="px-3 pb-3 flex justify-end">
            <button type="button"
              onClick={() => { setViewY(today.y); setViewM(today.m); selectDay(today.d); }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#C9A84C', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(201,168,76,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(201,168,76,0.08)'}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
