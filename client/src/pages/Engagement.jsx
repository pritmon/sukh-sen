import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { openWhatsApp, whatsappBirthdayMsg, whatsappAnniversaryMsg, whatsappBroadcastMsg } from '../utils.js';
import { MessageCircle, Gift, Heart, Megaphone, Send, Users, Check } from 'lucide-react';

function DaysChip({ days }) {
  if (days === 0) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
      🎉 Today!
    </span>
  );
  if (days === 1) return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)' }}>
      Tomorrow
    </span>
  );
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
      {days}d
    </span>
  );
}

function CelebrantRow({ c, onWish, accentColor, last }) {
  const initial = c.name?.[0]?.toUpperCase();
  return (
    <div className="px-5 py-3.5 flex items-center gap-3.5 transition-colors"
      style={{ borderBottom: last ? 'none' : '1px solid rgba(201,168,76,0.06)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
        style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}>
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>{c.name}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.62)' }}>{c.phone || 'No phone'}</p>
      </div>
      <DaysChip days={c.daysUntil} />
      {c.phone && (
        <button onClick={() => onWish(c)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-[0.97] flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.08)'}>
          <MessageCircle className="w-3.5 h-3.5" /> Wish
        </button>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, iconBg, iconColor, title, filter, onFilterChange, filterOptions, loading, children, emptyText }) {
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
      <div className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', background: 'rgba(201,168,76,0.03)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: iconBg }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
          <h3 className="font-serif font-semibold text-sm" style={{ color: '#F5F0E8' }}>{title}</h3>
        </div>
        {filterOptions && (
          <select className="text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            style={{ background: '#1A1A1A', border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(245,240,232,0.7)', colorScheme: 'dark' }}
            value={filter} onChange={e => onFilterChange(Number(e.target.value))}>
            {filterOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
      </div>
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-5 h-5 rounded-full animate-spin"
            style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      ) : children.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Icon className="w-9 h-9" style={{ color: `${iconColor}30` }} />
          <p className="text-sm" style={{ color: 'rgba(245,240,232,0.62)' }}>{emptyText}</p>
        </div>
      ) : children}
    </div>
  );
}

const FILTER_OPTS = [[3,'Next 3 days'],[7,'Next 7 days'],[14,'Next 14 days'],[30,'Next 30 days']];

function BirthdayPanel({ salonName }) {
  const [days,   setDays]   = useState(7);
  const [data,   setData]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,  setToast]  = useState('');
  useEffect(() => { setLoading(true); api.birthdays(days).then(setData).finally(() => setLoading(false)); }, [days]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function handleWish(c) {
    const message = whatsappBirthdayMsg(salonName, c.name);

    // Check Web Share (file) capability synchronously — no fetch needed
    const probe = new File([''], 'x.webp', { type: 'image/webp' });
    const canFileShare = !!(navigator.share && navigator.canShare?.({ files: [probe] }));

    if (canFileShare) {
      // Mobile: share image + message together via native share sheet
      try {
        const res  = await fetch('/birthday-card.webp');
        const blob = await res.blob();
        const file = new File([blob], 'birthday-card.webp', { type: 'image/webp' });
        await navigator.share({ files: [file], text: message });
        return;
      } catch (_) {}
    }

    // Desktop: open WhatsApp NOW — must happen before any await to keep user gesture
    openWhatsApp(c.phone, message);

    // Copy birthday card image to clipboard in background
    try {
      const res  = await fetch('/birthday-card.webp');
      const blob = await res.blob();
      if (window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/webp': blob })]);
        showToast('Image copied! Paste it in WhatsApp.');
      }
    } catch (_) {}
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
          <Check className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
      {/* Birthday card preview */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: '#111111', border: '1px solid rgba(236,72,153,0.2)' }}>
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(236,72,153,0.12)', background: 'rgba(236,72,153,0.04)' }}>
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4" style={{ color: '#ec4899' }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(236,72,153,0.7)' }}>Birthday Card</span>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(236,72,153,0.08)', color: 'rgba(236,72,153,0.7)', border: '1px solid rgba(236,72,153,0.15)' }}>
            Sent with Wish button
          </span>
        </div>
        <div className="p-4 flex gap-4 items-start">
          <img src="/birthday-card.webp" alt="Birthday card"
            className="w-28 rounded-xl flex-shrink-0 object-cover"
            style={{ border: '1px solid rgba(236,72,153,0.15)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'rgba(236,72,153,0.8)' }}>Message Preview</p>
            <div className="rounded-xl p-3 text-xs leading-relaxed whitespace-pre-line"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(245,240,232,0.82)' }}>
              {whatsappBirthdayMsg(salonName, 'Customer Name')}
            </div>
            <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'rgba(245,240,232,0.5)' }}>
              <span>📱 Mobile: shares image + message together · 💻 Desktop: copies image to clipboard</span>
            </p>
          </div>
        </div>
      </div>

      <SectionCard icon={Gift} iconBg="rgba(236,72,153,0.12)" iconColor="#ec4899"
        title="Upcoming Birthdays" filter={days} onFilterChange={setDays}
        filterOptions={FILTER_OPTS} loading={loading}
        emptyText={`No birthdays in the next ${days} days`}>
        {data.map((c, i) => (
          <CelebrantRow key={c.id} c={c} accentColor="#ec4899" last={i === data.length - 1}
            onWish={handleWish} />
        ))}
      </SectionCard>
    </div>
  );
}

function AnniversaryPanel({ salonName }) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); api.anniversaries(days).then(setData).finally(() => setLoading(false)); }, [days]);
  return (
    <SectionCard icon={Heart} iconBg="rgba(244,63,94,0.1)" iconColor="#f43f5e"
      title="Upcoming Anniversaries" filter={days} onFilterChange={setDays}
      filterOptions={FILTER_OPTS} loading={loading}
      emptyText={`No anniversaries in the next ${days} days`}>
      {data.map((c, i) => (
        <CelebrantRow key={c.id} c={c} accentColor="#f43f5e" last={i === data.length - 1}
          onWish={c => openWhatsApp(c.phone, whatsappAnniversaryMsg(salonName, c.name))} />
      ))}
    </SectionCard>
  );
}

function BroadcastPanel({ salonName }) {
  const [customers, setCustomers] = useState([]);
  const [selected,  setSelected]  = useState(new Set());
  const [message,   setMessage]   = useState('');
  const [filter,    setFilter]    = useState('all');
  const [sending,   setSending]   = useState(false);
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => { api.customers().then(setCustomers); }, []);

  const filtered = customers.filter(c => {
    if (filter === 'membership') return c.membership_tier && c.membership_tier !== 'none';
    return !!c.phone;
  });

  function toggleAll() {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(c => c.id)));
  }

  async function sendBroadcast() {
    if (!message.trim() || selected.size === 0) return;
    setSending(true); setSentCount(0);
    const targets = filtered.filter(c => selected.has(c.id) && c.phone);
    for (const c of targets) {
      openWhatsApp(c.phone, whatsappBroadcastMsg(salonName, message));
      await new Promise(r => setTimeout(r, 800));
      setSentCount(n => n + 1);
    }
    setSending(false);
  }

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: '#111111', border: '1px solid rgba(201,168,76,0.15)' }}>
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center gap-2.5"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', background: 'rgba(201,168,76,0.03)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(201,168,76,0.12)' }}>
          <Megaphone className="w-4 h-4" style={{ color: '#C9A84C' }} />
        </div>
        <h3 className="font-serif font-semibold text-sm" style={{ color: '#F5F0E8' }}>WhatsApp Broadcast</h3>
        {selected.size > 0 && (
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#C9A84C', color: '#0A0A0A' }}>{selected.size} selected</span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Message */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(201,168,76,0.85)' }}>
            Broadcast Message
          </label>
          <textarea className="input" rows={3}
            placeholder="e.g. 20% off on all facials this weekend! Book now 💆‍♀️"
            value={message} onChange={e => setMessage(e.target.value)} />
          <p className="text-xs" style={{ color: 'rgba(245,240,232,0.55)' }}>
            Sent individually to each customer via WhatsApp.
          </p>
        </div>

        {/* Recipient filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(201,168,76,0.85)' }}>
            Recipients
          </label>
          <div className="flex gap-2">
            {[['all', 'All (with phone)'], ['membership', 'Members only']].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)}
                className="px-3 py-1.5 rounded-xl border text-sm font-medium transition-all"
                style={filter === val
                  ? { background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0A0A0A', borderColor: '#C9A84C' }
                  : { background: '#1A1A1A', color: 'rgba(245,240,232,0.75)', borderColor: 'rgba(201,168,76,0.15)' }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Customer list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(201,168,76,0.85)' }}>
              <Users className="w-3.5 h-3.5 inline mr-1" />
              {selected.size} / {filtered.length} selected
            </span>
            <button onClick={toggleAll} className="text-xs font-medium" style={{ color: '#C9A84C' }}>
              {selected.size === filtered.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="rounded-xl max-h-52 overflow-y-auto"
            style={{ border: '1px solid rgba(201,168,76,0.12)', background: '#0D0D0D' }}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Users className="w-8 h-8" style={{ color: 'rgba(201,168,76,0.2)' }} />
                <p className="text-sm" style={{ color: 'rgba(245,240,232,0.62)' }}>No customers with phone numbers</p>
              </div>
            ) : filtered.map((c, i) => (
              <label key={c.id}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(201,168,76,0.05)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <input type="checkbox" checked={selected.has(c.id)} style={{ accentColor: '#C9A84C' }}
                  onChange={() => { const s = new Set(selected); s.has(c.id) ? s.delete(c.id) : s.add(c.id); setSelected(s); }} />
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                  {c.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#F5F0E8' }}>{c.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(245,240,232,0.62)' }}>{c.phone}</p>
                </div>
                {c.membership_tier && c.membership_tier !== 'none' && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0"
                    style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                    {c.membership_tier}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {sentCount > 0 && !sending && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Sent to {sentCount} customer{sentCount > 1 ? 's' : ''}</span>
          </div>
        )}

        <button onClick={sendBroadcast}
          disabled={sending || selected.size === 0 || !message.trim()}
          className="btn-primary flex items-center gap-2 w-full justify-center">
          {sending ? (
            <>
              <div className="w-4 h-4 rounded-full animate-spin"
                style={{ border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0A0A0A' }} />
              Sending {sentCount}/{selected.size}…
            </>
          ) : (
            <><Send className="w-4 h-4" /> Send to {selected.size || 0} customer{selected.size !== 1 ? 's' : ''}</>
          )}
        </button>
        <p className="text-xs text-center" style={{ color: 'rgba(245,240,232,0.75)' }}>
          Each message opens in WhatsApp — you confirm and send from your phone.
        </p>
      </div>
    </div>
  );
}

export default function Engagement() {
  const [settings, setSettings] = useState({});
  const [tab,      setTab]      = useState('birthdays');

  useEffect(() => { api.settings().then(setSettings).catch(() => {}); }, []);
  const salonName = settings.salon_name || 'Sukh&Sen Salon';

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex gap-1 rounded-xl p-1 w-fit"
        style={{ background: '#161616', border: '1px solid rgba(201,168,76,0.12)' }}>
        {[
          ['birthdays',     'Birthdays',    Gift],
          ['anniversaries', 'Anniversaries', Heart],
          ['broadcast',     'Broadcast',    Megaphone],
        ].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === key
              ? { background: 'rgba(201,168,76,0.15)', color: '#E8C96D', border: '1px solid rgba(201,168,76,0.25)' }
              : { color: 'rgba(245,240,232,0.68)', border: '1px solid transparent' }}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'birthdays'     && <BirthdayPanel     salonName={salonName} />}
      {tab === 'anniversaries' && <AnniversaryPanel  salonName={salonName} />}
      {tab === 'broadcast'     && <BroadcastPanel    salonName={salonName} />}
    </div>
  );
}
