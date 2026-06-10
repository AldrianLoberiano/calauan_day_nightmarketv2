-- =============================================================
--  MIGRATION: Add available stalls 259-276 (Right Column)
--  Database : nightmarket
--  Date     : 2026-06-09
--  Purpose  : Adds the missing Right Column stalls shown between
--             258 and 277, and marks them available.
-- =============================================================

USE nightmarket;

INSERT IGNORE INTO stalls
    (id, section, number, status, price, size, category, description, image_url, reservation_id)
