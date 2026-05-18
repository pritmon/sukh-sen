const express = require('express');
const db      = require('../db');
const router  = express.Router();

// GET /api/inventory
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT *, (quantity <= threshold) as low_stock FROM inventory ORDER BY category, name'
    ).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory
router.post('/', (req, res) => {
  try {
    const { name, quantity, threshold, unit, category } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = db.prepare(
      'INSERT INTO inventory (name, quantity, threshold, unit, category) VALUES (?,?,?,?,?)'
    ).run(name, quantity ?? 0, threshold ?? 5, unit || 'pcs', category || 'General');
    res.status(201).json(db.prepare('SELECT *, (quantity<=threshold) as low_stock FROM inventory WHERE id=?').get(r.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/inventory/:id
router.put('/:id', (req, res) => {
  try {
    const { name, quantity, threshold, unit, category } = req.body;
    db.prepare('UPDATE inventory SET name=?, quantity=?, threshold=?, unit=?, category=? WHERE id=?')
      .run(name, quantity, threshold, unit, category, req.params.id);
    res.json(db.prepare('SELECT *, (quantity<=threshold) as low_stock FROM inventory WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/inventory/:id/quantity
router.patch('/:id/quantity', (req, res) => {
  try {
    const { quantity } = req.body;
    db.prepare('UPDATE inventory SET quantity=? WHERE id=?').run(quantity, req.params.id);
    res.json(db.prepare('SELECT *, (quantity<=threshold) as low_stock FROM inventory WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM inventory WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
