const express = require('express');
const db      = require('../db');
const router  = express.Router();

const DEFAULTS = {
  salon_name:       'Sukh Sen Salon',
  salon_phone:      '',
  salon_whatsapp:   '',
  salon_instagram:  '',
  salon_address:    'Kakdwip',
};

function getAll() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map  = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return { ...DEFAULTS, ...map };
}

// GET /api/settings
router.get('/', (req, res) => {
  try {
    res.json(getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', (req, res) => {
  try {
    const upsert = db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );
    for (const [key, value] of Object.entries(req.body)) {
      if (key in DEFAULTS) upsert.run(key, value ?? '');
    }
    res.json(getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
