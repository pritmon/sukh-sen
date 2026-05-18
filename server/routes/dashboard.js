const express = require('express');
const db      = require('../db');
const router  = express.Router();

// GET /api/dashboard/today
router.get('/today', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const appointmentCount = db.prepare(
      'SELECT COUNT(*) as n FROM appointments WHERE date = ?'
    ).get(today).n;

    const revenue = db.prepare(`
      SELECT COALESCE(SUM(b.total), 0) as total
      FROM bills b
      JOIN appointments a ON a.id = b.appointment_id
      WHERE a.date = ? AND b.paid = 1
    `).get(today).total;

    const newCustomers = db.prepare(
      "SELECT COUNT(*) as n FROM customers WHERE date(created_at) = ?"
    ).get(today).n;

    const avgBill = db.prepare(`
      SELECT COALESCE(AVG(b.total), 0) as avg
      FROM bills b
      JOIN appointments a ON a.id = b.appointment_id
      WHERE a.date = ? AND b.paid = 1
    `).get(today).avg;

    const appointments = db.prepare(`
      SELECT
        a.id, a.time, a.status, a.is_walkin,
        c.name  AS customer_name,
        c.phone AS customer_phone,
        st.name AS staff_name,
        GROUP_CONCAT(sv.name, ', ') AS services,
        COALESCE(SUM(sv.price), 0)  AS total_price,
        b.id    AS bill_id,
        b.paid  AS bill_paid
      FROM appointments a
      JOIN customers c ON c.id = a.customer_id
      LEFT JOIN staff st ON st.id = a.staff_id
      LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
      LEFT JOIN services sv ON sv.id = aps.service_id
      LEFT JOIN bills b ON b.appointment_id = a.id
      WHERE a.date = ?
      GROUP BY a.id
      ORDER BY a.time ASC
    `).all(today);

    res.json({ appointmentCount, revenue, newCustomers, avgBill, appointments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
