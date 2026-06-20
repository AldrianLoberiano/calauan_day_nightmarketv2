# Stall Reservation Mapping System

Stall Reservation Mapping System is a Vite + React + TypeScript app for managing day and night market stall reservations. It provides public browsing, vendor, and admin flows with visual stall mapping on two independent maps.

## Features

### Public / User (Homepage)
- Interactive stall browsing with visual map view (Map A) and grid view (Map B)
- Map selector dropdown to switch between maps
- View Full Map button in the zoom controls bar for fullscreen map viewing
- Stall directory with search and status/category filters
- Reservation form with validation and receipt generation (printable, downloadable as .txt)
- Map assignment awareness: vendors assigned to a map see "Your Map" badge; the other map is grayed out and disabled
- Non-logged-in users see "Login to Reserve" prompt; wrong-map vendors see "Switch to Map X" warning
- Stall detail modal shows vendor name and business for reserved stalls
- Vendor page clears session and redirects to homepage on browser refresh

### Vendor
- Email + passcode login (passcode provided by admin)
- Dashboard with solid purple gradient header, profile dropdown with logout confirmation
- View own reservations and stall details
- Logged-in vendor's reserved stalls are highlighted on the map with a blue glow and dot indicator
- Vendor event/map assignment: each vendor is assigned to Map A (Bazaar) or Map B (Night Market) by admin

### Admin
- JWT-based authentication (real tokens, not localStorage flags)
- Dashboard with charts, reservation management, and vendor overview
- Vendor accounts management: create, edit, activate/deactivate, delete
- Vendor creation requires only Full Name + Email (username and passcode are auto-generated)
- Map Assignment dropdown (Map A / Map B) when creating or editing vendors
- Passcodes visible to admin; displayed in the vendor management table
- Delete vendor blocked if they have existing reservations (deactivate instead)
- Approve, reject, or mark reservations as occupied (success toast on each action)
- Admin-edited reservation form with native validation for required fields
- Tools to reset all stalls, clear reservations, and reset the reservation counter
- Extend all pending reservations by 1 day
- Pending reservations expire after 4 days by default
- All admin vendor CRUD operations show green success toast (3s)

### System
- Dual-map system: Map A (design_map) and Map B (all_stalls) operate independently
- Vendor event column (`Bazaar` = Map A, `Night Market` = Map B) controls which map a vendor can reserve from
- Server-Sent Events (SSE) for realtime updates across connected clients
- Auto-migration on startup: creates `admin_users` table, `passcode` column, `vendor_id` columns, `event` column
- All images served as static files from `public/images/`
- Consistent purple gradient headers across all pages (homepage, admin, vendor, login pages)

## Tech Stack

- Vite 6
- React 18
- TypeScript
- Tailwind CSS v4
- Vitest (108 tests across 4 files)
- Node.js / Express backend
- MySQL database
- jsonwebtoken (JWT) for auth
- bcrypt for password hashing
- lucide-react for icons
- recharts for dashboard charts

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

- **Admin:** `admin` / `bplo2026`
- **Default vendor:** `vendor` / `vendor123` (passcode shown in admin panel after creation)

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | Public | Health check |
| GET | `/api/health/details` | Public | DB connectivity, counts, memory |
| GET | `/api/events` | Public | SSE stream for realtime updates |
| GET | `/api/stalls` | Public | All stalls (both maps) |
| GET | `/api/stalls?source=design_map` | Public | Map A stalls only |
| GET | `/api/stalls?source=all_stalls` | Public | Map B stalls only |
| GET | `/api/stalls/:id` | Public | Single stall by ID |
| PUT | `/api/stalls/:id` | Public | Update stall status |
| GET | `/api/reservations` | Public | All reservations |
| GET | `/api/reservations/:id` | Public | Single reservation |
| POST | `/api/reservations` | Vendor | Create reservation |
| PUT | `/api/reservations/:id` | Public | Update reservation |
| DELETE | `/api/reservations/:id` | Public | Delete reservation |
| POST | `/api/reservations/:id/approve` | Admin | Approve reservation |
| POST | `/api/reservations/:id/reject` | Admin | Reject reservation |
| POST | `/api/reservations/:id/occupy` | Admin | Mark as occupied |
| POST | `/api/admin/login` | Public | Admin login (returns JWT) |
| POST | `/api/admin/vendors` | Admin | Create vendor |
| GET | `/api/admin/vendors` | Admin | List all vendors |
| PUT | `/api/admin/vendors/:id` | Admin | Update vendor |
| DELETE | `/api/admin/vendors/:id` | Admin | Delete vendor |
| GET | `/api/admin/vendors/:id/reservation-count` | Admin | Vendor reservation count |
| POST | `/api/admin/reset` | Admin | Reset all stalls |
| POST | `/api/admin/extend-pending` | Admin | Extend pending by 1 day |
| POST | `/api/vendors/login-passcode` | Public | Vendor login (returns JWT) |
| GET | `/api/vendors/me` | Vendor | Current vendor profile |
| GET | `/api/vendors/me/reservations` | Vendor | Current vendor's reservations |

## Project Structure

```
.
├─ .env
├─ .env.example
├─ USER_MANUAL.md
├─ database/
│  ├─ README.md
│  ├─ map_a_full_schema.sql
│  ├─ map_b_full_schema.sql
│  └─ vendor_schema.sql
├─ index.html
├─ package.json
├─ postcss.config.mjs
├─ tsconfig.json
├─ vite.config.ts
├─ public/
│  └─ images/
│     ├─ bplo-modified.png
│     ├─ bplo-removebg-preview.png
│     ├─ header1.png
│     ├─ logo.png
│     ├─ plan.png
│     ├─ vendors.jpg
│     └─ wallpaper.png
├─ server/
│  ├─ .env
│  ├─ .env.example
│  ├─ package.json
│  ├─ vitest.config.js
│  ├─ scripts/
│  └─ src/
│     ├─ db.js
│     ├─ index.js
│     ├─ stalls.js
│     └─ __tests__/
│        └─ stalls.test.js
├─ src/
│  ├─ main.tsx
│  ├─ vite-env.d.ts
│  ├─ assets/
│  │  ├─ images/
│  │  └─ NIGHTMARKET-PLAN.pdf
│  ├─ styles/
│  │  ├─ fonts.css
│  │  ├─ index.css
│  │  ├─ tailwind.css
│  │  └─ theme.css
│  ├─ test/
│  │  └─ setup.ts
│  └─ app/
│     ├─ App.tsx
│     ├─ components/
│     │  ├─ admin/
│     │  │  ├─ AdminDashboard.tsx
│     │  │  ├─ AdminLogin.tsx
│     │  │  ├─ ReservationCard.tsx
│     │  │  ├─ ReservationDetailsModal.tsx
│     │  │  └─ VendorManagement.tsx
│     │  └─ stalls/
│     │     ├─ ReceiptModal.tsx
│     │     ├─ ReservationFormModal.tsx
│     │     ├─ StallDetailModal.tsx
│     │     ├─ StallGridView.tsx
│     │     └─ StallMap.tsx
│     ├─ data/
│     │  ├─ stallData.ts
│     │  └─ stallData.test.ts
│     ├─ pages/
│     │  ├─ AdminPage.tsx
│     │  ├─ UserPage.tsx
│     │  └─ vendor/
│     │     ├─ index.ts
│     │     ├─ VendorDashboard.tsx
│     │     ├─ VendorLoginPage.tsx
│     │     └─ VendorPage.tsx
│     ├─ types/
│     │  └─ index.ts
│     └─ utils/
│        ├─ export.ts
│        ├─ helpers.ts
│        ├─ helpers.test.ts
│        ├─ storage.ts
│        └─ storage.test.ts
└─ README.md
```

## Development

1. Install dependencies: `npm i`
2. Start the dev server: `npm run dev`

## Scripts

- `npm run dev` — Start the Vite dev server
- `npm run build` — Build for production
- `npm run preview` — Preview the production build
- `npm run test` — Run Vitest (108 tests)
- `npm run test:watch` — Run Vitest in watch mode

## Developer Notes

- **Realtime updates:** The backend exposes an SSE endpoint at `/api/events`. The frontend subscribes and reloads stalls/reservations automatically when admin actions occur. To avoid Vite dev-proxy resets for long-lived SSE connections, set `VITE_API_URL` to the backend origin (e.g. `http://localhost:3001`) or rely on the tuned proxy in `vite.config.ts`.

- **Health endpoint:** `GET /api/health/details` provides a quick development view of DB connectivity, stall/reservation counts, SSE client count, memory usage and uptime.

- **Printing:** Receipt printing is implemented via an in-place modal and `@media print` rules. The printable view targets Letter size and is simplified (no QR, removed print button) to match BPLO requirements.

- **Admin edits:** The Reservation Details edit form uses native `required` validation for core fields (Full Name, Contact Number, Status, Address, Price, Admin Notes) to prevent accidental saves.

- **Vendor map restriction:** Vendors are assigned to a map via the `event` field on `vendor_users`. The homepage dropdown restricts non-assigned maps. Reservations are blocked if a vendor tries to reserve on the wrong map.

## Troubleshooting SSE / Dev Proxy

If you see `ECONNRESET` or the EventSource disconnects frequently in development:

1. Set `VITE_API_URL` to the backend origin and restart frontend so EventSource connects directly:

```powershell
$env:VITE_API_URL='http://localhost:3001'
npm run dev
```

2. Otherwise, check `vite.config.ts` — the dev proxy is configured with `timeout: 0`, `proxyTimeout: 0`, and `Connection: keep-alive` to better support SSE.

3. Verify the backend logs for SSE connect/disconnect and the `/api/health/details` output.
