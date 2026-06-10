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
VALUES
    ('259', 'Right Column', 259, 'available', 3500, 'large',
     'Clothing & Apparel',
