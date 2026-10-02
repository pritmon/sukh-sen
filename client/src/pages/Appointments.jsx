import { useEffect, useState, useRef } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, todayISO, statusClass, statusLabel, openWhatsApp, whatsappConfirmMsg } from '../utils.js';
import { Plus, Zap, Check, X, Trash2, ChevronLeft, ChevronRight, MessageCircle, UserCheck } from 'lucide-react';
import Modal from '../components/Modal.jsx';

function AppointmentForm({ onSave, onClose }) {
  const [services,      setServices]      = useState([]);
  const [staff,         setStaff]         = useState([]);
  const [saving,        setSaving]        = useState(false);
  const [recognized,    setRecognized]    = useState(null);
  const [nameSuggests,  setNameSuggests]  = useState([]);
  const [showSuggests,  setShowSuggests]  = useState(false);
  const [nameTimer,     setNameTimer]     = useState(null);
  const [phoneTimer,    setPhoneTimer]    = useState(null);
  const nameRef = useRef(null);
  const [form, setForm] = useState({
    customerName:  '',
    customerPhone: '',
    serviceIds:    [],
    staffId:       '',
    date:          todayISO(),
    time:          '10:00',
    notes:         '',
    isWalkin:      false,
  });

  useEffect(() => {
    Promise.all([api.services(), api.staff()]).then(([svcs, st]) => {
      setServices(svcs);
      setStaff(st);
      if (st.length) setForm(f => ({ ...f, staffId: st[0].id }));
    });
  }, []);

  // Close suggestions when clicking outside
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
    if (recognized) return; // already selected by name, don't override phone lookup
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
    if (!form.customerName.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  const categories = [...new Set(services.map(s => s.category))];

  return (
    <form onSubmit={submit} className="space-y-4">
      {recognized && (
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <UserCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#E8C96D' }}>
              Welcome back, {recognized.name}!
            </p>
            <p className="text-xs" style={{ color: 'rgba(201,168,76,0.6)' }}>
              {recognized.visitCount || recognized.visit_count || 0} visit{(recognized.visitCount || recognized.visit_count) !== 1 ? 's' : ''} · returning guest
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Name with autocomplete */}
        <div className="relative" ref={nameRef}>
          <label className="label">Customer Name *</label>
          <input className="input" value={form.customerName}
            onChange={e => handleNameChange(e.target.value)}
            onFocus={() => nameSuggests.length > 0 && setShowSuggests(true)}
            required placeholder="Type name to search…" autoComplete="off" />
          {showSuggests && nameSuggests.length > 0 && (
            <div className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden shadow-xl"
              style={{ background: '#1A1A1A', border: '1px solid rgba(201,168,76,0.25)' }}>
              {nameSuggests.map(c => (
                <button key={c.id} type="button"
                  onMouseDown={() => selectCustomer(c)}
                  className="w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors"
                  style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{c.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(245,240,232,0.4)' }}>{c.phone || 'No phone'}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'rgba(201,168,76,0.7)', background: 'rgba(201,168,76,0.1)' }}>
                    {c.visit_count || 0} visits
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.customerPhone}
            onChange={e => handlePhoneChange(e.target.value)}
            placeholder="Auto-filled or enter number" type="tel" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date *</label>
          <input className="input" type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Time *</label>
          <input className="input" type="time" value={form.time}
            onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required />
        </div>
      </div>

      <div>
        <label className="label">Staff</label>
        <select className="input" value={form.staffId}
          onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}>
          <option value="">Unassigned</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Services</label>
        <div className="rounded-xl p-3 space-y-3 max-h-48 overflow-y-auto"
          style={{ border: '1px solid rgba(201,168,76,0.15)', background: '#0D0D0D' }}>
          {categories.map(cat => (
            <div key={cat}>
              <p className="text-xs font-medium uppercase tracking-widest mb-1.5"
                style={{ color: 'rgba(201,168,76,0.5)' }}>{cat}</p>
              {services.filter(s => s.category === cat).map(s => (
                <label key={s.id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input type="checkbox" checked={form.serviceIds.includes(s.id)}
                    onChange={() => toggle(s.id)} style={{ accentColor: '#C9A84C' }} />
                  <span className="text-sm flex-1" style={{ color: form.serviceIds.includes(s.id) ? '#F5F0E8' : 'rgba(245,240,232,0.5)' }}>{s.name}</span>
                  <span className="text-sm font-serif" style={{ color: '#C9A84C' }}>{fmtRupee(s.price)}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Optional notes" />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isWalkin}
          onChange={e => setForm(f => ({ ...f, isWalkin: e.target.checked }))}
          style={{ accentColor: '#C9A84C' }} />
        <span className="text-sm" style={{ color: 'rgba(245,240,232,0.7)' }}>Walk-in</span>
      </label>

      <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-4 flex justify-end gap-2"
        style={{ background: '#141414', borderTop: '1px solid rgba(201,168,76,0.1)', marginTop: 8 }}>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Book Appointment'}
        </button>
      </div>
    </form>
  );
}

export default function Appointments() {
  const [appts,    setAppts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [date,     setDate]     = useState(todayISO());
  const [showNew,  setShowNew]  = useState(false);
  const [error,    setError]    = useState(null);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.settings().then(setSettings).catch(() => {});
  }, []);

  async function load(d) {
    setLoading(true);
    try {
      setAppts(await api.appointments(d));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(date); }, [date]);

  function shiftDate(n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d.toISOString().split('T')[0]);
  }

  async function handleNew(form) {
    await api.createAppointment(form);
    setShowNew(false);
    load(date);
  }

  async function handleWalkin() {
    const name  = prompt('Customer name:');
    if (!name) return;
    const phone = prompt('Phone number (optional):') || '';
    await api.createAppointment({
      customerName: name, customerPhone: phone,
      serviceIds: [], staffId: '', date, time: new Date().toTimeString().slice(0,5),
      notes: '', isWalkin: true,
    });
    load(date);
  }

  async function setStatus(id, status) {
    await api.setStatus(id, status);
    load(date);
  }

  async function del(id) {
    if (!confirm('Delete this appointment?')) return;
    await api.deleteAppointment(id);
    load(date);
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg px-2 py-1.5"
          style={{ background: '#161616', border: '1px solid rgba(201,168,76,0.2)' }}>
          <button onClick={() => shiftDate(-1)} className="p-1 rounded-lg transition-colors"
            style={{ color: 'rgba(201,168,76,0.5)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(201,168,76,0.5)'}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="text-sm border-none focus:outline-none bg-transparent font-medium"
            style={{ color: '#F5F0E8', colorScheme: 'dark' }} />
          <button onClick={() => shiftDate(1)} className="p-1 rounded-lg transition-colors"
            style={{ color: 'rgba(201,168,76,0.5)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(201,168,76,0.5)'}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button onClick={() => setDate(todayISO())} className="btn-secondary text-xs px-3 py-2">Today</button>
        <div className="ml-auto flex gap-2">
          <button onClick={handleWalkin} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.97]"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.25)' }}>
            <Zap className="w-4 h-4" /> Walk-in
          </button>
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
        {/* Header */}
        <div className="hidden sm:flex px-4 py-2.5 text-xs font-medium uppercase tracking-widest gap-3"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', background: '#0D0D0D', color: 'rgba(201,168,76,0.5)' }}>
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
          <p className="text-center text-sm py-10" style={{ color: 'rgba(245,240,232,0.35)' }}>No appointments for {fmtDate(date)}</p>
        ) : (
          <div>
            {appts.map((a, idx) => (
              <div key={a.id} className="px-4 py-3 transition-colors"
                style={{ borderBottom: idx < appts.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                {/* Mobile card layout */}
                <div className="flex items-start gap-2.5 sm:hidden">
                  <span className="text-xs font-mono py-1 px-1.5 rounded text-center flex-shrink-0 mt-0.5"
                    style={{ width: 52, color: '#C9A84C', background: 'rgba(201,168,76,0.08)' }}>{a.time}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate flex-1" style={{ color: '#F5F0E8' }}>{a.customer_name}</p>
                      <span className="text-sm font-serif font-semibold flex-shrink-0" style={{ color: '#C9A84C' }}>{fmtRupee(a.total_price)}</span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(245,240,232,0.55)' }}>
                      {a.services?.map(s => s.name).join(', ') || '—'}
                    </p>
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
                        <button onClick={() => del(a.id)} title="Delete"
                          className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(245,240,232,0.2)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,240,232,0.2)'; e.currentTarget.style.background = 'transparent'; }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop row layout */}
                <div className="hidden sm:flex items-center gap-3">
                  {/* Time */}
                  <span className="text-xs font-mono py-1 px-1.5 rounded text-center flex-shrink-0"
                    style={{ width: 52, color: '#C9A84C', background: 'rgba(201,168,76,0.08)' }}>{a.time}</span>
                  {/* Customer */}
                  <div className="flex-shrink-0 min-w-0" style={{ width: 140 }}>
                    <p className="text-sm font-medium truncate" style={{ color: '#F5F0E8' }}>{a.customer_name}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(245,240,232,0.35)' }}>{a.customer_phone || '—'}</p>
                  </div>
                  {/* Services + status */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: 'rgba(245,240,232,0.6)' }}>
                      {a.services?.map(s => s.name).join(', ') || '—'}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={statusClass(a.status)}>{statusLabel(a.status)}</span>
                      {a.is_walkin ? <span className="badge-pending">Walk-in</span> : null}
                    </div>
                  </div>
                  {/* Staff */}
                  <span className="text-xs flex-shrink-0 truncate" style={{ width: 110, color: 'rgba(245,240,232,0.55)' }}>
                    {a.staff_name || '—'}
                  </span>
                  {/* Amount */}
                  <span className="text-sm flex-shrink-0 font-serif font-semibold text-right" style={{ width: 60, color: '#C9A84C' }}>
                    {fmtRupee(a.total_price)}
                  </span>
                  {/* WhatsApp */}
                  <div className="flex-shrink-0" style={{ width: 100 }}>
                    {a.customer_phone && (
                      <button
                        onClick={() => openWhatsApp(a.customer_phone, whatsappConfirmMsg(settings.salon_name || 'Sukh Sen Salon', a.customer_name, a.date, a.time, a.services?.map(s => s.name).join(', ')))}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors w-full justify-center"
                        style={{ color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.16)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.08)'}>
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </button>
                    )}
                  </div>
                  {/* Status actions */}
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
                    <button onClick={() => del(a.id)} title="Delete"
                      className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(245,240,232,0.2)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,240,232,0.2)'; e.currentTarget.style.background = 'transparent'; }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <Modal title="New Appointment" onClose={() => setShowNew(false)} wide>
          <AppointmentForm onSave={handleNew} onClose={() => setShowNew(false)} />
        </Modal>
      )}
    </div>
  );
}
