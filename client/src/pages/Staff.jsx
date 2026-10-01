import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Plus, Pencil, Trash2, Phone, AlertCircle, BookOpen, ArrowLeft, Users } from 'lucide-react';
import Modal from '../components/Modal.jsx';

const ROLES = ['Owner', 'Top Stylist', 'Senior Stylist', 'Stylist', 'Assistant', 'Receptionist', 'Trainee'];

const EMPTY = {
  name: '', phone: '', role: 'Stylist',
  dob: '', address: '',
  emergency_name: '', emergency_phone: '', emergency_relation: '',
  years_experience: '', skills: '', education: '', previous_work: '', family_details: '',
};

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest mb-3 pb-1"
        style={{ color: 'rgba(201,168,76,0.6)', borderBottom: '1px solid rgba(201,168,76,0.12)' }}>{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function StaffForm({ initial, onSave, onClose }) {
  const [form,   setForm]   = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Basic Info">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name *">
            <input className="input" value={form.name} required
              onChange={e => set('name', e.target.value)} placeholder="Full name" />
          </Field>
          <Field label="Role">
            <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input className="input" value={form.phone || ''} type="tel"
              onChange={e => set('phone', e.target.value)} placeholder="Mobile number" />
          </Field>
          <Field label="Date of Birth">
            <input className="input" type="date" value={form.dob || ''}
              onChange={e => set('dob', e.target.value)} />
          </Field>
        </div>
        <Field label="Address">
          <input className="input" value={form.address || ''}
            onChange={e => set('address', e.target.value)} placeholder="Home address" />
        </Field>
      </Section>

      <Section title="Emergency Contact">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact Name">
            <input className="input" value={form.emergency_name || ''}
              onChange={e => set('emergency_name', e.target.value)} placeholder="Name" />
          </Field>
          <Field label="Relation">
            <input className="input" value={form.emergency_relation || ''}
              onChange={e => set('emergency_relation', e.target.value)} placeholder="e.g. Spouse, Father" />
          </Field>
        </div>
        <Field label="Emergency Phone">
          <input className="input" value={form.emergency_phone || ''} type="tel"
            onChange={e => set('emergency_phone', e.target.value)} placeholder="Emergency contact number" />
        </Field>
      </Section>

      <Section title="Professional Profile">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Years of Experience">
            <input className="input" type="number" min={0} value={form.years_experience || ''}
              onChange={e => set('years_experience', e.target.value)} placeholder="e.g. 5" />
          </Field>
          <Field label="Education">
            <input className="input" value={form.education || ''}
              onChange={e => set('education', e.target.value)} placeholder="e.g. 10th Pass, ITI" />
          </Field>
        </div>
        <Field label="Skills / Specializations">
          <input className="input" value={form.skills || ''}
            onChange={e => set('skills', e.target.value)} placeholder="e.g. Cutting, Colour, Keratin, Bridal" />
        </Field>
        <Field label="Previous Work Experience">
          <textarea className="input" rows={2} value={form.previous_work || ''}
            onChange={e => set('previous_work', e.target.value)}
            placeholder="Previous salon name, duration, role, etc." />
        </Field>
      </Section>

      <Section title="Family Details">
        <Field label="Family Members">
          <textarea className="input" rows={2} value={form.family_details || ''}
            onChange={e => set('family_details', e.target.value)}
            placeholder="e.g. Wife: Priya, Son: Rahul (age 5)" />
        </Field>
      </Section>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save Staff Profile'}
        </button>
      </div>
    </form>
  );
}

function StaffProfile({ staff: s, onBack, onEdit }) {
  const infoRow = (label, val) => val ? (
    <div className="flex gap-2">
      <span className="text-xs font-medium w-28 flex-shrink-0" style={{ color: 'rgba(201,168,76,0.5)' }}>{label}</span>
      <span className="text-sm" style={{ color: '#F5F0E8' }}>{val}</span>
    </div>
  ) : null;

  const cardStyle = { background: '#141414', border: '1px solid rgba(201,168,76,0.15)' };
  const sectionLabel = (text, icon) => (
    <p className="text-xs font-medium uppercase tracking-widest mb-3 flex items-center gap-1.5"
      style={{ color: 'rgba(201,168,76,0.6)' }}>
      {icon}{text}
    </p>
  );

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'rgba(201,168,76,0.6)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(201,168,76,0.6)'}>
        <ArrowLeft className="w-4 h-4" /> Back to Staff
      </button>

      {/* Header */}
      <div className="p-5 rounded-xl flex items-center gap-4" style={cardStyle}>
        <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0A0A0A' }}>
          {s.name[0]}
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-lg font-semibold" style={{ color: '#F5F0E8' }}>{s.name}</h2>
          <p className="text-sm font-medium mt-0.5" style={{ color: '#C9A84C' }}>{s.role}</p>
          {s.years_experience > 0 && (
            <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.35)' }}>{s.years_experience} yr{s.years_experience !== 1 ? 's' : ''} experience</p>
          )}
        </div>
        <button onClick={() => onEdit(s)} className="btn-secondary flex items-center gap-1.5">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact */}
        <div className="p-5 rounded-xl space-y-2" style={cardStyle}>
          {sectionLabel('Contact')}
          {infoRow('Phone', s.phone)}
          {infoRow('Date of Birth', s.dob)}
          {infoRow('Address', s.address)}
        </div>

        {/* Emergency */}
        <div className="p-5 rounded-xl space-y-2" style={cardStyle}>
          {sectionLabel('Emergency Contact', <AlertCircle className="w-3.5 h-3.5" style={{ color: '#f87171' }} />)}
          {s.emergency_name ? (
            <>
              {infoRow('Name', s.emergency_name)}
              {infoRow('Relation', s.emergency_relation)}
              {s.emergency_phone && (
                <a href={`tel:${s.emergency_phone}`}
                  className="flex items-center gap-2 text-sm font-medium mt-1"
                  style={{ color: '#C9A84C' }}>
                  <Phone className="w-3.5 h-3.5" /> {s.emergency_phone}
                </a>
              )}
            </>
          ) : (
            <p className="text-xs" style={{ color: 'rgba(245,240,232,0.3)' }}>Not set</p>
          )}
        </div>

        {/* Professional */}
        <div className="p-5 rounded-xl space-y-2" style={cardStyle}>
          {sectionLabel('Professional Profile', <BookOpen className="w-3.5 h-3.5" />)}
          {infoRow('Experience', s.years_experience ? `${s.years_experience} years` : null)}
          {infoRow('Education', s.education)}
          {s.skills && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'rgba(201,168,76,0.5)' }}>Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {s.skills.split(',').map(sk => (
                  <span key={sk} className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                    {sk.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
          {s.previous_work && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'rgba(201,168,76,0.5)' }}>Previous Work</p>
              <p className="text-sm whitespace-pre-line" style={{ color: 'rgba(245,240,232,0.7)' }}>{s.previous_work}</p>
            </div>
          )}
        </div>

        {/* Family */}
        {s.family_details && (
          <div className="p-5 rounded-xl" style={cardStyle}>
            {sectionLabel('Family', <Users className="w-3.5 h-3.5" />)}
            <p className="text-sm whitespace-pre-line" style={{ color: 'rgba(245,240,232,0.7)' }}>{s.family_details}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Staff() {
  const [staff,    setStaff]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);  // null | 'new' | staffObj
  const [selected, setSelected] = useState(null);  // staff profile view

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

  if (selected) {
    return <StaffProfile staff={selected} onBack={() => setSelected(null)} onEdit={s => { setModal(s); setSelected(null); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 rounded-full animate-spin"
            style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      ) : staff.length === 0 ? (
        <p className="text-center text-sm py-10" style={{ color: 'rgba(245,240,232,0.4)' }}>No staff members added</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => (
            <div key={s.id} className="p-5 rounded-xl cursor-pointer transition-all duration-200"
              style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.15)' }}
              onClick={() => setSelected(s)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0A0A0A' }}>
                  {s.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold" style={{ color: '#F5F0E8' }}>{s.name}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: '#C9A84C' }}>{s.role}</p>
                  {s.years_experience > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.35)' }}>{s.years_experience} yr exp</p>
                  )}
                  {s.phone && <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.35)' }}>{s.phone}</p>}
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setModal(s)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'rgba(201,168,76,0.5)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.5)'; e.currentTarget.style.background = 'transparent'; }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(s.id)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'rgba(239,68,68,0.5)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.5)'; e.currentTarget.style.background = 'transparent'; }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {s.skills && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {s.skills.split(',').slice(0, 3).map(sk => (
                    <span key={sk} className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                      {sk.trim()}
                    </span>
                  ))}
                </div>
              )}
              {s.emergency_name && (
                <div className="mt-3 flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5"
                  style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <AlertCircle className="w-3 h-3" />
                  Emergency: {s.emergency_name} · {s.emergency_phone}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'new' ? 'Add Staff Member' : 'Edit Staff Profile'} onClose={() => setModal(null)} wide>
          <StaffForm initial={modal !== 'new' ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
