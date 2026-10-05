const express = require('express');
const { prepare } = require('../db');
const router  = express.Router();

const visitCountSql = '(SELECT COUNT(*) FROM appointments WHERE customer_id = customers.id) as visit_count';

// GET /api/customers?q=search
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let rows;
    if (q) {
      rows = await prepare(
        `SELECT *, ${visitCountSql} FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC`
      ).all(`%${q}%`, `%${q}%`);
    } else {
      rows = await prepare(`SELECT *, ${visitCountSql} FROM customers ORDER BY created_at DESC`).all();
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/lookup?phone=
router.get('/lookup', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'phone required' });
    const c = await prepare('SELECT * FROM customers WHERE phone = ?').get(phone.trim());
    if (!c) return res.status(404).json({ error: 'Not found' });
    const visitCount = (await prepare('SELECT COUNT(*) as n FROM appointments WHERE customer_id = ?').get(c.id))?.n || 0;
    res.json({ ...c, visitCount: Number(visitCount) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/birthdays?days=7
router.get('/birthdays', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const all = await prepare("SELECT * FROM customers WHERE birthday IS NOT NULL AND birthday != ''").all();
    const today = new Date();
    const upcoming = [];
    for (const c of all) {
      const [, mm, dd] = c.birthday.split('-');
      for (let i = 0; i <= days; i++) {
        const check = new Date(today);
        check.setDate(check.getDate() + i);
        if (check.getMonth() + 1 === Number(mm) && check.getDate() === Number(dd)) {
          upcoming.push({ ...c, daysUntil: i });
          break;
        }
      }
    }
    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    res.json(upcoming);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/anniversaries?days=7
router.get('/anniversaries', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const all = await prepare("SELECT * FROM customers WHERE anniversary IS NOT NULL AND anniversary != ''").all();
    const today = new Date();
    const upcoming = [];
    for (const c of all) {
      const [, mm, dd] = c.anniversary.split('-');
      for (let i = 0; i <= days; i++) {
        const check = new Date(today);
        check.setDate(check.getDate() + i);
        if (check.getMonth() + 1 === Number(mm) && check.getDate() === Number(dd)) {
          upcoming.push({ ...c, daysUntil: i });
          break;
        }
      }
    }
    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    res.json(upcoming);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const customer = await prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Not found' });

    const appointments = await prepare(`
      SELECT
        a.id, a.date, a.time, a.status, a.is_walkin,
        st.name AS staff_name,
        GROUP_CONCAT(sv.name, ', ') AS services,
        COALESCE(SUM(sv.price), 0) AS total_price,
        b.total AS bill_total,
        b.paid AS bill_paid,
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

    const visitCount  = appointments.length;
    const totalSpent  = (await prepare('SELECT COALESCE(SUM(b.total), 0) as total FROM bills b JOIN appointments a ON a.id = b.appointment_id WHERE a.customer_id = ? AND b.paid = 1').get(req.params.id))?.total || 0;
    const loyaltyLog  = await prepare('SELECT * FROM loyalty_transactions WHERE customer_id = ? ORDER BY created_at DESC LIMIT 20').all(req.params.id);

    res.json({ ...customer, appointments, visitCount: Number(visitCount), totalSpent: Number(totalSpent), loyaltyLog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers — create new customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, birthday, anniversary, membership_tier, gender } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const result = await prepare(
      `INSERT INTO customers (name, phone, email, birthday, anniversary, membership_tier, gender) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(name.trim(), phone || null, email || null, birthday || null, anniversary || null, membership_tier || 'none', gender || null);
    res.json(await prepare('SELECT * FROM customers WHERE id=?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, birthday, anniversary, membership_tier, gender } = req.body;
    await prepare(`UPDATE customers SET name=?, phone=?, email=?, birthday=?, anniversary=?, membership_tier=?, gender=? WHERE id=?`)
      .run(name, phone, email, birthday || null, anniversary || null, membership_tier || 'none', gender || null, req.params.id);
    res.json(await prepare('SELECT * FROM customers WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const { reason, notes } = req.body || {};
    const customer = await prepare('SELECT id, name, phone FROM customers WHERE id=?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Not found' });

    const apptIds = (await prepare('SELECT id FROM appointments WHERE customer_id=?').all(req.params.id)).map(r => r.id);
    for (const aid of apptIds) {
      await prepare('DELETE FROM appointment_services WHERE appointment_id=?').run(aid);
      await prepare('DELETE FROM bills WHERE appointment_id=?').run(aid);
    }
    await prepare('DELETE FROM appointments WHERE customer_id=?').run(req.params.id);
    await prepare('DELETE FROM loyalty_transactions WHERE customer_id=?').run(req.params.id);
    await prepare('DELETE FROM customers WHERE id=?').run(req.params.id);

    if (customer.phone) {
      await prepare('INSERT OR IGNORE INTO deleted_seeds (phone) VALUES (?)').run(customer.phone);
    }

    res.json({ deleted: true, name: customer.name, reason: reason || null, notes: notes || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/loyalty
router.post('/:id/loyalty', async (req, res) => {
  try {
    const { points, type, note } = req.body;
    const delta = type === 'redeem' ? -Math.abs(points) : Math.abs(points);
    await prepare('UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id=?').run(delta, req.params.id);
    await prepare('INSERT INTO loyalty_transactions (customer_id, points, type, note) VALUES (?,?,?,?)').run(req.params.id, delta, type, note || null);
    res.json(await prepare('SELECT loyalty_points FROM customers WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
