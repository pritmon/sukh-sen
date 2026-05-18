import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, todayISO, statusClass, statusLabel, openWhatsApp, whatsappConfirmMsg } from '../utils.js';
import { Plus, Zap, Check, X, Trash2, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import Modal from '../components/Modal.jsx';

function AppointmentForm({ onSave, onClose }) {
  const [services, setServices] = useState([]);
  const [staff,    setStaff]    = useState([]);
  const [saving,   setSaving]   = useState(false);
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Customer Name *</label>
          <input className="input" value={form.customerName}
            onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
            required placeholder="Full name" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.customerPhone}
            onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
            placeholder="Mobile number" type="tel" />
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
        <div className="border border-gray-200 rounded-xl p-3 space-y-3 max-h-48 overflow-y-auto bg-gray-50/50">
          {categories.map(cat => (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{cat}</p>
              {services.filter(s => s.category === cat).map(s => (
                <label key={s.id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input type="checkbox" checked={form.serviceIds.includes(s.id)}
                    onChange={() => toggle(s.id)}
                    className="rounded border-gray-300 text-brand-500" />
                  <span className="text-sm text-gray-700 flex-1">{s.name}</span>
                  <span className="text-sm text-gray-500">{fmtRupee(s.price)}</span>
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
          className="rounded border-gray-300 text-brand-500" />
        <span className="text-sm text-gray-700">Walk-in</span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm">
          <button onClick={() => shiftDate(-1)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            className="text-sm border-none focus:outline-none bg-transparent font-medium text-gray-700"
          />
          <button onClick={() => shiftDate(1)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button onClick={() => setDate(todayISO())} className="btn-secondary text-xs px-3 py-2">Today</button>
        <div className="ml-auto flex gap-2">
          <button onClick={handleWalkin} className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]">
            <Zap className="w-4 h-4" /> Walk-in
          </button>
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide grid grid-cols-12 gap-2">
          <span className="col-span-1">Time</span>
          <span className="col-span-3">Customer</span>
          <span className="col-span-4">Services</span>
          <span className="col-span-1">Staff</span>
          <span className="col-span-1 text-right">Amount</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 text-sm py-10">Loading…</p>
        ) : error ? (
          <p className="text-center text-red-500 text-sm py-10">{error}</p>
        ) : appts.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No appointments for {fmtDate(date)}</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {appts.map(a => (
              <div key={a.id} className="px-5 py-3 grid grid-cols-12 gap-2 items-center hover:bg-gray-50">
                <span className="col-span-1 text-sm font-mono text-gray-500">{a.time}</span>
                <div className="col-span-3 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.customer_name}</p>
                  <p className="text-xs text-gray-400">{a.customer_phone}</p>
                </div>
                <div className="col-span-4 min-w-0">
                  <p className="text-sm text-gray-700 truncate">
                    {a.services?.map(s => s.name).join(', ') || '—'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={statusClass(a.status)}>{statusLabel(a.status)}</span>
                    {a.is_walkin ? <span className="badge-pending">Walk-in</span> : null}
                  </div>
                </div>
                <span className="col-span-1 text-xs text-gray-500">{a.staff_name || '—'}</span>
                <span className="col-span-1 text-sm text-right text-gray-700">{fmtRupee(a.total_price)}</span>
                <div className="col-span-2 flex justify-end gap-1">
                  {a.customer_phone && (
                    <button
                      title="Send WhatsApp confirmation"
                      onClick={() => openWhatsApp(
                        a.customer_phone,
                        whatsappConfirmMsg(
                          settings.salon_name || 'Sukh Sen Salon',
                          a.customer_name,
                          a.date,
                          a.time,
                          a.services?.map(s => s.name).join(', ')
                        )
                      )}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                  {a.status === 'pending' && (
                    <>
                      <button
                        onClick={() => setStatus(a.id, 'done')}
                        title="Mark done"
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setStatus(a.id, 'cancelled')}
                        title="Cancel"
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => del(a.id)}
                    title="Delete"
                    className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
