require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

// Init DB (runs migrations + seed)
const db = require('./db');

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : ['http://localhost:5173', 'http://localhost:3000'],
}));
app.use(express.json());

// ─── Silent access logger ────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/devlog')) return next();
  const skip = ['.js', '.css', '.ico', '.png', '.map', '.woff', '.svg'];
  if (skip.some(ext => req.path.endsWith(ext))) return next();
  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';
    db.prepare('INSERT INTO access_logs (ip, user_agent, path, method, referer) VALUES (?,?,?,?,?)')
      .run(ip, req.headers['user-agent'] || '', req.path, req.method, req.headers['referer'] || '');
  } catch (_) {}
  next();
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const distPath = path.join(__dirname, '../client/dist');
  const indexPath = path.join(distPath, 'index.html');
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    distExists: fs.existsSync(distPath),
    indexExists: fs.existsSync(indexPath),
    distPath,
  });
});

// ─── Hidden dev log page ─────────────────────────────────────────────────────
app.get('/devlog/pm2025', (req, res) => {
  try {
    const logs = db.prepare(
      'SELECT * FROM access_logs ORDER BY created_at DESC LIMIT 1000'
    ).all();

    const parseDevice = ua => {
      if (!ua) return 'Unknown';
      if (/Mobile|Android|iPhone/.test(ua)) return '📱 Mobile';
      if (/Tablet|iPad/.test(ua)) return '📟 Tablet';
      return '💻 Desktop';
    };
    const parseBrowser = ua => {
      if (!ua) return '—';
      if (/Edg\//.test(ua)) return 'Edge';
      if (/OPR\//.test(ua)) return 'Opera';
      if (/Chrome\//.test(ua)) return 'Chrome';
      if (/Firefox\//.test(ua)) return 'Firefox';
      if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari';
      return 'Other';
    };

    // group by IP for summary
    const ipMap = {};
    for (const l of logs) {
      if (!ipMap[l.ip]) ipMap[l.ip] = { count: 0, first: l.created_at, last: l.created_at };
      ipMap[l.ip].count++;
      if (l.created_at > ipMap[l.ip].last) ipMap[l.ip].last = l.created_at;
    }
    const uniqueIPs = Object.keys(ipMap).length;

    const summaryRows = Object.entries(ipMap)
      .sort((a, b) => b[1].last.localeCompare(a[1].last))
      .map(([ip, d]) => `<tr><td>${ip}</td><td>${d.count}</td><td>${d.first.slice(0,16)}</td><td>${d.last.slice(0,16)}</td></tr>`)
      .join('');

    const detailRows = logs.map(l => `
      <tr>
        <td>${l.created_at.slice(0,16)}</td>
        <td><code>${l.ip}</code></td>
        <td>${parseDevice(l.user_agent)} ${parseBrowser(l.user_agent)}</td>
        <td>${l.method}</td>
        <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis">${l.path}</td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;font-size:11px">${l.referer || '—'}</td>
      </tr>`).join('');

    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Access Log</title>
<style>
  body{font-family:monospace;background:#0d0d0d;color:#e5e5e5;padding:24px;font-size:13px}
  h2{color:#c9a84c;margin-bottom:4px}p{color:#888;margin:0 0 20px}
  table{width:100%;border-collapse:collapse;margin-bottom:32px}
  th{background:#1a1a1a;color:#c9a84c;padding:8px 10px;text-align:left;font-size:11px;letter-spacing:.05em;text-transform:uppercase}
  td{padding:7px 10px;border-bottom:1px solid #1e1e1e;vertical-align:top}
  tr:hover td{background:#161616}
  code{background:#1a1a1a;padding:2px 5px;border-radius:3px;color:#e8c96d}
  .badge{display:inline-block;padding:2px 7px;border-radius:4px;font-size:11px}
</style></head><body>
<h2>Sukh&amp;Sen — Access Log</h2>
<p>${logs.length} requests · ${uniqueIPs} unique IP${uniqueIPs !== 1 ? 's' : ''}</p>
<h3 style="color:#c9a84c;margin-bottom:8px">IP Summary</h3>
<table><thead><tr><th>IP Address</th><th>Requests</th><th>First Seen</th><th>Last Seen</th></tr></thead>
<tbody>${summaryRows}</tbody></table>
<h3 style="color:#c9a84c;margin-bottom:8px">Full Log (latest 1000)</h3>
<table><thead><tr><th>Time</th><th>IP</th><th>Device</th><th>Method</th><th>Path</th><th>Referer</th></tr></thead>
<tbody>${detailRows}</tbody></table>
</body></html>`);
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/customers',    require('./routes/customers'));
app.use('/api/services',     require('./routes/services'));
app.use('/api/bills',        require('./routes/billing'));
app.use('/api/staff',        require('./routes/staff'));
app.use('/api/inventory',    require('./routes/inventory'));
app.use('/api/settings',     require('./routes/settings'));
app.use('/api/reports',      require('./routes/reports'));

// ─── Serve React build in production ────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../client/dist');
  app.use(express.static(dist));
  app.get('*', (req, res) => {
    const indexPath = path.join(dist, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('sendFile error:', err.message, '| path:', indexPath);
        res.status(500).json({ error: 'Frontend not built', path: indexPath });
      }
    });
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Sukh Sen Salon server running on port ${PORT}`);
});
