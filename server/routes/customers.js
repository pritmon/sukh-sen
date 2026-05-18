const express = require('express');
const db      = require('../db');
const router  = express.Router();

// GET /api/customers?q=search
router.get('/', (req, res) => {
  try {
    const { q } = req.query;
    let rows;
    if (q) {
      const like = `%${q}%`;
      rows = db.prepare(
        'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC'
      ).all(like, like);
    } else {
      rows = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id  (with visit history)
router.get('/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Not found' });

    const appointments = db.prepare(`
      SELECT
        a.id, a.date, a.time, a.status, a.is_walkin,
        st.name AS staff_name,
        GROUP_CONCAT(sv.name, ', ') AS services,
        COALESCE(SUM(sv.price), 0)  AS total_price,
        b.total   AS bill_total,
        b.paid    AS bill_paid,
        b.payment_method
      FROM appointments a
      LEFT JOIN staff st ON st.id = a.staff_id
      LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
      LEFT JOIN services sv ON sv.id = aps.service_id
      LEFT JOIN bills b ON b.appointment_id = a.id
      WHERE a.customer_id = ?
      GROUP BY a.id
      ORDER BY a.date DESC, a.time DESC
    `).all(req.params.id);

    const totalSpent = db.prepare(`
      SELECT COALESCE(SUM(b.total), 0) as total
      FROM bills b
      JOIN appointments a ON a.id = b.appointment_id
      WHERE a.customer_id = ? AND b.paid = 1
    `).get(req.params.id).total;

    res.json({ ...customer, appointments, totalSpent, visitCount: appointments.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', (req, res) => {
  try {
    const { name, phone, email } = req.body;
    db.prepare('UPDATE customers SET name=?, phone=?, email=? WHERE id=?')
      .run(name, phone, email, req.params.id);
    res.json(db.prepare('SELECT * FROM customers WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
