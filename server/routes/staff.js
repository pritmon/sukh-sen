const express = require('express');
const { prepare } = require('../db');
const router  = express.Router();

const FIELDS = `id, name, phone, role, active, dob, address,
  emergency_name, emergency_phone, emergency_relation,
  years_experience, skills, education, previous_work, family_details,
  pan_number, aadhar_number, driving_license, voter_id, photo, created_at`;

router.get('/', async (req, res) => {
  try {
    res.json(await prepare(`SELECT ${FIELDS} FROM staff WHERE active=1 ORDER BY name`).all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await prepare(`SELECT ${FIELDS} FROM staff WHERE id=?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name, phone, role, dob, address,
      emergency_name, emergency_phone, emergency_relation,
      years_experience, skills, education, previous_work, family_details,
      pan_number, aadhar_number, driving_license, voter_id, photo,
    } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = await prepare(`
      INSERT INTO staff (name, phone, role, dob, address,
        emergency_name, emergency_phone, emergency_relation,
        years_experience, skills, education, previous_work, family_details,
        pan_number, aadhar_number, driving_license, voter_id, photo)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      name, phone || null, role || 'Stylist',
      dob || null, address || null,
      emergency_name || null, emergency_phone || null, emergency_relation || null,
      years_experience || null, skills || null, education || null,
      previous_work || null, family_details || null,
      pan_number || null, aadhar_number || null, driving_license || null,
      voter_id || null, photo || null,
    );
    res.status(201).json(await prepare(`SELECT ${FIELDS} FROM staff WHERE id=?`).get(r.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const {
      name, phone, role, dob, address,
      emergency_name, emergency_phone, emergency_relation,
      years_experience, skills, education, previous_work, family_details,
      pan_number, aadhar_number, driving_license, voter_id, photo,
    } = req.body;
    await prepare(`
      UPDATE staff SET
        name=?, phone=?, role=?,
        dob=?, address=?,
        emergency_name=?, emergency_phone=?, emergency_relation=?,
        years_experience=?, skills=?, education=?, previous_work=?, family_details=?,
        pan_number=?, aadhar_number=?, driving_license=?, voter_id=?, photo=?
      WHERE id=?
    `).run(
      name, phone || null, role || 'Stylist',
      dob || null, address || null,
      emergency_name || null, emergency_phone || null, emergency_relation || null,
      years_experience || 0, skills || null, education || null, previous_work || null, family_details || null,
      pan_number || null, aadhar_number || null, driving_license || null, voter_id || null, photo || null,
      req.params.id
    );
    res.json(await prepare(`SELECT ${FIELDS} FROM staff WHERE id=?`).get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prepare('UPDATE staff SET active=0 WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
