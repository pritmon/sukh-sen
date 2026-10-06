const { createClient } = require('@libsql/client');

const client = createClient({
  url:       process.env.TURSO_DATABASE_URL || 'file:./data/salon.db',
  authToken: process.env.TURSO_AUTH_TOKEN   || undefined,
});

// ─── Query helpers ────────────────────────────────────────────────────────────
// prepare(sql) works like SQLite's prepare — chain .get(), .all(), or .run()
// so all route files can do: await prepare('SELECT ...').get(id)

function prepare(sql) {
  return {
    // Returns the first row as an object, or null if no rows
    async get(...args) {
      const r = await client.execute({ sql, args: args.flat() });
      if (!r.rows.length) return null;
      const obj = {};
      r.columns.forEach((c, i) => { obj[c] = r.rows[0][i]; });
      return obj;
    },
    // Returns all rows as an array of objects
    async all(...args) {
      const r = await client.execute({ sql, args: args.flat() });
      return r.rows.map(row => {
        const obj = {};
        r.columns.forEach((c, i) => { obj[c] = row[i]; });
        return obj;
      });
    },
    // Runs INSERT / UPDATE / DELETE — returns { lastInsertRowid, changes }
    async run(...args) {
      const r = await client.execute({ sql, args: args.flat() });
      return { lastInsertRowid: Number(r.lastInsertRowid), changes: r.rowsAffected };
    },
  };
}

// Safe migration helper — silently skips if the column already exists
async function addCol(table, col, type) {
  try { await client.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`); } catch (_) {}
}

// ─── Schema ───────────────────────────────────────────────────────────────────

async function initSchema() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS access_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      ip          TEXT,
      user_agent  TEXT,
      device_info TEXT,
      path        TEXT,
      method      TEXT,
      referer     TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS staff (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      phone      TEXT,
      role       TEXT DEFAULT 'Stylist',
      active     INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS services (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      price      REAL NOT NULL,
      duration   INTEGER DEFAULT 30,
      category   TEXT DEFAULT 'General',
      active     INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      phone      TEXT UNIQUE,
      email      TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS appointments (
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
    )`,
    `CREATE TABLE IF NOT EXISTS appointment_services (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL,
      service_id     INTEGER NOT NULL,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id)     REFERENCES services(id)
    )`,
    `CREATE TABLE IF NOT EXISTS bills (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER UNIQUE NOT NULL,
      subtotal       REAL NOT NULL,
      total          REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      paid           INTEGER DEFAULT 0,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    )`,
    `CREATE TABLE IF NOT EXISTS bill_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id      INTEGER NOT NULL,
      service_id   INTEGER,
      service_name TEXT NOT NULL,
      price        REAL NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS inventory (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      quantity   REAL DEFAULT 0,
      threshold  REAL DEFAULT 5,
      unit       TEXT DEFAULT 'pcs',
      category   TEXT DEFAULT 'General',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS deleted_seeds (
      phone TEXT PRIMARY KEY
    )`,
    `CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      points      INTEGER NOT NULL,
      type        TEXT NOT NULL,
      note        TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )`,
  ];

  for (const sql of tables) {
    await client.execute(sql);
  }

  // migrations
  await addCol('customers', 'birthday',        'TEXT');
  await addCol('customers', 'anniversary',     'TEXT');
  await addCol('customers', 'membership_tier', "TEXT DEFAULT 'none'");
  await addCol('customers', 'loyalty_points',  'INTEGER DEFAULT 0');
  await addCol('customers', 'gender',          'TEXT');
  await addCol('staff', 'dob',                 'TEXT');
  await addCol('staff', 'address',             'TEXT');
  await addCol('staff', 'emergency_name',      'TEXT');
  await addCol('staff', 'emergency_phone',     'TEXT');
  await addCol('staff', 'emergency_relation',  'TEXT');
  await addCol('staff', 'years_experience',    'INTEGER DEFAULT 0');
  await addCol('staff', 'skills',              'TEXT');
  await addCol('staff', 'education',           'TEXT');
  await addCol('staff', 'previous_work',       'TEXT');
  await addCol('staff', 'family_details',      'TEXT');
  await addCol('staff', 'pan_number',          'TEXT');
  await addCol('staff', 'aadhar_number',       'TEXT');
  await addCol('staff', 'driving_license',     'TEXT');
  await addCol('staff', 'voter_id',            'TEXT');
  await addCol('staff', 'photo',               'TEXT');
  await addCol('bills', 'gst_applied',         'INTEGER DEFAULT 0');
  await addCol('bills', 'gst_rate',            'REAL DEFAULT 0');
  await addCol('bills', 'gst_amount',          'REAL DEFAULT 0');
  await addCol('bills', 'discount',            'REAL DEFAULT 0');
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const svcRow = await prepare('SELECT COUNT(*) as n FROM services').get();
  if (!svcRow || Number(svcRow.n) === 0) {
    const services = [
      ["Men's Cut - Top Stylist",      350, 30, "Men's Styling"],
      ["Men's Cut - Senior Stylist",   275, 30, "Men's Styling"],
      ["Men's Cut - Stylist",          149, 30, "Men's Styling"],
      ["Kids Cut (Below 10 yrs)",      120, 20, "Men's Styling"],
      ['Zero Trim',                     50, 15, "Men's Styling"],
      ['Regular Shave',                 80, 20, "Men's Styling"],
      ['French Beard',                 100, 20, "Men's Styling"],
      ['Beard Design',                 120, 25, "Men's Styling"],
      ['Head Shave',                   200, 20, "Men's Styling"],
      ["Women's Cut - Top Stylist",    650, 45, "Women's Styling"],
      ["Women's Cut - Senior Stylist", 500, 45, "Women's Styling"],
      ["Women's Cut - Stylist",        400, 45, "Women's Styling"],
      ["Girls Cut (Below 10 yrs)",     200, 20, "Women's Styling"],
      ['Fringe Cut',                   150, 15, "Women's Styling"],
      ['Moustache Colour',             150, 20, 'Hair Colour'],
      ['Beard Colour',                 300, 30, 'Hair Colour'],
      ["Men's All Over Colour",        800, 60, 'Hair Colour'],
      ["Men's Cap Highlight",          900, 60, 'Hair Colour'],
      ['Tint Regrowth',               1200, 60, 'Hair Colour'],
      ["Women's All Over Colour",     1600, 90, 'Hair Colour'],
      ['Half Head Highlight',         2000, 90, 'Hair Colour'],
      ['Full Head Highlight',         3500,120, 'Hair Colour'],
      ['Per Streak',                   300, 30, 'Hair Colour'],
      ['Wash & Blast Dry',             100, 20, 'Hair Treatments'],
      ['Straight Blow Dry (Shoulder)', 300, 40, 'Hair Treatments'],
      ['Straight Blow Dry (Below Shoulder)', 350, 50, 'Hair Treatments'],
      ['In Curl / Out Curl',           400, 45, 'Hair Treatments'],
      ['Ironing',                      500, 45, 'Hair Treatments'],
      ['Tonging',                      700, 45, 'Hair Treatments'],
      ['Scrunching',                   300, 30, 'Hair Treatments'],
      ['Creamping',                    700, 45, 'Hair Treatments'],
      ["Protein Treatment (Men's)",   1000, 60, 'Hair Treatments'],
      ["Protein Treatment (Women's)", 1500, 75, 'Hair Treatments'],
      ["Dandruff Treatment (Men's)",   800, 45, 'Hair Treatments'],
      ["Dandruff Treatment (Women's)",1500, 60, 'Hair Treatments'],
      ["Hair Spa Normal - Men's Short",  400, 45, 'Hair Spa'],
      ["Hair Spa Normal - Men's Medium", 550, 60, 'Hair Spa'],
      ["Hair Spa Normal - Women's Short",700, 60, 'Hair Spa'],
      ["Hair Spa Normal - Women's Medium",900,75, 'Hair Spa'],
      ["Hair Spa Normal - Women's Long",1200, 90, 'Hair Spa'],
      ["Hair Spa Premium - Men's Short",  600, 60, 'Hair Spa'],
      ["Hair Spa Premium - Men's Medium", 700, 75, 'Hair Spa'],
      ["Hair Spa Premium - Women's Short",900, 75, 'Hair Spa'],
      ["Hair Spa Premium - Women's Medium",1200,90,'Hair Spa'],
      ["Hair Spa Premium - Women's Long", 1600,105,'Hair Spa'],
      ['Straightening - Fringe',        1000, 60, 'Straightening & Keratin'],
      ['Straightening - Crown Area',    2000, 90, 'Straightening & Keratin'],
      ['Straightening - Upto Neck',     3000,120, 'Straightening & Keratin'],
      ['Straightening - Shoulder',      4000,150, 'Straightening & Keratin'],
      ['Straightening - Below Shoulder',5500,180, 'Straightening & Keratin'],
      ['Straightening - Upto Waist',    7000,210, 'Straightening & Keratin'],
      ['Keratin - Fringe',              1500, 60, 'Straightening & Keratin'],
      ['Keratin - Crown Area',          2500, 90, 'Straightening & Keratin'],
      ['Keratin - Upto Neck',           3500,120, 'Straightening & Keratin'],
      ['Keratin - Shoulder',            4000,150, 'Straightening & Keratin'],
      ['Keratin - Below Shoulder',      6000,180, 'Straightening & Keratin'],
      ['Keratin - Upto Waist',          8000,210, 'Straightening & Keratin'],
      ["Olive Massager (Men's)",         250, 30, 'Head Massage'],
      ["Olive Massager (Women's)",       450, 30, 'Head Massage'],
      ["Almond Exotica (Men's)",         250, 30, 'Head Massage'],
      ["Almond Exotica (Women's)",       450, 30, 'Head Massage'],
      ['Smartbond Hair Rebuilding',     1500, 60, 'Head Massage'],
      ['Threading - Eyebrows',           25, 10, 'Threading'],
      ['Threading - Upper Lips',         20, 10, 'Threading'],
      ['Threading - Chin',               25, 10, 'Threading'],
      ['Threading - Forehead',           25, 10, 'Threading'],
      ['Threading - Sides',              30, 10, 'Threading'],
      ['Threading - Neck',               30, 10, 'Threading'],
      ['Express Manicure',              250, 30, 'Hand & Foot Care'],
      ['Regular Manicure',              350, 45, 'Hand & Foot Care'],
      ['Paraffin Manicure',             500, 60, 'Hand & Foot Care'],
      ['Deluxe Manicure',               550, 60, 'Hand & Foot Care'],
      ['Luxury Manicure',               900, 75, 'Hand & Foot Care'],
      ['Cuts & File (Hand)',             80,  15, 'Hand & Foot Care'],
      ['File & Polish (Hand)',           150, 20, 'Hand & Foot Care'],
      ['Express Pedicure',              350, 30, 'Hand & Foot Care'],
      ['Regular Pedicure',              450, 45, 'Hand & Foot Care'],
      ['Paraffin Pedicure',             700, 60, 'Hand & Foot Care'],
      ['Deluxe Pedicure',               800, 60, 'Hand & Foot Care'],
      ['Luxury Pedicure',              1100, 75, 'Hand & Foot Care'],
      ['Cuts & File (Foot)',             80,  15, 'Hand & Foot Care'],
      ['File & Polish (Foot)',           150, 20, 'Hand & Foot Care'],
      ['Organic Mani Pedi',             500, 60, 'Hand & Foot Care'],
      ['Choco Mint Mani Pedi',         1400, 90, 'Hand & Foot Care'],
      ['Cookies & Cupcake Mani Pedi',  1800, 90, 'Hand & Foot Care'],
      ['Candle Mani Pedi',             2200, 90, 'Hand & Foot Care'],
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
      ['Clean & Clear Facial',          800, 60, 'Facials'],
      ['Acne Treatment Facial',        1000, 60, 'Facials'],
      ['Skin Brightening Facial',      1800, 75, 'Facials'],
      ['Dark Spot Treatment',          1900, 75, 'Facials'],
      ['Forever Younger Facial',       2200, 90, 'Facials'],
      ['Perfect Radiance Facial',      2500, 90, 'Facials'],
      ['Under Eye Treatment',           800, 45, 'Facials'],
      ['Sensi Balance Facial',         1500, 60, 'Facials'],
      ['Mini Facial (Jeannot)',        1400, 60, 'Facials'],
      ['Hydra Boost Advanced Facial',  2400, 75, 'Facials'],
      ['Infinite Youth Facial',        2500, 90, 'Facials'],
      ['Brilliance White Facial',      2700, 90, 'Facials'],
      ['Instant Glow Facial',          2800, 90, 'Facials'],
      ['Algae Mask',                    800, 30, 'Facials'],
      ['Face D-Tan Normal',             500, 30, 'Facials'],
      ['Face D-Tan Premium',            800, 45, 'Facials'],
      ['Organic Clean Up Skin',        1000, 60, 'Facials'],
      ['Pure Pore Moisturizing Facial',1440, 60, 'Facials'],
      ['Gold Moroccan Vitamin C Facial',2700,75, 'Facials'],
      ['Chocolate Mint Facial',        1800, 60, 'Facials'],
      ['CC Derma Insta Glow Facial',   3480, 90, 'Facials'],
      ['Eye Make-up',                  1300, 60, 'Bridal & Makeup'],
      ['Mini Make-up',                 1500, 60, 'Bridal & Makeup'],
      ['Simple Make-up',               2500, 90, 'Bridal & Makeup'],
      ['Party Make-up',                5500,120, 'Bridal & Makeup'],
      ['Bridal Advanced Make-up',      8000,180, 'Bridal & Makeup'],
      ['Make-up Groom',                1500, 90, 'Bridal & Makeup'],
      ['Make-up with Hair Straightening',2000,120,'Bridal & Makeup'],
    ];
    await client.batch(
      services.map(r => ({ sql: 'INSERT INTO services (name, price, duration, category) VALUES (?,?,?,?)', args: r })),
      'write'
    );
  }

  const staffRow = await prepare('SELECT COUNT(*) as n FROM staff').get();
  if (!staffRow || Number(staffRow.n) === 0) {
    await prepare("INSERT INTO staff (name, phone, role) VALUES (?, ?, ?)").run('Dev Das', '8116708080', 'Owner');
  }

  const demoStaff = [
    { name: 'Priya Mandal',   role: 'Senior Stylist',            phone: '9831001122', dob: '1995-06-14', years_experience: 6,  skills: 'Hair cutting, colouring, hair spa' },
    { name: 'Suchitra Das',   role: 'Stylist',                   phone: '9732001133', dob: '1999-03-22', years_experience: 3,  skills: 'Blow dry, straightening, threading' },
    { name: 'Rekha Ghosh',    role: 'Threading & Waxing Expert', phone: '9051002244', dob: '1992-11-05', years_experience: 9,  skills: 'Threading, waxing, facials' },
    { name: 'Sourav Naskar',  role: "Men's Hair Specialist",     phone: '8420003355', dob: '1997-08-30', years_experience: 5,  skills: "Men's cuts, beard styling, head massage" },
    { name: 'Mita Roy',       role: 'Beautician',                phone: '7001004466', dob: '1993-01-18', years_experience: 8,  skills: 'Bridal makeup, facials, manicure/pedicure' },
  ];
  const existingStaff = await prepare('SELECT name FROM staff').all();
  const existingNames = new Set(existingStaff.map(r => r.name));
  for (const s of demoStaff) {
    if (!existingNames.has(s.name)) {
      await prepare('INSERT OR IGNORE INTO staff (name, role, phone, dob, years_experience, skills) VALUES (?,?,?,?,?,?)')
        .run(s.name, s.role, s.phone, s.dob, s.years_experience, s.skills);
    }
  }

  // Returns a birthday/anniversary in "2000-MM-DD" format, offset by daysOffset from today.
  // Year 2000 is used so birthday/anniversary reminders fire relative to today's calendar date.
  function mmdd(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return `2000-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  const demoCustomers = [
    { name: 'Rima Biswas Test',    phone: '9831111001', gender: 'female', birthday: mmdd(0),  anniversary: mmdd(5), membership_tier: 'gold',   loyalty_points: 320 },
    { name: 'Suparna Naskar Test', phone: '9732777007', gender: 'female', birthday: mmdd(3),  anniversary: mmdd(0), membership_tier: 'silver', loyalty_points: 190 },
    { name: 'Mita Sen Test',       phone: '9051888008', gender: 'female', birthday: mmdd(14), anniversary: mmdd(2), membership_tier: 'none',   loyalty_points: 75  },
    { name: 'Priti Ghosh Test',    phone: '8420999009', gender: 'female', birthday: mmdd(20), anniversary: mmdd(4), membership_tier: 'gold',   loyalty_points: 560 },
    { name: 'Subhash Halder Test', phone: '9831000011', gender: 'male',   birthday: mmdd(10), anniversary: null,    membership_tier: 'none',   loyalty_points: 30  },
  ];

  const deletedRows   = await prepare('SELECT phone FROM deleted_seeds').all();
  const deletedPhones = new Set(deletedRows.map(r => r.phone));

  for (const c of demoCustomers) {
    if (deletedPhones.has(c.phone)) continue;
    await prepare(
      'INSERT OR IGNORE INTO customers (name, phone, gender, birthday, anniversary, membership_tier, loyalty_points) VALUES (?,?,?,?,?,?,?)'
    ).run(c.name, c.phone, c.gender, c.birthday, c.anniversary, c.membership_tier, c.loyalty_points);
    // Only update birthday/anniversary if not yet set — prevents overwriting on every restart
    await prepare('UPDATE customers SET birthday=?, anniversary=? WHERE phone=? AND birthday IS NULL')
      .run(c.birthday, c.anniversary, c.phone);
  }

  const apptRow = await prepare('SELECT COUNT(*) as n FROM appointments').get();
  if (!apptRow || Number(apptRow.n) === 0) {
    const d = new Date();
    const dateOf = n => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0]; };
    const today = dateOf(0), yday1 = dateOf(-1), yday2 = dateOf(-2), yday3 = dateOf(-3);

    const staffId = async name => (await prepare('SELECT id FROM staff WHERE name=?').get(name))?.id ?? 1;
    const sOwner   = 1;
    const sPriya   = await staffId('Priya Mandal');
    const sSuchitra = await staffId('Suchitra Das');
    const sRekha   = await staffId('Rekha Ghosh');
    const sSourav  = await staffId('Sourav Naskar');
    const sMita    = await staffId('Mita Roy');

    const custId = async phone => (await prepare('SELECT id FROM customers WHERE phone=?').get(phone))?.id;
    const cRima    = await custId('9831111001');
    const cSuparna = await custId('9732777007');
    const cMitaS   = await custId('9051888008');
    const cPriti   = await custId('8420999009');
    const cSubhash = await custId('9831000011');

    const svcByName = async prefix => (await prepare("SELECT id FROM services WHERE name LIKE ? LIMIT 1").get(`${prefix}%`))?.id ?? 1;
    const svcWomCut    = await svcByName("Women's Cut");
    const svcMenCut    = await svcByName("Men's Cut");
    const svcBlowDry   = await svcByName('Straight Blow');
    const svcThreading = await svcByName('Threading');
    const svcFacial    = await svcByName('Clean & Clear');
    const svcColour    = await svcByName("Women's All Over Colour");
    const svcBeard     = await svcByName('Beard Design');
    const svcManicure  = await svcByName('Regular Manicure');
    const svcHeadMassage = await svcByName('Olive Massager');

    const addAppt = async (cid, sid, date, time, status, svcId) => {
      if (!cid) return;
      const r = await prepare('INSERT INTO appointments (customer_id, staff_id, date, time, status) VALUES (?,?,?,?,?)').run(cid, sid, date, time, status);
      await prepare('INSERT INTO appointment_services (appointment_id, service_id) VALUES (?,?)').run(r.lastInsertRowid, svcId);
    };

    // Today
    await addAppt(cRima,    sOwner,   today, '09:30', 'done',    svcWomCut);
    await addAppt(cSuparna, sRekha,   today, '11:00', 'done',    svcThreading);
    await addAppt(cSubhash, sSourav,  today, '11:30', 'pending', svcBeard);
    await addAppt(cPriti,   sMita,    today, '15:30', 'pending', svcManicure);
    await addAppt(cMitaS,   sPriya,   today, '16:00', 'pending', svcFacial);
    // Yesterday
    await addAppt(cRima,    sPriya,   yday1, '10:00', 'done',    svcBlowDry);
    await addAppt(cSuparna, sSuchitra,yday1, '12:00', 'done',    svcColour);
    await addAppt(cSubhash, sOwner,   yday1, '14:00', 'done',    svcHeadMassage);
    // 2 days ago
    await addAppt(cPriti,   sOwner,   yday2, '14:30', 'done',    svcWomCut);
    await addAppt(cMitaS,   sSuchitra,yday2, '10:00', 'done',    svcBlowDry);

    await client.batch([
      { sql: 'INSERT INTO inventory (name, quantity, threshold, unit, category) VALUES (?,?,?,?,?)', args: ['Shampoo (500ml)',       8, 3, 'bottles', 'Hair Care'] },
      { sql: 'INSERT INTO inventory (name, quantity, threshold, unit, category) VALUES (?,?,?,?,?)', args: ['Hair Colour - Black',   5, 2, 'tubes',   'Hair Colour'] },
      { sql: 'INSERT INTO inventory (name, quantity, threshold, unit, category) VALUES (?,?,?,?,?)', args: ['Hair Colour - Brown',   2, 2, 'tubes',   'Hair Colour'] },
      { sql: 'INSERT INTO inventory (name, quantity, threshold, unit, category) VALUES (?,?,?,?,?)', args: ['Facial Cream',          4, 2, 'jars',    'Skin Care'] },
      { sql: 'INSERT INTO inventory (name, quantity, threshold, unit, category) VALUES (?,?,?,?,?)', args: ['Razor Blades',         20, 5, 'pcs',     'Shaving'] },
      { sql: 'INSERT INTO inventory (name, quantity, threshold, unit, category) VALUES (?,?,?,?,?)', args: ['Keratin Solution',      3, 2, 'bottles', 'Hair Treatments'] },
      { sql: 'INSERT INTO inventory (name, quantity, threshold, unit, category) VALUES (?,?,?,?,?)', args: ['Wax Strips',           50,10, 'pcs',     'Waxing'] },
    ], 'write');
  }

  const settingsRow = await prepare('SELECT COUNT(*) as n FROM settings').get();
  if (!settingsRow || Number(settingsRow.n) === 0) {
    await client.batch([
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ['salon_name',      'Sukh&Sen Unisex Salon'] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ['salon_address',   'Kakdwip, West Bengal'] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ['salon_instagram', 'sukhandsenunisexsalon'] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ['salon_facebook',  'sukhandsen'] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ['salon_phone',     ''] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ['salon_whatsapp',  ''] },
    ], 'write');
  }
}

// ─── Exported init ────────────────────────────────────────────────────────────

async function init() {
  await initSchema();
  await seed();
  console.log('DB ready (Turso)');
}

module.exports = { prepare, init, client };
