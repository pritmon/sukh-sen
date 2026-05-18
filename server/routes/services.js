const express = require('express');
const db      = require('../db');
const router  = express.Router();

// GET /api/services
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM services WHERE active=1 ORDER BY category, name').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services
router.post('/', (req, res) => {
  try {
    const { name, price, duration, category } = req.body;
    if (!name || price == null) return res.status(400).json({ error: 'name and price required' });
    const r = db.prepare(
      'INSERT INTO services (name, price, duration, category) VALUES (?,?,?,?)'
    ).run(name, price, duration || 30, category || 'General');
    res.status(201).json(db.prepare('SELECT * FROM services WHERE id=?').get(r.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/services/:id
router.put('/:id', (req, res) => {
  try {
    const { name, price, duration, category } = req.body;
    db.prepare('UPDATE services SET name=?, price=?, duration=?, category=? WHERE id=?')
      .run(name, price, duration, category, req.params.id);
    res.json(db.prepare('SELECT * FROM services WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/services/:id  (soft delete)
router.delete('/:id', (req, res) => {
  try {
    db.prepare('UPDATE services SET active=0 WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
