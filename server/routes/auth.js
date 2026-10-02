const express = require('express');
const jwt     = require('jsonwebtoken');
const router  = express.Router();

const SECRET   = process.env.JWT_SECRET    || 'sukhandsen-fallback-secret-2025';
const USERNAME = process.env.AUTH_USERNAME || 'owner';
const PASSWORD = process.env.AUTH_PASSWORD || 'salon2025';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USERNAME && password === PASSWORD) {
    const token = jwt.sign({ username }, SECRET, { expiresIn: '30d' });
    res.json({ token, username });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(auth.slice(7), SECRET);
    res.json({ username: payload.username });
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
});

module.exports = router;
