const express = require('express');
const db      = require('../db');
const router  = express.Router();

// GET /api/staff
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM staff WHERE active=1 ORDER BY name').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/staff
router.post('/', (req, res) => {
  try {
    const { name, phone, role } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = db.prepare('INSERT INTO staff (name, phone, role) VALUES (?,?,?)').run(name, phone || null, role || 'Stylist');
    res.status(201).json(db.prepare('SELECT * FROM staff WHERE id=?').get(r.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/staff/:id
router.put('/:id', (req, res) => {
  try {
    const { name, phone, role } = req.body;
    db.prepare('UPDATE staff SET name=?, phone=?, role=? WHERE id=?').run(name, phone, role, req.params.id);
    res.json(db.prepare('SELECT * FROM staff WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/staff/:id  (soft delete)
router.delete('/:id', (req, res) => {
  try {
    db.prepare('UPDATE staff SET active=0 WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
