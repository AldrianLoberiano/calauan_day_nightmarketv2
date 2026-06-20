# Stall Reservation Mapping System

Stall Reservation Mapping System is a Vite + React + TypeScript app for managing day and night market stall reservations. It provides user, vendor, and admin flows, visual stall mapping, and reservation management features.

## Features

### Public / User
- Interactive stall browsing with visual map and grid views
- Category filter (Food vs Non-Food) in the stall directory
- Reservation form with validation and receipt generation (printable, downloadable as .txt)

### Vendor
- Email + passcode login (passcode provided by admin)
- View own reservations and stall details
- Logged-in vendor's reserved stalls are highlighted on the map with a blue glow and dot indicator

### Admin
- JWT-based authentication (real tokens, not localStorage flags)
- Dashboard with charts, reservation management, and vendor overview
- Vendor accounts management: create, edit, activate/deactivate, delete
- Vendor creation requires only Full Name + Email (username and passcode are auto-generated)
- Passcodes visible to admin; displayed in the vendor management table
- Delete vendor blocked if they have existing reservations (deactivate instead)
- Approve, reject, or mark reservations as occupied
- Admin-edited reservation form with native validation for required fields
- Tools to reset all stalls, clear reservations, and reset the reservation counter
- Extend all pending reservations by 1 day
- Pending reservations expire after 4 days by default

### System
- Dual-map system: Map A (design_map) and Map B (all_stalls) operate independently
- Server-Sent Events (SSE) for realtime updates across connected clients
- Auto-migration on startup: creates `admin_users` table, `passcode` column, `vendor_id` columns

## Tech Stack

- Vite 6
- React 19
- TypeScript
- Tailwind CSS v4
- Vitest (108 tests across 4 files)

## API

This project includes a Node/Express + MySQL backend under `server/`.

### Backend setup

1. Create the database using the schema files in [database/](database/):
   - `map_a_full_schema.sql` — Map A (design map) tables
   - `map_b_full_schema.sql` — Map B (all stalls) tables
   - `vendor_schema.sql` — vendor_users table
2. Copy `server/.env.example` to `server/.env` and update credentials.
3. Install backend dependencies:
   - `cd server`
   - `npm i`
4. Start the API server:
   - `npm run dev`

The frontend proxies API requests to `http://localhost:3001` via the Vite dev proxy. You can override this with `VITE_API_URL` in `.env`.

### Default credentials

- **Admin:** `admin` / `admin123`
- **Vendor:** `vendor` / `vendor123` (passcode shown in admin panel after creation)

## Project Structure

```
.
├─ .env
├─ .env.example
├─ ATTRIBUTIONS.md
├─ database/
│  ├─ README.md
│  ├─ map_a_full_schema.sql
│  ├─ map_b_full_schema.sql
│  └─ vendor_schema.sql
├─ guidelines/
│  └─ Guidelines.md
├─ index.html
├─ package.json
├─ postcss.config.mjs
├─ public/
├─ vite.config.ts
├─ server/
│  ├─ .env
│  ├─ .env.example
│  ├─ package.json
│  └─ src/
│     ├─ db.js
│     ├─ index.js
│     ├─ stalls.js
│     └─ __tests__/
│        └─ stalls.test.js
├─ src/
│  ├─ main.tsx
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ components/
│  │  │  ├─ admin/
│  │  │  │  ├─ AdminDashboard.tsx
│  │  │  │  ├─ AdminLogin.tsx
│  │  │  │  ├─ ReservationCard.tsx
│  │  │  │  ├─ ReservationDetailsModal.tsx
│  │  │  │  └─ VendorManagement.tsx
│  │  │  ├─ primitives/
│  │  │  │  ├─ ReceiptModal.tsx
│  │  │  │  ├─ ReservationFormModal.tsx
│  │  │  │  ├─ StallDetailModal.tsx
│  │  │  │  ├─ StallGridView.tsx
│  │  │  │  └─ StallMap.tsx
│  │  │  └─ public/
│  │  ├─ data/
│  │  │  └─ stallData.ts
│  │  ├─ imports/
│  │  ├─ pages/
│  │  │  ├─ AdminPage.tsx
│  │  │  ├─ UserPage.tsx
│  │  │  ├─ VendorDashboard.tsx
│  │  │  ├─ VendorLoginPage.tsx
│  │  │  └─ VendorPage.tsx
│  │  ├─ types/
│  │  │  └─ index.ts
│  │  └─ utils/
│  │     ├─ export.ts
│  │     ├─ helpers.ts
│  │     ├─ storage.ts
│  │     └─ storage.test.ts
│  └─ styles/
│     ├─ fonts.css
│     ├─ index.css
│     ├─ tailwind.css
│     └─ theme.css
└─ README.md
```

## Development

1. Install dependencies: `npm i`
2. Start the dev server: `npm run dev`

## Scripts

- `npm run dev` - Start the Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run test` - Run Vitest (108 tests)

## Recent developer notes

- Realtime updates: the backend exposes an SSE endpoint at `/api/events`. The frontend subscribes and reloads stalls/reservations automatically when admin actions occur. To avoid Vite dev-proxy resets for long-lived SSE connections, set `VITE_API_URL` to the backend origin (e.g. `http://localhost:3001`) or rely on the tuned proxy in `vite.config.ts`.

- Health endpoint: `GET /api/health/details` provides a quick development view of DB connectivity, stall/reservation counts, SSE client count, memory usage and uptime. The server also logs a compact health line every 30s in dev mode.

- Printing: Receipt printing is implemented via an in-place modal and `@media print` rules. The printable view targets Letter size and is simplified (no QR, removed print button) to match BPLO requirements.

- Admin edits: The Reservation Details edit form now uses native `required` validation for core fields (Full Name, Contact Number, Status, Address, Price, Admin Notes) to prevent accidental saves that would revert a reservation's status (for example, saving an `occupied` reservation back to `approved`).

## Troubleshooting SSE / Dev Proxy

If you see `ECONNRESET` or the EventSource disconnects frequently in development:

1. Set `VITE_API_URL` to the backend origin and restart frontend so EventSource connects directly:

```powershell
$env:VITE_API_URL='http://localhost:3001'
npm run dev
```

2. Otherwise, check `vite.config.ts` — the dev proxy is configured with `timeout: 0`, `proxyTimeout: 0`, and `Connection: keep-alive` to better support SSE.

3. Verify the backend logs for SSE connect/disconnect and the `/api/health/details` output.
