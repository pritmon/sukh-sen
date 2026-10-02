const express = require('express');
const db      = require('../db');
const router  = express.Router();

const FIELDS = `id, name, phone, role, active, dob, address,
  emergency_name, emergency_phone, emergency_relation,
  years_experience, skills, education, previous_work, family_details, created_at`;

// GET /api/staff
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT ${FIELDS} FROM staff WHERE active=1 ORDER BY name`).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/staff/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT ${FIELDS} FROM staff WHERE id=?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/staff
router.post('/', (req, res) => {
  try {
    const {
      name, phone, role,
      dob, address,
      emergency_name, emergency_phone, emergency_relation,
      years_experience, skills, education, previous_work, family_details,
    } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = db.prepare(`
      INSERT INTO staff (name, phone, role, dob, address,
        emergency_name, emergency_phone, emergency_relation,
        years_experience, skills, education, previous_work, family_details)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      name, phone || null, role || 'Stylist',
      dob || null, address || null,
      emergency_name || null, emergency_phone || null, emergency_relation || null,
      years_experience || null, skills || null, education || null,
      previous_work || null, family_details || null,
    );
    res.status(201).json(db.prepare(`SELECT ${FIELDS} FROM staff WHERE id=?`).get(r.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/staff/:id  — full update including CV fields
router.put('/:id', (req, res) => {
  try {
    const {
      name, phone, role,
      dob, address,
      emergency_name, emergency_phone, emergency_relation,
      years_experience, skills, education, previous_work, family_details,
    } = req.body;
    db.prepare(`
      UPDATE staff SET
        name=?, phone=?, role=?,
        dob=?, address=?,
        emergency_name=?, emergency_phone=?, emergency_relation=?,
        years_experience=?, skills=?, education=?, previous_work=?, family_details=?
      WHERE id=?
    `).run(
      name, phone || null, role || 'Stylist',
      dob || null, address || null,
      emergency_name || null, emergency_phone || null, emergency_relation || null,
      years_experience || 0, skills || null, education || null, previous_work || null, family_details || null,
      req.params.id
    );
    res.json(db.prepare(`SELECT ${FIELDS} FROM staff WHERE id=?`).get(req.params.id));
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
