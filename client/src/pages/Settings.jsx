import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Save, Instagram, MessageCircle, Phone, MapPin, Store, ExternalLink } from 'lucide-react';

const cardStyle = { background: '#111111', border: '1px solid rgba(201,168,76,0.15)' };

function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
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

        {/* Left — editable form */}
        <form onSubmit={handleSave} className="p-6 rounded-xl space-y-5 self-start" style={cardStyle}>
          <h2 className="font-serif font-semibold" style={{ color: '#F5F0E8' }}>Salon Information</h2>

          <div>
            <label className="label flex items-center gap-1"><Store className="w-3 h-3" /> Salon Name</label>
            <input className="input" value={form.salon_name}
              onChange={e => setForm(f => ({ ...f, salon_name: e.target.value }))} />
          </div>

          <div>
            <label className="label flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</label>
            <input className="input" value={form.salon_address}
              onChange={e => setForm(f => ({ ...f, salon_address: e.target.value }))}
              placeholder="e.g. Kakdwip, West Bengal" />
          </div>

          <div>
            <label className="label flex items-center gap-1"><Phone className="w-3 h-3" /> Salon Phone</label>
            <input className="input" value={form.salon_phone} type="tel"
              onChange={e => setForm(f => ({ ...f, salon_phone: e.target.value }))}
              placeholder="10-digit mobile number" />
          </div>

          <div style={{ borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: '20px' }}>
            <h2 className="font-serif font-semibold mb-4" style={{ color: '#F5F0E8' }}>Social & Messaging</h2>

            <div className="space-y-4">
              <div>
                <label className="label flex items-center gap-1.5">
                  <MessageCircle className="w-3 h-3" style={{ color: '#22c55e' }} />
                  WhatsApp Number
                  <span className="font-normal" style={{ color: 'rgba(245,240,232,0.35)' }}>(for customer messages)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(245,240,232,0.35)' }}>+91</span>
                  <input className="input pl-10" value={form.salon_whatsapp} type="tel"
                    onChange={e => setForm(f => ({ ...f, salon_whatsapp: e.target.value }))}
                    placeholder="98765 43210" />
                </div>
                {waNumber && (
                  <a href={`https://wa.me/${waE164}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs" style={{ color: '#22c55e' }}>
                    <ExternalLink className="w-3 h-3" /> Test WhatsApp link
                  </a>
                )}
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <Instagram className="w-3 h-3" style={{ color: '#ec4899' }} /> Instagram Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(245,240,232,0.35)' }}>@</span>
                  <input className="input pl-7" value={igHandle}
                    onChange={e => setForm(f => ({ ...f, salon_instagram: e.target.value.replace('@', '') }))}
                    placeholder="sukhandsenunisexsalon" />
                </div>
                {igHandle && (
                  <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs" style={{ color: '#ec4899' }}>
                    <ExternalLink className="w-3 h-3" /> View profile
                  </a>
                )}
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <FacebookIcon className="w-3 h-3" style={{ color: '#3b82f6' }} /> Facebook Page
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>fb.com/</span>
                  <input className="input pl-16" value={fbHandle}
                    onChange={e => setForm(f => ({ ...f, salon_facebook: e.target.value.replace('facebook.com/', '') }))}
                    placeholder="sukhandsen" />
                </div>
                {fbHandle && (
                  <a href={`https://facebook.com/${fbHandle}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs" style={{ color: '#3b82f6' }}>
                    <ExternalLink className="w-3 h-3" /> View page
                  </a>
                )}
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="btn-primary flex items-center gap-2 w-full justify-center">
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </form>

        {/* Right — live previews */}
        <div className="space-y-4 self-start">
          {/* Social previews */}
          {(igHandle || fbHandle) && (
            <div className="p-5 rounded-xl space-y-3" style={cardStyle}>
              <h3 className="font-serif font-medium text-sm" style={{ color: '#F5F0E8' }}>Social Media</h3>
              {igHandle && (
                <div className="flex items-center gap-3 rounded-lg px-4 py-3"
                  style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.15)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #ec4899, #9333ea)' }}>
                    <Instagram className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>@{igHandle}</p>
                    <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>Instagram</p>
                  </div>
                  <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 flex-shrink-0">
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                </div>
              )}
              {fbHandle && (
                <div className="flex items-center gap-3 rounded-lg px-4 py-3"
                  style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#3b82f6' }}>
                    <FacebookIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{fbHandle}</p>
                    <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>Facebook</p>
                  </div>
                  <a href={`https://facebook.com/${fbHandle}`} target="_blank" rel="noopener noreferrer"
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 flex-shrink-0">
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                </div>
              )}
              <p className="text-xs" style={{ color: 'rgba(245,240,232,0.3)' }}>Both links appear in the sidebar for quick access.</p>
            </div>
          )}

          {/* WhatsApp info */}
          {form.salon_whatsapp && (
            <div className="p-5 rounded-xl space-y-3" style={cardStyle}>
              <h3 className="font-serif font-medium text-sm flex items-center gap-2" style={{ color: '#F5F0E8' }}>
                <MessageCircle className="w-4 h-4" style={{ color: '#22c55e' }} /> WhatsApp Quick Actions
              </h3>
              <p className="text-xs" style={{ color: 'rgba(245,240,232,0.4)' }}>
                These buttons appear throughout the app and open WhatsApp with a pre-filled message.
              </p>
              {[
                { label: 'Appointment Confirmation', desc: 'Sent after booking a new appointment' },
                { label: 'Bill Receipt',             desc: 'Sent after generating a bill' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                  style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}>
                  <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Placeholder when no social/WA configured */}
          {!igHandle && !fbHandle && !form.salon_whatsapp && (
            <div className="p-5 rounded-xl" style={cardStyle}>
              <p className="text-sm text-center py-4" style={{ color: 'rgba(245,240,232,0.3)' }}>
                Add your WhatsApp number or social handles to see previews here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
