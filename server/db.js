const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs   = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'salon.db');
const dataDir = path.dirname(DB_PATH);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS staff (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    phone      TEXT,
    role       TEXT DEFAULT 'Stylist',
    active     INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    price      REAL NOT NULL,
    duration   INTEGER DEFAULT 30,
    category   TEXT DEFAULT 'General',
    active     INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    phone      TEXT UNIQUE,
    email      TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    staff_id    INTEGER,
    date        TEXT NOT NULL,
    time        TEXT NOT NULL,
    status      TEXT DEFAULT 'pending',
    notes       TEXT,
    is_walkin   INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (staff_id)    REFERENCES staff(id)
  );

  CREATE TABLE IF NOT EXISTS appointment_services (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    service_id     INTEGER NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id)     REFERENCES services(id)
  );

  CREATE TABLE IF NOT EXISTS bills (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER UNIQUE NOT NULL,
    subtotal       REAL NOT NULL,
    total          REAL NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    paid           INTEGER DEFAULT 0,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
  );

  CREATE TABLE IF NOT EXISTS bill_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id      INTEGER NOT NULL,
    service_id   INTEGER,
    service_name TEXT NOT NULL,
    price        REAL NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    quantity   REAL DEFAULT 0,
    threshold  REAL DEFAULT 5,
    unit       TEXT DEFAULT 'pcs',
    category   TEXT DEFAULT 'General',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Seed ─────────────────────────────────────────────────────────────────
function seed() {
  const svcCount = db.prepare('SELECT COUNT(*) as n FROM services').get().n;
  if (svcCount === 0) {
    const ins = db.prepare('INSERT INTO services (name, price, duration, category) VALUES (?,?,?,?)');
    [
      ['Haircut',         100, 30, 'Hair'],
      ['Haircut + Shave', 150, 45, 'Hair'],
      ['Hair Colour',     500, 90, 'Hair'],
      ['Facial',          300, 60, 'Skin'],
      ['Threading',        30, 15, 'Skin'],
      ['Shave',            60, 20, 'Hair'],
      ['Head Massage',    200, 30, 'Wellness'],
    ].forEach(r => ins.run(...r));
  }

  const staffCount = db.prepare('SELECT COUNT(*) as n FROM staff').get().n;
  if (staffCount === 0) {
    db.prepare("INSERT INTO staff (name, role) VALUES (?, ?)").run('Owner', 'Owner');
  }

  const apptCount = db.prepare('SELECT COUNT(*) as n FROM appointments').get().n;
  if (apptCount === 0) {
    const today = new Date().toISOString().split('T')[0];

    db.prepare("INSERT INTO customers (name, phone) VALUES (?, ?)").run('Rahul Das',     '9876543210');
    db.prepare("INSERT INTO customers (name, phone) VALUES (?, ?)").run('Suresh Mondal', '9123456789');
    db.prepare("INSERT INTO customers (name, phone) VALUES (?, ?)").run('Amit Kumar',    '8765432109');

    const insA  = db.prepare('INSERT INTO appointments (customer_id, staff_id, date, time, status) VALUES (?,?,?,?,?)');
    const insAS = db.prepare('INSERT INTO appointment_services (appointment_id, service_id) VALUES (?,?)');

    const a1 = insA.run(1, 1, today, '10:00', 'done');
    insAS.run(Number(a1.lastInsertRowid), 1);

    const a2 = insA.run(2, 1, today, '11:30', 'pending');
    insAS.run(Number(a2.lastInsertRowid), 2);

    const a3 = insA.run(3, 1, today, '14:00', 'pending');
    insAS.run(Number(a3.lastInsertRowid), 4);

    const insInv = db.prepare('INSERT INTO inventory (name, quantity, threshold, unit, category) VALUES (?,?,?,?,?)');
    [
      ['Shampoo (500ml)',     8, 3, 'bottles', 'Hair Care'],
      ['Hair Colour - Black', 5, 2, 'tubes',   'Hair Colour'],
      ['Hair Colour - Brown', 2, 2, 'tubes',   'Hair Colour'],
      ['Facial Cream',        4, 2, 'jars',    'Skin Care'],
      ['Razor Blades',       20, 5, 'pcs',     'Shaving'],
    ].forEach(r => insInv.run(...r));
  }
}

seed();

module.exports = db;
