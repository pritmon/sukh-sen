import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtDate, fmtRupee, statusClass, statusLabel } from '../utils.js';
import { Search, User, Phone, ChevronRight, ArrowLeft } from 'lucide-react';

function CustomerProfile({ id, onBack }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.customer(id).then(setData).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>;
  if (!data)   return <div className="text-red-500 text-sm">Not found</div>;

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to list
      </button>

      {/* Header card */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg">
          {data.name[0]}
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-lg">{data.name}</h2>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Phone className="w-3 h-3" /> {data.phone || 'No phone'}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-bold text-brand-600">{fmtRupee(data.totalSpent)}</p>
          <p className="text-xs text-gray-400">{data.visitCount} visit{data.visitCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Visit history */}
      <div className="card">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-sm text-gray-900">Visit History</h3>
        </div>
        {data.appointments.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No visits yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.appointments.map(a => (
              <div key={a.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fmtDate(a.date)} at {a.time}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.services || 'No services'}</p>
                    {a.staff_name && <p className="text-xs text-gray-400">by {a.staff_name}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-gray-700">{fmtRupee(a.bill_total || a.total_price)}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <span className={statusClass(a.status)}>{statusLabel(a.status)}</span>
                      {a.bill_paid === 1 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
                          {a.payment_method === 'upi' ? 'UPI' : 'Cash'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
    try {
      setCustomers(await api.customers(query));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  if (selected) {
    return <CustomerProfile id={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search by name or phone…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-10">Loading…</p>
        ) : customers.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No customers found</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {customers.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 text-left"
              >
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm flex-shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {c.phone || 'No phone'}
                  </p>
                </div>
                <p className="text-xs text-gray-400">{fmtDate(c.created_at?.split('T')[0])}</p>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
