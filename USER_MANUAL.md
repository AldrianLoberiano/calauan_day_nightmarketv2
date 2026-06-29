# Calauan Day & Night Market — User Manual

## Overview

Calauan Day & Night Market Stall Reservation System is a web application for browsing market stalls, making reservations, and managing stall data. It supports two independent maps (Map A and Map B) with vendor-specific access.

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL database
- npm

### Install

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

### Run

```bash
# Backend (from backend/)
npm run dev

# Frontend (from frontend/)
npm run dev
```

### Default Credentials

| Role | Username | Password / Passcode |
|------|----------|---------------------|
| Admin | `admin` | `admin123` |
| Vendor | Auto-generated | Passcode: shown in admin panel |

---

## User Guide

### Public / Visitor (Homepage)

1. **Browse stalls** — Open the app to see the stall map (Map A) with color-coded availability.
2. **Switch maps** — Use the dropdown to switch between Map A (Bazaar) and Map B (Night Market).
3. **View Full Map** — Click "View Full Map" in the zoom controls bar to see a fullscreen version of the current map.
4. **Stall directory** — Scroll down to browse stalls in a searchable, filterable grid organized by section (A, B, AA, BB, C, D, G).
5. **Click a stall** — Opens the stall detail modal showing status, category, and vendor info (if reserved).
6. **Reserve** — Click "Reserve" on an available stall. Fill in Full Name and Contact Number. Submit to get a reservation number.
7. **Print receipt** — After reservation, a receipt modal appears. Use your browser's print function (optimized for Letter size).

### Vendor

1. **Login** — Go to `/vendor` and enter your email + passcode (provided by admin).
2. **Dashboard** — View your reservations with details and status.
3. **Search reservations** — Use the search bar to filter by reservation number, stall ID, or name.
4. **Price display** — Your reservation card shows the agreed price (green) or "Price to be discussed" (amber) if no price has been set yet.
5. **Map restriction** — You can only reserve stalls on your assigned map (Map A or Map B). The homepage will show "Your Map" badge and gray out the other map.
6. **Logout** — Click your avatar in the header, then click "Sign out". A confirmation modal will appear.

### Admin

1. **Login** — Go to `/admin` and enter admin credentials.
2. **Dashboard tabs:**
   - **Overview** — Charts showing stall status distribution and reservation counts.
   - **Map A Reservations** — List all Map A reservations with search and status filters.
   - **Map B Reservations** — List all Map B reservations with search and status filters.
   - **Map A** — Interactive visual map of Map A stalls.
   - **Map B** — Grid view of Map B stalls.
   - **Vendors** — Manage vendor accounts.
3. **Real-time updates** — Reservations auto-refresh every 3 seconds. Data also refreshes when you switch back to the browser tab.

#### Vendor Management

4. **Create vendor** — Click "Add Vendor", enter Full Name and Email. Username and passcode are auto-generated.
5. **Map assignment** — When creating or editing a vendor, select their map (Map A or Map B) from the dropdown.
6. **Search vendors** — Use the search bar to filter by name, business name, email, or contact number.
7. **Filter by map** — Use the dropdown to show All Maps, Map A (Bazaar), or Map B (Night Market) vendors only.
8. **View passcodes** — Passcodes are masked by default. Click the eye icon to reveal.
9. **Edit vendor** — Click the edit icon to change name, email, business, contact, status, or map assignment.
10. **Delete vendor** — Click the delete icon. Blocked if the vendor has existing reservations (deactivate instead).

#### Reservation Management

11. **View details** — Click any reservation card to see full details.
12. **Price display** — All reservation cards show the price:
    - **Green badge**: Price set (e.g., ₱2,500)
    - **Amber badge**: "Price to be discussed" (pending with no price set)
13. **Approve** — Sets the reservation to approved. The stall becomes "reserved".
14. **Reject** — Deletes the reservation permanently and releases the stall.
15. **Mark Occupied** — Changes the stall to "occupied".
16. **Delete** — Removes the reservation with a confirmation popup. A green toast notification appears on the dashboard after deletion.
17. **Edit reservation** — Click "Edit" to modify name, contact, business, DTI, cedula, address, status, or price.

#### Reports & Export

18. **Export** — Click "Export" on the reservations tab to download as CSV, Excel (.xlsx), or Word (.docx).
19. **Price in exports** — The Price column is only included when reservations have a price set. Pending reservations show "To be discussed".

#### Settings

20. **Extend Pending** — Adds 1 day to all pending reservations.
21. **Reset All Stalls** — Resets all stall statuses to "available" and clears all reservations.

---

## Reservation Lifecycle

```
Visitor reserves stall → Status: pending (expires in 4 days)
  Price: "To be discussed"
        ↓
Admin reviews → Sets price during approval
        ↓
Admin approves → Status: approved → Stall: reserved
        ↓
Admin marks occupied → Status: occupied → Stall: occupied
```

- Pending reservations show "Price to be discussed" until the admin sets a price.
- Pending reservations expire automatically after 4 days if not processed.
- Approved reservations show the agreed price and change the stall to "reserved".
- Occupied reservations are final.
- Rejected reservations are permanently deleted.

---

## Two-Map System

| Map | Source | Stalls | Description |
|-----|--------|--------|-------------|
| Map A | `design_map` | 319 | Bazaar layout (visual map) |
| Map B | `all_stalls` | 319 | Full grid view of all stalls |

- Each vendor is assigned to one map via the `event` field (Bazaar = Map A, Night Market = Map B).
- Vendors can only reserve stalls on their assigned map.
- The homepage dropdown restricts access to the non-assigned map.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| App won't start | Check Node version (18+), run `npm install`, verify DB is running |
| Database errors | Verify `backend/.env` credentials, check MySQL is running |
| Stalls not loading | Check backend logs, verify `/api/health` returns 200 |
| Vendor can't reserve wrong map | This is by design — vendor is assigned to a specific map |
| Reservation not showing | Check if it expired (4 days), was rejected (deleted), or you're on the wrong map tab |
| Receipt won't print | Use Ctrl+P / Cmd+P in the receipt modal |
| Price shows ₱2,500 for pending | Refresh the page — backend fix requires restart |
| Real-time updates not working | Check SSE connection at `/api/health/details` |
| Passcode not visible | Click the eye icon next to the masked passcode in vendor management |

---

## Developers

### Project Structure

```
├─ frontend/              # React + TypeScript + Vite frontend
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ components/
│  │  │  │  ├─ admin/      # AdminDashboard, VendorManagement, ReservationCard, etc.
│  │  │  │  └─ stalls/     # StallMap, StallGridView, ReceiptModal, etc.
│  │  │  ├─ pages/         # UserPage, AdminPage
│  │  │  │  └─ vendor/     # VendorDashboard, VendorLoginPage
│  │  │  ├─ types/         # TypeScript types
│  │  │  └─ utils/         # API client, helpers, export, tests
│  │  └─ styles/
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.ts
│  └─ vitest.config.ts
├─ backend/               # Node.js + Express backend
│  ├─ src/
│  │  ├─ index.js          # All API routes, auth, SSE, rate limiting
│  │  ├─ db.js             # MySQL connection pool
│  │  ├─ stalls.js         # Stall data generation
│  │  └─ __tests__/        # Backend tests
│  ├─ database/            # SQL schema files
│  ├─ scripts/
│  ├─ .env                 # DB credentials, JWT_SECRET, CORS_ORIGIN
│  └─ package.json
├─ README.md
└─ USER_MANUAL.md
```

### Scripts

#### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm test` | Run Vitest (89 tests) |
| `npm run test:watch` | Run Vitest in watch mode |

#### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API server with file watching |
| `npm start` | Start API server |
| `npm test` | Run backend tests (19 tests) |

### Key Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/stalls` | Public | All stalls |
| `GET /api/reservations` | Public | All reservations |
| `POST /api/reservations` | Vendor | Create reservation (rate limited) |
| `PUT /api/reservations/:id` | Admin | Update reservation |
| `DELETE /api/reservations/:id` | Admin | Delete reservation |
| `POST /api/reservations/:id/approve` | Admin | Approve reservation |
| `POST /api/reservations/:id/reject` | Admin | Reject reservation (deletes it) |
| `POST /api/reservations/:id/occupy` | Admin | Mark as occupied |
| `POST /api/admin/login` | Public | Admin login (rate limited) |
| `POST /api/vendors/login-passcode` | Public | Vendor login (rate limited) |
| `GET /api/events` | Public | SSE realtime stream |
| `GET /api/health/details` | Admin | System diagnostics |

### Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DB_HOST` | Yes | MySQL host |
| `DB_USER` | Yes | MySQL username |
| `DB_PASSWORD` | Yes | MySQL password |
| `DB_NAME` | Yes | Database name |
| `JWT_SECRET` | Yes | Secret for JWT signing (server exits if missing) |
| `CORS_ORIGIN` | No | Allowed origin in production (default: `*` in dev) |
| `VITE_API_URL` | No | Backend URL for frontend (default: `/api`) |
