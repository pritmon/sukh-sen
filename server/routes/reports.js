const express = require('express');
const { prepare } = require('../db');
const router  = express.Router();

router.get('/staff-performance', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const rows = await prepare(`
      SELECT
        st.id,
        st.name,
        st.role,
        COUNT(DISTINCT a.id)                                         AS appointments,
        COALESCE(SUM(CASE WHEN b.paid=1 THEN b.total ELSE 0 END),0) AS revenue,
        COALESCE(SUM(CASE WHEN b.paid=1 THEN b.total ELSE 0 END) /
          NULLIF(COUNT(DISTINCT CASE WHEN b.paid=1 THEN a.id END),0), 0) AS avg_bill,
        COUNT(DISTINCT CASE WHEN b.paid=1 THEN a.id END)            AS billed_count,
        GROUP_CONCAT(DISTINCT sv.name)                               AS services_done
      FROM staff st
      LEFT JOIN appointments a  ON a.staff_id = st.id AND a.date = ?
      LEFT JOIN bills b         ON b.appointment_id = a.id
      LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
      LEFT JOIN services sv     ON sv.id = aps.service_id
      WHERE st.active = 1
      GROUP BY st.id
      ORDER BY revenue DESC
    `).all(date);
    res.json({ date, staff: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/monthly', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const summary = await prepare(`
      SELECT
        a.date,
        COUNT(DISTINCT a.id)                                         AS appointments,
        COALESCE(SUM(CASE WHEN b.paid=1 THEN b.total ELSE 0 END),0) AS revenue
      FROM appointments a
      LEFT JOIN bills b ON b.appointment_id = a.id
      WHERE a.date LIKE ?
      GROUP BY a.date
      ORDER BY a.date ASC
    `).all(`${month}%`);
    const totalRevenue = summary.reduce((s, r) => s + Number(r.revenue), 0);
    const totalAppts   = summary.reduce((s, r) => s + Number(r.appointments), 0);
    res.json({ month, days: summary, totalRevenue, totalAppts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
