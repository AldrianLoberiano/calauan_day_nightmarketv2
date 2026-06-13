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
    ('260', 'Right Column', 260, 'available', 2500, 'medium',
     'General Merchandise',
     'Great for personal care products and hygiene goods.',
     'https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('261', 'Right Column', 261, 'available', 1500, 'small',
     'Cooked Food',
     'Corner stall with extra space for cooking equipment and display.',
     'https://images.unsplash.com/photo-1504674900247-0877df9cc836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('262', 'Right Column', 262, 'available', 2500, 'medium',
     'Vegetables & Fruits',
     'Corner stall with wide display area for colorful produce.',
     'https://images.unsplash.com/photo-1540420773420-3366772f4999?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('263', 'Right Column', 263, 'available', 2500, 'medium',
     'Dry Goods & Groceries',
     'Corner location with high foot traffic, ideal for grocery items.',
     'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('264', 'Right Column', 264, 'available', 3500, 'large',
     'Clothing & Apparel',
     'High-visibility location for fashion retail and trendy items.',
     'https://images.unsplash.com/photo-1441986300917-64674bd600d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('265', 'Right Column', 265, 'available', 2500, 'medium',
     'General Merchandise',
     'Suitable for school supplies, notebooks, and art materials.',
     'https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('266', 'Right Column', 266, 'available', 1500, 'small',
     'Cooked Food',
     'Great for silog meals, merienda, and affordable daily lunches.',
     'https://images.unsplash.com/photo-1504674900247-0877df9cc836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('267', 'Right Column', 267, 'available', 2500, 'medium',
     'Vegetables & Fruits',
     'Suitable for exotic fruits, organic veggies, and fresh herbs.',
     'https://images.unsplash.com/photo-1540420773420-3366772f4999?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('268', 'Right Column', 268, 'available', 2500, 'medium',
     'Dry Goods & Groceries',
     'Suitable for noodles, crackers, biscuits, and packaged foods.',
     'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('269', 'Right Column', 269, 'available', 3500, 'large',
     'Clothing & Apparel',
     'Suitable for children''s clothing, school supplies, and toys.',
     'https://images.unsplash.com/photo-1441986300917-64674bd600d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('270', 'Right Column', 270, 'available', 2500, 'medium',
     'General Merchandise',
     'Excellent for seeds, gardening tools, and farm supplies.',
     'https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('271', 'Right Column', 271, 'available', 1500, 'small',
     'Cooked Food',
     'Excellent for baked goods, pastries, and Filipino desserts.',
     'https://images.unsplash.com/photo-1504674900247-0877df9cc836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('272', 'Right Column', 272, 'available', 2500, 'medium',
     'Vegetables & Fruits',
     'Prime spot for selling locally sourced farm produce.',
     'https://images.unsplash.com/photo-1540420773420-3366772f4999?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('273', 'Right Column', 273, 'available', 2500, 'medium',
     'Dry Goods & Groceries',
     'Ideal for selling canned goods, condiments, and dry groceries.',
     'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('274', 'Right Column', 274, 'available', 3500, 'large',
     'Clothing & Apparel',
     'Perfect for selling everyday clothing and accessories.',
     'https://images.unsplash.com/photo-1441986300917-64674bd600d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('275', 'Right Column', 275, 'available', 2500, 'medium',
     'General Merchandise',
     'Perfect for kitchenware, cookware, and home essentials.',
     'https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL),
    ('276', 'Right Column', 276, 'available', 1500, 'small',
     'Cooked Food',
     'High-traffic location great for fast food and ready-to-eat items.',
     'https://images.unsplash.com/photo-1504674900247-0877df9cc836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
     NULL);

UPDATE stalls
SET status = 'available',
    reservation_id = NULL,
    updated_at = NOW()
WHERE id REGEXP '^[0-9]+$'
  AND CAST(id AS UNSIGNED) BETWEEN 259 AND 276;

INSERT IGNORE INTO reservation_counter (section, counter) VALUES ('R', 0);

INSERT IGNORE INTO stall_maps (map_name, stall_id)
SELECT 'design_map', id
FROM stalls
WHERE id REGEXP '^[0-9]+$'
  AND CAST(id AS UNSIGNED) BETWEEN 259 AND 276;

INSERT IGNORE INTO stall_maps (map_name, stall_id)
SELECT 'all_stalls', id
FROM stalls
WHERE id REGEXP '^[0-9]+$'
  AND CAST(id AS UNSIGNED) BETWEEN 259 AND 276;

SELECT id, section, number, status, size, category
FROM stalls
WHERE id REGEXP '^[0-9]+$'
  AND CAST(id AS UNSIGNED) BETWEEN 259 AND 276
ORDER BY CAST(id AS UNSIGNED);
