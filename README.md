# FleetPulse TMS – Enterprise Freight & Fleet Management System

![FleetPulse TMS](public/assets/images/truck-highway.png)

FleetPulse TMS is an enterprise-grade, offline-first Transport Management System specifically engineered for perishable multi-drop fruit logistics and industrial backhaul freight along the high-density Maharashtra ⇄ Gujarat trade corridor (Pune, Nashik, Mumbai ⇄ Vapi, Surat, Vadodara, Ahmedabad).

---

## 1. Project Architecture

The application is structured into decoupled, independently deployable tiers:

```
FleetPulse-TMS/
├── frontend/                     # Client application (Target: Vercel)
│   ├── public/                   # PWA Service Worker, Web Manifest & Lottie assets
│   ├── src/
│   │   ├── api/                  # Centralized REST API client (Fetch/JWT/Timeout)
│   │   ├── components/           # Admin Dashboard, User Portal, Driver Mobile PWA
│   │   ├── context/              # TMSContext with automatic API sync + IndexedDB fallback
│   │   └── utils/                # IndexedDB Storage Engine & Offline Queue
│   ├── package.json
│   ├── vercel.json               # SPA routing fallback & service worker caching
│   └── vite.config.ts
│
├── backend/                      # API Server (Target: Render)
│   ├── src/
│   │   ├── config/               # PostgreSQL pool & validated environment config
│   │   ├── controllers/          # 12 Modular Domain Controllers (Trips, ODO, Fuel, etc.)
│   │   ├── db/                   # Schema DDL (schema.sql), in-memory store & seeder
│   │   ├── middleware/           # Auth (JWT), RBAC (admin/operator/driver), errorHandler
│   │   ├── routes/               # Express modular route definitions
│   │   └── server.ts             # Server entrypoint with graceful shutdown
│   ├── render.yaml               # Render Infrastructure-as-Code blueprint
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                       # Shared domain contracts (Zero circular dependencies)
│   └── types/
│       ├── tms.ts                # TypeScript domain models (Vehicles, Trips, Fuel, etc.)
│       └── api.ts                # API Request/Response interfaces
│
├── package.json                  # Root convenience scripts
├── vercel.json                   # Root Vercel SPA configuration
└── README.md
```

---

## 2. Local Development Setup

### Prerequisites
- Node.js `v18+` or `v20+` (LTS recommended)
- npm `v9+` or `v10+`

### Step 1: Install Dependencies
```bash
# Install root & frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Configure Environment Variables
1. **Frontend Configuration (`frontend/.env`):**
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```
2. **Backend Configuration (`backend/.env`):**
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=fleetpulse_dev_secret_key_minimum_32_characters_2026
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   # Optional: Connect to local PostgreSQL (if omitted, runs with persistent in-memory seeder)
   # DATABASE_URL=postgresql://postgres:password@localhost:5432/fleetpulse_tms
   ```

### Step 3: Run the Application
Open two terminal windows:

- **Terminal 1: Start Backend API Server**
  ```bash
  npm run dev:backend
  # Or from backend folder:
  # cd backend && npm run dev
  ```
  *Server starts on `http://localhost:5000` with Health Check at `http://localhost:5000/health`.*

- **Terminal 2: Start Frontend Application**
  ```bash
  npm run dev
  ```
  *Frontend starts on `http://localhost:3000`.*

---

## 3. Production Deployment Guide

### A. Deploy Frontend on Vercel

1. **Import Git Repository:**
   - Log in to your [Vercel Dashboard](https://vercel.com) and click **Add New > Project**.
   - Select your FleetPulse Git repository.
2. **Configure Project Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** Leave as root `./` (or select `frontend`)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Environment Variables:**
   - Add `VITE_API_BASE_URL`: `https://fleetpulse-api.onrender.com` (your live Render backend URL).
4. **Deploy:** Click **Deploy**. Vercel will build the production SPA and serve it via global CDN with PWA service worker caching.

---

### B. Deploy Backend on Render

1. **Option 1: Deploy using `render.yaml` Blueprint (Recommended):**
   - In your Render Dashboard, click **New > Blueprint**.
   - Connect your repository. Render automatically reads `backend/render.yaml` to provision both:
     1. A managed PostgreSQL database (`fleetpulse-postgres`).
     2. The Node.js Web Service (`fleetpulse-api`).
2. **Option 2: Deploy Manually as a Web Service:**
   - Click **New > Web Service**.
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
3. **Environment Variables on Render:**
   - `PORT`: (Provided automatically by Render)
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Generate a strong 32-character secret.
   - `CORS_ORIGINS`: `https://your-app.vercel.app` (your actual Vercel domain).
   - `DATABASE_URL`: Your PostgreSQL connection string.

---

### C. Database Setup & PostgreSQL Migration

1. **Schema Initialization:**
   Run the schema migration file located at [`backend/src/db/schema.sql`](file:///c:/Users/Ashish%20Bhadange/Downloads/FleetPulse-TMS---Freight-Fleet-main/backend/src/db/schema.sql) against your PostgreSQL database:
   ```bash
   psql $DATABASE_URL -f backend/src/db/schema.sql
   ```
2. **Initial Fleet & User Seeding:**
   ```bash
   cd backend
   npm run seed
   ```
   *This seeds the entire initial fleet (`MH-12-RN-4892`, `MH-15-EG-3301`, `GJ-03-XX-5512`), active trips, Mandi parties, drivers, and user credentials with zero data loss.*

---

## 4. Default Credentials

| Portal / Role | Username / Email | Password | Access Rights |
|---|---|---|---|
| **Admin** | `admin@fleetpulse.com` | `Admin@123` | Full control: Company profile, KYC approval, Trip dispatch, Settle Payments, ODO override |
| **Operator / Dispatcher** | `dispatcher@fleetpulse.com` | `Admin@123` | Operational: Create Trips, Edit Outbound Places, Fuel Entries, Service Logs |
| **Driver Portal (PWA)** | `sukhwinder@driver.com` | Direct / Token | Mobile UI: Log refuel, Submit service bills, Dispute ODO, Offline Sync |

---

## 5. Offline-First Synchronization & PWA

- **Highway Dead-Zone Simulation:** Drivers can record trips, refuel entries, and odometer events even when there is zero network connectivity on National Highway 48.
- **IndexedDB Persistent Queue:** Actions are queued locally with client UUIDs and idempotency hashes.
- **Auto Sync on Reconnect:** When network connectivity is re-established, the sync engine flushes pending actions to `/api/sync/batch`. The backend guarantees anti-duplication via unique idempotency logging.

---

## 6. Common Deployment Troubleshooting

1. **CORS Error on Vercel:**
   - Ensure the exact Vercel domain (e.g. `https://fleetpulse-tms.vercel.app`) is included in the backend's `CORS_ORIGINS` environment variable without trailing slashes.
2. **Render Cold Start Delay:**
   - Free-tier Render services sleep after 15 minutes of inactivity. The FleetPulse client features an automatic 8-second timeout with fallback to persistent local storage so users are never blocked by cold starts.
3. **PWA Refresh 404s:**
   - Handled via `vercel.json` rewrite rule `/(.*) -> /index.html`.
