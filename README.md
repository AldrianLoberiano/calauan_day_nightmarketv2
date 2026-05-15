# stall Reservation Mapping System

stall Reservation Mapping System is a Vite + React + TypeScript app for managing day and night market stall reservations. It provides user and admin flows, visual stall mapping, and reservation management features.

## Features

- User and admin pages with reservation workflows
- Interactive stall map and stall detail views
- Reservation form and receipt modals
- UI kit components for consistent styling

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS

## API

This project currently runs without a backend API. Data is sourced from local files and persisted in browser storage:

- Mock data: `src/app/data/stallData.ts`
- Storage helpers: `src/app/utils/storage.ts`

If you plan to connect a real API, add an API client layer (for example, in `src/app/utils/`) and replace the mock data usage in the pages and components.

## Project Structure

```
.
├─ index.html
├─ package.json
├─ postcss.config.mjs
├─ vite.config.ts
├─ guidelines/
│  └─ Guidelines.md
├─ src/
│  ├─ main.tsx
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ routes.tsx
│  │  ├─ components/
│  │  │  ├─ ReceiptModal.tsx
│  │  │  ├─ ReservationFormModal.tsx
│  │  │  ├─ StallDetailModal.tsx
│  │  │  ├─ StallMap.tsx
│  │  │  ├─ admin/
│  │  │  │  ├─ AdminDashboard.tsx
│  │  │  │  ├─ AdminLogin.tsx
│  │  │  │  └─ ReservationCard.tsx
│  │  │  ├─ figma/
│  │  │  │  └─ ImageWithFallback.tsx
│  │  │  └─ ui/
│  │  │     └─ ...
│  │  ├─ data/
│  │  │  └─ stallData.ts
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
