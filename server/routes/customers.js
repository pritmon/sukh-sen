const express = require('express');
const db      = require('../db');
const router  = express.Router();

// GET /api/customers?q=search
router.get('/', (req, res) => {
  try {
    const { q } = req.query;
    let rows;
    const visitCountSql = '(SELECT COUNT(*) FROM appointments WHERE customer_id = customers.id) as visit_count';
    if (q) {
      const like = `%${q}%`;
      rows = db.prepare(
        `SELECT *, ${visitCountSql} FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC`
      ).all(like, like);
    } else {
      rows = db.prepare(`SELECT *, ${visitCountSql} FROM customers ORDER BY created_at DESC`).all();
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/lookup?phone=  — auto-fill on appointment booking
router.get('/lookup', (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.json(null);
    const c = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone.trim());
    if (!c) return res.json(null);
    const visitCount = db.prepare('SELECT COUNT(*) as n FROM appointments WHERE customer_id = ?').get(c.id).n;
    res.json({ ...c, visitCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/birthdays?days=7  — upcoming birthdays
router.get('/birthdays', (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const all = db.prepare("SELECT * FROM customers WHERE birthday IS NOT NULL AND birthday != ''").all();
    const today = new Date();
    const results = [];
    for (const c of all) {
      const [, mm, dd] = c.birthday.split('-');
      const thisYear = new Date(today.getFullYear(), Number(mm) - 1, Number(dd));
      let diff = Math.ceil((thisYear - today) / 86400000);
      if (diff < 0) diff += 365;
      if (diff <= days) results.push({ ...c, daysUntil: diff });
    }
    results.sort((a, b) => a.daysUntil - b.daysUntil);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/anniversaries?days=7  — upcoming anniversaries
router.get('/anniversaries', (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const all = db.prepare("SELECT * FROM customers WHERE anniversary IS NOT NULL AND anniversary != ''").all();
    const today = new Date();
    const results = [];
    for (const c of all) {
      const [, mm, dd] = c.anniversary.split('-');
      const thisYear = new Date(today.getFullYear(), Number(mm) - 1, Number(dd));
      let diff = Math.ceil((thisYear - today) / 86400000);
      if (diff < 0) diff += 365;
      if (diff <= days) results.push({ ...c, daysUntil: diff });
    }
    results.sort((a, b) => a.daysUntil - b.daysUntil);
    res.json(results);
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

    const loyaltyHistory = db.prepare(
      'SELECT * FROM loyalty_transactions WHERE customer_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(req.params.id);

    res.json({ ...customer, appointments, totalSpent, visitCount: appointments.length, loyaltyHistory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', (req, res) => {
  try {
    const { name, phone, email, birthday, anniversary, membership_tier, gender } = req.body;
    db.prepare(`UPDATE customers SET name=?, phone=?, email=?, birthday=?, anniversary=?, membership_tier=?, gender=? WHERE id=?`)
      .run(name, phone, email, birthday || null, anniversary || null, membership_tier || 'none', gender || null, req.params.id);
    res.json(db.prepare('SELECT * FROM customers WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/customers/:id  — remove customer + all their data
router.delete('/:id', (req, res) => {
  try {
    const { reason, notes } = req.body || {};
    const customer = db.prepare('SELECT id, name, phone FROM customers WHERE id=?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Not found' });

    // cascade delete in dependency order
    const apptIds = db.prepare('SELECT id FROM appointments WHERE customer_id=?').all(req.params.id).map(r => r.id);
    for (const aid of apptIds) {
      db.prepare('DELETE FROM appointment_services WHERE appointment_id=?').run(aid);
      db.prepare('DELETE FROM bills WHERE appointment_id=?').run(aid);
    }
    db.prepare('DELETE FROM appointments WHERE customer_id=?').run(req.params.id);
    db.prepare('DELETE FROM loyalty_transactions WHERE customer_id=?').run(req.params.id);
    db.prepare('DELETE FROM customers WHERE id=?').run(req.params.id);

    // Remember this phone so the seed never re-inserts this customer
    if (customer.phone) db.prepare('INSERT OR IGNORE INTO deleted_seeds (phone) VALUES (?)').run(customer.phone);

    res.json({ deleted: true, name: customer.name, reason: reason || null, notes: notes || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/loyalty  — add/deduct points
router.post('/:id/loyalty', (req, res) => {
  try {
    const { points, type, note } = req.body; // type: 'earn' | 'redeem' | 'bonus'
    const delta = type === 'redeem' ? -Math.abs(points) : Math.abs(points);
    db.prepare('UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id=?').run(delta, req.params.id);
    db.prepare('INSERT INTO loyalty_transactions (customer_id, points, type, note) VALUES (?,?,?,?)').run(req.params.id, delta, type, note || null);
    res.json(db.prepare('SELECT loyalty_points FROM customers WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
