const express = require('express');
const { prepare } = require('../db');
const router  = express.Router();

router.get('/', async (req, res) => {
  try {
    res.json(await prepare('SELECT * FROM services WHERE active=1 ORDER BY category, name').all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, price, duration, category } = req.body;
    if (!name || price == null) return res.status(400).json({ error: 'name and price required' });
    const r = await prepare('INSERT INTO services (name, price, duration, category) VALUES (?,?,?,?)').run(name, price, duration || 30, category || 'General');
    res.status(201).json(await prepare('SELECT * FROM services WHERE id=?').get(r.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, price, duration, category } = req.body;
    await prepare('UPDATE services SET name=?, price=?, duration=?, category=? WHERE id=?').run(name, price, duration, category, req.params.id);
    res.json(await prepare('SELECT * FROM services WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prepare('UPDATE services SET active=0 WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
