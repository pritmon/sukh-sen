import { useEffect, useState, useRef } from 'react';
import { api } from '../api.js';
import { Plus, Pencil, Trash2, Phone, AlertCircle, BookOpen, ArrowLeft, Users, CreditCard, Camera, X } from 'lucide-react';
import Modal from '../components/Modal.jsx';

const ROLES = ['Owner', 'Top Stylist', 'Senior Stylist', 'Stylist', 'Assistant', 'Receptionist', 'Trainee'];

const EMPTY = {
  name: '', phone: '', role: 'Stylist',
  dob: '', address: '',
  emergency_name: '', emergency_phone: '', emergency_relation: '',
  years_experience: '', skills: '', education: '', previous_work: '', family_details: '',
};

const EMPTY_FAMILY = {
  marital_status: '', spouse: '',
  mother: '', father: '', brother: '', sister: '',
  grandfather: '', grandmother: '',
  son: '', daughter: '',
};

function parseFamily(raw) {
  if (!raw) return { ...EMPTY_FAMILY };
  try { return { ...EMPTY_FAMILY, ...JSON.parse(raw) }; }
  catch { return { ...EMPTY_FAMILY, notes: raw }; }
}

function serializeFamily(fam) {
  const clean = Object.fromEntries(Object.entries(fam).filter(([, v]) => v));
  return Object.keys(clean).length ? JSON.stringify(clean) : '';
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest mb-3 pb-1"
        style={{ color: 'rgba(201,168,76,0.85)', borderBottom: '1px solid rgba(201,168,76,0.12)' }}>{title}</p>
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
  const [family, setFamily] = useState(() => parseFamily(initial?.family_details));
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});
  const [showAlert, setShowAlert] = useState(false);
  const photoRef = useRef(null);
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: false })); };
  const setFam = (k, v) => setFamily(f => ({ ...f, [k]: v }));

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { set('photo', ev.target.result); setErrors(e => ({ ...e, photo: false })); };
    reader.readAsDataURL(file);
  }

  const toggleStyle = (active) => active
    ? { background: 'rgba(201,168,76,0.15)', color: '#E8C96D', border: '1px solid rgba(201,168,76,0.35)' }
    : { background: '#1A1A1A', color: 'rgba(245,240,232,0.72)', border: '1px solid rgba(201,168,76,0.12)' };

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name?.trim())          errs.name          = 'Name';
    if (!form.phone?.trim())         errs.phone         = 'Phone Number';
    if (!form.photo)                 errs.photo         = 'Passport Photo';
    if (!form.aadhar_number?.trim()) errs.aadhar_number = 'Aadhar Number';
    if (Object.keys(errs).length) { setErrors(errs); setShowAlert(true); return; }
    setSaving(true);
    try {
      await onSave({ ...form, family_details: serializeFamily(family) });
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Basic Info">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name *">
            <input className={`input${errors.name ? ' border-red-500' : ''}`} value={form.name} required
              onChange={e => set('name', e.target.value)} placeholder="Full name"
              style={errors.name ? { borderColor: '#ef4444' } : {}} />
            {errors.name && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.name}</p>}
          </Field>
          <Field label="Role">
            <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone *">
            <input className="input" value={form.phone || ''} type="tel"
              onChange={e => set('phone', e.target.value)} placeholder="Mobile number"
              style={errors.phone ? { borderColor: '#ef4444' } : {}} />
            {errors.phone && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.phone}</p>}
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
        {/* Marital status */}
        <Field label="Marital Status">
          <div className="flex gap-2">
            {['Unmarried', 'Married'].map(s => (
              <button type="button" key={s}
                onClick={() => setFam('marital_status', family.marital_status === s ? '' : s)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={toggleStyle(family.marital_status === s)}>
                {s}
              </button>
            ))}
          </div>
        </Field>

        {/* Spouse — only if married */}
        {family.marital_status === 'Married' && (
          <Field label="Wife / Husband">
            <input className="input" value={family.spouse || ''}
              onChange={e => setFam('spouse', e.target.value)} placeholder="Spouse name" />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Father">
            <input className="input" value={family.father || ''}
              onChange={e => setFam('father', e.target.value)} placeholder="Father's name" />
          </Field>
          <Field label="Mother">
            <input className="input" value={family.mother || ''}
              onChange={e => setFam('mother', e.target.value)} placeholder="Mother's name" />
          </Field>
          <Field label="Brother">
            <input className="input" value={family.brother || ''}
              onChange={e => setFam('brother', e.target.value)} placeholder="Brother's name(s)" />
          </Field>
          <Field label="Sister">
            <input className="input" value={family.sister || ''}
              onChange={e => setFam('sister', e.target.value)} placeholder="Sister's name(s)" />
          </Field>
          <Field label="Grandfather">
            <input className="input" value={family.grandfather || ''}
              onChange={e => setFam('grandfather', e.target.value)} placeholder="Grandfather's name" />
          </Field>
          <Field label="Grandmother">
            <input className="input" value={family.grandmother || ''}
              onChange={e => setFam('grandmother', e.target.value)} placeholder="Grandmother's name" />
          </Field>
          <Field label="Son">
            <input className="input" value={family.son || ''}
              onChange={e => setFam('son', e.target.value)} placeholder="Son's name(s)" />
          </Field>
          <Field label="Daughter">
            <input className="input" value={family.daughter || ''}
              onChange={e => setFam('daughter', e.target.value)} placeholder="Daughter's name(s)" />
          </Field>
        </div>
      </Section>

      <Section title="ID Documents">
        {/* Passport photo */}
        <div className="flex items-start gap-4">
          <div>
            <p className="label mb-2">Passport Photo *</p>
            <div className="w-20 h-24 rounded-xl overflow-hidden flex items-center justify-center relative"
              style={{ background: '#1A1A1A', border: `1px solid ${errors.photo ? '#ef4444' : 'rgba(201,168,76,0.2)'}` }}>
              {form.photo
                ? <img src={form.photo} alt="photo" className="w-full h-full object-cover" />
                : <Camera className="w-6 h-6" style={{ color: errors.photo ? '#f87171' : 'rgba(201,168,76,0.3)' }} />}
            </div>
            {errors.photo && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.photo}</p>}
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => photoRef.current?.click()}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                {form.photo ? 'Change' : 'Upload'}
              </button>
              {form.photo && (
                <button type="button" onClick={() => { set('photo', ''); setErrors(e => ({ ...e, photo: 'Passport photo is required' })); }}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                  Remove
                </button>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="PAN Number">
            <input className="input" value={form.pan_number || ''}
              onChange={e => set('pan_number', e.target.value.toUpperCase())}
              placeholder="ABCDE1234F" maxLength={10} />
          </Field>
          <Field label="Aadhar Number *">
            <input className="input" value={form.aadhar_number || ''}
              onChange={e => set('aadhar_number', e.target.value)}
              placeholder="XXXX XXXX XXXX" maxLength={14}
              style={errors.aadhar_number ? { borderColor: '#ef4444' } : {}} />
            {errors.aadhar_number && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{errors.aadhar_number}</p>}
          </Field>
          <Field label="Driving License">
            <input className="input" value={form.driving_license || ''}
              onChange={e => set('driving_license', e.target.value.toUpperCase())}
              placeholder="DL number" />
          </Field>
          <Field label="Voter ID">
            <input className="input" value={form.voter_id || ''}
              onChange={e => set('voter_id', e.target.value.toUpperCase())}
              placeholder="Voter ID number" />
          </Field>
        </div>
      </Section>

      {/* Validation alert popup */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowAlert(false)}>
          <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            style={{ background: '#1A1A1A', border: '1px solid rgba(239,68,68,0.4)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertCircle className="w-5 h-5" style={{ color: '#f87171' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#F5F0E8' }}>Required fields missing</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.72)' }}>Please fill in the following before saving:</p>
              </div>
            </div>
            <ul className="space-y-2 mb-5">
              {Object.values(errors).map(label => (
                <li key={label} className="flex items-center gap-2 text-sm rounded-lg px-3 py-2"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#f87171' }} />
                  {label}
                </li>
              ))}
            </ul>
            <button onClick={() => setShowAlert(false)} className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}>
              Got it, I'll fix these
            </button>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-4 flex justify-end gap-2"
        style={{ background: '#141414', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
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
      <span className="text-xs font-medium w-28 flex-shrink-0" style={{ color: 'rgba(201,168,76,0.78)' }}>{label}</span>
      <span className="text-sm" style={{ color: '#F5F0E8' }}>{val}</span>
    </div>
  ) : null;

  const cardStyle = { background: '#141414', border: '1px solid rgba(201,168,76,0.15)' };
  const sectionLabel = (text, icon) => (
    <p className="text-xs font-medium uppercase tracking-widest mb-3 flex items-center gap-1.5"
      style={{ color: 'rgba(201,168,76,0.85)' }}>
      {icon}{text}
    </p>
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'rgba(201,168,76,0.85)' }}
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
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-lg font-semibold truncate" style={{ color: '#F5F0E8' }}>{s.name}</h2>
          <p className="text-sm font-medium mt-0.5" style={{ color: '#C9A84C' }}>{s.role}</p>
          {s.years_experience > 0 && (
            <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.62)' }}>{s.years_experience} yr{s.years_experience !== 1 ? 's' : ''} experience</p>
          )}
        </div>
        <button onClick={() => onEdit(s)} className="btn-secondary flex items-center gap-1.5 flex-shrink-0">
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
            <p className="text-xs" style={{ color: 'rgba(245,240,232,0.55)' }}>Not set</p>
          )}
        </div>

        {/* Professional */}
        <div className="p-5 rounded-xl space-y-2" style={cardStyle}>
          {sectionLabel('Professional Profile', <BookOpen className="w-3.5 h-3.5" />)}
          {infoRow('Experience', s.years_experience ? `${s.years_experience} years` : null)}
          {infoRow('Education', s.education)}
          {s.skills && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'rgba(201,168,76,0.78)' }}>Skills</p>
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
              <p className="text-xs font-medium mb-1" style={{ color: 'rgba(201,168,76,0.78)' }}>Previous Work</p>
              <p className="text-sm whitespace-pre-line" style={{ color: 'rgba(245,240,232,0.7)' }}>{s.previous_work}</p>
            </div>
          )}
        </div>

        {/* ID Documents */}
        {(s.pan_number || s.aadhar_number || s.driving_license || s.voter_id || s.photo) && (
          <div className="p-5 rounded-xl" style={cardStyle}>
            {sectionLabel('ID Documents', <CreditCard className="w-3.5 h-3.5" />)}
            <div className="flex items-start gap-5">
              {s.photo && (
                <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ border: '1px solid rgba(201,168,76,0.2)' }}>
                  <img src={s.photo} alt="Passport" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="space-y-2 flex-1">
                {infoRow('PAN', s.pan_number)}
                {infoRow('Aadhar', s.aadhar_number)}
                {infoRow('Driving Lic.', s.driving_license)}
                {infoRow('Voter ID', s.voter_id)}
              </div>
            </div>
          </div>
        )}

        {/* Family */}
        {s.family_details && (() => {
          const fam = parseFamily(s.family_details);
          const rows = [
            fam.marital_status && ['Status', fam.marital_status],
            fam.spouse && ['Wife / Husband', fam.spouse],
            fam.father && ['Father', fam.father],
            fam.mother && ['Mother', fam.mother],
            fam.brother && ['Brother', fam.brother],
            fam.sister && ['Sister', fam.sister],
            fam.grandfather && ['Grandfather', fam.grandfather],
            fam.grandmother && ['Grandmother', fam.grandmother],
            fam.son && ['Son', fam.son],
            fam.daughter && ['Daughter', fam.daughter],
            fam.notes && ['Notes', fam.notes],
          ].filter(Boolean);
          return rows.length > 0 ? (
            <div className="p-5 rounded-xl space-y-2" style={cardStyle}>
              {sectionLabel('Family', <Users className="w-3.5 h-3.5" />)}
              {rows.map(([label, val]) => infoRow(label, val))}
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}

export default function Staff() {
  const [staff,         setStaff]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [modal,         setModal]         = useState(null);
  const [selected,      setSelected]      = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  function requestDelete(id) { setPendingDelete(id); setTimeout(() => setPendingDelete(null), 3000); }

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
    await api.deleteStaff(id);
    load();
  }

  if (selected) {
    return <StaffProfile staff={selected} onBack={() => setSelected(null)} onEdit={s => { setModal(s); setSelected(null); }} />;
  }

  return (
    <div className="space-y-4 max-w-5xl">
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
        <p className="text-center text-sm py-10" style={{ color: 'rgba(245,240,232,0.68)' }}>No staff members added</p>
      ) : (
        <div className="min-w-0 w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
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
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.62)' }}>{s.years_experience} yr exp</p>
                  )}
                  {s.phone && <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.62)' }}>{s.phone}</p>}
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setModal(s)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'rgba(201,168,76,0.78)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.5)'; e.currentTarget.style.background = 'transparent'; }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {pendingDelete === s.id
                    ? <button onClick={() => handleDelete(s.id)}
                        className="px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        Sure?
                      </button>
                    : <button onClick={() => requestDelete(s.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'rgba(239,68,68,0.5)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.5)'; e.currentTarget.style.background = 'transparent'; }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>}
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
        <Modal title={modal === 'new' ? 'Add Staff Member' : 'Edit Staff Profile'} subtitle={modal === 'new' ? 'Add a new team member with their role and details' : 'Update name, role, contact or commission details'} onClose={() => setModal(null)} wide>
          <StaffForm initial={modal !== 'new' ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
