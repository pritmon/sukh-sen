import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtRupee } from '../utils.js';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Modal from '../components/Modal.jsx';

const EMPTY = { name: '', price: '', duration: 30, category: 'Hair' };
const CATEGORIES = ['Hair', 'Skin', 'Wellness', 'General'];

function ServiceForm({ initial, onSave, onClose }) {
  const [form,   setForm]   = useState(initial || EMPTY);
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
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
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
  const [modal,    setModal]    = useState(null); // null | 'new' | service object

  async function load() {
    setLoading(true);
    try { setServices(await api.services()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(form) {
    if (modal === 'new') {
      await api.createService(form);
    } else {
      await api.updateService(modal.id, form);
    }
    setModal(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this service?')) return;
    await api.deleteService(id);
    load();
  }

  const grouped = CATEGORIES.reduce((acc, cat) => {
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
        <p className="text-center text-gray-400 text-sm py-10">Loading…</p>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <div key={cat} className="card overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{cat}</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(s => (
                    <div key={s.id} className="px-5 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.duration} min</p>
                      </div>
                      <span className="text-base font-semibold text-brand-600">{fmtRupee(s.price)}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setModal(s)}
                          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
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
        <Modal
          title={modal === 'new' ? 'Add Service' : 'Edit Service'}
          onClose={() => setModal(null)}
        >
          <ServiceForm
            initial={modal !== 'new' ? modal : null}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
