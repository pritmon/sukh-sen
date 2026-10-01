import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Plus, Pencil, Trash2, AlertTriangle, Minus } from 'lucide-react';
import Modal from '../components/Modal.jsx';

const EMPTY = { name: '', quantity: 0, threshold: 5, unit: 'pcs', category: 'General' };
const CATEGORIES = ['Hair Care', 'Hair Colour', 'Skin Care', 'Shaving', 'General'];

const cardStyle = { background: '#111111', border: '1px solid rgba(201,168,76,0.15)' };

function InventoryForm({ initial, onSave, onClose }) {
  const [form,   setForm]   = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, quantity: Number(form.quantity), threshold: Number(form.threshold) });
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Product Name *</label>
        <input className="input" value={form.name} required
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Shampoo 500ml" />
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
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

function QtyButton({ item, onUpdate }) {
  const [qty, setQty] = useState(item.quantity);
  const [busy, setBusy] = useState(false);

  async function adjust(delta) {
    const next = Math.max(0, qty + delta);
    setBusy(true);
    try { await onUpdate(item.id, next); setQty(next); }
    finally { setBusy(false); }
  }

  const btnStyle = {
    padding: '4px', borderRadius: '6px',
    border: '1px solid rgba(201,168,76,0.2)',
    background: '#1A1A1A', color: 'rgba(245,240,232,0.5)',
  };

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => adjust(-1)} disabled={busy || qty <= 0} style={{ ...btnStyle, opacity: qty <= 0 ? 0.3 : 1 }}>
        <Minus className="w-3 h-3" />
      </button>
      <span className="text-sm font-medium w-8 text-center" style={{ color: '#F5F0E8' }}>{qty}</span>
      <button onClick={() => adjust(1)} disabled={busy} style={btnStyle}>
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function Inventory() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);

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
    if (!confirm('Delete this item?')) return;
    await api.deleteInventory(id);
    load();
  }

  const lowStockCount = items.filter(i => i.low_stock).length;
  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {});

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle className="w-4 h-4" />
            {lowStockCount} item{lowStockCount > 1 ? 's' : ''} low on stock
          </div>
        )}
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-1.5 ml-auto">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm py-10" style={{ color: 'rgba(245,240,232,0.35)' }}>No inventory items</p>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const catItems = grouped[cat];
            if (!catItems?.length) return null;
            return (
              <div key={cat} className="rounded-xl overflow-hidden" style={cardStyle}>
                <div className="px-5 py-3" style={{ background: '#0D0D0D', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                  <h3 className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.6)' }}>{cat}</h3>
                </div>
                <div>
                  {catItems.map((item, idx) => (
                    <div key={item.id} className="px-5 py-3 flex items-center gap-4 transition-colors"
                      style={{
                        borderBottom: idx < catItems.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none',
                        background: item.low_stock ? 'rgba(239,68,68,0.04)' : 'transparent',
                      }}
                      onMouseEnter={e => !item.low_stock && (e.currentTarget.style.background = 'rgba(201,168,76,0.04)')}
                      onMouseLeave={e => !item.low_stock && (e.currentTarget.style.background = 'transparent')}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{item.name}</p>
                          {item.low_stock ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                              <AlertTriangle className="w-3 h-3" /> Low
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.3)' }}>Alert at {item.threshold} {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <QtyButton item={item} onUpdate={handleQty} />
                        <span className="ml-1 text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>{item.unit}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setModal(item)}
                          className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(201,168,76,0.5)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.5)'; e.currentTarget.style.background = 'transparent'; }}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(239,68,68,0.5)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.5)'; e.currentTarget.style.background = 'transparent'; }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'new' ? 'Add Inventory Item' : 'Edit Item'} onClose={() => setModal(null)}>
          <InventoryForm initial={modal !== 'new' ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
