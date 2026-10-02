require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const jwt     = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sukhandsen-fallback-secret-2025';

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
app.post('/devlog/pm2025/clear', (req, res) => {
  try {
    db.prepare('DELETE FROM access_logs').run();
    res.redirect('/devlog/pm2025');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

app.get('/devlog/pm2025', (req, res) => {
  try {
    const logs = db.prepare(
      'SELECT * FROM access_logs ORDER BY created_at DESC LIMIT 1000'
    ).all();

    const parseUA = ua => {
      if (!ua) return { device: '❓ Unknown', os: '—', browser: '—' };

      // Device
      let device = '💻 Desktop';
      if (/iPhone/.test(ua))                        device = '📱 iPhone';
      else if (/iPad/.test(ua))                     device = '📟 iPad';
      else if (/Android.*Mobile/.test(ua))          device = '📱 Android Phone';
      else if (/Android/.test(ua))                  device = '📟 Android Tablet';

      // OS
      let os = '—';
      const iosV   = ua.match(/iPhone OS ([\d_]+)/);
      const ipadV  = ua.match(/iPad.*OS ([\d_]+)/);
      const andV   = ua.match(/Android ([\d.]+)/);
      const macV   = ua.match(/Mac OS X ([\d_.]+)/);
      if (iosV)                                     os = 'iOS ' + iosV[1].replace(/_/g, '.');
      else if (ipadV)                               os = 'iPadOS ' + ipadV[1].replace(/_/g, '.');
      else if (andV)                                os = 'Android ' + andV[1];
      else if (/Windows NT 10\.0/.test(ua))         os = 'Windows 10/11';
      else if (/Windows NT 6\.3/.test(ua))          os = 'Windows 8.1';
      else if (/Windows NT 6\.1/.test(ua))          os = 'Windows 7';
      else if (/Windows/.test(ua))                  os = 'Windows';
      else if (macV && !/iPhone|iPad/.test(ua))     os = 'macOS ' + macV[1].replace(/_/g, '.');
      else if (/Linux/.test(ua))                    os = 'Linux';

      // Browser + version
      let browser = '—';
      const edgeV  = ua.match(/Edg\/([\d.]+)/);
      const oprV   = ua.match(/OPR\/([\d.]+)/);
      const chrV   = ua.match(/Chrome\/([\d.]+)/);
      const ffV    = ua.match(/Firefox\/([\d.]+)/);
      const safV   = ua.match(/Version\/([\d.]+).*Safari/);
      if (edgeV)                                    browser = 'Edge ' + edgeV[1].split('.')[0];
      else if (oprV)                                browser = 'Opera ' + oprV[1].split('.')[0];
      else if (chrV)                                browser = 'Chrome ' + chrV[1].split('.')[0];
      else if (ffV)                                 browser = 'Firefox ' + ffV[1].split('.')[0];
      else if (safV)                                browser = 'Safari ' + safV[1].split('.')[0];
      else if (/Safari/.test(ua))                   browser = 'Safari';

      return { device, os, browser };
    };

    // group by IP for summary
    const ipMap = {};
    for (const l of logs) {
      const { device, os, browser } = parseUA(l.user_agent);
      if (!ipMap[l.ip]) ipMap[l.ip] = { count: 0, first: l.created_at, last: l.created_at, device, os, browser };
      ipMap[l.ip].count++;
      if (l.created_at > ipMap[l.ip].last) {
        ipMap[l.ip].last = l.created_at;
        ipMap[l.ip].device  = device;
        ipMap[l.ip].os      = os;
        ipMap[l.ip].browser = browser;
      }
    }
    const uniqueIPs = Object.keys(ipMap).length;

    const deviceKey = d => d.includes('iPhone') ? 'iphone' : d.includes('Android Phone') ? 'android' : d.includes('iPad') || d.includes('Android Tablet') ? 'tablet' : 'desktop';

    const summaryRows = Object.entries(ipMap)
      .sort((a, b) => b[1].last.localeCompare(a[1].last))
      .map(([ip, d]) => `<tr data-device="${deviceKey(d.device)}">
        <td><code>${ip}</code></td>
        <td>${d.device}</td>
        <td>${d.os}</td>
        <td>${d.browser}</td>
        <td>${d.count}</td>
        <td>${d.first.slice(0,16)}</td>
        <td>${d.last.slice(0,16)}</td>
      </tr>`).join('');

    const detailRows = logs.map(l => {
      const { device, os, browser } = parseUA(l.user_agent);
      return `<tr data-device="${deviceKey(device)}">
        <td>${l.created_at.slice(0,16)}</td>
        <td><code>${l.ip}</code></td>
        <td>${device}</td>
        <td>${os}</td>
        <td>${browser}</td>
        <td>${l.method}</td>
        <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis">${l.path}</td>
      </tr>`;
    }).join('');

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
  .filters{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
  .filter-btn{padding:5px 14px;border-radius:20px;border:1px solid #333;background:#1a1a1a;color:#888;cursor:pointer;font-family:monospace;font-size:12px;transition:all .15s}
  .filter-btn.active{background:rgba(201,168,76,0.15);border-color:#c9a84c;color:#c9a84c}
</style>
<script>
  function filter(type) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === type));
    document.querySelectorAll('tr[data-device]').forEach(r => {
      r.style.display = (type === 'all' || r.dataset.device === type) ? '' : 'none';
    });
  }
</script>
</head><body>
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
<h2 style="margin:0">Sukh&amp;Sen — Access Log</h2>
<form method="POST" action="/devlog/pm2025/clear" onsubmit="return confirm('Clear all logs?')">
  <button type="submit" style="background:#7f1d1d;color:#fca5a5;border:1px solid #991b1b;padding:6px 16px;border-radius:6px;cursor:pointer;font-family:monospace;font-size:12px">🗑 Clear Logs</button>
</form>
</div>
<p>${logs.length} requests · ${uniqueIPs} unique IP${uniqueIPs !== 1 ? 's' : ''}</p>
<div class="filters">
  <button class="filter-btn active" data-filter="all" onclick="filter('all')">All</button>
  <button class="filter-btn" data-filter="iphone" onclick="filter('iphone')">📱 iPhone</button>
  <button class="filter-btn" data-filter="android" onclick="filter('android')">📱 Android</button>
  <button class="filter-btn" data-filter="tablet" onclick="filter('tablet')">📟 Tablet</button>
  <button class="filter-btn" data-filter="desktop" onclick="filter('desktop')">💻 Desktop</button>
</div>
<h3 style="color:#c9a84c;margin-bottom:8px">IP Summary</h3>
<table><thead><tr><th>IP Address</th><th>Device</th><th>OS</th><th>Browser</th><th>Requests</th><th>First Seen</th><th>Last Seen</th></tr></thead>
<tbody>${summaryRows}</tbody></table>
<h3 style="color:#c9a84c;margin-bottom:8px">Full Log (latest 1000)</h3>
<table><thead><tr><th>Time</th><th>IP</th><th>Device</th><th>OS</th><th>Browser</th><th>Method</th><th>Path</th></tr></thead>
<tbody>${detailRows}</tbody></table>
</body></html>`);
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// ─── JWT auth middleware (protects all /api/* except login & health) ─────────
const requireAuth = (req, res, next) => {
  if (req.path === '/api/health') return next();
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
};

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard',    requireAuth, require('./routes/dashboard'));
app.use('/api/appointments', requireAuth, require('./routes/appointments'));
app.use('/api/customers',    requireAuth, require('./routes/customers'));
app.use('/api/services',     requireAuth, require('./routes/services'));
app.use('/api/bills',        requireAuth, require('./routes/billing'));
app.use('/api/staff',        requireAuth, require('./routes/staff'));
app.use('/api/inventory',    requireAuth, require('./routes/inventory'));
app.use('/api/settings',     requireAuth, require('./routes/settings'));
app.use('/api/reports',      requireAuth, require('./routes/reports'));

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
