# Sukh Sen Salon — Management System

Full-stack salon management web app for **Sukh Sen Salon, Kakdwip**.

## Features

| Module | Capabilities |
|---|---|
| **Dashboard** | Today's stats (appointments, revenue, new customers, avg bill) + appointment list |
| **Appointments** | Book, view by date, mark done/cancel, walk-in quick booking |
| **Customers** | Auto-created on booking, search, visit history, total spent |
| **Services** | CRUD with category grouping, pre-seeded with 7 salon services |
| **Billing** | Generate bills, multiple services, cash/UPI, daily revenue summary |
| **Staff** | Add/edit staff, assign to appointments |
| **Inventory** | Track stock, low-stock alerts, +/− quantity controls |

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Node.js + Express
- **Database:** SQLite via Node.js built-in `node:sqlite` (zero config, auto-created, no native compilation)

---

## Local Setup

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Steps

```bash
# 1. Clone the repo
git clone <repo-url>
cd sukhandsen

# 2. Install all dependencies
npm install
npm install --prefix client

# 3. Copy env file
cp .env.example .env

# 4. Start dev servers (client on :5173, server on :5000)
npm run dev
```

Open http://localhost:5173 — the app is ready with seed data (3 appointments, 7 services, 1 staff member, 5 inventory items).

The SQLite database is auto-created at `server/data/salon.db` on first run.

---

## Production Build (local)

```bash
npm run build        # builds React → client/dist
NODE_ENV=production npm start   # serves everything on :5000
```

---

## Deploy to Render (Free Tier)

### Steps

1. Push the repo to GitHub.

2. Go to [render.com](https://render.com) → **New → Web Service** → connect your repo.

3. Configure:

| Setting | Value |
|---|---|
| **Environment** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

4. Add Environment Variables in the Render dashboard:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DB_PATH` | `./server/data/salon.db` |

5. Click **Deploy**. Render will build and launch the service.

> **Note:** Render's free tier uses ephemeral storage — the SQLite DB resets on each deploy. For persistence, upgrade to a paid plan with a disk, or migrate to PostgreSQL.

---

## Project Structure

```
sukhandsen/
├── package.json          # Root: server deps + scripts
├── render.yaml           # Render deploy config
├── server/
│   ├── index.js          # Express app
│   ├── db.js             # SQLite init, migrations, seed
│   ├── data/             # salon.db lives here (git-ignored)
│   └── routes/
│       ├── dashboard.js
│       ├── appointments.js
│       ├── customers.js
│       ├── services.js
│       ├── billing.js
│       ├── staff.js
│       └── inventory.js
└── client/
    ├── package.json
    ├── vite.config.js    # Proxy /api → :5000 in dev
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── api.js        # Fetch wrapper for all endpoints
        ├── utils.js      # Date/currency formatters
        ├── components/
        │   ├── Layout.jsx
        │   ├── Sidebar.jsx
        │   └── Modal.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Appointments.jsx
            ├── Customers.jsx
            ├── Services.jsx
            ├── Billing.jsx
            ├── Staff.jsx
            └── Inventory.jsx
```

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/today` | Stats + appointment list for today |
| GET | `/api/appointments?date=` | Appointments filtered by date |
| POST | `/api/appointments` | Create appointment (auto-creates customer) |
| PATCH | `/api/appointments/:id/status` | Update status (pending/done/cancelled) |
| GET | `/api/customers?q=` | List/search customers |
| GET | `/api/customers/:id` | Customer profile + visit history |
| GET | `/api/services` | All active services |
| POST/PUT/DELETE | `/api/services` | CRUD services |
| GET | `/api/bills/unbilled` | Done appointments without bills |
| POST | `/api/bills` | Generate bill |
| PATCH | `/api/bills/:id/pay` | Mark bill as paid |
| GET | `/api/bills/summary?date=` | Daily revenue breakdown |
| GET/POST/PUT/DELETE | `/api/staff` | Staff management |
| GET/POST/PUT/DELETE | `/api/inventory` | Inventory management |
| PATCH | `/api/inventory/:id/quantity` | Update stock quantity |
