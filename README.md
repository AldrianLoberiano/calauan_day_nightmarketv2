# stall Reservation Mapping System

stall Reservation Mapping System is a Vite + React + TypeScript app for managing day and night market stall reservations. It provides user and admin flows, visual stall mapping, and reservation management features.

## Features

- User and admin pages with reservation workflows
- Interactive stall map and stall detail views
- Reservation form and receipt modals
- UI kit components for consistent styling
- Admin tools to reset all stalls, clear reservations, and reset the reservation counter
- Admin action to extend all pending reservations by 1 day
- Pending reservations now expire after 4 days by default
- Category filter simplified to Food vs Non-Food in the user stall directory

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS

## API

This project includes a Node/Express + MySQL backend under `server/`.

### Backend setup

1. Create the database using [database/schema.sql](database/schema.sql).
2. Copy `server/.env.example` to `server/.env` and update credentials.
3. Install backend dependencies:
   - `cd server`
   - `npm i`
4. Start the API server:
   - `npm run dev`

The frontend expects the API at `http://localhost:5174/api`. You can override this with `VITE_API_URL` in `.env`.

## Project Structure

```
.
├─ .env
├─ .env.example
├─ ATTRIBUTIONS.md
├─ database/
│  ├─ README.md
│  └─ schema.sql
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
│     └─ stalls.js
├─ src/
│  ├─ main.tsx
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ components/
│  │  │  ├─ admin/
│  │  │  │  ├─ AdminDashboard.tsx
│  │  │  │  ├─ AdminLogin.tsx
│  │  │  │  ├─ ReservationCard.tsx
│  │  │  │  └─ ReservationDetailsModal.tsx
│  │  │  ├─ primitives/
│  │  │  │  ├─ ReceiptModal.tsx
│  │  │  │  ├─ ReservationFormModal.tsx
│  │  │  │  ├─ StallDetailModal.tsx
│  │  │  │  └─ StallMap.tsx
│  │  │  └─ public/
│  │  ├─ data/
│  │  │  └─ stallData.ts
│  │  ├─ imports/
│  │  ├─ pages/
│  │  │  ├─ AdminPage.tsx
│  │  │  └─ UserPage.tsx
│  │  ├─ types/
│  │  │  └─ index.ts
│  │  └─ utils/
│  │     ├─ helpers.ts
│  │     └─ storage.ts
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

## Recent developer notes
