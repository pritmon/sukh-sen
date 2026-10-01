import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, todayISO, openWhatsApp, whatsappBillMsg } from '../utils.js';
import { Plus, Check, Banknote, Smartphone, Eye, MessageCircle } from 'lucide-react';
import Modal from '../components/Modal.jsx';

function BillForm({ appointment, onSave, onClose }) {
  const [items,    setItems]    = useState(
    (appointment.services || []).map(s => ({ ...s, selected: true }))
  );
  const [extra,    setExtra]    = useState({ name: '', price: '' });
  const [method,   setMethod]   = useState('cash');
  const [applyGst, setApplyGst] = useState(false);
  const [gstRate,  setGstRate]  = useState(18);
  const [saving,   setSaving]   = useState(false);

  const subtotal = items.filter(i => i.selected).reduce((s, i) => s + Number(i.price), 0);
  const gstAmt   = applyGst ? Math.round(subtotal * gstRate / 100 * 100) / 100 : 0;
  const total    = subtotal + gstAmt;

  function toggle(idx) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));
  }

  function addExtra() {
    if (!extra.name || !extra.price) return;
    setItems(prev => [...prev, { name: extra.name, price: Number(extra.price), selected: true }]);
    setExtra({ name: '', price: '' });
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const selectedItems = items.filter(i => i.selected).map(i => ({
      serviceId:   i.id || null,
      serviceName: i.name,
      price:       Number(i.price),
    }));
    try {
      await onSave({ appointmentId: appointment.id, items: selectedItems, paymentMethod: method, applyGst, gstRate });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-xl p-3.5 text-sm" style={{ background: '#0D0D0D', border: '1px solid rgba(201,168,76,0.12)' }}>
        <p className="font-semibold font-serif" style={{ color: '#F5F0E8' }}>{appointment.customer_name}</p>
        <p className="mt-0.5" style={{ color: 'rgba(245,240,232,0.4)' }}>{fmtDate(appointment.date)} at {appointment.time}</p>
      </div>

      <div>
        <label className="label">Services</label>
        <div className="rounded-xl divide-y" style={{ border: '1px solid rgba(201,168,76,0.12)', background: '#0D0D0D' }}>
          {items.map((item, idx) => (
            <label key={idx} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              style={{ borderColor: 'rgba(201,168,76,0.06)' }}>
              <input type="checkbox" checked={item.selected} onChange={() => toggle(idx)}
                className="rounded" style={{ accentColor: '#C9A84C' }} />
              <span className="flex-1 text-sm" style={{ color: item.selected ? '#F5F0E8' : 'rgba(245,240,232,0.4)' }}>{item.name}</span>
              <span className="text-sm font-serif" style={{ color: '#C9A84C' }}>{fmtRupee(item.price)}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Add Extra Item</label>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Item name" value={extra.name}
            onChange={e => setExtra(p => ({ ...p, name: e.target.value }))} />
          <input className="input w-24" placeholder="₹" type="number" value={extra.price}
            onChange={e => setExtra(p => ({ ...p, price: e.target.value }))} />
          <button type="button" onClick={addExtra} className="btn-secondary px-3">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GST toggle */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="w-9 h-5 rounded-full relative cursor-pointer transition-colors"
            style={{ background: applyGst ? '#C9A84C' : 'rgba(255,255,255,0.15)' }}
            onClick={() => setApplyGst(g => !g)}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: applyGst ? 'translateX(16px)' : 'translateX(2px)' }} />
          </div>
          <span className="text-sm font-medium" style={{ color: '#F5F0E8' }}>Apply GST</span>
          {applyGst && (
            <div className="flex items-center gap-1 ml-2">
              <input type="number" value={gstRate} min={0} max={28} step={0.5}
                onChange={e => setGstRate(Number(e.target.value))}
                className="input w-16 py-1 text-center text-sm" />
              <span className="text-sm" style={{ color: 'rgba(245,240,232,0.4)' }}>%</span>
            </div>
          )}
        </label>
      </div>

      {/* Total */}
      <div className="rounded-xl px-4 py-3.5 space-y-1" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
        {applyGst && (
          <>
            <div className="flex justify-between text-sm" style={{ color: 'rgba(245,240,232,0.5)' }}>
              <span>Subtotal</span><span>{fmtRupee(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: 'rgba(245,240,232,0.5)' }}>
              <span>GST ({gstRate}%)</span><span>{fmtRupee(gstAmt)}</span>
            </div>
            <div className="my-1" style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }} />
          </>
        )}
        <div className="flex items-center justify-between">
          <span className="font-semibold" style={{ color: '#F5F0E8' }}>Total</span>
          <span className="text-xl font-bold font-serif" style={{ color: '#C9A84C' }}>{fmtRupee(total)}</span>
        </div>
      </div>

      {/* Payment method */}
      <div>
        <label className="label">Payment Method</label>
        <div className="flex gap-2">
          {['cash', 'upi'].map(m => (
            <button key={m} type="button" onClick={() => setMethod(m)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97]"
              style={method === m
                ? { background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0A0A0A', borderColor: '#C9A84C' }
                : { background: '#1A1A1A', color: 'rgba(245,240,232,0.5)', borderColor: 'rgba(201,168,76,0.15)' }}>
              {m === 'cash' ? <><Banknote className="w-4 h-4" /> Cash</> : <><Smartphone className="w-4 h-4" /> UPI</>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving || !items.some(i => i.selected)}>
          {saving ? 'Generating…' : 'Generate Bill'}
        </button>
      </div>
    </form>
  );
}

function BillDetail({ bill, onClose, onPay, salonName }) {
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState(bill.payment_method || 'cash');

  async function handlePay() {
    setPaying(true);
    try { await onPay(bill.id, method); }
    finally { setPaying(false); }
  }

  function shareWhatsApp() {
    openWhatsApp(
      bill.customer_phone,
      whatsappBillMsg(salonName || 'Sukh Sen Salon', bill.customer_name, bill.items || [], bill.total, bill.payment_method)
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 text-sm" style={{ background: '#0D0D0D', border: '1px solid rgba(201,168,76,0.12)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold font-serif text-base" style={{ color: '#F5F0E8' }}>{bill.customer_name}</p>
            <p className="mt-0.5" style={{ color: 'rgba(245,240,232,0.4)' }}>{fmtDate(bill.date)} at {bill.time}</p>
            {bill.staff_name && <p style={{ color: 'rgba(245,240,232,0.3)' }}>by {bill.staff_name}</p>}
          </div>
          {bill.customer_phone && (
            <button onClick={shareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </button>
          )}
        </div>
      </div>

      <div className="space-y-0">
        {(bill.items || []).map((item, i) => (
          <div key={i} className="flex justify-between text-sm py-2"
            style={{ borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
            <span style={{ color: 'rgba(245,240,232,0.7)' }}>{item.service_name}</span>
            <span className="font-serif" style={{ color: '#C9A84C' }}>{fmtRupee(item.price)}</span>
          </div>
        ))}
        {bill.gst_applied === 1 && (
          <>
            <div className="flex justify-between text-sm py-1.5" style={{ color: 'rgba(245,240,232,0.4)' }}>
              <span>Subtotal</span><span>{fmtRupee(bill.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5" style={{ color: 'rgba(245,240,232,0.4)' }}>
              <span>GST ({bill.gst_rate}%)</span><span>{fmtRupee(bill.gst_amount)}</span>
            </div>
            <div className="my-1" style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }} />
          </>
        )}
        <div className="flex justify-between font-bold text-base pt-2">
          <span style={{ color: '#F5F0E8' }}>Total{bill.gst_applied === 1 ? ' (incl. GST)' : ''}</span>
          <span className="font-serif" style={{ color: '#C9A84C' }}>{fmtRupee(bill.total)}</span>
        </div>
      </div>

      {bill.paid ? (
        <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
          style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.15)' }}>
          <Check className="w-4 h-4" />
          Paid via {bill.payment_method === 'upi' ? 'UPI' : 'Cash'}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            {['cash', 'upi'].map(m => (
              <button key={m} type="button" onClick={() => setMethod(m)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97]"
                style={method === m
                  ? { background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0A0A0A', borderColor: '#C9A84C' }
                  : { background: '#1A1A1A', color: 'rgba(245,240,232,0.5)', borderColor: 'rgba(201,168,76,0.15)' }}>
                {m === 'cash' ? <><Banknote className="w-4 h-4" /> Cash</> : <><Smartphone className="w-4 h-4" /> UPI</>}
              </button>
            ))}
          </div>
          <button onClick={handlePay} disabled={paying} className="btn-primary w-full justify-center flex items-center gap-2">
            <Check className="w-4 h-4" /> {paying ? 'Processing…' : 'Mark as Paid'}
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <button className="btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function Billing() {
  const [tab,      setTab]     = useState('unbilled');
  const [unbilled,    setUnbilled]    = useState([]);
  const [bills,       setBills]       = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [billModal,   setBillModal]   = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [summaryDate, setSummaryDate] = useState(todayISO());
  const [settings,    setSettings]    = useState({});

  useEffect(() => {
    api.settings().then(setSettings).catch(() => {});
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [u, b, s] = await Promise.all([api.unbilled(), api.bills(), api.billSummary(summaryDate)]);
      setUnbilled(u); setBills(b); setSummary(s);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadAll(); }, [summaryDate]);

  async function handleCreate(data) {
    await api.createBill(data);
    setBillModal(null);
    loadAll();
  }

  async function handlePay(id, method) {
    const updated = await api.payBill(id, { paymentMethod: method });
    setDetailModal(updated);
    loadAll();
  }

  const cardStyle = { background: '#111111', border: '1px solid rgba(201,168,76,0.15)' };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Summary */}
      <div className="p-5 rounded-xl" style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-semibold" style={{ color: '#F5F0E8' }}>Daily Revenue</h2>
          <input type="date" value={summaryDate} onChange={e => setSummaryDate(e.target.value)}
            className="text-sm rounded-lg px-3 py-1.5 focus:outline-none"
            style={{ background: '#1A1A1A', border: '1px solid rgba(201,168,76,0.2)', color: '#F5F0E8', colorScheme: 'dark' }} />
        </div>
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Bills',  value: summary.billCount },
              { label: 'Paid Revenue', value: fmtRupee(summary.paidRevenue) },
              { label: 'Cash',         value: fmtRupee(summary.cashRevenue) },
              { label: 'UPI',          value: fmtRupee(summary.upiRevenue) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3.5"
                style={{ background: '#0D0D0D', border: '1px solid rgba(201,168,76,0.1)' }}>
                <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.5)' }}>{label}</p>
                <p className="text-xl font-serif font-semibold mt-1" style={{ color: '#C9A84C' }}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ background: '#161616', border: '1px solid rgba(201,168,76,0.12)' }}>
        {[['unbilled', 'Generate Bill'], ['history', 'Bill History']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === key
              ? { background: 'rgba(201,168,76,0.15)', color: '#E8C96D', border: '1px solid rgba(201,168,76,0.25)' }
              : { color: 'rgba(245,240,232,0.4)', border: '1px solid transparent' }}>
            {label} {key === 'unbilled' && unbilled.length > 0 && (
              <span className="ml-1 rounded-full px-1.5 py-0.5 text-xs"
                style={{ background: '#C9A84C', color: '#0A0A0A' }}>{unbilled.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      ) : tab === 'unbilled' ? (
        <div className="rounded-xl overflow-hidden" style={cardStyle}>
          {unbilled.length === 0 ? (
            <p className="text-center text-sm py-10" style={{ color: 'rgba(245,240,232,0.35)' }}>No unbilled appointments</p>
          ) : (
            <div>
              {unbilled.map((a, idx) => (
                <div key={a.id} className="px-5 py-3 flex items-center gap-4 transition-colors"
                  style={{ borderBottom: idx < unbilled.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{a.customer_name}</p>
                    <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>{fmtDate(a.date)} at {a.time} · {a.services?.map(s => s.name).join(', ') || '—'}</p>
                  </div>
                  <span className="text-sm font-serif" style={{ color: '#C9A84C' }}>{fmtRupee(a.total_price)}</span>
                  <button onClick={() => setBillModal(a)} className="btn-primary flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Bill
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={cardStyle}>
          {bills.length === 0 ? (
            <p className="text-center text-sm py-10" style={{ color: 'rgba(245,240,232,0.35)' }}>No bills yet</p>
          ) : (
            <div>
              {bills.map((b, idx) => (
                <div key={b.id} className="px-5 py-3 flex items-center gap-4 transition-colors"
                  style={{ borderBottom: idx < bills.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{b.customer_name}</p>
                    <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>{fmtDate(b.date)} · {b.staff_name || 'Unassigned'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-serif font-semibold" style={{ color: '#C9A84C' }}>{fmtRupee(b.total)}</p>
                    <p className="text-xs" style={{ color: 'rgba(245,240,232,0.3)' }}>{b.payment_method?.toUpperCase()}</p>
                  </div>
                  <span className={b.paid ? 'badge-done' : 'badge-pending'}>
                    {b.paid ? 'Paid' : 'Unpaid'}
                  </span>
                  <button onClick={async () => setDetailModal(await api.bill(b.id))}
                    className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(201,168,76,0.5)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.5)'; e.currentTarget.style.background = 'transparent'; }}>
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {billModal && (
        <Modal title="Generate Bill" onClose={() => setBillModal(null)}>
          <BillForm appointment={billModal} onSave={handleCreate} onClose={() => setBillModal(null)} />
        </Modal>
      )}

      {detailModal && (
        <Modal title="Bill Details" onClose={() => setDetailModal(null)}>
          <BillDetail bill={detailModal} onClose={() => setDetailModal(null)} onPay={handlePay} salonName={settings.salon_name} />
        </Modal>
      )}
    </div>
  );
}
