import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Save, Instagram, MessageCircle, Phone, MapPin, Store, ExternalLink, CheckCircle2 } from 'lucide-react';

function FacebookIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function Field({ icon: Icon, iconColor, label, sub, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: iconColor || 'rgba(201,168,76,0.6)' }} />
        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(245,240,232,0.5)' }}>{label}</label>
        {sub && <span className="text-xs" style={{ color: 'rgba(245,240,232,0.25)' }}>{sub}</span>}
      </div>
      {children}
    </div>
  );
}

export default function SalonSettings() {
  const [form,    setForm]    = useState({
    salon_name:      'Sukh&Sen Unisex Salon',
    salon_phone:     '',
    salon_whatsapp:  '',
    salon_instagram: '',
    salon_facebook:  '',
    salon_address:   'Kakdwip',
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    api.settings().then(s => { setForm(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  }

  const igHandle = form.salon_instagram?.replace('@', '') || '';
  const fbHandle = form.salon_facebook?.replace('facebook.com/', '').replace('@', '') || '';
  const waNumber = form.salon_whatsapp?.replace(/\D/g, '') || '';
  const waE164   = waNumber.startsWith('91') ? waNumber : `91${waNumber}`;

  if (loading) return <div className="text-sm" style={{ color: 'rgba(245,240,232,0.4)' }}>Loading…</div>;

  return (
    <div className="max-w-5xl">
      <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)' }}>

        {/* Left — form */}
        <form onSubmit={handleSave} className="space-y-5 self-start">

          {/* Salon info card */}
          <div className="rounded-xl overflow-hidden"
            style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
            <div className="px-5 py-3.5 flex items-center gap-2"
              style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', background: 'rgba(201,168,76,0.03)' }}>
              <Store className="w-4 h-4" style={{ color: '#C9A84C' }} />
              <h2 className="font-serif font-semibold text-sm" style={{ color: '#F5F0E8' }}>Salon Information</h2>
            </div>
            <div className="p-5 space-y-4">
              <Field icon={Store} label="Salon Name">
                <input className="input" value={form.salon_name}
                  onChange={e => setForm(f => ({ ...f, salon_name: e.target.value }))} />
              </Field>
              <Field icon={MapPin} label="Address">
                <input className="input" value={form.salon_address}
                  onChange={e => setForm(f => ({ ...f, salon_address: e.target.value }))}
                  placeholder="e.g. Kakdwip, West Bengal" />
              </Field>
              <Field icon={Phone} label="Phone">
                <input className="input" value={form.salon_phone} type="tel"
                  onChange={e => setForm(f => ({ ...f, salon_phone: e.target.value }))}
                  placeholder="10-digit mobile number" />
              </Field>
            </div>
          </div>

          {/* Social card */}
          <div className="rounded-xl overflow-hidden"
            style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
            <div className="px-5 py-3.5 flex items-center gap-2"
              style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', background: 'rgba(201,168,76,0.03)' }}>
              <MessageCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
              <h2 className="font-serif font-semibold text-sm" style={{ color: '#F5F0E8' }}>Social & Messaging</h2>
            </div>
            <div className="p-5 space-y-4">
              <Field icon={MessageCircle} iconColor="#22c55e" label="WhatsApp" sub="(for customer messages)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none"
                    style={{ color: 'rgba(245,240,232,0.35)' }}>+91</span>
                  <input className="input pl-10" value={form.salon_whatsapp} type="tel"
                    onChange={e => setForm(f => ({ ...f, salon_whatsapp: e.target.value }))}
                    placeholder="98765 43210" />
                </div>
                {waNumber && (
                  <a href={`https://wa.me/${waE164}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs" style={{ color: '#22c55e' }}>
                    <ExternalLink className="w-3 h-3" /> Test link
                  </a>
                )}
              </Field>

              <Field icon={Instagram} iconColor="#ec4899" label="Instagram Handle">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none"
                    style={{ color: 'rgba(245,240,232,0.35)' }}>@</span>
                  <input className="input pl-7" value={igHandle}
                    onChange={e => setForm(f => ({ ...f, salon_instagram: e.target.value.replace('@', '') }))}
                    placeholder="sukhandsenunisexsalon" />
                </div>
                {igHandle && (
                  <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs" style={{ color: '#ec4899' }}>
                    <ExternalLink className="w-3 h-3" /> View profile
                  </a>
                )}
              </Field>

              <Field icon={p => <FacebookIcon {...p} />} iconColor="#3b82f6" label="Facebook Page">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs select-none"
                    style={{ color: 'rgba(245,240,232,0.35)' }}>fb.com/</span>
                  <input className="input pl-16" value={fbHandle}
                    onChange={e => setForm(f => ({ ...f, salon_facebook: e.target.value.replace('facebook.com/', '') }))}
                    placeholder="sukhandsen" />
                </div>
                {fbHandle && (
                  <a href={`https://facebook.com/${fbHandle}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs" style={{ color: '#3b82f6' }}>
                    <ExternalLink className="w-3 h-3" /> View page
                  </a>
                )}
              </Field>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="btn-primary flex items-center gap-2 w-full justify-center"
            style={saved ? { background: 'linear-gradient(135deg,#22c55e,#16a34a)', borderColor: '#22c55e' } : {}}>
            {saved
              ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
              : <><Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Settings'}</>}
          </button>
        </form>

        {/* Right — previews */}
        <div className="space-y-4 self-start">
          {(igHandle || fbHandle) && (
            <div className="rounded-xl overflow-hidden"
              style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
              <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', background: 'rgba(201,168,76,0.03)' }}>
                <h3 className="font-serif font-semibold text-sm" style={{ color: '#F5F0E8' }}>Social Media</h3>
              </div>
              <div className="p-4 space-y-3">
                {igHandle && (
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.15)' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #ec4899, #9333ea)' }}>
                      <Instagram className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#F5F0E8' }}>@{igHandle}</p>
                      <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>Instagram</p>
                    </div>
                    <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 flex-shrink-0">
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                  </div>
                )}
                {fbHandle && (
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#3b82f6' }}>
                      <FacebookIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#F5F0E8' }}>{fbHandle}</p>
                      <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>Facebook</p>
                    </div>
                    <a href={`https://facebook.com/${fbHandle}`} target="_blank" rel="noopener noreferrer"
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 flex-shrink-0">
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                  </div>
                )}
                <p className="text-xs px-1" style={{ color: 'rgba(245,240,232,0.3)' }}>
                  Both links appear in the sidebar for quick access.
                </p>
              </div>
            </div>
          )}

          {form.salon_whatsapp && (
            <div className="rounded-xl overflow-hidden"
              style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
              <div className="px-5 py-3.5 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', background: 'rgba(201,168,76,0.03)' }}>
                <MessageCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                <h3 className="font-serif font-semibold text-sm" style={{ color: '#F5F0E8' }}>WhatsApp Quick Actions</h3>
              </div>
              <div className="p-4 space-y-2.5">
                <p className="text-xs px-1" style={{ color: 'rgba(245,240,232,0.4)' }}>
                  These buttons open WhatsApp with a pre-filled message.
                </p>
                {[
                  { label: 'Appointment Confirmation', desc: 'After booking' },
                  { label: 'Bill Receipt',             desc: 'After billing' },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}>
                    <MessageCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{label}</p>
                      <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!igHandle && !fbHandle && !form.salon_whatsapp && (
            <div className="rounded-xl p-6 text-center"
              style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.12)' }}>
              <p className="text-sm" style={{ color: 'rgba(245,240,232,0.3)' }}>
                Add WhatsApp or social handles to see previews here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
