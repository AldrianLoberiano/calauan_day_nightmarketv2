-- Purpose: Update stall IDs D1-D4 to D36-D39 and move reservations.

-- IMPORTANT: Review and backup your database before running.

START TRANSACTION;
SET @old_fk_checks = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- Update reservations first so any existing links move to new IDs
UPDATE reservations
SET stall_id = CASE stall_id
  WHEN 'D1' THEN 'D36'
  WHEN 'D2' THEN 'D37'
  WHEN 'D3' THEN 'D38'
  WHEN 'D4' THEN 'D39'
  ELSE stall_id
END
WHERE stall_id IN ('D1','D2','D3','D4');

-- Rename stalls
UPDATE stalls
SET id = CASE id
  WHEN 'D1' THEN 'D36'
  WHEN 'D2' THEN 'D37'
  WHEN 'D3' THEN 'D38'
  WHEN 'D4' THEN 'D39'
  ELSE id
END,
    section = 'Corner D'
WHERE id IN ('D1','D2','D3','D4');

SET FOREIGN_KEY_CHECKS = @old_fk_checks;
COMMIT;

-- End of migration
