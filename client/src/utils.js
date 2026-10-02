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

// Open WhatsApp chat with a pre-filled message
// phone: customer's number (10-digit Indian), message: string
export function openWhatsApp(phone, message) {
  if (!phone) {
    alert('No phone number for this customer.');
    return;
  }
  const num = phone.replace(/\D/g, '');
  const e164 = num.startsWith('91') ? num : `91${num}`;
  const url  = `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

export function whatsappConfirmMsg(salonName, customerName, date, time, services) {
  return `Hello ${customerName},\n\nYour appointment at *${salonName}* is confirmed!\n\n📅 Date: ${fmtDate(date)}\n⏰ Time: ${time}\n✂️ Services: ${services || 'TBD'}\n\nSee you soon! 🙏`;
}

export function whatsappBillMsg(salonName, customerName, items, total, method) {
  const list = items.map(i => `  • ${i.service_name}: ₹${i.price}`).join('\n');
  return `Hello ${customerName},\n\nThank you for visiting *${salonName}*! 🙏\n\nHere is your bill:\n${list}\n\n💰 *Total: ₹${total}*\n💳 Payment: ${method === 'upi' ? 'UPI' : 'Cash'}\n\nHave a great day! 😊`;
}

export function whatsappBirthdayMsg(salonName, customerName) {
  return `⚜️ *✨ H A P P Y  B I R T H D A Y ✨* ⚜️\n\nToday, we celebrate the incredible journey of *${customerName}*. 🥂🌟\n\nMay the year ahead stretch out before you like a beautiful path, filled with:\n ✨ Divine blessings & good health\n ✨ Moments that take your breath away\n ✨ Infinite laughter & unshakeable peace\n\nSending you our warmest energy and highest vibes for a truly magnificent celebration today! 🌟🎂\n\n~ *Warmly, ${salonName}* 🤍`;
}

export function whatsappAnniversaryMsg(salonName, customerName) {
  return `💍 Happy Anniversary ${customerName}! 🥂\n\nWishing you both a beautiful celebration! 🌹\n\nTo make your special day even more memorable, *${salonName}* has a special offer waiting for you. Come in and let us pamper you! ✨`;
}

export function whatsappBroadcastMsg(salonName, customMessage) {
  return `Hello from *${salonName}*! 🌸\n\n${customMessage}\n\nFor appointments, call or message us anytime. We look forward to seeing you! 💕`;
}
