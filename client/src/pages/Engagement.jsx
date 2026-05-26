import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { openWhatsApp, whatsappBirthdayMsg, whatsappAnniversaryMsg, whatsappBroadcastMsg } from '../utils.js';
import { MessageCircle, Gift, Heart, Megaphone, Send, Users, Calendar } from 'lucide-react';

function DaysUntilBadge({ days }) {
  if (days === 0) return <span className="badge-done">Today! 🎉</span>;
  if (days === 1) return <span className="badge-pending">Tomorrow</span>;
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">In {days} days</span>;
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
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
            <Gift className="w-4 h-4 text-pink-500" />
          </div>
          <h3 className="section-title">Upcoming Birthdays</h3>
        </div>
        <select className="input max-w-[130px] text-xs py-1.5"
          value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={3}>Next 3 days</option>
          <option value={7}>Next 7 days</option>
          <option value={14}>Next 14 days</option>
          <option value={30}>Next 30 days</option>
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : data.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">No birthdays in the next {days} days</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {data.map(c => (
            <div key={c.id} className="px-6 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm flex-shrink-0">
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-400">{c.phone || 'No phone'}</p>
              </div>
              <DaysUntilBadge days={c.daysUntil} />
              {c.phone && (
                <button
                  onClick={() => openWhatsApp(c.phone, whatsappBirthdayMsg(salonName, c.name))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl text-xs font-semibold transition-all active:scale-[0.97]">
                  <MessageCircle className="w-3.5 h-3.5" /> Wish
                </button>
              )}
            </div>
          ))}
        </div>
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
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="section-title">Upcoming Anniversaries</h3>
        </div>
        <select className="input max-w-[130px] text-xs py-1.5"
          value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={3}>Next 3 days</option>
          <option value={7}>Next 7 days</option>
          <option value={14}>Next 14 days</option>
          <option value={30}>Next 30 days</option>
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : data.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">No anniversaries in the next {days} days</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {data.map(c => (
            <div key={c.id} className="px-6 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-sm flex-shrink-0">
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-400">{c.phone || 'No phone'}</p>
              </div>
              <DaysUntilBadge days={c.daysUntil} />
              {c.phone && (
                <button
                  onClick={() => openWhatsApp(c.phone, whatsappAnniversaryMsg(salonName, c.name))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl text-xs font-semibold transition-all active:scale-[0.97]">
                  <MessageCircle className="w-3.5 h-3.5" /> Wish
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BroadcastPanel({ salonName }) {
  const [customers, setCustomers] = useState([]);
  const [selected,  setSelected]  = useState(new Set());
  const [message,   setMessage]   = useState('');
  const [filter,    setFilter]    = useState('all'); // all | has_phone | membership
  const [sending,   setSending]   = useState(false);
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    api.customers().then(setCustomers);
  }, []);

  const filtered = customers.filter(c => {
    if (filter === 'has_phone') return !!c.phone;
    if (filter === 'membership') return c.membership_tier && c.membership_tier !== 'none';
    return !!c.phone;
  });

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(c => c.id)));
    }
  }

  async function sendBroadcast() {
    if (!message.trim() || selected.size === 0) return;
    setSending(true);
    setSentCount(0);
    const targets = filtered.filter(c => selected.has(c.id) && c.phone);
    for (const c of targets) {
      openWhatsApp(c.phone, whatsappBroadcastMsg(salonName, message));
      await new Promise(r => setTimeout(r, 800));
      setSentCount(n => n + 1);
    }
    setSending(false);
  }

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-brand-600" />
        </div>
        <h3 className="section-title">WhatsApp Broadcast</h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Message */}
        <div>
          <label className="label">Broadcast Message</label>
          <textarea className="input" rows={3}
            placeholder="e.g. 20% off on all facials this weekend! Book now 💆‍♀️"
            value={message} onChange={e => setMessage(e.target.value)} />
          <p className="text-xs text-gray-400 mt-1">This message will be sent to each selected customer via WhatsApp.</p>
        </div>

        {/* Filter */}
        <div>
          <label className="label">Recipient Filter</label>
          <div className="flex gap-2">
            {[['all', 'All (with phone)'], ['membership', 'Members only']].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                  filter === val ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Customer list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Select Customers ({selected.size}/{filtered.length})</label>
            <button onClick={toggleAll} className="text-xs text-brand-600 hover:underline font-medium">
              {selected.size === filtered.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="border border-gray-200 rounded-xl max-h-52 overflow-y-auto bg-gray-50/50">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No customers with phone numbers</p>
            ) : (
              filtered.map(c => (
                <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white border-b border-gray-100 last:border-0 transition-colors">
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => {
                    const s = new Set(selected);
                    s.has(c.id) ? s.delete(c.id) : s.add(c.id);
                    setSelected(s);
                  }} className="rounded border-gray-300 text-brand-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.phone}</p>
                  </div>
                  {c.membership_tier && c.membership_tier !== 'none' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 capitalize">{c.membership_tier}</span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>

        {sentCount > 0 && <p className="text-sm text-green-600 font-medium">✓ Sent to {sentCount} customer{sentCount > 1 ? 's' : ''}</p>}

        <button
          onClick={sendBroadcast}
          disabled={sending || selected.size === 0 || !message.trim()}
          className="btn-primary flex items-center gap-2 w-full justify-center">
          {sending ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending ({sentCount}/{selected.size})…</>
          ) : (
            <><Send className="w-4 h-4" /> Send to {selected.size} customer{selected.size !== 1 ? 's' : ''}</>
          )}
        </button>
        <p className="text-xs text-gray-400 text-center">Each message opens in WhatsApp. You confirm and send from your phone.</p>
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
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[['birthdays','Birthdays', Gift], ['anniversaries','Anniversaries', Heart], ['broadcast','Broadcast', Megaphone]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
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
