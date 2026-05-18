const express = require('express');
const db      = require('../db');
const router  = express.Router();

const apptQuery = `
  SELECT
    a.id, a.date, a.time, a.status, a.notes, a.is_walkin, a.created_at,
    c.id    AS customer_id,
    c.name  AS customer_name,
    c.phone AS customer_phone,
    st.id   AS staff_id,
    st.name AS staff_name,
    GROUP_CONCAT(sv.id || ':' || sv.name || ':' || sv.price, '|') AS svc_raw,
    COALESCE(SUM(sv.price), 0) AS total_price,
    b.id    AS bill_id,
    b.paid  AS bill_paid
  FROM appointments a
  JOIN customers c ON c.id = a.customer_id
  LEFT JOIN staff st ON st.id = a.staff_id
  LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
  LEFT JOIN services sv ON sv.id = aps.service_id
  LEFT JOIN bills b ON b.appointment_id = a.id
`;

function parseServices(raw) {
  if (!raw) return [];
  return raw.split('|').map(s => {
    const [id, name, price] = s.split(':');
    return { id: Number(id), name, price: Number(price) };
  });
}

// GET /api/appointments?date=YYYY-MM-DD
router.get('/', (req, res) => {
  try {
    const { date } = req.query;
    let rows;
    if (date) {
      rows = db.prepare(apptQuery + ' WHERE a.date = ? GROUP BY a.id ORDER BY a.time ASC').all(date);
    } else {
      rows = db.prepare(apptQuery + ' GROUP BY a.id ORDER BY a.date DESC, a.time ASC').all();
    }
    res.json(rows.map(r => ({ ...r, services: parseServices(r.svc_raw), svc_raw: undefined })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/appointments/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(apptQuery + ' WHERE a.id = ? GROUP BY a.id').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ ...row, services: parseServices(row.svc_raw), svc_raw: undefined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/appointments
router.post('/', (req, res) => {
  try {
    const { customerName, customerPhone, serviceIds, staffId, date, time, notes, isWalkin } = req.body;
    if (!customerName || !date || !time) {
      return res.status(400).json({ error: 'customerName, date, and time are required' });
    }

    // Upsert customer
    let customer = customerPhone
      ? db.prepare('SELECT * FROM customers WHERE phone = ?').get(customerPhone)
      : null;
    if (!customer) {
      const ins = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)');
      const result = ins.run(customerName, customerPhone || null);
      customer = { id: result.lastInsertRowid };
    }

    const insAppt = db.prepare(
      'INSERT INTO appointments (customer_id, staff_id, date, time, notes, is_walkin) VALUES (?,?,?,?,?,?)'
    );
    const appt = insAppt.run(customer.id, staffId || null, date, time, notes || null, isWalkin ? 1 : 0);
    const apptId = appt.lastInsertRowid;

    if (Array.isArray(serviceIds)) {
      const insAS = db.prepare('INSERT INTO appointment_services (appointment_id, service_id) VALUES (?,?)');
      for (const sid of serviceIds) insAS.run(apptId, sid);
    }

    const row = db.prepare(apptQuery + ' WHERE a.id = ? GROUP BY a.id').get(apptId);
    res.status(201).json({ ...row, services: parseServices(row.svc_raw), svc_raw: undefined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'done', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
    const row = db.prepare(apptQuery + ' WHERE a.id = ? GROUP BY a.id').get(req.params.id);
    res.json({ ...row, services: parseServices(row.svc_raw), svc_raw: undefined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM appointment_services WHERE appointment_id = ?').run(req.params.id);
    db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
