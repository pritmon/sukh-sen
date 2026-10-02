// One-time demo seed: Bengali staff + customers with birthdays/anniversaries
// Run: node seed-demo.js
// Safe to run multiple times (skips if already exists)

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'server/data/salon.db'));
db.exec('PRAGMA foreign_keys = ON');

// ── Staff ───────────────────────────────────────────────────────────────────
// Today in UTC
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

const existingStaff = db.prepare('SELECT name FROM staff').all().map(r => r.name);

const staffToAdd = [
  { name: 'Priya Mandal',    role: 'Senior Stylist',              phone: '9831001122', dob: '1995-06-14', years_experience: 6, skills: 'Hair cutting, colouring, hair spa' },
  { name: 'Suchitra Das',    role: 'Stylist',                     phone: '9732001133', dob: '1999-03-22', years_experience: 3, skills: 'Blow dry, straightening, threading' },
  { name: 'Rekha Ghosh',     role: 'Threading & Waxing Expert',   phone: '9051002244', dob: '1992-11-05', years_experience: 9, skills: 'Threading, waxing, facials' },
  { name: 'Sourav Naskar',   role: "Men's Hair Specialist",        phone: '8420003355', dob: '1997-08-30', years_experience: 5, skills: "Men's cuts, beard styling, head massage" },
  { name: 'Mita Roy',        role: 'Beautician',                  phone: '7001004466', dob: '1993-01-18', years_experience: 8, skills: 'Bridal makeup, facials, manicure/pedicure' },
];

const insStaff = db.prepare(
  'INSERT INTO staff (name, role, phone, dob, years_experience, skills) VALUES (?,?,?,?,?,?)'
);

let staffAdded = 0;
for (const s of staffToAdd) {
  if (!existingStaff.includes(s.name)) {
    insStaff.run(s.name, s.role, s.phone, s.dob, s.years_experience, s.skills);
    staffAdded++;
    console.log(`  ✓ Staff: ${s.name} (${s.role})`);
  } else {
    console.log(`  - Staff already exists: ${s.name}`);
  }
}

// ── Customers with birthdays & anniversaries ─────────────────────────────────
// Set dates so they fall within the next 0–14 days (relative to Oct 2, 2026)
// birthday/anniversary stored as MM-DD (just month-day, year doesn't matter for recurring checks)

function daysFromNow(n) {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const customersToAdd = [
  // Birthdays upcoming
  { name: 'Rima Biswas',       phone: '9831111001', gender: 'female', birthday: daysFromNow(0),  anniversary: null,          membership_tier: 'gold',   loyalty_points: 320 },
  { name: 'Kakoli Mondal',     phone: '9732222002', gender: 'female', birthday: daysFromNow(1),  anniversary: daysFromNow(8),membership_tier: 'silver',  loyalty_points: 150 },
  { name: 'Sunita Bera',       phone: '9051333003', gender: 'female', birthday: daysFromNow(3),  anniversary: null,          membership_tier: 'none',    loyalty_points: 60  },
  { name: 'Puja Das',          phone: '8420444004', gender: 'female', birthday: daysFromNow(5),  anniversary: daysFromNow(12),membership_tier: 'silver', loyalty_points: 210 },
  { name: 'Ananya Roy',        phone: '7001555005', gender: 'female', birthday: daysFromNow(7),  anniversary: null,          membership_tier: 'none',    loyalty_points: 40  },
  { name: 'Debasree Halder',   phone: '9831666006', gender: 'female', birthday: daysFromNow(11), anniversary: daysFromNow(3),membership_tier: 'gold',   loyalty_points: 480 },
  // Anniversaries upcoming
  { name: 'Suparna Naskar',    phone: '9732777007', gender: 'female', birthday: daysFromNow(20), anniversary: daysFromNow(0), membership_tier: 'silver', loyalty_points: 190 },
  { name: 'Mita Sen',          phone: '9051888008', gender: 'female', birthday: daysFromNow(25), anniversary: daysFromNow(2), membership_tier: 'none',   loyalty_points: 75  },
  { name: 'Priti Ghosh',       phone: '8420999009', gender: 'female', birthday: daysFromNow(18), anniversary: daysFromNow(6), membership_tier: 'gold',   loyalty_points: 560 },
  // Male customers
  { name: 'Subhash Halder',    phone: '9831000011', gender: 'male',   birthday: daysFromNow(4),  anniversary: null,          membership_tier: 'none',    loyalty_points: 30  },
  { name: 'Tapan Mondal',      phone: '9732000022', gender: 'male',   birthday: daysFromNow(9),  anniversary: daysFromNow(9),membership_tier: 'silver',  loyalty_points: 120 },
  { name: 'Bikash Roy',        phone: '9051000033', gender: 'male',   birthday: daysFromNow(13), anniversary: null,          membership_tier: 'none',    loyalty_points: 50  },
];

const existingPhones = new Set(db.prepare('SELECT phone FROM customers WHERE phone IS NOT NULL').all().map(r => r.phone));

const insCust = db.prepare(
  'INSERT OR IGNORE INTO customers (name, phone, gender, birthday, anniversary, membership_tier, loyalty_points) VALUES (?,?,?,?,?,?,?)'
);

let custAdded = 0;
for (const c of customersToAdd) {
  if (!existingPhones.has(c.phone)) {
    insCust.run(c.name, c.phone, c.gender, c.birthday, c.anniversary, c.membership_tier, c.loyalty_points);
    custAdded++;
    const bday = c.birthday ? `bday ${c.birthday}` : '';
    const anni = c.anniversary ? `anni ${c.anniversary}` : '';
    console.log(`  ✓ Customer: ${c.name} [${[bday, anni].filter(Boolean).join(', ')}]`);
  } else {
    console.log(`  - Customer already exists: ${c.name}`);
  }
}

console.log(`\nDone. Added ${staffAdded} staff, ${custAdded} customers.`);
db.close();
