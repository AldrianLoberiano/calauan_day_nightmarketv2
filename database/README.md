# Database — Calauan Day & Night Market

Stall Reservation Mapping System · BPLO

---

## Files

| File         | Purpose                                                  |
| ------------ | -------------------------------------------------------- |
| `schema.sql` | Full SQL schema — tables, indexes, views, triggers       |
| `seed.json`  | Seed data — config, rules, admin users, reference values |

---

## Tables

### `stalls`

Master list of all 277 market stalls.

| Column           | Type    | Description                                       |
| ---------------- | ------- | ------------------------------------------------- |
| `id`             | TEXT PK | Stall ID (e.g. `"1"`, `"A1"`)                     |
| `section`        | TEXT    | Market section name                               |
| `number`         | INTEGER | Row number (0 = corner stall)                     |
| `status`         | TEXT    | `available` · `pending` · `reserved` · `occupied` |
| `price`          | REAL    | Monthly rent in PHP                               |
| `size`           | TEXT    | `small` · `medium` · `large` · `corner`           |
| `category`       | TEXT    | One of 5 stall categories                         |
| `description`    | TEXT    | Stall description text                            |
| `image_url`      | TEXT    | Unsplash image URL                                |
| `reservation_id` | TEXT FK | Active reservation (nullable)                     |

### `reservations`

Every reservation request submitted by applicants.

| `expires_at` | TEXT | `created_at` + 3 days |
| `updated_at` | TEXT | Last modified timestamp |

### `admin_users`
Authorized BPLO staff accounts.

| Column | Type | Description |
|--------|------|-------------|
| `username` | TEXT UNIQUE | Login username |
| `password` | TEXT | Plain text (hash in production) |
| `role` | TEXT | `admin` · `staff` |

### `reservation_counter`
Single-row counter for generating sequential reservation numbers.

---

## Stall Layout (277 total)

| Section | Stall IDs | Count |
|---------|-----------|-------|
| Bottom Row | 1 – 71 | 71 |
| Left Column | 72 – 134 | 63 |
| Top Left Corner | 135 | 1 |
| Top Row | 136 – 196 | 61 |
| Upper Right Row | 197 – 225 | 29 |
| Right Column | 226 – 258 | 33 |
| Corner A | A1 – A5 | 5 |
| Corner B | B1 – B4 | 4 |
| Corner C | C1 – C4 | 4 |
| Corner D | D1 – D6 | 6 |
| **Total** | | **277** |

---

## Pricing

| Size | Monthly Rent |
|------|-------------|
| Small (6 sqm) | ₱1,500 |
| Medium (10 sqm) | ₱2,500 |
| Large (16 sqm) | ₱3,500 |
| Corner (20 sqm) | ₱4,500 |

---

## localStorage Keys (current implementation)

```
pwesto_stalls           → Stall[] JSON array
pwesto_reservations     → Reservation[] JSON array
pwesto_reservation_counter → integer counter
```

---

## Default Admin Credentials

```
Username : admin
Password : bplo2026
```

> Change before deploying to production.

---

## Reservation Number Format

```
RES-{YEAR}-{4-digit counter}
Example: RES-2026-0001
```

Reservations expire **3 days** after creation if not processed at the BPLO Office.

## Feature Enhancements
- Add `applicant_email` to `reservations` for email notifications.
- Implement password hashing for 'admin users' in production.
- Add `payment_status` to `reservations` for tracking payments
