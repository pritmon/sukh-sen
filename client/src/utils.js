// Format YYYY-MM-DD → DD/MM/YYYY
export function fmtDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

// Format ₹ amounts
export function fmtRupee(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

// Today as YYYY-MM-DD
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function statusClass(s) {
  if (s === 'done')      return 'badge-done';
  if (s === 'cancelled') return 'badge-cancelled';
  return 'badge-pending';
}

export function statusLabel(s) {
  if (s === 'done')      return 'Done';
  if (s === 'cancelled') return 'Cancelled';
  return 'Pending';
}
