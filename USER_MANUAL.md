# Calauan Day & Night Market — User Manual

## Overview

Calauan Day & Night Market Stall Reservation System is a web application for browsing market stalls, making reservations, and managing stall data. It supports two independent maps (Map A and Map B) with vendor-specific access.

## Quick Start

### Prerequisites

- Node.js 16+
- MySQL database
- npm

### Install

```bash
# Client (root)
npm install

# Server
cd server
npm install
```

### Run

```bash
# Backend (from server/)
npm run dev

# Frontend (from project root)
npm run dev
```

### Default Credentials

| Role | Username | Password / Passcode |
|------|----------|---------------------|
| Admin | `admin` | `bplo2026` |
| Vendor | `vendor` | Passcode: shown in admin panel |

---

## User Guide

### Public / Visitor (Homepage)

1. **Browse stalls** — Open the app to see the stall map (Map A) with color-coded availability.
2. **Switch maps** — Use the dropdown to switch between Map A (Bazaar) and Map B (Night Market).
3. **View Full Map** — Click "View Full Map" in the zoom controls bar to see a fullscreen version of the current map.
4. **Stall directory** — Scroll down to browse stalls in a searchable, filterable grid organized by section (A, B, AA, BB, C, D, G).
5. **Click a stall** — Opens the stall detail modal showing status, category, price, and vendor info (if reserved).
6. **Reserve** — Click "Reserve" on an available stall. Fill in Full Name and Contact Number. Submit to get a reservation number.
7. **Print receipt** — After reservation, a receipt modal appears. Use your browser's print function (optimized for Letter size).

### Vendor

1. **Login** — Go to `/vendor` and enter your email + passcode (provided by admin).
2. **Dashboard** — View your reservations, stall details, and status.
3. **Map restriction** — You can only reserve stalls on your assigned map (Map A or Map B). The homepage will show "Your Map" badge and gray out the other map.
4. **Logout** — Click your avatar in the header, then click "Sign out". A confirmation modal will appear.

### Admin

1. **Login** — Go to `/admin` and enter admin credentials.
2. **Dashboard tabs:**
   - **Overview** — Charts showing stall status distribution and reservation counts.
   - **Reservations** — List all reservations. Click to view details, approve, reject, or mark as occupied.
   - **Vendors** — Manage vendor accounts.
3. **Create vendor** — Click "Add Vendor", enter Full Name and Email. Username and passcode are auto-generated.
4. **Map assignment** — When creating or editing a vendor, select their map (Map A or Map B) from the dropdown.
5. **Edit vendor** — Click the edit icon to change name, email, business, contact, status, or map assignment.
6. **Delete vendor** — Click the delete icon. Blocked if the vendor has existing reservations (deactivate instead).
7. **Reservation actions:**
   - **Approve** — Changes stall status to "reserved".
   - **Reject** — Releases the stall back to "available".
   - **Mark Occupied** — Changes stall status to "occupied".
   - **Delete** — Removes the reservation entirely.
8. **Tools:**
   - **Extend Pending** — Adds 1 day to all pending reservations.
   - **Reset All Stalls** — Resets all stall statuses to "available".

---

## Reservation Lifecycle

```
Visitor reserves stall → Status: pending (expires in 4 days)
        ↓
Admin approves → Status: approved → Stall: reserved
        ↓
Admin marks occupied → Status: occupied → Stall: occupied
```

- Pending reservations expire automatically after 4 days if not processed.
- Approved reservations change the stall to "reserved".
- Occupied reservations are final.

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
| App won't start | Check Node version, run `npm install`, verify DB is running |
| Database errors | Verify `server/.env` credentials, check MySQL is running |
| Stalls not loading | Check backend logs, verify `/api/health` returns 200 |
| Vendor can't reserve wrong map | This is by design — vendor is assigned to a specific map |
| Reservation not showing | Check if it expired (4 days) or was rejected |
| Receipt won't print | Use Ctrl+P / Cmd+P in the receipt modal |

---

## Developers

### Project Structure

```
├─ server/              # Node.js + Express backend
│  ├─ src/
│  │  ├─ index.js       # All API routes, auth, SSE
│  │  ├─ db.js          # MySQL connection pool
│  │  └─ stalls.js      # Stall data generation
│  └─ .env              # DB credentials
├─ src/                 # React + TypeScript frontend
│  └─ app/
│     ├─ components/
│     │  ├─ admin/      # Admin dashboard, login, vendor management
│     │  └─ stalls/     # StallMap, StallGridView, modals
│     ├─ pages/         # UserPage, AdminPage
│     │  └─ vendor/     # VendorDashboard, VendorLoginPage, VendorPage
│     ├─ types/         # TypeScript types
│     └─ utils/         # API client, helpers, tests
├─ database/            # SQL schema files
└─ public/images/       # Static images
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run test` | Run Vitest (108 tests) |
| `npm run test:watch` | Run Vitest in watch mode |

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/stalls` | All stalls |
| `GET /api/reservations` | All reservations |
| `POST /api/reservations` | Create reservation (vendor auth) |
| `POST /api/admin/login` | Admin login |
| `POST /api/vendors/login-passcode` | Vendor login |
| `GET /api/events` | SSE realtime stream |
| `GET /api/health/details` | System diagnostics |

---

