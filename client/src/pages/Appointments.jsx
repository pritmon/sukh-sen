import { useEffect, useState, useRef } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, fmtTime, todayISO, statusClass, statusLabel, openWhatsApp, whatsappConfirmMsg } from '../utils.js';
import { Plus, Zap, Check, X, Trash2, ChevronLeft, ChevronRight, MessageCircle, UserCheck } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import DatePicker from '../components/DatePicker.jsx';
import TimePicker from '../components/TimePicker.jsx';

function AppointmentForm({ onSave, onClose, walkin }) {
  const [services,     setServices]     = useState([]);
  const [staff,        setStaff]        = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [formErrors,   setFormErrors]   = useState({});
  const [recognized,   setRecognized]   = useState(null);
  const [nameSuggests, setNameSuggests] = useState([]);
  const [showSuggests, setShowSuggests] = useState(false);
  const [nameTimer,    setNameTimer]    = useState(null);
  const [phoneTimer,   setPhoneTimer]   = useState(null);
  const nameRef = useRef(null);

  const nowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const [form, setForm] = useState({
    customerName:  '',
    customerPhone: '',
    serviceIds:    [],
    staffId:       '',
    date:          todayISO(),
    time:          walkin ? nowTime() : '10:00',
    notes:         '',
    isWalkin:      !!walkin,
  });

  useEffect(() => {
    Promise.all([api.services(), api.staff()]).then(([svcs, st]) => {
      setServices(svcs);
      setStaff(st);
      if (st.length) setForm(f => ({ ...f, staffId: st[0].id }));
    });
  }, []);

  useEffect(() => {
    function handler(e) {
      if (nameRef.current && !nameRef.current.contains(e.target)) setShowSuggests(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleNameChange(name) {
    setForm(f => ({ ...f, customerName: name }));
    setRecognized(null);
    clearTimeout(nameTimer);
    if (name.trim().length >= 2) {
      setNameTimer(setTimeout(async () => {
        const results = await api.customers(name.trim()).catch(() => []);
        setNameSuggests(results.slice(0, 6));
        setShowSuggests(results.length > 0);
      }, 300));
    } else {
      setNameSuggests([]);
      setShowSuggests(false);
    }
  }

  function selectCustomer(c) {
    setRecognized({ ...c, visitCount: c.visit_count || 0 });
    setForm(f => ({ ...f, customerName: c.name, customerPhone: c.phone || '' }));
    setShowSuggests(false);
    setNameSuggests([]);
  }

  function handlePhoneChange(phone) {
    setForm(f => ({ ...f, customerPhone: phone }));
    if (recognized) return;
    setRecognized(null);
    clearTimeout(phoneTimer);
    if (phone.replace(/\D/g, '').length >= 10) {
      setPhoneTimer(setTimeout(async () => {
        const found = await api.customerLookup(phone.trim()).catch(() => null);
        if (found) {
          setRecognized(found);
          setForm(f => ({ ...f, customerName: found.name }));
        }
      }, 400));
    }
  }

  function toggle(id) {
    setForm(f => ({
      ...f,
      serviceIds: f.serviceIds.includes(id)
        ? f.serviceIds.filter(s => s !== id)
        : [...f.serviceIds, id],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.customerName.trim()) errs.customerName = 'Customer name is required';
    const digits = (form.customerPhone || '').replace(/\D/g, '');
    if (digits && digits.length !== 10) errs.customerPhone = 'Must be a 10-digit number';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  const categories = [...new Set(services.map(s => s.category))];
  const selectedServices = services.filter(s => form.serviceIds.includes(s.id));
  const total = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Returning customer banner */}
      {recognized && (
        <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <UserCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#E8C96D' }}>
              Welcome back, {recognized.name}!
            </p>
            <p className="text-xs" style={{ color: 'rgba(201,168,76,0.85)' }}>
              {recognized.visitCount || recognized.visit_count || 0} visit{(recognized.visitCount || recognized.visit_count) !== 1 ? 's' : ''} · returning guest
            </p>
          </div>
        </div>
      )}

      {/* Customer */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative" ref={nameRef}>
          <label className="label">Customer Name *</label>
          <input className="input" value={form.customerName}
            onChange={e => { handleNameChange(e.target.value); setFormErrors(er => ({ ...er, customerName: '' })); }}
            onFocus={() => nameSuggests.length > 0 && setShowSuggests(true)}
            placeholder="Type name to search…" autoComplete="off"
            style={formErrors.customerName ? { borderColor: '#ef4444' } : {}} />
          {formErrors.customerName && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{formErrors.customerName}</p>}
          {showSuggests && nameSuggests.length > 0 && (
            <div className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden shadow-xl"
              style={{ background: '#1A1A1A', border: '1px solid rgba(201,168,76,0.25)' }}>
              {nameSuggests.map(c => (
                <button key={c.id} type="button" onMouseDown={() => selectCustomer(c)}
                  className="w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors"
                  style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{c.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(245,240,232,0.68)' }}>{c.phone || 'No phone'}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'rgba(201,168,76,0.7)', background: 'rgba(201,168,76,0.1)' }}>
                    {c.visit_count || 0} visits
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.customerPhone}
            onChange={e => { handlePhoneChange(e.target.value.replace(/\D/g, '').slice(0,10)); setFormErrors(er => ({ ...er, customerPhone: '' })); }}
            placeholder="10-digit number" type="tel" maxLength={10}
            style={formErrors.customerPhone ? { borderColor: '#ef4444' } : {}} />
          {formErrors.customerPhone && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{formErrors.customerPhone}</p>}
        </div>
      </div>

      {/* Date / Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{walkin ? 'Date (today)' : 'Date *'}</label>
          <DatePicker
            value={form.date}
            onChange={d => setForm(f => ({ ...f, date: d }))}
            readOnly={!!walkin}
          />
        </div>
        <div>
          <label className="label">{walkin ? 'Time (now)' : 'Time *'}</label>
          <TimePicker value={form.time} onChange={t => setForm(f => ({ ...f, time: t }))} />
        </div>
      </div>

      {/* Staff */}
      <div>
        <label className="label">Staff</label>
        <select className="input" value={form.staffId}
          onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}>
          <option value="">Unassigned</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
        </select>
      </div>

      {/* Services */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="label mb-0">Services</label>
          {selectedServices.length > 0 && (
            <span className="text-xs font-semibold" style={{ color: '#E8C96D' }}>
              {selectedServices.length} selected · {fmtRupee(total)}
            </span>
          )}
        </div>
        <div className="rounded-xl p-3 space-y-3 max-h-52 overflow-y-auto"
          style={{ border: '1px solid rgba(201,168,76,0.15)', background: '#0D0D0D' }}>
          {categories.map(cat => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: 'rgba(201,168,76,0.78)' }}>{cat}</p>
              {services.filter(s => s.category === cat).map(s => {
                const checked = form.serviceIds.includes(s.id);
                return (
                  <label key={s.id}
                    className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors"
                    style={checked ? { background: 'rgba(201,168,76,0.06)' } : {}}>
                    <input type="checkbox" checked={checked}
                      onChange={() => toggle(s.id)} style={{ accentColor: '#C9A84C' }} />
                    <span className="text-sm flex-1"
                      style={{ color: checked ? '#F5F0E8' : 'rgba(245,240,232,0.5)' }}>{s.name}</span>
                    <span className="text-sm font-serif font-semibold"
                      style={{ color: checked ? '#E8C96D' : 'rgba(201,168,76,0.55)' }}>{fmtRupee(s.price)}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Total summary */}
      {selectedServices.length > 0 && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)' }}>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(201,168,76,0.7)' }}>Services selected</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(245,240,232,0.65)', maxWidth: 280 }}>
              {selectedServices.map(s => s.name).join(' · ')}
            </p>
          </div>
          <p className="text-xl font-serif font-bold flex-shrink-0 ml-3" style={{ color: '#E8C96D' }}>{fmtRupee(total)}</p>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Special requests, allergies, preferences…" />
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-4 flex justify-end gap-2"
        style={{ background: '#141414', borderTop: '1px solid rgba(201,168,76,0.1)', marginTop: 8 }}>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : walkin ? '⚡ Log Walk-in' : 'Book Appointment'}
        </button>
      </div>
    </form>
  );
}

export default function Appointments() {
  const [appts,         setAppts]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [date,          setDate]          = useState(todayISO());
  const [showNew,       setShowNew]       = useState(false);
  const [showWalkin,    setShowWalkin]    = useState(false);
  const [error,         setError]         = useState(null);
  const [settings,      setSettings]      = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  function requestDelete(id) { setPendingDelete(id); setTimeout(() => setPendingDelete(null), 3000); }

  useEffect(() => { api.settings().then(setSettings).catch(() => {}); }, []);

  async function load(d) {
    setLoading(true);
    try { setAppts(await api.appointments(d)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(date); }, [date]);

  function shiftDate(n) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + n);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDate(`${y}-${m}-${day}`);
  }

  async function handleNew(form) {
    await api.createAppointment(form);
    setShowNew(false);
    load(date);
  }

  async function handleWalkin(form) {
    await api.createAppointment(form);
    setShowWalkin(false);
    load(date);
  }

  async function setStatus(id, status) {
    await api.setStatus(id, status);
    load(date);
  }

  async function del(id) {
    await api.deleteAppointment(id);
    load(date);
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => shiftDate(-1)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'rgba(201,168,76,0.6)', background: '#161616', border: '1px solid rgba(201,168,76,0.15)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.6)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'; }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div style={{ width: 180 }}>
            <DatePicker value={date} onChange={setDate} />
          </div>
          <button onClick={() => shiftDate(1)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'rgba(201,168,76,0.6)', background: '#161616', border: '1px solid rgba(201,168,76,0.15)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.6)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'; }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button onClick={() => setDate(todayISO())} className="btn-secondary text-xs px-3 py-2">Today</button>
        <div className="ml-auto flex gap-2.5">
          <button onClick={() => setShowWalkin(true)}
            className="group flex flex-col items-start px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.96]"
            style={{
              background: 'rgba(201,168,76,0.07)',
              border: '1px solid rgba(201,168,76,0.28)',
              boxShadow: '0 0 0 0 rgba(201,168,76,0)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(201,168,76,0.13)';
              e.currentTarget.style.borderColor = 'rgba(201,168,76,0.55)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(201,168,76,0.18)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(201,168,76,0.07)';
              e.currentTarget.style.borderColor = 'rgba(201,168,76,0.28)';
              e.currentTarget.style.boxShadow = '0 0 0 0 rgba(201,168,76,0)';
            }}>
            <span className="flex items-center gap-1.5 text-sm font-bold leading-tight tracking-wide" style={{ color: '#E8C96D' }}>
              <Zap className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 4px rgba(232,201,109,0.6))' }} /> Walk-in
            </span>
            <span className="text-xs leading-tight mt-0.5 font-medium" style={{ color: 'rgba(201,168,76,0.5)' }}>drop-in · pay now</span>
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex flex-col items-start px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.96]"
            style={{
              background: 'linear-gradient(135deg, #B8922E 0%, #C9A84C 40%, #E8C96D 100%)',
              boxShadow: '0 4px 20px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
              color: '#0D0D0D',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 6px 28px rgba(201,168,76,0.55), inset 0 1px 0 rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
            <span className="flex items-center gap-1.5 text-sm font-bold leading-tight tracking-wide">
              <Plus className="w-4 h-4" /> Book Ahead
            </span>
            <span className="text-xs leading-tight mt-0.5 font-medium" style={{ color: 'rgba(13,13,13,0.55)' }}>schedule in advance</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
        <div className="hidden sm:flex px-4 py-2.5 text-xs font-medium uppercase tracking-widest gap-3"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', background: '#0D0D0D', color: 'rgba(201,168,76,0.78)' }}>
          <span style={{ width: 52, flexShrink: 0 }}>Time</span>
          <span style={{ width: 140, flexShrink: 0 }}>Customer</span>
          <span className="flex-1 min-w-0">Services</span>
          <span style={{ width: 110, flexShrink: 0 }}>Staff</span>
          <span style={{ width: 60, flexShrink: 0, textAlign: 'right' }}>Amount</span>
          <span style={{ width: 100, flexShrink: 0 }}></span>
          <span style={{ width: 72, flexShrink: 0 }}></span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
          </div>
        ) : error ? (
          <p className="text-center text-sm py-10" style={{ color: '#f87171' }}>{error}</p>
        ) : appts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <p className="text-sm font-medium" style={{ color: 'rgba(245,240,232,0.68)' }}>No appointments for {fmtDate(date)}</p>
            <p className="text-xs" style={{ color: 'rgba(245,240,232,0.42)' }}>Use + New to book or Walk-in for drop-ins</p>
          </div>
        ) : (
          <div>
            {appts.map((a, idx) => (
              <div key={a.id} className="px-4 py-3 transition-colors"
                style={{ borderBottom: idx < appts.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                {/* Mobile card */}
                <div className="flex items-start gap-2.5 sm:hidden">
                  <span className="text-xs font-mono py-1 px-1.5 rounded text-center flex-shrink-0 mt-0.5"
                    style={{ width: 52, color: '#C9A84C', background: 'rgba(201,168,76,0.08)' }}>{fmtTime(a.time)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate flex-1" style={{ color: '#F5F0E8' }}>{a.customer_name}</p>
                      <span className="text-sm font-serif font-semibold flex-shrink-0" style={{ color: '#C9A84C' }}>{fmtRupee(a.total_price)}</span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(245,240,232,0.55)' }}>
                      {a.services?.map(s => s.name).join(', ') || '—'}
                    </p>
                    {a.staff_name && <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.45)' }}>{a.staff_name}</p>}
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1">
                        <span className={statusClass(a.status)}>{statusLabel(a.status)}</span>
                        {a.is_walkin ? <span className="badge-pending">Walk-in</span> : null}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {a.status === 'pending' && (
                          <>
                            <button onClick={() => setStatus(a.id, 'done')} title="Mark done"
                              className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(74,222,128,0.6)' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#4ade80'; e.currentTarget.style.background = 'rgba(74,222,128,0.08)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(74,222,128,0.6)'; e.currentTarget.style.background = 'transparent'; }}>
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setStatus(a.id, 'cancelled')} title="Cancel"
                              className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(239,68,68,0.6)' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; e.currentTarget.style.background = 'transparent'; }}>
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {pendingDelete === a.id
                          ? <button onClick={() => del(a.id)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold"
                              style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                              Sure?
                            </button>
                          : <button onClick={() => requestDelete(a.id)} title="Delete"
                              className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(245,240,232,0.42)' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,240,232,0.2)'; e.currentTarget.style.background = 'transparent'; }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop row */}
                <div className="hidden sm:flex items-center gap-3">
                  <span className="text-xs font-mono py-1 px-1.5 rounded text-center flex-shrink-0"
                    style={{ width: 52, color: '#C9A84C', background: 'rgba(201,168,76,0.08)' }}>{fmtTime(a.time)}</span>
                  <div className="flex-shrink-0 min-w-0" style={{ width: 140 }}>
                    <p className="text-sm font-medium truncate" style={{ color: '#F5F0E8' }}>{a.customer_name}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(245,240,232,0.62)' }}>{a.customer_phone || '—'}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: 'rgba(245,240,232,0.6)' }}>
                      {a.services?.map(s => s.name).join(', ') || '—'}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={statusClass(a.status)}>{statusLabel(a.status)}</span>
                      {a.is_walkin ? <span className="badge-pending">Walk-in</span> : null}
                    </div>
                  </div>
                  <span className="text-xs flex-shrink-0 truncate" style={{ width: 110, color: 'rgba(245,240,232,0.55)' }}>
                    {a.staff_name || '—'}
                  </span>
                  <span className="text-sm flex-shrink-0 font-serif font-semibold text-right" style={{ width: 60, color: '#C9A84C' }}>
                    {fmtRupee(a.total_price)}
                  </span>
                  <div className="flex-shrink-0" style={{ width: 100 }}>
                    {a.customer_phone && (
                      <button
                        onClick={() => openWhatsApp(a.customer_phone, whatsappConfirmMsg(settings.salon_name || 'Sukh Sen Salon', a.customer_name, a.date, a.time, a.services?.map(s => s.name).join(', ')))}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors w-full justify-center"
                        style={{ color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.16)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.08)'}>
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </button>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-end gap-0.5" style={{ width: 72 }}>
                    {a.status === 'pending' && (
                      <>
                        <button onClick={() => setStatus(a.id, 'done')} title="Mark done"
                          className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(74,222,128,0.6)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#4ade80'; e.currentTarget.style.background = 'rgba(74,222,128,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(74,222,128,0.6)'; e.currentTarget.style.background = 'transparent'; }}>
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setStatus(a.id, 'cancelled')} title="Cancel"
                          className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(239,68,68,0.6)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; e.currentTarget.style.background = 'transparent'; }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {pendingDelete === a.id
                      ? <button onClick={() => del(a.id)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold"
                          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                          Sure?
                        </button>
                      : <button onClick={() => requestDelete(a.id)} title="Delete"
                          className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(245,240,232,0.42)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,240,232,0.2)'; e.currentTarget.style.background = 'transparent'; }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <Modal title="Book Appointment" subtitle="Schedule a future visit for a customer" onClose={() => setShowNew(false)} wide>
          <AppointmentForm onSave={handleNew} onClose={() => setShowNew(false)} />
        </Modal>
      )}

      {showWalkin && (
        <Modal title="⚡ Walk-in" subtitle="Customer is here now · date & time auto-filled" onClose={() => setShowWalkin(false)} wide>
          <AppointmentForm onSave={handleWalkin} onClose={() => setShowWalkin(false)} walkin />
        </Modal>
      )}
    </div>
  );
}
