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

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`);

// ─── Seed ─────────────────────────────────────────────────────────────────
function seed() {
  const svcCount = db.prepare('SELECT COUNT(*) as n FROM services').get().n;
  if (svcCount === 0) {
    const ins = db.prepare('INSERT INTO services (name, price, duration, category) VALUES (?,?,?,?)');
    // [name, price (starting), duration mins, category]
    const services = [
      // ── Men's Styling ──────────────────────────────
      ["Men's Cut - Top Stylist",      350, 30, "Men's Styling"],
      ["Men's Cut - Senior Stylist",   275, 30, "Men's Styling"],
      ["Men's Cut - Stylist",          149, 30, "Men's Styling"],
      ["Kids Cut (Below 10 yrs)",      120, 20, "Men's Styling"],
      // ── Shave ──────────────────────────────────────
      ['Zero Trim',                     50, 15, "Men's Styling"],
      ['Regular Shave',                 80, 20, "Men's Styling"],
      ['French Beard',                 100, 20, "Men's Styling"],
      ['Beard Design',                 120, 25, "Men's Styling"],
      ['Head Shave',                   200, 20, "Men's Styling"],
      // ── Women's Styling ────────────────────────────
      ["Women's Cut - Top Stylist",    650, 45, "Women's Styling"],
      ["Women's Cut - Senior Stylist", 500, 45, "Women's Styling"],
      ["Women's Cut - Stylist",        400, 45, "Women's Styling"],
      ["Girls Cut (Below 10 yrs)",     200, 20, "Women's Styling"],
      ['Fringe Cut',                   150, 15, "Women's Styling"],
      // ── Colour Service ─────────────────────────────
      ['Moustache Colour',             150, 20, 'Hair Colour'],
      ['Beard Colour',                 300, 30, 'Hair Colour'],
      ["Men's All Over Colour",        800, 60, 'Hair Colour'],
      ["Men's Cap Highlight",          900, 60, 'Hair Colour'],
      ['Tint Regrowth',               1200, 60, 'Hair Colour'],
      ["Women's All Over Colour",     1600, 90, 'Hair Colour'],
      ['Half Head Highlight',         2000, 90, 'Hair Colour'],
      ['Full Head Highlight',         3500,120, 'Hair Colour'],
      ['Per Streak',                   300, 30, 'Hair Colour'],
      // ── Blowdry ────────────────────────────────────
      ['Wash & Blast Dry',             100, 20, 'Hair Treatments'],
      ['Straight Blow Dry (Shoulder)', 300, 40, 'Hair Treatments'],
      ['Straight Blow Dry (Below Shoulder)', 350, 50, 'Hair Treatments'],
      ['In Curl / Out Curl',           400, 45, 'Hair Treatments'],
      // ── Styling ────────────────────────────────────
      ['Ironing',                      500, 45, 'Hair Treatments'],
      ['Tonging',                      700, 45, 'Hair Treatments'],
      ['Scrunching',                   300, 30, 'Hair Treatments'],
      ['Creamping',                    700, 45, 'Hair Treatments'],
      // ── Protein & Dandruff ─────────────────────────
      ["Protein Treatment (Men's)",   1000, 60, 'Hair Treatments'],
      ["Protein Treatment (Women's)", 1500, 75, 'Hair Treatments'],
      ["Dandruff Treatment (Men's)",   800, 45, 'Hair Treatments'],
      ["Dandruff Treatment (Women's)",1500, 60, 'Hair Treatments'],
      // ── Hair Spa Normal ────────────────────────────
      ["Hair Spa Normal - Men's Short",  400, 45, 'Hair Spa'],
      ["Hair Spa Normal - Men's Medium", 550, 60, 'Hair Spa'],
      ["Hair Spa Normal - Women's Short",700, 60, 'Hair Spa'],
      ["Hair Spa Normal - Women's Medium",900,75, 'Hair Spa'],
      ["Hair Spa Normal - Women's Long",1200, 90, 'Hair Spa'],
      // ── Hair Spa Premium ───────────────────────────
      ["Hair Spa Premium - Men's Short",  600, 60, 'Hair Spa'],
      ["Hair Spa Premium - Men's Medium", 700, 75, 'Hair Spa'],
      ["Hair Spa Premium - Women's Short",900, 75, 'Hair Spa'],
      ["Hair Spa Premium - Women's Medium",1200,90,'Hair Spa'],
      ["Hair Spa Premium - Women's Long", 1600,105,'Hair Spa'],
      // ── Straightening / Rebonding ──────────────────
      ['Straightening - Fringe',        1000, 60, 'Straightening & Keratin'],
      ['Straightening - Crown Area',    2000, 90, 'Straightening & Keratin'],
      ['Straightening - Upto Neck',     3000,120, 'Straightening & Keratin'],
      ['Straightening - Shoulder',      4000,150, 'Straightening & Keratin'],
      ['Straightening - Below Shoulder',5500,180, 'Straightening & Keratin'],
      ['Straightening - Upto Waist',    7000,210, 'Straightening & Keratin'],
      // ── Keratin ────────────────────────────────────
      ['Keratin - Fringe',              1500, 60, 'Straightening & Keratin'],
      ['Keratin - Crown Area',          2500, 90, 'Straightening & Keratin'],
      ['Keratin - Upto Neck',           3500,120, 'Straightening & Keratin'],
      ['Keratin - Shoulder',            4000,150, 'Straightening & Keratin'],
      ['Keratin - Below Shoulder',      6000,180, 'Straightening & Keratin'],
      ['Keratin - Upto Waist',          8000,210, 'Straightening & Keratin'],
      // ── Head Massage ───────────────────────────────
      ["Olive Massager (Men's)",         250, 30, 'Head Massage'],
      ["Olive Massager (Women's)",       450, 30, 'Head Massage'],
      ["Almond Exotica (Men's)",         250, 30, 'Head Massage'],
      ["Almond Exotica (Women's)",       450, 30, 'Head Massage'],
      ['Smartbond Hair Rebuilding',     1500, 60, 'Head Massage'],
      // ── Threading ──────────────────────────────────
      ['Threading - Eyebrows',           25, 10, 'Threading'],
      ['Threading - Upper Lips',         20, 10, 'Threading'],
      ['Threading - Chin',               25, 10, 'Threading'],
      ['Threading - Forehead',           25, 10, 'Threading'],
      ['Threading - Sides',              30, 10, 'Threading'],
      ['Threading - Neck',               30, 10, 'Threading'],
      // ── Hand Radiance (Manicure) ───────────────────
      ['Express Manicure',              250, 30, 'Hand & Foot Care'],
      ['Regular Manicure',              350, 45, 'Hand & Foot Care'],
      ['Paraffin Manicure',             500, 60, 'Hand & Foot Care'],
      ['Deluxe Manicure',               550, 60, 'Hand & Foot Care'],
      ['Luxury Manicure',               900, 75, 'Hand & Foot Care'],
      ['Cuts & File (Hand)',             80,  15, 'Hand & Foot Care'],
      ['File & Polish (Hand)',           150, 20, 'Hand & Foot Care'],
      // ── Leg Radiance (Pedicure) ────────────────────
      ['Express Pedicure',              350, 30, 'Hand & Foot Care'],
      ['Regular Pedicure',              450, 45, 'Hand & Foot Care'],
      ['Paraffin Pedicure',             700, 60, 'Hand & Foot Care'],
      ['Deluxe Pedicure',               800, 60, 'Hand & Foot Care'],
      ['Luxury Pedicure',              1100, 75, 'Hand & Foot Care'],
      ['Cuts & File (Foot)',             80,  15, 'Hand & Foot Care'],
      ['File & Polish (Foot)',           150, 20, 'Hand & Foot Care'],
      // ── Sea Soul Mani-Pedi ─────────────────────────
      ['Organic Mani Pedi',             500, 60, 'Hand & Foot Care'],
      ['Choco Mint Mani Pedi',         1400, 90, 'Hand & Foot Care'],
      ['Cookies & Cupcake Mani Pedi',  1800, 90, 'Hand & Foot Care'],
      ['Candle Mani Pedi',             2200, 90, 'Hand & Foot Care'],
      // ── Waxing ─────────────────────────────────────
      ['Waxing - Full Arms',            170, 20, 'Waxing'],
      ['Waxing - Half Arms',            110, 15, 'Waxing'],
      ['Waxing - Full Legs',            230, 30, 'Waxing'],
      ['Waxing - Half Legs',            170, 20, 'Waxing'],
      ['Waxing - Underarms',            120, 10, 'Waxing'],
      ['Waxing - Full Face',            250, 20, 'Waxing'],
      ['Waxing - Upper Lip',             35, 10, 'Waxing'],
      ['Waxing - Chin',                  25, 10, 'Waxing'],
      ['Waxing - Forehead',              45, 10, 'Waxing'],
      ['Waxing - Full Back',            275, 30, 'Waxing'],
      ['Waxing - Full Front',           275, 30, 'Waxing'],
      ['Waxing - Bikini Line',          380, 20, 'Waxing'],
      ['Waxing - Full Body',           1050, 90, 'Waxing'],
      // ── CV Pro Facials ─────────────────────────────
      ['Clean & Clear Facial',          800, 60, 'Facials'],
      ['Acne Treatment Facial',        1000, 60, 'Facials'],
      ['Skin Brightening Facial',      1800, 75, 'Facials'],
      ['Dark Spot Treatment',          1900, 75, 'Facials'],
      ['Forever Younger Facial',       2200, 90, 'Facials'],
      ['Perfect Radiance Facial',      2500, 90, 'Facials'],
      ['Under Eye Treatment',           800, 45, 'Facials'],
      ['Sensi Balance Facial',         1500, 60, 'Facials'],
      // ── Jeannot Facials ────────────────────────────
      ['Mini Facial (Jeannot)',        1400, 60, 'Facials'],
      ['Hydra Boost Advanced Facial',  2400, 75, 'Facials'],
      ['Infinite Youth Facial',        2500, 90, 'Facials'],
      ['Brilliance White Facial',      2700, 90, 'Facials'],
      ['Instant Glow Facial',          2800, 90, 'Facials'],
      ['Algae Mask',                    800, 30, 'Facials'],
      // ── D-Tan & Sea Soul Facials ───────────────────
      ['Face D-Tan Normal',             500, 30, 'Facials'],
      ['Face D-Tan Premium',            800, 45, 'Facials'],
      ['Organic Clean Up Skin',        1000, 60, 'Facials'],
      ['Pure Pore Moisturizing Facial',1440, 60, 'Facials'],
      ['Gold Moroccan Vitamin C Facial',2700,75, 'Facials'],
      ['Chocolate Mint Facial',        1800, 60, 'Facials'],
      ['CC Derma Insta Glow Facial',   3480, 90, 'Facials'],
      // ── Bridal & Makeup ────────────────────────────
      ['Eye Make-up',                  1300, 60, 'Bridal & Makeup'],
      ['Mini Make-up',                 1500, 60, 'Bridal & Makeup'],
      ['Simple Make-up',               2500, 90, 'Bridal & Makeup'],
      ['Party Make-up',                5500,120, 'Bridal & Makeup'],
      ['Bridal Advanced Make-up',      8000,180, 'Bridal & Makeup'],
      ['Make-up Groom',                1500, 90, 'Bridal & Makeup'],
      ['Make-up with Hair Straightening',2000,120,'Bridal & Makeup'],
    ];
    services.forEach(r => ins.run(...r));
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
    insAS.run(Number(a2.lastInsertRowid), 10);

    const a3 = insA.run(3, 1, today, '14:00', 'pending');
    insAS.run(Number(a3.lastInsertRowid), 62);

    const insInv = db.prepare('INSERT INTO inventory (name, quantity, threshold, unit, category) VALUES (?,?,?,?,?)');
    [
      ['Shampoo (500ml)',       8, 3, 'bottles', 'Hair Care'],
      ['Hair Colour - Black',   5, 2, 'tubes',   'Hair Colour'],
      ['Hair Colour - Brown',   2, 2, 'tubes',   'Hair Colour'],
      ['Facial Cream',          4, 2, 'jars',    'Skin Care'],
      ['Razor Blades',         20, 5, 'pcs',     'Shaving'],
      ['Keratin Solution',      3, 2, 'bottles', 'Hair Treatments'],
      ['Wax Strips',           50,10, 'pcs',     'Waxing'],
    ].forEach(r => insInv.run(...r));
  }

  // Seed default settings
  const settingsCount = db.prepare('SELECT COUNT(*) as n FROM settings').get().n;
  if (settingsCount === 0) {
    const upsert = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
    upsert.run('salon_name',      'Sukh&Sen Unisex Salon');
    upsert.run('salon_address',   'Kakdwip, West Bengal');
    upsert.run('salon_instagram', 'sukhandsenunisexsalon');
    upsert.run('salon_facebook',  'sukhandsen');
    upsert.run('salon_phone',     '');
    upsert.run('salon_whatsapp',  '');
  }
}

seed();

module.exports = db;
