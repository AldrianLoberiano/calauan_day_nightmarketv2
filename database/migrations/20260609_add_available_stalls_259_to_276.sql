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
     'Ideal for school uniforms, casual wear, and workwear.',
     'https://images.unsplash.com/photo-1441986300917-64674bd600d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
