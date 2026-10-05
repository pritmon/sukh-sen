const BASE = '/api';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

const post = (path, body) => req(path, { method: 'POST',   body: JSON.stringify(body) });
const put  = (path, body) => req(path, { method: 'PUT',    body: JSON.stringify(body) });
const patch= (path, body) => req(path, { method: 'PATCH',  body: JSON.stringify(body) });
const del  = (path)       => req(path, { method: 'DELETE' });

export const api = {
  // Dashboard
  dashboard: () => req('/dashboard/today'),

  // Appointments
  appointments:       (date) => req(`/appointments${date ? `?date=${date}` : ''}`),
  appointment:        (id)   => req(`/appointments/${id}`),
  createAppointment:  (data) => post('/appointments', data),
  setStatus:          (id, status) => patch(`/appointments/${id}/status`, { status }),
  deleteAppointment:  (id)   => del(`/appointments/${id}`),

  // Customers
  customers:        (q)    => req(`/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  customer:         (id)   => req(`/customers/${id}`),
  customerLookup:   (phone)=> req(`/customers/lookup?phone=${encodeURIComponent(phone)}`),
  createCustomer:   (d)    => post(`/customers`, d),
  updateCustomer:   (id,d) => put(`/customers/${id}`, d),
  deleteCustomer:   (id,d) => req(`/customers/${id}`, { method: 'DELETE', body: JSON.stringify(d) }),
  addLoyaltyPoints: (id,d) => post(`/customers/${id}/loyalty`, d),
  birthdays:        (days) => req(`/customers/birthdays?days=${days||7}`),
  anniversaries:    (days) => req(`/customers/anniversaries?days=${days||7}`),

  // Services
  services:      ()     => req('/services'),
  createService: (d)    => post('/services', d),
  updateService: (id,d) => put(`/services/${id}`, d),
  deleteService: (id)   => del(`/services/${id}`),

  // Billing
  bills:         ()     => req('/bills'),
  billSummary:   (date) => req(`/bills/summary${date ? `?date=${date}` : ''}`),
  unbilled:      ()     => req('/bills/unbilled'),
  bill:          (id)   => req(`/bills/${id}`),
  createBill:    (d)    => post('/bills', d),
  payBill:       (id,d) => patch(`/bills/${id}/pay`, d),

  // Staff
  staff:         ()     => req('/staff'),
  staffMember:   (id)   => req(`/staff/${id}`),
  createStaff:   (d)    => post('/staff', d),
  updateStaff:   (id,d) => put(`/staff/${id}`, d),
  deleteStaff:   (id)   => del(`/staff/${id}`),

  // Inventory
  inventory:        ()       => req('/inventory'),
  createInventory:  (d)      => post('/inventory', d),
  updateInventory:  (id,d)   => put(`/inventory/${id}`, d),
  updateQty:        (id,qty) => patch(`/inventory/${id}/quantity`, { quantity: qty }),
  deleteInventory:  (id)     => del(`/inventory/${id}`),

  // Settings
  settings:        ()  => req('/settings'),
  saveSettings:    (d) => put('/settings', d),

  // Reports
  staffPerformance: (date) => req(`/reports/staff-performance${date ? `?date=${date}` : ''}`),
  monthlyReport:    (month)=> req(`/reports/monthly${month ? `?month=${month}` : ''}`),
};
