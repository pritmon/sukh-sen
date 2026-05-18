import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, todayISO, openWhatsApp, whatsappBillMsg } from '../utils.js';
import { Plus, Check, Banknote, Smartphone, Eye, MessageCircle } from 'lucide-react';
import Modal from '../components/Modal.jsx';

function BillForm({ appointment, onSave, onClose }) {
  const [items,   setItems]   = useState(
    (appointment.services || []).map(s => ({ ...s, selected: true }))
  );
  const [extra,   setExtra]   = useState({ name: '', price: '' });
  const [method,  setMethod]  = useState('cash');
  const [saving,  setSaving]  = useState(false);

  const total = items.filter(i => i.selected).reduce((s, i) => s + Number(i.price), 0);

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
      await onSave({ appointmentId: appointment.id, items: selectedItems, paymentMethod: method });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <p className="font-medium text-gray-900">{appointment.customer_name}</p>
        <p className="text-gray-500">{fmtDate(appointment.date)} at {appointment.time}</p>
      </div>

      <div>
        <label className="label">Services</label>
        <div className="border border-gray-200 rounded-lg divide-y">
          {items.map((item, idx) => (
            <label key={idx} className="flex items-center gap-3 px-3 py-2 cursor-pointer">
              <input type="checkbox" checked={item.selected} onChange={() => toggle(idx)}
                className="rounded border-gray-300 text-brand-500" />
              <span className="flex-1 text-sm text-gray-700">{item.name}</span>
              <span className="text-sm text-gray-700">{fmtRupee(item.price)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Add extra item */}
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

      {/* Total */}
      <div className="flex items-center justify-between bg-brand-50 rounded-lg px-4 py-3">
        <span className="font-semibold text-gray-700">Total</span>
        <span className="text-xl font-bold text-brand-600">{fmtRupee(total)}</span>
      </div>

      {/* Payment method */}
      <div>
        <label className="label">Payment Method</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMethod('cash')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors ${
              method === 'cash' ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            <Banknote className="w-4 h-4" /> Cash
          </button>
          <button
            type="button"
            onClick={() => setMethod('upi')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors ${
              method === 'upi' ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            <Smartphone className="w-4 h-4" /> UPI
          </button>
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
      <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-gray-900 text-base">{bill.customer_name}</p>
            <p className="text-gray-500">{fmtDate(bill.date)} at {bill.time}</p>
            {bill.staff_name && <p className="text-gray-400">by {bill.staff_name}</p>}
          </div>
          {bill.customer_phone && (
            <button
              onClick={shareWhatsApp}
              className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {(bill.items || []).map((item, i) => (
          <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
            <span className="text-gray-700">{item.service_name}</span>
            <span className="text-gray-700">{fmtRupee(item.price)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-base pt-2">
          <span>Total</span>
          <span className="text-brand-600">{fmtRupee(bill.total)}</span>
        </div>
      </div>

      {bill.paid ? (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm font-medium">
          <Check className="w-4 h-4" />
          Paid via {bill.payment_method === 'upi' ? 'UPI' : 'Cash'}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            {['cash', 'upi'].map(m => (
              <button key={m} type="button" onClick={() => setMethod(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  method === m ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200'
                }`}>
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

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 text-sm">Daily Revenue</h2>
          <input type="date" value={summaryDate} onChange={e => setSummaryDate(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Bills',   value: summary.billCount },
              { label: 'Paid Revenue',  value: fmtRupee(summary.paidRevenue) },
              { label: 'Cash',          value: fmtRupee(summary.cashRevenue) },
              { label: 'UPI',           value: fmtRupee(summary.upiRevenue) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[['unbilled', 'Generate Bill'], ['history', 'Bill History']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label} {key === 'unbilled' && unbilled.length > 0 && (
              <span className="ml-1 bg-brand-500 text-white rounded-full px-1.5 py-0.5 text-xs">{unbilled.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 text-sm py-10">Loading…</p>
      ) : tab === 'unbilled' ? (
        <div className="card overflow-hidden">
          {unbilled.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">No unbilled appointments</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {unbilled.map(a => (
                <div key={a.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{a.customer_name}</p>
                    <p className="text-xs text-gray-400">{fmtDate(a.date)} at {a.time} · {a.services?.map(s => s.name).join(', ') || '—'}</p>
                  </div>
                  <span className="text-sm text-gray-700">{fmtRupee(a.total_price)}</span>
                  <button onClick={() => setBillModal(a)} className="btn-primary flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Bill
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {bills.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">No bills yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {bills.map(b => (
                <div key={b.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{b.customer_name}</p>
                    <p className="text-xs text-gray-400">{fmtDate(b.date)} · {b.staff_name || 'Unassigned'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{fmtRupee(b.total)}</p>
                    <p className="text-xs text-gray-400">{b.payment_method?.toUpperCase()}</p>
                  </div>
                  <span className={b.paid ? 'badge-done' : 'badge-pending'}>
                    {b.paid ? 'Paid' : 'Unpaid'}
                  </span>
                  <button onClick={async () => setDetailModal(await api.bill(b.id))}
                    className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
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
