import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtRupee } from '../utils.js';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Modal from '../components/Modal.jsx';

const EMPTY = { name: '', price: '', duration: 30, category: "Women's Styling" };

function ServiceForm({ initial, categories, onSave, onClose }) {
  const [form,   setForm]   = useState(initial || { ...EMPTY, category: categories[0] || EMPTY.category });
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, price: Number(form.price), duration: Number(form.duration) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Service Name *</label>
        <input className="input" value={form.name} required
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Haircut" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Price (₹) *</label>
          <input className="input" type="number" min="0" step="1" value={form.price} required
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
        </div>
        <div>
          <label className="label">Duration (min)</label>
          <input className="input" type="number" min="5" step="5" value={form.duration}
            onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="label">Category</label>
        <select className="input" value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
          {categories.map(c => <option key={c}>{c}</option>)}
          <option value="__new__">+ New category…</option>
        </select>
        {form.category === '__new__' && (
          <input className="input mt-2" placeholder="Type new category name"
            onChange={e => setForm(f => ({ ...f, category: e.target.value === '__new__' ? '' : e.target.value }))} />
        )}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save Service'}
        </button>
      </div>
    </form>
  );
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);

  async function load() {
    setLoading(true);
    try { setServices(await api.services()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(form) {
    if (modal === 'new') await api.createService(form);
    else                  await api.updateService(modal.id, form);
    setModal(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this service?')) return;
    await api.deleteService(id);
    load();
  }

  const categories = [...new Set(services.map(s => s.category))].sort();
  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = services.filter(s => s.category === cat);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 rounded-full animate-spin"
            style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-14" style={{ color: 'rgba(245,240,232,0.4)' }}>
          <p className="text-sm">No services added yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map(cat => (
            <div key={cat} className="rounded-xl overflow-hidden"
              style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
              <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', background: '#0D0D0D' }}>
                <h3 className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.6)' }}>{cat}</h3>
              </div>
              <div>
                {grouped[cat].map((s, idx) => (
                  <div key={s.id} className="px-5 py-3 flex items-center gap-4 transition-colors"
                    style={{ borderBottom: idx < grouped[cat].length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{s.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.35)' }}>{s.duration} min</p>
                    </div>
                    <span className="text-base font-serif font-semibold" style={{ color: '#C9A84C' }}>{fmtRupee(s.price)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setModal(s)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'rgba(201,168,76,0.5)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.5)'; e.currentTarget.style.background = 'transparent'; }}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'rgba(239,68,68,0.5)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.5)'; e.currentTarget.style.background = 'transparent'; }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'new' ? 'Add Service' : 'Edit Service'} onClose={() => setModal(null)}>
          <ServiceForm
            initial={modal !== 'new' ? modal : null}
            categories={categories}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
