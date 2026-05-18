require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

// Init DB (runs migrations + seed)
require('./db');

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : ['http://localhost:5173', 'http://localhost:3000'],
}));
app.use(express.json());

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/customers',    require('./routes/customers'));
app.use('/api/services',     require('./routes/services'));
app.use('/api/bills',        require('./routes/billing'));
app.use('/api/staff',        require('./routes/staff'));
app.use('/api/inventory',    require('./routes/inventory'));
app.use('/api/settings',     require('./routes/settings'));

// ─── Serve React build in production ────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../client/dist');
  app.use(express.static(dist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Sukh Sen Salon server running on port ${PORT}`);
});
