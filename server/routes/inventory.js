const express = require('express');
const { prepare } = require('../db');
const router  = express.Router();

router.get('/', async (req, res) => {
  try {
    res.json(await prepare('SELECT *, (quantity <= threshold) as low_stock FROM inventory ORDER BY category, name').all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, quantity, threshold, unit, category } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = await prepare('INSERT INTO inventory (name, quantity, threshold, unit, category) VALUES (?,?,?,?,?)').run(name, quantity ?? 0, threshold ?? 5, unit || 'pcs', category || 'General');
    res.status(201).json(await prepare('SELECT *, (quantity<=threshold) as low_stock FROM inventory WHERE id=?').get(r.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, quantity, threshold, unit, category } = req.body;
    await prepare('UPDATE inventory SET name=?, quantity=?, threshold=?, unit=?, category=? WHERE id=?').run(name, quantity, threshold, unit, category, req.params.id);
    res.json(await prepare('SELECT *, (quantity<=threshold) as low_stock FROM inventory WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/quantity', async (req, res) => {
  try {
    const { quantity } = req.body;
    await prepare('UPDATE inventory SET quantity=? WHERE id=?').run(quantity, req.params.id);
    res.json(await prepare('SELECT *, (quantity<=threshold) as low_stock FROM inventory WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prepare('DELETE FROM inventory WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
