const express = require('express');
const { prepare } = require('../db');
const router  = express.Router();

const DEFAULTS = {
  salon_name:       'Sukh&Sen Unisex Salon',
  salon_phone:      '',
  salon_whatsapp:   '',
  salon_instagram:  '',
  salon_facebook:   '',
  salon_address:    'Kakdwip',
};

async function getAll() {
  const rows = await prepare('SELECT key, value FROM settings').all();
  const map  = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return { ...DEFAULTS, ...map };
}

router.get('/', async (req, res) => {
  try {
    res.json(await getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      if (key in DEFAULTS) {
        await prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value ?? '');
      }
    }
    res.json(await getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
