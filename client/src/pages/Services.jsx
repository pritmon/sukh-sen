import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtRupee } from '../utils.js';
import { Plus, Pencil, Trash2, Scissors, Clock } from 'lucide-react';
import Modal from '../components/Modal.jsx';

const EMPTY = { name: '', price: '', duration: 30, category: "Women's Styling" };

function ServiceForm({ initial, categories, onSave, onClose }) {
  const [form,   setForm]   = useState(initial || { ...EMPTY, category: categories[0] || EMPTY.category });
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!form.name || form.category === '__new__' || !form.category) return;
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
      <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-4 flex justify-end gap-2"
        style={{ background: '#141414', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save Service'}
        </button>
      </div>
    </form>
  );
}

function ServiceCard({ service, onEdit, onDelete }) {
  return (
    <div className="p-4 rounded-xl flex flex-col gap-3 transition-all"
      style={{
        background: '#111111',
        border: '1px solid rgba(201,168,76,0.15)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.background = '#141414'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'; e.currentTarget.style.background = '#111111'; }}>

      {/* Name */}
      <p className="text-sm font-semibold leading-snug" style={{ color: '#F5F0E8' }}>{service.name}</p>

      {/* Price — big */}
      <div>
        <p className="text-2xl font-bold font-serif leading-none" style={{ color: '#C9A84C' }}>
          {fmtRupee(service.price)}
        </p>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(245,240,232,0.55)' }} />
        <span className="text-xs" style={{ color: 'rgba(245,240,232,0.68)' }}>{service.duration} min</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-1 pt-1"
        style={{ borderTop: '1px solid rgba(201,168,76,0.08)', marginTop: 'auto' }}>
        <button onClick={() => onEdit(service)}
          className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(201,168,76,0.78)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.5)'; e.currentTarget.style.background = 'transparent'; }}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(service.id)}
          className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(239,68,68,0.45)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.45)'; e.currentTarget.style.background = 'transparent'; }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [filter,   setFilter]   = useState('All');

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
  const allTabs    = ['All', ...categories];
  const visible    = filter === 'All' ? services : services.filter(s => s.category === filter);

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.12)' }}>
            <Scissors className="w-4 h-4" style={{ color: '#C9A84C' }} />
            <span className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>{services.length}</span>
            <span className="text-xs" style={{ color: 'rgba(245,240,232,0.68)' }}>services</span>
          </div>
          {categories.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.12)' }}>
              <span className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>{categories.length}</span>
              <span className="text-xs" style={{ color: 'rgba(245,240,232,0.68)' }}>categories</span>
            </div>
          )}
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-1.5 flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {/* Category filter tabs */}
      {allTabs.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {allTabs.map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={filter === tab
                ? { background: 'rgba(201,168,76,0.18)', color: '#E8C96D', border: '1px solid rgba(201,168,76,0.4)' }
                : { background: '#111111', color: '#F5F0E8', border: '1px solid rgba(201,168,76,0.2)' }}>
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 rounded-full animate-spin"
            style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <Scissors className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(201,168,76,0.2)' }} />
          <p className="text-sm" style={{ color: 'rgba(245,240,232,0.62)' }}>
            No services{filter !== 'All' ? ` in ${filter}` : ''}
          </p>
        </div>
      ) : filter === 'All' ? (
        /* Grouped view when showing all */
        <div className="space-y-6">
          {categories.map(cat => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold uppercase tracking-widest"
                  style={{ color: '#C9A84C' }}>{cat}</h3>
                <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ color: '#E8C96D', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
                  {services.filter(s => s.category === cat).length} services
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {services.filter(s => s.category === cat).map(s => (
                  <ServiceCard key={s.id} service={s} onEdit={setModal} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Flat grid when a category is selected */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {visible.map(s => (
            <ServiceCard key={s.id} service={s} onEdit={setModal} onDelete={handleDelete} />
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
