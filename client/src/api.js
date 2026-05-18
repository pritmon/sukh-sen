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
  customers:     (q)    => req(`/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  customer:      (id)   => req(`/customers/${id}`),
  updateCustomer:(id,d) => put(`/customers/${id}`, d),

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
  createStaff:   (d)    => post('/staff', d),
  updateStaff:   (id,d) => put(`/staff/${id}`, d),
  deleteStaff:   (id)   => del(`/staff/${id}`),

  // Inventory
  inventory:        ()       => req('/inventory'),
  createInventory:  (d)      => post('/inventory', d),
  updateInventory:  (id,d)   => put(`/inventory/${id}`, d),
  updateQty:        (id,qty) => patch(`/inventory/${id}/quantity`, { quantity: qty }),
  deleteInventory:  (id)     => del(`/inventory/${id}`),
};
