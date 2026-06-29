# Calauan Day & Night Market — Stall Reservation Mapping System

A full-stack stall reservation system for the Calauan Day & Night Market. Built with React + TypeScript + Vite (frontend) and Node.js + Express + MySQL (backend). Features dual-map stall visualization, vendor management, real-time updates, and role-based access control.

---

## Features

### Public / User (Homepage)

- Interactive stall browsing with visual **Map A** (design map) and **Map B** (grid view)
- Map selector dropdown to switch between maps
- View Full Map button for fullscreen map viewing
- Stall directory with search and status/category filters
- Reservation form with field validation and receipt generation (printable, downloadable as `.txt`)
- Map assignment awareness: vendors assigned to a map see "Your Map" badge; the other map is grayed out
- Non-logged-in users see "Login to Reserve" prompt; wrong-map vendors see "Switch to Map X" warning
- Stall detail modal shows vendor name and business for reserved stalls
- Real-time updates via Server-Sent Events (SSE) — stalls refresh automatically on admin/vendor actions

### Vendor

- Email + passcode login (passcode provided by admin)
- Dashboard with solid purple gradient header, profile dropdown with logout confirmation
- View own reservations with **search bar** to filter by reservation number, stall ID, or name
- Reservation cards show **price status**: green badge with price or amber "Price to be discussed"
- Expanded reservation details show price, contact info, address, and status-specific notices
- Logged-in vendor's reserved stalls are highlighted on the map with a blue glow and dot indicator
- Vendor event/map assignment: each vendor is assigned to Map A (Bazaar) or Map B (Night Market) by admin

### Admin

- JWT-based authentication with **image CAPTCHA verification** (prevents bot logins)
- Dashboard with charts, reservation management, and vendor overview
- **Real-time reservation updates** (3-second polling + visibility/focus refresh)

#### Reservations
- Approve, reject, or mark reservations as occupied (success toast on each action)
- **Delete reservation** with confirmation popup and dashboard toast notification
- Admin-edited reservation form with native validation for required fields
- **Price management**: admin sets price during approval; pending reservations always show "Price to be discussed"
- Reservation cards show price badge on **all statuses** (pending, approved, occupied, rejected)
- Pending reservations expire after 4 days by default

#### Vendor Accounts
- Create, edit, activate/deactivate, delete vendors
- Vendor creation requires only Full Name + Email (username and passcode auto-generated)
- Map Assignment dropdown (Map A / Map B) when creating or editing vendors
- **Passcodes masked** by default with show/hide eye icon toggle
- **Search bar** to filter vendors by name, business, email, or contact number
- **Map filter dropdown** to show All Maps / Map A (Bazaar) / Map B (Night Market)
- Delete vendor blocked if they have existing reservations (deactivate instead)
- All vendor CRUD operations show green success toast (3s)

#### Reports & Export
- Export reservations to **CSV**, **Excel (.xlsx)**, or **Word (.docx)**
- **Price column included only when reservations have a price set**
- Pending reservations show "To be discussed" in exports instead of stall default price

#### Settings
- Reset all stalls, clear reservations, and reset the reservation counter
- Extend all pending reservations by 1 day

### System

- **Dual-map system**: Map A (design_map) and Map B (all_stalls) operate independently
- Vendor event column (`Bazaar` = Map A, `Night Market` = Map B) controls which map a vendor can reserve from
- Server-Sent Events (SSE) for realtime updates across connected clients
- Auto-migration on startup: creates tables, columns, and default admin/vendor accounts
- All images served as static files from `public/images/`
- Consistent purple gradient headers across all pages

---

## Security

- Admin passwords stored with **bcrypt** hashing (migrated from plaintext)
- **JWT_SECRET** required in `.env` — server exits on startup if missing
- **Image CAPTCHA** on admin login (client-side validated, prevents automated attacks)
- **Rate limiting** on admin login, vendor login, and reservation creation
- **CORS restricted** in production via `CORS_ORIGIN` env var
- `x-powered-by` header disabled; trust proxy enabled
- Status validation on admin vendor updates
- Source parameter validated against allowlist on all stall/reservation endpoints
- Default passwords configurable via environment variables (not hardcoded)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS v4 |
| Backend | Node.js, Express, MySQL (mysql2) |
| Auth | JWT (jsonwebtoken), bcrypt |
| Charts | Recharts |
| Icons | Lucide React |
| Testing | Vitest (108 frontend + 19 backend = 127 tests) |
| Export | SheetJS (xlsx), docx, file-saver |

---

## Project Structure

```
.
├─ frontend/
│  ├─ src/
│  │  ├─ main.tsx
│  │  ├─ app/
│  │  │  ├─ App.tsx
│  │  │  ├─ components/
│  │  │  │  ├─ admin/
│  │  │  │  │  ├─ AdminDashboard.tsx
│  │  │  │  │  ├─ AdminLogin.tsx
│  │  │  │  │  ├─ ReservationCard.tsx
│  │  │  │  │  ├─ ReservationDetailsModal.tsx
│  │  │  │  │  └─ VendorManagement.tsx
│  │  │  │  └─ stalls/
│  │  │  │     ├─ ReceiptModal.tsx
│  │  │  │     ├─ ReservationFormModal.tsx
│  │  │  │     ├─ StallDetailModal.tsx
│  │  │  │     ├─ StallGridView.tsx
│  │  │  │     └─ StallMap.tsx
│  │  │  ├─ data/
│  │  │  │  ├─ stallData.ts
│  │  │  │  └─ stallData.test.ts
│  │  │  ├─ pages/
│  │  │  │  ├─ AdminPage.tsx
│  │  │  │  ├─ UserPage.tsx
│  │  │  │  └─ vendor/
│  │  │  │     ├─ VendorDashboard.tsx
│  │  │  │     ├─ VendorLoginPage.tsx
│  │  │  │     └─ VendorPage.tsx
│  │  │  ├─ types/
│  │  │  │  └─ index.ts
│  │  │  └─ utils/
│  │  │     ├─ export.ts
│  │  │     ├─ helpers.ts
│  │  │     ├─ helpers.test.ts
│  │  │     ├─ storage.ts
│  │  │     └─ storage.test.ts
│  │  └─ styles/
│  ├─ index.html
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ vite.config.ts
│  └─ vitest.config.ts
├─ backend/
│  ├─ src/
│  │  ├─ index.js
│  │  ├─ db.js
│  │  ├─ stalls.js
│  │  └─ __tests__/
│  │     └─ stalls.test.js
│  ├─ database/
│  │  ├─ map_a_full_schema.sql
│  │  ├─ map_b_full_schema.sql
│  │  └─ vendor_schema.sql
│  ├─ scripts/
│  ├─ .env
│  ├─ .env.example
│  ├─ package.json
│  └─ vitest.config.js
├─ README.md
└─ USER_MANUAL.md
```

---

## Setup

### Prerequisites

- Node.js 18+
- MySQL 8+
- npm

### Backend

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create `.env` from `.env.example` and configure:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=calauan_market
   JWT_SECRET=a-strong-random-secret
   CORS_ORIGIN=http://localhost:5173
   ```

3. Create the database using schema files in `database/`:
   ```bash
   mysql -u root -p < database/map_a_full_schema.sql
   mysql -u root -p < database/map_b_full_schema.sql
   mysql -u root -p < database/vendor_schema.sql
   ```

4. Start the server:
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3001`.

### Frontend

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173` and proxies API requests to the backend.

### Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Default Vendor | Auto-generated | Auto-generated (shown in admin panel) |

---

## API Endpoints

| Method | Endpoint | Auth | Rate Limited | Description |
|--------|----------|------|:---:|-------------|
| GET | `/api/health` | Public | No | Health check |
| GET | `/api/health/details` | Admin | No | DB status, counts, memory |
| GET | `/api/events` | Public | No | SSE stream for realtime updates |
| GET | `/api/stalls` | Public | No | All stalls (both maps) |
| GET | `/api/stalls/:id` | Public | No | Single stall by ID |
| PUT | `/api/stalls/:id` | Admin | No | Update stall status |
| GET | `/api/reservations` | Public | No | All reservations |
| GET | `/api/reservations/:id` | Public | No | Single reservation |
| POST | `/api/reservations` | Vendor | **Yes** | Create reservation |
| PUT | `/api/reservations/:id` | Admin | No | Update reservation |
| DELETE | `/api/reservations/:id` | Admin | No | Delete reservation |
| POST | `/api/reservations/:id/approve` | Admin | No | Approve reservation |
| POST | `/api/reservations/:id/reject` | Admin | No | Reject reservation |
| POST | `/api/reservations/:id/occupy` | Admin | No | Mark as occupied |
| POST | `/api/admin/login` | Public | **Yes** | Admin login (JWT) |
| POST | `/api/admin/vendors` | Admin | No | Create vendor |
| GET | `/api/admin/vendors` | Admin | No | List all vendors |
| PUT | `/api/admin/vendors/:id` | Admin | No | Update vendor |
| DELETE | `/api/admin/vendors/:id` | Admin | No | Delete vendor |
| GET | `/api/admin/vendors/:id/reservation-count` | Admin | No | Vendor reservation count |
| POST | `/api/admin/reset` | Admin | No | Reset all stalls |
| POST | `/api/admin/extend-pending` | Admin | No | Extend pending by 1 day |
| POST | `/api/vendors/login-passcode` | Public | **Yes** | Vendor login (JWT) |
| GET | `/api/vendors/me` | Vendor | No | Current vendor profile |
| GET | `/api/vendors/me/reservations` | Vendor | No | Current vendor's reservations |

---

## Scripts

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm test` | Run Vitest (89 tests) |
| `npm run test:watch` | Run Vitest in watch mode |

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API server with file watching |
| `npm start` | Start API server (`node src/index.js`) |
| `npm test` | Run backend tests (19 tests) |

---

## Developer Notes

- **Realtime updates:** SSE endpoint at `/api/events` broadcasts reservation and stall changes. Frontend subscribes and reloads automatically. For stable SSE in dev, set `VITE_API_URL=http://localhost:3001`.

- **Price workflow:** Pending reservations show "Price to be discussed". Admin sets price during approval via the edit form. The price is stored on the stall record and reflected in approved/occupied reservations.

- **Export behavior:** The Price column is conditionally included in CSV/Excel/Word exports — only shown when at least one reservation has a price. Pending rows show "To be discussed".

- **Passcode security:** Vendor passcodes are masked by default in the admin panel. Click the eye icon to reveal.

- **Rejection = Deletion:** When admin rejects a reservation, it is permanently deleted from the database (not just status-changed).

- **Print:** Receipt printing uses `@media print` rules targeting Letter size. The printable view is simplified (no QR, no print button).

## Troubleshooting

### SSE / Dev Proxy

If EventSource disconnects frequently in development:

```powershell
$env:VITE_API_URL='http://localhost:3001'
npm run dev
```

Or check `vite.config.ts` — the dev proxy is configured with `timeout: 0` and `Connection: keep-alive` for SSE support.

### Port Conflicts

- Frontend: `5173` (Vite default)
- Backend: `3001` (Express)

Change in `vite.config.ts` (frontend proxy target) and `backend/.env` if needed.
