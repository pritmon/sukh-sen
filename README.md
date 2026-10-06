<div align="center">

# ✂️ Sukh&Sen — Salon Management System

**A full-stack, luxury-themed management app built for Sukh&Sen Unisex Salon, Kakdwip.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-sukhandsen.onrender.com-C9A84C?style=for-the-badge&logo=render&logoColor=white)](https://sukhandsen.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Turso](https://img.shields.io/badge/Database-Turso%20SQLite-4FF8D2?style=for-the-badge)](https://turso.tech)

</div>

---

## ✨ Features

| Module | What it does |
|---|---|
| **📊 Dashboard** | Live stats — today's appointments, total revenue, new guests, avg. bill. Social media quick-links. |
| **📅 Appointments** | Book by date & time, assign staff & services, mark done/cancel, walk-in shortcut |
| **👥 Customers** | Search guests, view full visit history & total spent, birthday/anniversary tracking, loyalty points, membership tiers |
| **🧾 Billing** | Generate itemised bills with discount, optional GST, Cash/UPI/Card payment. Print receipt, share via WhatsApp |
| **📈 Reports** | Daily revenue by payment method, date-range revenue trend, top services & top customers |
| **👩‍💼 Staff** | Full staff profiles (skills, experience, ID docs), assign to appointments |
| **💆 Services** | 120+ pre-loaded services across 14 categories, CRUD with price & duration |
| **📦 Inventory** | Track product stock, low-stock alerts, +/− quick controls |
| **⚙️ Settings** | Salon name, address, phone, WhatsApp, Instagram & Facebook links, GST configuration |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router, Lucide icons |
| **Backend** | Node.js 18, Express, JWT auth (30-day tokens), gzip compression |
| **Database** | [Turso](https://turso.tech) cloud SQLite via `@libsql/client` — persistent across deploys |
| **Hosting** | [Render](https://render.com) free tier (web service) |

---

## 🚀 Local Setup

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- A free [Turso](https://turso.tech) account (or use a local `.db` file — see below)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/pritmon/sukh-sen.git
cd sukh-sen

# 2. Install dependencies
npm install
npm install --prefix client

# 3. Create your env file
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Required for auth — use any random string
JWT_SECRET=your-secret-here

# Turso cloud DB (get from turso.tech dashboard)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token-here

# Omit TURSO_* to use a local SQLite file at server/data/salon.db instead
```

```bash
# 4. Start dev servers (frontend on :5173, backend on :3001)
npm run dev
```

Open **http://localhost:5173** — the app starts with seed data (5 demo customers, 120+ services, demo appointments).

---

## 🏗 Project Structure

```
sukh-sen/
├── package.json              # Root scripts (dev, build, start)
├── render.yaml               # Render deploy config
│
├── server/
│   ├── index.js              # Express app — middleware, routes, auth
│   ├── db.js                 # Turso client, query helpers, schema, seed
│   └── routes/
│       ├── auth.js           # POST /api/auth/login
│       ├── dashboard.js      # GET  /api/dashboard
│       ├── appointments.js   # Full CRUD + status updates
│       ├── customers.js      # Search, profiles, loyalty
│       ├── billing.js        # Bills, payment, daily summary
│       ├── services.js       # Service catalogue CRUD
│       ├── staff.js          # Staff profiles
│       ├── inventory.js      # Stock tracking
│       ├── reports.js        # Revenue trends & top lists
│       └── settings.js       # Salon settings key-value store
│
└── client/
    ├── vite.config.js        # Proxy /api → :3001 in dev
    ├── tailwind.config.js
    └── src/
        ├── App.jsx           # Routes + auth guard
        ├── api.js            # Fetch wrapper for every endpoint
        ├── utils.js          # Date, currency, status helpers
        ├── components/
        │   ├── Layout.jsx    # Sidebar + page shell
        │   ├── Sidebar.jsx   # Navigation
        │   ├── Modal.jsx     # Reusable modal
        │   └── DatePicker.jsx # Portal-based calendar (escapes overflow:hidden)
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Appointments.jsx
            ├── Customers.jsx
            ├── Billing.jsx
            ├── Services.jsx
            ├── Staff.jsx
            ├── Inventory.jsx
            ├── Reports.jsx
            └── Settings.jsx
```

---

## 🌐 Deploy to Render

1. Push the repo to GitHub.
2. Go to [render.com](https://render.com) → **New → Web Service** → connect repo.
3. Set build & start:

   | Setting | Value |
   |---|---|
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm start` |

4. Add environment variables in the Render dashboard:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `JWT_SECRET` | *(random secret)* |
   | `TURSO_DATABASE_URL` | *(from turso.tech)* |
   | `TURSO_AUTH_TOKEN` | *(from turso.tech)* |

5. Click **Deploy**. The app is live in ~2 minutes.

> **Why Turso?** Unlike SQLite on Render's ephemeral disk, Turso is a cloud database — data persists across every deploy and restart.

---

## 📡 API Reference

All endpoints except `/api/auth/login` and `/api/health` require a `Bearer` token in the `Authorization` header.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login, returns JWT |
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/dashboard` | Today's stats + appointment list |
| `GET` | `/api/appointments?date=` | Appointments by date |
| `POST` | `/api/appointments` | Create appointment |
| `PATCH` | `/api/appointments/:id/status` | Update status |
| `GET` | `/api/customers?q=` | List / search customers |
| `GET` | `/api/customers/:id` | Profile + full visit history |
| `POST` | `/api/customers` | Add customer |
| `PUT` | `/api/customers/:id` | Edit customer |
| `GET` | `/api/services` | All active services |
| `POST/PUT/DELETE` | `/api/services` | Manage services |
| `GET` | `/api/bills/unbilled` | Done appointments without a bill |
| `POST` | `/api/bills` | Generate bill (with discount, GST, payment method) |
| `PATCH` | `/api/bills/:id/pay` | Mark bill as paid |
| `GET` | `/api/bills/summary?date=` | Daily revenue by payment method |
| `GET` | `/api/reports/revenue?from=&to=` | Revenue trend for date range |
| `GET/POST/PUT/DELETE` | `/api/staff` | Staff management |
| `GET/POST/PUT/DELETE` | `/api/inventory` | Inventory management |
| `GET/PUT` | `/api/settings` | Salon settings |

---

## 🎨 Design

The UI uses a **luxury dark/gold theme** throughout:

| Token | Hex | Use |
|---|---|---|
| Gold primary | `#C9A84C` | Borders, icons, labels |
| Gold light | `#E8C96D` | Headings, values |
| Cream | `#F5F0E8` | Body text |
| Dark base | `#0D0D0D` | Page background |
| Dark card | `#111111` | Card backgrounds |

---

<div align="center">
  Made with ☕ for <strong>Sukh&Sen Unisex Salon</strong>, Kakdwip, West Bengal
</div>
