-- Migration: Convert reservation_counter to per-section counters
-- Created: 2026-05-20
-- Purpose: Replace single-row reservation_counter schema with a per-section table
-- and migrate the existing counter value into a default section so numbering
-- continues without gaps.

-- IMPORTANT: Review and backup your database before running.

-- 1) Create the new per-section table
CREATE TABLE IF NOT EXISTS reservation_counter_new (
  section VARCHAR(16) PRIMARY KEY,
  counter INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- 2) If you have the old single-row table, copy its counter into a default section
--    This keeps existing numbering available under section 'ALL'.
--    If your current schema already has a 'section' column, skip this step.

-- Copy from old table (uncomment to run if reservation_counter has columns id and counter):
-- INSERT INTO reservation_counter_new (section, counter)
-- SELECT 'ALL', counter FROM reservation_counter WHERE id = 1 LIMIT 1;

-- 3) (Optional) If you prefer to start fresh, you can leave the new table empty.

-- 4) Replace the old table with the new one (only after verifying step 2)
--    Note: This is destructive to the old table. Keep a backup before running.

-- DROP TABLE IF EXISTS reservation_counter_backup;
-- RENAME TABLE reservation_counter TO reservation_counter_backup;
-- RENAME TABLE reservation_counter_new TO reservation_counter;

-- 5) If you want a non-destructive approach, run the following instead of renames:
--    (a) Ensure application will create rows on demand (server code already handles it)
--    (b) Keep the new table as `reservation_counter_new` and do not drop old table.

-- Usage notes:
-- - After migration, reservation numbers will be generated like: RES-2026-A-0001
--   where 'A' is the stall `section` value (uppercased).
-- - Existing reservations keep their `reservation_number` values.
-- - To use per-section counters immediately, either run the RENAME steps above
--   or keep both tables and rely on the server to insert into `reservation_counter`.

-- Example quick-run (destructive; perform a DB backup first):
-- CREATE TABLE IF NOT EXISTS reservation_counter_new (
--   section VARCHAR(16) PRIMARY KEY,
--   counter INT NOT NULL DEFAULT 0
-- ) ENGINE=InnoDB;
-- INSERT INTO reservation_counter_new (section, counter)
-- SELECT 'ALL', counter FROM reservation_counter WHERE id = 1 LIMIT 1;
-- RENAME TABLE reservation_counter TO reservation_counter_backup;
-- RENAME TABLE reservation_counter_new TO reservation_counter;

-- End of migration
