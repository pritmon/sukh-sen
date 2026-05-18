const express = require('express');
const db      = require('../db');
const router  = express.Router();

function getBillWithItems(billId) {
  const bill = db.prepare(`
    SELECT b.*, a.date, a.time, c.name AS customer_name, c.phone AS customer_phone, st.name AS staff_name
    FROM bills b
    JOIN appointments a ON a.id = b.appointment_id
    JOIN customers c ON c.id = a.customer_id
    LEFT JOIN staff st ON st.id = a.staff_id
    WHERE b.id = ?
  `).get(billId);
  if (!bill) return null;
  bill.items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(billId);
  return bill;
}

// GET /api/bills
router.get('/', (req, res) => {
  try {
    const bills = db.prepare(`
      SELECT b.*, a.date, a.time, c.name AS customer_name, st.name AS staff_name
      FROM bills b
      JOIN appointments a ON a.id = b.appointment_id
      JOIN customers c ON c.id = a.customer_id
      LEFT JOIN staff st ON st.id = a.staff_id
      ORDER BY b.created_at DESC
    `).all();
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bills/summary?date=YYYY-MM-DD
router.get('/summary', (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const summary = db.prepare(`
      SELECT
        COUNT(*) as billCount,
        COALESCE(SUM(CASE WHEN paid=1 THEN total ELSE 0 END), 0) AS paidRevenue,
        COALESCE(SUM(CASE WHEN paid=0 THEN total ELSE 0 END), 0) AS unpaidRevenue,
        COALESCE(SUM(total), 0) AS totalRevenue,
        SUM(CASE WHEN payment_method='cash' AND paid=1 THEN total ELSE 0 END) AS cashRevenue,
        SUM(CASE WHEN payment_method='upi'  AND paid=1 THEN total ELSE 0 END) AS upiRevenue
      FROM bills b
      JOIN appointments a ON a.id = b.appointment_id
      WHERE a.date = ?
    `).get(date);
    res.json({ date, ...summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bills/unbilled  — done appointments without a bill
router.get('/unbilled', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        a.id, a.date, a.time,
        c.name AS customer_name,
        st.name AS staff_name,
        GROUP_CONCAT(sv.id || ':' || sv.name || ':' || sv.price, '|') AS svc_raw,
        COALESCE(SUM(sv.price), 0) AS total_price
      FROM appointments a
      JOIN customers c ON c.id = a.customer_id
      LEFT JOIN staff st ON st.id = a.staff_id
      LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
      LEFT JOIN services sv ON sv.id = aps.service_id
      LEFT JOIN bills b ON b.appointment_id = a.id
      WHERE a.status = 'done' AND b.id IS NULL
      GROUP BY a.id
      ORDER BY a.date DESC, a.time DESC
    `).all();

    const result = rows.map(r => ({
      ...r,
      services: r.svc_raw
        ? r.svc_raw.split('|').map(s => {
            const [id, name, price] = s.split(':');
            return { id: Number(id), name, price: Number(price) };
          })
        : [],
      svc_raw: undefined,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bills/:id
router.get('/:id', (req, res) => {
  try {
    const bill = getBillWithItems(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Not found' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bills
// body: { appointmentId, items: [{serviceId?, serviceName, price}], paymentMethod }
router.post('/', (req, res) => {
  try {
    const { appointmentId, items, paymentMethod } = req.body;
    if (!appointmentId || !items?.length) {
      return res.status(400).json({ error: 'appointmentId and items required' });
    }

    const subtotal = items.reduce((s, i) => s + Number(i.price), 0);
    const total    = subtotal;

    const billRes = db.prepare(
      'INSERT INTO bills (appointment_id, subtotal, total, payment_method, paid) VALUES (?,?,?,?,0)'
    ).run(appointmentId, subtotal, total, paymentMethod || 'cash');
    const billId = billRes.lastInsertRowid;

    const insItem = db.prepare(
      'INSERT INTO bill_items (bill_id, service_id, service_name, price) VALUES (?,?,?,?)'
    );
    for (const item of items) {
      insItem.run(billId, item.serviceId || null, item.serviceName, item.price);
    }

    res.status(201).json(getBillWithItems(billId));
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Bill already exists for this appointment' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bills/:id/pay
router.patch('/:id/pay', (req, res) => {
  try {
    const { paymentMethod } = req.body;
    db.prepare('UPDATE bills SET paid=1, payment_method=? WHERE id=?')
      .run(paymentMethod || 'cash', req.params.id);
    res.json(getBillWithItems(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
