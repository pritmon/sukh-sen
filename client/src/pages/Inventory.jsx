import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Plus, Pencil, Trash2, AlertTriangle, Minus, Package } from 'lucide-react';
import Modal from '../components/Modal.jsx';

const EMPTY = { name: '', quantity: 0, threshold: 5, unit: 'pcs', category: 'Hair Care' };
const CATEGORIES = ['Hair Care', 'Hair Colour', 'Skin Care', 'Shaving', 'Waxing', 'Hair Treatments', 'General'];

function InventoryForm({ initial, onSave, onClose }) {
  const [form,   setForm]   = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const setField = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name?.trim())          errs.name     = 'Product name is required';
    if (Number(form.quantity) < 0)   errs.quantity = 'Quantity cannot be negative';
    if (Number(form.threshold) < 0)  errs.threshold = 'Threshold cannot be negative';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try { await onSave({ ...form, quantity: Number(form.quantity), threshold: Number(form.threshold) }); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Product Name *</label>
        <input className="input" value={form.name}
          onChange={e => setField('name', e.target.value)}
          placeholder="e.g. Shampoo 500ml"
          style={errors.name ? { borderColor: '#ef4444' } : {}} />
        {errors.name && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.name}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Quantity</label>
          <input className="input" type="number" min="0" step="0.5" value={form.quantity}
            onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
        </div>
        <div>
          <label className="label">Unit</label>
          <input className="input" value={form.unit}
            onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
            placeholder="pcs, bottles, tubes…" />
        </div>
      </div>
      <div>
        <label className="label">Low Stock Alert (threshold)</label>
        <input className="input" type="number" min="0" step="0.5" value={form.threshold}
          onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} />
      </div>
      <div>
        <label className="label">Category</label>
        <select className="input" value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-4 flex justify-end gap-2"
        style={{ background: '#141414', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Item'}</button>
      </div>
    </form>
  );
}

function StockBar({ qty, threshold }) {
  const max   = Math.max(qty, threshold * 2, 1);
  const pct   = Math.min(100, (qty / max) * 100);
  const isLow = qty <= threshold;
  const color = isLow ? '#ef4444' : qty <= threshold * 1.5 ? '#f59e0b' : '#C9A84C';
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function ItemCard({ item, onUpdate, onEdit, onDelete }) {
  const [qty,        setQty]        = useState(item.quantity);
  const [busy,       setBusy]       = useState(false);
  const [confirming, setConfirming] = useState(false);
  function requestDelete() { setConfirming(true); setTimeout(() => setConfirming(false), 3000); }
  const isLow = qty <= item.threshold;

  async function adjust(delta) {
    const next = Math.max(0, qty + delta);
    setBusy(true);
    try { await onUpdate(item.id, next); setQty(next); }
    finally { setBusy(false); }
  }

  return (
    <div className="p-4 rounded-xl flex flex-col gap-3 transition-all"
      style={{
        background: isLow ? 'rgba(239,68,68,0.05)' : '#111111',
        border: `1px solid ${isLow ? 'rgba(239,68,68,0.25)' : 'rgba(201,168,76,0.15)'}`,
      }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug" style={{ color: '#F5F0E8' }}>{item.name}</p>
          <p className="text-xs mt-0.5 capitalize" style={{ color: 'rgba(245,240,232,0.55)' }}>{item.category}</p>
        </div>
        {isLow && (
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
            <AlertTriangle className="w-3 h-3" /> Low
          </span>
        )}
      </div>

      {/* Stock number */}
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold font-serif leading-none" style={{ color: isLow ? '#ef4444' : '#C9A84C' }}>{qty}</span>
        <span className="text-sm font-semibold mb-1" style={{ color: 'rgba(245,240,232,0.85)' }}>{item.unit}</span>
      </div>

      {/* Stock bar */}
      <StockBar qty={qty} threshold={item.threshold} />
      <p className="text-xs" style={{ color: 'rgba(245,240,232,0.75)' }}>Alert below {item.threshold} {item.unit}</p>

      {/* Controls */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid rgba(201,168,76,0.08)' }}>
        {/* Qty adjust */}
        <div className="flex items-center gap-2">
          <button onClick={() => adjust(-1)} disabled={busy || qty <= 0}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: '#1A1A1A', border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(245,240,232,0.75)', opacity: qty <= 0 ? 0.3 : 1 }}>
            <Minus className="w-3 h-3" />
          </button>
          <button onClick={() => adjust(1)} disabled={busy}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: '#1A1A1A', border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(245,240,232,0.75)' }}>
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {/* Edit / Delete */}
        <div className="flex gap-1">
          <button onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(201,168,76,0.78)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.5)'; e.currentTarget.style.background = 'transparent'; }}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {confirming
            ? <button onClick={() => onDelete(item.id)}
                className="px-2 py-1 rounded-lg text-xs font-semibold"
                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                Sure?
              </button>
            : <button onClick={requestDelete}
                className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(239,68,68,0.45)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.45)'; e.currentTarget.style.background = 'transparent'; }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>}
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [filter,  setFilter]  = useState('All');

  async function load() {
    setLoading(true);
    try { setItems(await api.inventory()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(form) {
    if (modal === 'new') await api.createInventory(form);
    else                  await api.updateInventory(modal.id, form);
    setModal(null);
    load();
  }

  async function handleQty(id, qty) {
    await api.updateQty(id, qty);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty, low_stock: qty <= i.threshold ? 1 : 0 } : i));
  }

  async function handleDelete(id) {
    await api.deleteInventory(id);
    load();
  }

  const lowCount   = items.filter(i => i.quantity <= i.threshold).length;
  const usedCats   = ['All', ...[...new Set(items.map(i => i.category))].sort()];
  const visible    = filter === 'All' ? items : items.filter(i => i.category === filter);

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Stats */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.12)' }}>
            <Package className="w-4 h-4" style={{ color: '#C9A84C' }} />
            <span className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>{items.length}</span>
            <span className="text-xs" style={{ color: 'rgba(245,240,232,0.68)' }}>items</span>
          </div>
          {lowCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
              <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>{lowCount}</span>
              <span className="text-xs" style={{ color: 'rgba(239,68,68,0.7)' }}>low stock</span>
            </div>
          )}
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-1.5 flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Category filter tabs */}
      {usedCats.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {usedCats.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={filter === cat
                ? { background: 'rgba(201,168,76,0.18)', color: '#E8C96D', border: '1px solid rgba(201,168,76,0.4)' }
                : { background: '#111111', color: '#F5F0E8', border: '1px solid rgba(201,168,76,0.2)' }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(201,168,76,0.2)' }} />
          <p className="text-sm" style={{ color: 'rgba(245,240,232,0.62)' }}>No items{filter !== 'All' ? ` in ${filter}` : ''}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem' }}>
          {visible.map(item => (
            <ItemCard key={item.id} item={item}
              onUpdate={handleQty}
              onEdit={setModal}
              onDelete={handleDelete} />
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'new' ? 'Add Inventory Item' : 'Edit Item'} subtitle={modal === 'new' ? 'Track a new product or supply in your stock' : 'Update stock quantity, price or details'} onClose={() => setModal(null)}>
          <InventoryForm initial={modal !== 'new' ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
