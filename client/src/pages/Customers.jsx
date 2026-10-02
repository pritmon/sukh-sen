import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, statusClass, statusLabel, openWhatsApp, whatsappConfirmMsg } from '../utils.js';
import { Search, Phone, ChevronRight, ArrowLeft, Star, Gift, Heart, MessageCircle, Pencil, Award } from 'lucide-react';
import Modal from '../components/Modal.jsx';

const TIERS = ['none', 'bronze', 'silver', 'gold', 'platinum'];
const TIER_STYLE = {
  none:     'bg-gray-100 text-gray-500',
  bronze:   'bg-orange-100 text-orange-700',
  silver:   'bg-slate-100 text-slate-600',
  gold:     'bg-amber-100 text-amber-700',
  platinum: 'bg-purple-100 text-purple-700',
};

function MembershipBadge({ tier }) {
  if (!tier || tier === 'none') return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${TIER_STYLE[tier]}`}>
      <Award className="w-3 h-3 mr-1" />{tier}
    </span>
  );
}

function EditCustomerModal({ customer, onSave, onClose }) {
  const [form, setForm] = useState({
    name:            customer.name,
    phone:           customer.phone || '',
    email:           customer.email || '',
    gender:          customer.gender || '',
    birthday:        customer.birthday || '',
    anniversary:     customer.anniversary || '',
    membership_tier: customer.membership_tier || 'none',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Name *</label>
          <input className="input" value={form.name} required onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <label className="label">Gender</label>
          <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label flex items-center gap-1"><Gift className="w-3 h-3" /> Birthday</label>
          <input className="input" type="date" value={form.birthday} onChange={e => set('birthday', e.target.value)} />
        </div>
        <div>
          <label className="label flex items-center gap-1"><Heart className="w-3 h-3" /> Anniversary</label>
          <input className="input" type="date" value={form.anniversary} onChange={e => set('anniversary', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label flex items-center gap-1"><Award className="w-3 h-3" /> Membership Tier</label>
        <div className="flex gap-2 flex-wrap">
          {TIERS.map(t => (
            <button key={t} type="button" onClick={() => set('membership_tier', t)}
              className={`px-3 py-1.5 rounded-xl border text-sm font-semibold capitalize transition-all ${
                form.membership_tier === t
                  ? `${TIER_STYLE[t]} border-current`
                  : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
              }`}>
              {t === 'none' ? 'No Membership' : t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

function LoyaltyModal({ customer, onClose, onDone }) {
  const [pts,  setPts]  = useState('');
  const [type, setType] = useState('earn');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!pts) return;
    setSaving(true);
    try {
      await api.addLoyaltyPoints(customer.id, { points: Number(pts), type, note });
      onDone();
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="bg-brand-50 rounded-xl px-4 py-3 border border-brand-100 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Current Points</p>
        <p className="text-2xl font-bold text-brand-600">{customer.loyalty_points ?? 0} pts</p>
      </div>
      <div>
        <label className="label">Transaction Type</label>
        <div className="flex gap-2">
          {[['earn', 'Add Points'], ['redeem', 'Redeem'], ['bonus', 'Bonus']].map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => setType(val)}
              className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${
                type === val ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Points</label>
        <input className="input" type="number" min={1} value={pts} onChange={e => setPts(e.target.value)} placeholder="e.g. 50" required />
      </div>
      <div>
        <label className="label">Note (optional)</label>
        <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Birthday bonus" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Update Points'}</button>
      </div>
    </form>
  );
}

function CustomerProfile({ id, onBack }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen,    setEditOpen]    = useState(false);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);

  async function load() {
    setLoading(true);
    try { setData(await api.customer(id)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="flex items-center justify-center h-32"><div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} /></div>;
  if (!data)   return <div className="text-sm" style={{ color: '#f87171' }}>Not found</div>;

  const cardStyle = { background: '#141414', border: '1px solid rgba(201,168,76,0.15)' };

  return (
    <div className="space-y-5 max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'rgba(201,168,76,0.6)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(201,168,76,0.6)'}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="p-5 rounded-xl" style={cardStyle}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0A0A0A' }}>
            {data.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif font-semibold text-lg" style={{ color: '#F5F0E8' }}>{data.name}</h2>
              <MembershipBadge tier={data.membership_tier} />
            </div>
            <p className="text-sm flex items-center gap-1 mt-0.5" style={{ color: 'rgba(245,240,232,0.45)' }}>
              <Phone className="w-3 h-3" /> {data.phone || 'No phone'}
            </p>
            {data.birthday && <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.35)' }}>🎂 {fmtDate(data.birthday)}</p>}
            {data.anniversary && <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>💍 {fmtDate(data.anniversary)}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-serif font-semibold" style={{ color: '#C9A84C' }}>{fmtRupee(data.totalSpent)}</p>
            <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>{data.visitCount} visit{data.visitCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Loyalty points */}
        <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4" style={{ color: '#C9A84C' }} />
            <span className="text-sm font-medium" style={{ color: '#F5F0E8' }}>Loyalty Points</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-serif font-semibold" style={{ color: '#C9A84C' }}>{data.loyalty_points ?? 0} pts</span>
            <button onClick={() => setLoyaltyOpen(true)} className="btn-secondary text-xs px-3 py-1.5">Manage</button>
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <button onClick={() => setEditOpen(true)} className="btn-secondary flex items-center gap-1.5 text-xs">
            <Pencil className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>
      </div>

      {/* Visit history */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
          <h3 className="section-title">Visit History</h3>
        </div>
        {data.appointments.length === 0 ? (
          <p className="text-center text-sm py-8" style={{ color: 'rgba(245,240,232,0.35)' }}>No visits yet</p>
        ) : (
          <div>
            {data.appointments.map((a, idx) => (
              <div key={a.id} className="px-5 py-3.5 flex items-start justify-between gap-3 transition-colors"
                style={{ borderBottom: idx < data.appointments.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{fmtDate(a.date)} · {a.time}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.4)' }}>{a.services || 'No services'}</p>
                  {a.staff_name && <p className="text-xs" style={{ color: 'rgba(245,240,232,0.3)' }}>by {a.staff_name}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-serif font-semibold" style={{ color: '#C9A84C' }}>{fmtRupee(a.bill_total || a.total_price)}</p>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <span className={statusClass(a.status)}>{statusLabel(a.status)}</span>
                    {a.bill_paid === 1 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                        {a.payment_method === 'upi' ? 'UPI' : 'Cash'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editOpen && (
        <Modal title="Edit Customer" onClose={() => setEditOpen(false)}>
          <EditCustomerModal customer={data} onClose={() => setEditOpen(false)}
            onSave={async (form) => { await api.updateCustomer(data.id, form); setEditOpen(false); load(); }} />
        </Modal>
      )}

      {loyaltyOpen && (
        <Modal title="Loyalty Points" onClose={() => setLoyaltyOpen(false)}>
          <LoyaltyModal customer={data} onClose={() => setLoyaltyOpen(false)}
            onDone={() => { setLoyaltyOpen(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [q,         setQ]         = useState('');
  const [selected,  setSelected]  = useState(null);

  async function load(query = '') {
    setLoading(true);
    try { setCustomers(await api.customers(query)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  if (selected) return <CustomerProfile id={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(201,168,76,0.4)' }} />
        <input className="input pl-10" placeholder="Search by name or phone…"
          value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
          </div>
        ) : customers.length === 0 ? (
          <p className="text-center text-sm py-10" style={{ color: 'rgba(245,240,232,0.35)' }}>No customers found</p>
        ) : (
          <div>
            {customers.map((c, idx) => (
              <button key={c.id} onClick={() => setSelected(c.id)}
                className="w-full px-5 py-3.5 flex items-center gap-3 text-left transition-colors"
                style={{ borderBottom: idx < customers.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0A0A0A' }}>
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{c.name}</p>
                    <MembershipBadge tier={c.membership_tier} />
                  </div>
                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'rgba(245,240,232,0.35)' }}>
                    <Phone className="w-3 h-3" /> {c.phone || 'No phone'}
                  </p>
                </div>
                {(c.loyalty_points > 0) && (
                  <span className="flex items-center gap-1 text-xs font-semibold rounded-lg px-2 py-1"
                    style={{ color: '#C9A84C', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <Star className="w-3 h-3" /> {c.loyalty_points}
                  </span>
                )}
                <p className="text-xs" style={{ color: 'rgba(245,240,232,0.25)' }}>{fmtDate(c.created_at?.split('T')[0])}</p>
                <ChevronRight className="w-4 h-4" style={{ color: 'rgba(201,168,76,0.3)' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
