import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Plus, Pencil, Trash2, UserCog } from 'lucide-react';
import Modal from '../components/Modal.jsx';

const EMPTY = { name: '', phone: '', role: 'Stylist' };
const ROLES  = ['Owner', 'Stylist', 'Assistant', 'Receptionist'];

function StaffForm({ initial, onSave, onClose }) {
  const [form,   setForm]   = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Name *</label>
        <input className="input" value={form.name} required
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Staff member name" />
      </div>
      <div>
        <label className="label">Phone</label>
        <input className="input" value={form.phone || ''} type="tel"
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="Mobile number" />
      </div>
      <div>
        <label className="label">Role</label>
        <select className="input" value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default function Staff() {
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);

  async function load() {
    setLoading(true);
    try { setStaff(await api.staff()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(form) {
    if (modal === 'new') await api.createStaff(form);
    else                  await api.updateStaff(modal.id, form);
    setModal(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Remove this staff member?')) return;
    await api.deleteStaff(id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 text-sm py-10">Loading…</p>
      ) : staff.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">No staff members</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold flex-shrink-0">
                  {s.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-brand-600 font-medium">{s.role}</p>
                  {s.phone && <p className="text-xs text-gray-400 mt-1">{s.phone}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setModal(s)}
                    className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(s.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'new' ? 'Add Staff Member' : 'Edit Staff'} onClose={() => setModal(null)}>
          <StaffForm initial={modal !== 'new' ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
