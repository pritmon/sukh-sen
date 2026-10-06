import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, fmtTime, todayISO, openWhatsApp, whatsappBillMsg } from '../utils.js';
import { Plus, Check, Banknote, Smartphone, CreditCard, Eye, MessageCircle, Receipt, TrendingUp, CalendarDays, Printer, Tag } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import DatePicker from '../components/DatePicker.jsx';

function BillForm({ appointment, onSave, onClose }) {
  const [items,    setItems]    = useState(
    (appointment.services || []).map(s => ({ ...s, selected: true }))
  );
  const [extra,    setExtra]    = useState({ name: '', price: '' });
  const [method,   setMethod]   = useState('cash');
  const [applyGst, setApplyGst] = useState(false);
  const [gstRate,  setGstRate]  = useState(18);
  const [discount, setDiscount] = useState('');
  const [saving,   setSaving]   = useState(false);

  const subtotal     = items.filter(i => i.selected).reduce((s, i) => s + Number(i.price), 0);
  const discountAmt  = Math.min(Number(discount) || 0, subtotal);
  const taxable      = subtotal - discountAmt;
  const gstAmt       = applyGst ? Math.round(taxable * gstRate / 100 * 100) / 100 : 0;
  const total        = taxable + gstAmt;

  function toggle(idx) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));
  }

  function addExtra() {
    if (!extra.name || !extra.price) return;
    setItems(prev => [...prev, { name: extra.name, price: Number(extra.price), selected: true }]);
    setExtra({ name: '', price: '' });
  }

  const [billError, setBillError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const selectedItems = items.filter(i => i.selected).map(i => ({
      serviceId:   i.id || null,
      serviceName: i.name,
      price:       Number(i.price),
    }));
    if (!selectedItems.length) { setBillError('Select at least one service to generate a bill'); return; }
    setBillError('');
    setSaving(true);
    try {
      await onSave({ appointmentId: appointment.id, items: selectedItems, paymentMethod: method, applyGst, gstRate, discount: discountAmt });
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-xl p-3.5 text-sm" style={{ background: '#0D0D0D', border: '1px solid rgba(201,168,76,0.12)' }}>
        <p className="font-semibold font-serif" style={{ color: '#F5F0E8' }}>{appointment.customer_name}</p>
        <p className="mt-0.5" style={{ color: 'rgba(245,240,232,0.68)' }}>{fmtDate(appointment.date)} at {fmtTime(appointment.time)}</p>
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

      {/* Discount */}
      <div>
        <label className="label flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />Discount (₹)</label>
        <input
          className="input w-full"
          type="number"
          min={0}
          max={subtotal}
          placeholder="0"
          value={discount}
          onChange={e => setDiscount(e.target.value)}
        />
      </div>

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
              <span className="text-sm" style={{ color: 'rgba(245,240,232,0.68)' }}>%</span>
            </div>
          )}
        </label>
      </div>

      <div className="rounded-xl px-4 py-3.5 space-y-1" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
        <div className="flex justify-between text-sm" style={{ color: 'rgba(245,240,232,0.75)' }}>
          <span>Subtotal</span><span>{fmtRupee(subtotal)}</span>
        </div>
        {discountAmt > 0 && (
          <div className="flex justify-between text-sm" style={{ color: '#4ade80' }}>
            <span>Discount</span><span>− {fmtRupee(discountAmt)}</span>
          </div>
        )}
        {applyGst && (
          <div className="flex justify-between text-sm" style={{ color: 'rgba(245,240,232,0.75)' }}>
            <span>GST ({gstRate}%)</span><span>{fmtRupee(gstAmt)}</span>
          </div>
        )}
        <div className="my-1" style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }} />
        <div className="flex items-center justify-between">
          <span className="font-semibold" style={{ color: '#F5F0E8' }}>Total</span>
          <span className="text-xl font-bold font-serif" style={{ color: '#C9A84C' }}>{fmtRupee(total)}</span>
        </div>
      </div>

      <div>
        <label className="label">Payment Method</label>
        <div className="flex gap-2">
          {[
            { id: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
            { id: 'upi',  label: 'UPI',  icon: <Smartphone className="w-4 h-4" /> },
            { id: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
          ].map(({ id, label, icon }) => (
            <button key={id} type="button" onClick={() => setMethod(id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97]"
              style={method === id
                ? { background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0A0A0A', borderColor: '#C9A84C' }
                : { background: '#1A1A1A', color: 'rgba(245,240,232,0.75)', borderColor: 'rgba(201,168,76,0.15)' }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {billError && (
        <p className="text-xs text-center" style={{ color: '#f87171' }}>{billError}</p>
      )}
      <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-4 flex justify-end gap-2"
        style={{ background: '#141414', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
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

  function printReceipt() {
    const lines = (bill.items || []).map(i =>
      `<tr><td>${i.service_name}</td><td style="text-align:right">${fmtRupee(i.price)}</td></tr>`
    ).join('');
    const discountRow = Number(bill.discount) > 0
      ? `<tr><td style="color:#16a34a">Discount</td><td style="text-align:right;color:#16a34a">− ${fmtRupee(bill.discount)}</td></tr>` : '';
    const gstRow = bill.gst_applied
      ? `<tr><td>GST (${bill.gst_rate}%)</td><td style="text-align:right">${fmtRupee(bill.gst_amount)}</td></tr>` : '';
    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt</title>
<style>
  body{font-family:Arial,sans-serif;font-size:13px;margin:0;padding:20px;color:#111}
  h2{margin:0 0 4px;font-size:16px;text-align:center}
  p{margin:2px 0;text-align:center;font-size:12px;color:#555}
  hr{border:none;border-top:1px dashed #aaa;margin:10px 0}
  table{width:100%;border-collapse:collapse}
  td{padding:4px 2px}
  .total td{font-weight:bold;font-size:14px;border-top:1px solid #111;padding-top:8px}
  .paid{text-align:center;margin-top:12px;font-size:12px;color:#16a34a;font-weight:bold}
  @media print{body{padding:10px}}
</style></head><body>
<h2>${salonName || 'Sukh&Sen Unisex Salon'}</h2>
<p>Kakdwip, West Bengal</p>
<hr>
<p style="text-align:left"><b>Guest:</b> ${bill.customer_name}</p>
<p style="text-align:left"><b>Date:</b> ${fmtDate(bill.date)} ${fmtTime(bill.time)}</p>
${bill.staff_name ? `<p style="text-align:left"><b>Staff:</b> ${bill.staff_name}</p>` : ''}
<hr>
<table>${lines}${discountRow}${gstRow}<tr class="total"><td>Total</td><td style="text-align:right">${fmtRupee(bill.total)}</td></tr></table>
<p class="paid">${bill.paid ? `✓ Paid via ${{ cash: 'Cash', upi: 'UPI', card: 'Card' }[bill.payment_method] || 'Cash'}` : 'UNPAID'}</p>
<hr><p style="font-size:11px;color:#aaa">Thank you for visiting!</p>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
</body></html>`);
    w.document.close();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 text-sm" style={{ background: '#0D0D0D', border: '1px solid rgba(201,168,76,0.12)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold font-serif text-base" style={{ color: '#F5F0E8' }}>{bill.customer_name}</p>
            <p className="mt-0.5" style={{ color: 'rgba(245,240,232,0.68)' }}>{fmtDate(bill.date)} at {fmtTime(bill.time)}</p>
            {bill.staff_name && <p style={{ color: 'rgba(245,240,232,0.55)' }}>by {bill.staff_name}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={printReceipt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            {bill.customer_phone && (
              <button onClick={shareWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>
            )}
          </div>
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
        {(Number(bill.discount) > 0 || bill.gst_applied === 1) && (
          <div className="flex justify-between text-sm py-1.5" style={{ color: 'rgba(245,240,232,0.68)' }}>
            <span>Subtotal</span><span>{fmtRupee(bill.subtotal)}</span>
          </div>
        )}
        {Number(bill.discount) > 0 && (
          <div className="flex justify-between text-sm py-1.5" style={{ color: '#4ade80' }}>
            <span>Discount</span><span>− {fmtRupee(bill.discount)}</span>
          </div>
        )}
        {bill.gst_applied === 1 && (
          <div className="flex justify-between text-sm py-1.5" style={{ color: 'rgba(245,240,232,0.68)' }}>
            <span>GST ({bill.gst_rate}%)</span><span>{fmtRupee(bill.gst_amount)}</span>
          </div>
        )}
        <div className="my-1" style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }} />
        <div className="flex justify-between font-bold text-base pt-2">
          <span style={{ color: '#F5F0E8' }}>Total</span>
          <span className="font-serif" style={{ color: '#C9A84C' }}>{fmtRupee(bill.total)}</span>
        </div>
      </div>

      {bill.paid ? (
        <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
          style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.15)' }}>
          <Check className="w-4 h-4" />
          Paid via {{ cash: 'Cash', upi: 'UPI', card: 'Card' }[bill.payment_method] || 'Cash'}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            {[
              { id: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
              { id: 'upi',  label: 'UPI',  icon: <Smartphone className="w-4 h-4" /> },
              { id: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
            ].map(({ id, label, icon }) => (
              <button key={id} type="button" onClick={() => setMethod(id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97]"
                style={method === id
                  ? { background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0A0A0A', borderColor: '#C9A84C' }
                  : { background: '#1A1A1A', color: 'rgba(245,240,232,0.75)', borderColor: 'rgba(201,168,76,0.15)' }}>
                {icon} {label}
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
  const [tab,         setTab]         = useState('unbilled');
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
    <div className="space-y-5 max-w-3xl">

      {/* Revenue summary */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: '#C9A84C' }} />
            <h2 className="font-serif font-bold text-sm" style={{ color: '#E8C96D' }}>Daily Revenue</h2>
          </div>
          <div style={{ width: 170 }}>
            <DatePicker value={summaryDate} onChange={setSummaryDate} />
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0"
            style={{ borderColor: 'rgba(201,168,76,0.08)' }}>
            {[
              { icon: CalendarDays, label: 'Bills',         value: summary.billCount,             plain: true },
              { icon: Receipt,      label: 'Paid Revenue',  value: fmtRupee(summary.paidRevenue)             },
              { icon: Banknote,     label: 'Cash',          value: fmtRupee(summary.cashRevenue)             },
              { icon: Smartphone,   label: 'UPI',           value: fmtRupee(summary.upiRevenue)              },
            ].map(({ icon: Icon, label, value, plain }) => (
              <div key={label} className="px-5 py-4 flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  <span className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#C9A84C' }}>{label}</span>
                </div>
                <p className="text-2xl font-serif font-bold leading-none"
                  style={{ color: '#E8C96D' }}>{value}</p>
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
              : { color: 'rgba(245,240,232,0.68)', border: '1px solid transparent' }}>
            {label}
            {key === 'unbilled' && unbilled.length > 0 && (
              <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold"
                style={{ background: '#C9A84C', color: '#0A0A0A' }}>{unbilled.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 rounded-full animate-spin"
            style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      ) : tab === 'unbilled' ? (
        <div className="rounded-xl overflow-hidden"
          style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
          {unbilled.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}>
                <Receipt className="w-6 h-6" style={{ color: 'rgba(201,168,76,0.3)' }} />
              </div>
              <p className="text-sm" style={{ color: 'rgba(245,240,232,0.62)' }}>No unbilled appointments</p>
            </div>
          ) : (
            unbilled.map((a, idx) => (
              <div key={a.id}
                className="px-5 py-4 flex items-center gap-4 transition-colors"
                style={{ borderBottom: idx < unbilled.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {/* Customer avatar initial */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                  style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                  {a.customer_name?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>{a.customer_name}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(245,240,232,0.62)' }}>
                    {fmtDate(a.date)} · {fmtTime(a.time)}
                    {a.services?.length ? ' · ' + a.services.map(s => s.name).join(', ') : ''}
                  </p>
                </div>

                <span className="text-sm font-serif font-semibold flex-shrink-0" style={{ color: '#C9A84C' }}>
                  {fmtRupee(a.total_price)}
                </span>

                <button onClick={() => setBillModal(a)}
                  className="btn-primary flex items-center gap-1.5 flex-shrink-0 text-xs px-3 py-2">
                  <Plus className="w-3.5 h-3.5" /> Bill
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden"
          style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}>
                <Receipt className="w-6 h-6" style={{ color: 'rgba(201,168,76,0.3)' }} />
              </div>
              <p className="text-sm" style={{ color: 'rgba(245,240,232,0.62)' }}>No bills yet</p>
            </div>
          ) : (
            bills.map((b, idx) => (
              <div key={b.id}
                className="px-5 py-4 flex items-center gap-4 transition-colors"
                style={{ borderBottom: idx < bills.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                  style={{ background: b.paid ? 'rgba(34,197,94,0.1)' : 'rgba(201,168,76,0.08)', color: b.paid ? '#22c55e' : '#C9A84C', border: `1px solid ${b.paid ? 'rgba(34,197,94,0.2)' : 'rgba(201,168,76,0.15)'}` }}>
                  {b.customer_name?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>{b.customer_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.62)' }}>
                    {fmtDate(b.date)}
                    {b.staff_name ? ' · ' + b.staff_name : ''}
                  </p>
                </div>

                {/* Amount + method */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-serif font-bold" style={{ color: '#C9A84C' }}>{fmtRupee(b.total)}</p>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-md"
                    style={b.payment_method === 'upi'
                      ? { background: 'rgba(99,102,241,0.12)', color: '#818cf8' }
                      : { background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>
                    {b.payment_method?.toUpperCase() || '—'}
                  </span>
                </div>

                {/* Status badge */}
                <span className={b.paid ? 'badge-done' : 'badge-pending'} style={{ flexShrink: 0 }}>
                  {b.paid ? 'Paid' : 'Unpaid'}
                </span>

                {/* View button */}
                <button onClick={async () => setDetailModal(await api.bill(b.id))}
                  className="p-2 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: 'rgba(201,168,76,0.78)', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.background = 'rgba(201,168,76,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.5)'; e.currentTarget.style.background = 'rgba(201,168,76,0.06)'; }}>
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {billModal && (
        <Modal title="Generate Bill" subtitle="Select services and collect payment for this appointment" onClose={() => setBillModal(null)}>
          <BillForm appointment={billModal} onSave={handleCreate} onClose={() => setBillModal(null)} />
        </Modal>
      )}

      {detailModal && (
        <Modal title="Bill Details" subtitle="Full breakdown of services and payment received" onClose={() => setDetailModal(null)}>
          <BillDetail bill={detailModal} onClose={() => setDetailModal(null)} onPay={handlePay} salonName={settings.salon_name} />
        </Modal>
      )}
    </div>
  );
}
