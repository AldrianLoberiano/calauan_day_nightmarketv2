  ELSE id
END,
    section = 'Corner D'
WHERE id IN ('D1','D2','D3','D4');

SET FOREIGN_KEY_CHECKS = @old_fk_checks;
COMMIT;

-- End of migration
