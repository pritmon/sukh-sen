import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { openWhatsApp, whatsappBirthdayMsg, whatsappAnniversaryMsg, whatsappBroadcastMsg } from '../utils.js';
import { MessageCircle, Gift, Heart, Megaphone, Send } from 'lucide-react';

const cardStyle = { background: '#111111', border: '1px solid rgba(201,168,76,0.15)' };

function DaysUntilBadge({ days }) {
  if (days === 0) return <span className="badge-done">Today! 🎉</span>;
  if (days === 1) return <span className="badge-pending">Tomorrow</span>;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
      In {days} days
    </span>
  );
}

function CelebrantRow({ c, onWish }) {
  return (
    <div className="px-5 py-3.5 flex items-center gap-3 transition-colors"
      style={{ borderBottom: '1px solid rgba(201,168,76,0.06)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0A0A0A' }}>
        {c.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{c.name}</p>
        <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>{c.phone || 'No phone'}</p>
      </div>
      <DaysUntilBadge days={c.daysUntil} />
      {c.phone && (
        <button onClick={() => onWish(c)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-[0.97]"
          style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.08)'}>
          <MessageCircle className="w-3.5 h-3.5" /> Wish
        </button>
      )}
    </div>
  );
}

function BirthdayPanel({ salonName }) {
  const [days,    setDays]    = useState(7);
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.birthdays(days).then(setData).finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="rounded-xl overflow-hidden" style={cardStyle}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', background: '#0D0D0D' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(236,72,153,0.12)' }}>
            <Gift className="w-4 h-4" style={{ color: '#ec4899' }} />
          </div>
          <h3 className="text-sm font-medium" style={{ color: '#F5F0E8' }}>Upcoming Birthdays</h3>
        </div>
        <select className="input max-w-[130px] text-xs py-1.5" style={{ colorScheme: 'dark' }}
          value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={3}>Next 3 days</option>
          <option value={7}>Next 7 days</option>
          <option value={14}>Next 14 days</option>
          <option value={30}>Next 30 days</option>
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-sm py-8" style={{ color: 'rgba(245,240,232,0.35)' }}>No birthdays in the next {days} days</p>
      ) : (
        <div>{data.map(c => <CelebrantRow key={c.id} c={c} onWish={c => openWhatsApp(c.phone, whatsappBirthdayMsg(salonName, c.name))} />)}</div>
      )}
    </div>
  );
}

function AnniversaryPanel({ salonName }) {
  const [days,    setDays]    = useState(7);
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.anniversaries(days).then(setData).finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="rounded-xl overflow-hidden" style={cardStyle}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', background: '#0D0D0D' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(244,63,94,0.1)' }}>
            <Heart className="w-4 h-4" style={{ color: '#f43f5e' }} />
          </div>
          <h3 className="text-sm font-medium" style={{ color: '#F5F0E8' }}>Upcoming Anniversaries</h3>
        </div>
        <select className="input max-w-[130px] text-xs py-1.5" style={{ colorScheme: 'dark' }}
          value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={3}>Next 3 days</option>
          <option value={7}>Next 7 days</option>
          <option value={14}>Next 14 days</option>
          <option value={30}>Next 30 days</option>
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-sm py-8" style={{ color: 'rgba(245,240,232,0.35)' }}>No anniversaries in the next {days} days</p>
      ) : (
        <div>{data.map(c => <CelebrantRow key={c.id} c={c} onWish={c => openWhatsApp(c.phone, whatsappAnniversaryMsg(salonName, c.name))} />)}</div>
      )}
    </div>
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
    <div className="rounded-xl overflow-hidden" style={cardStyle}>
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', background: '#0D0D0D' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(201,168,76,0.12)' }}>
          <Megaphone className="w-4 h-4" style={{ color: '#C9A84C' }} />
        </div>
        <h3 className="text-sm font-medium" style={{ color: '#F5F0E8' }}>WhatsApp Broadcast</h3>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <label className="label">Broadcast Message</label>
          <textarea className="input" rows={3}
            placeholder="e.g. 20% off on all facials this weekend! Book now 💆‍♀️"
            value={message} onChange={e => setMessage(e.target.value)} />
          <p className="text-xs mt-1" style={{ color: 'rgba(245,240,232,0.3)' }}>This message will be sent to each selected customer via WhatsApp.</p>
        </div>

        <div>
          <label className="label">Recipient Filter</label>
          <div className="flex gap-2">
            {[['all', 'All (with phone)'], ['membership', 'Members only']].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)}
                className="px-3 py-1.5 rounded-xl border text-sm font-medium transition-all"
                style={filter === val
                  ? { background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0A0A0A', borderColor: '#C9A84C' }
                  : { background: '#1A1A1A', color: 'rgba(245,240,232,0.5)', borderColor: 'rgba(201,168,76,0.15)' }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0" style={{ color: 'rgba(245,240,232,0.5)' }}>
              Select Customers ({selected.size}/{filtered.length})
            </label>
            <button onClick={toggleAll} className="text-xs font-medium" style={{ color: '#C9A84C' }}>
              {selected.size === filtered.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="rounded-xl max-h-52 overflow-y-auto"
            style={{ border: '1px solid rgba(201,168,76,0.12)', background: '#0D0D0D' }}>
            {filtered.length === 0 ? (
              <p className="text-center text-sm py-6" style={{ color: 'rgba(245,240,232,0.35)' }}>No customers with phone numbers</p>
            ) : (
              filtered.map(c => (
                <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid rgba(201,168,76,0.05)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <input type="checkbox" checked={selected.has(c.id)} style={{ accentColor: '#C9A84C' }}
                    onChange={() => { const s = new Set(selected); s.has(c.id) ? s.delete(c.id) : s.add(c.id); setSelected(s); }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>{c.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>{c.phone}</p>
                  </div>
                  {c.membership_tier && c.membership_tier !== 'none' && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                      style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}>{c.membership_tier}</span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>

        {sentCount > 0 && (
          <p className="text-sm font-medium" style={{ color: '#22c55e' }}>✓ Sent to {sentCount} customer{sentCount > 1 ? 's' : ''}</p>
        )}

        <button onClick={sendBroadcast} disabled={sending || selected.size === 0 || !message.trim()}
          className="btn-primary flex items-center gap-2 w-full justify-center">
          {sending ? (
            <><div className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0A0A0A' }} /> Sending ({sentCount}/{selected.size})…</>
          ) : (
            <><Send className="w-4 h-4" /> Send to {selected.size} customer{selected.size !== 1 ? 's' : ''}</>
          )}
        </button>
        <p className="text-xs text-center" style={{ color: 'rgba(245,240,232,0.3)' }}>Each message opens in WhatsApp. You confirm and send from your phone.</p>
      </div>
    </div>
  );
}

export default function Engagement() {
  const [settings, setSettings] = useState({});
  const [tab, setTab] = useState('birthdays');

  useEffect(() => { api.settings().then(setSettings); }, []);
  const salonName = settings.salon_name || 'Sukh&Sen Salon';

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ background: '#161616', border: '1px solid rgba(201,168,76,0.12)' }}>
        {[['birthdays','Birthdays', Gift], ['anniversaries','Anniversaries', Heart], ['broadcast','Broadcast', Megaphone]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === key
              ? { background: 'rgba(201,168,76,0.15)', color: '#E8C96D', border: '1px solid rgba(201,168,76,0.25)' }
              : { color: 'rgba(245,240,232,0.4)', border: '1px solid transparent' }}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'birthdays'     && <BirthdayPanel salonName={salonName} />}
      {tab === 'anniversaries' && <AnniversaryPanel salonName={salonName} />}
      {tab === 'broadcast'     && <BroadcastPanel salonName={salonName} />}
    </div>
  );
}
