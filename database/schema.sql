-- =============================================================
--  CALAUAN DAY & NIGHT MARKET — MySQL Schema
--  System   : BPLO Stall Reservation Mapping System
--  Version  : 2.0
--  Created  : 2026-05-17
-- =============================================================

CREATE DATABASE IF NOT EXISTS nightmarket;

USE nightmarket;

-- =============================================================
--  TABLE: admin_users
--  Stores authorized BPLO admin accounts.
-- =============================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- store hashed in production
    full_name VARCHAR(128) NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'staff',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- =============================================================
--  TABLE: stalls
--  The master list of all market stalls.
-- =============================================================
CREATE TABLE IF NOT EXISTS stalls (
    id VARCHAR(8) PRIMARY KEY,
    section VARCHAR(64) NOT NULL,
    number INT NOT NULL,
    status ENUM(
        'available',
        'pending',
        'reserved',
        'occupied'
    ) NOT NULL DEFAULT 'available',
    price DECIMAL(10, 2) NOT NULL,
    size ENUM(
        'small',
        'medium',
        'large',
        'corner'
    ) NOT NULL,
    category ENUM(
        'Cooked Food',
        'Vegetables & Fruits',
        'Dry Goods & Groceries',
        'Clothing & Apparel',
        'General Merchandise'
    ) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    reservation_id CHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_stalls_status (status),
    INDEX idx_stalls_section (section),
    INDEX idx_stalls_category (category),
    INDEX idx_stalls_reservation_id (reservation_id)
) ENGINE = InnoDB;

-- =============================================================
--  TABLE: reservations
--  Tracks every stall reservation request made by applicants.
-- =============================================================
CREATE TABLE IF NOT EXISTS reservations (
    id CHAR(36) PRIMARY KEY,
    reservation_number VARCHAR(32) NOT NULL UNIQUE,
    stall_id VARCHAR(8) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    contact_number VARCHAR(32) NOT NULL,
    business_name VARCHAR(128) NULL,
    address VARCHAR(255) NULL,
    status ENUM(
        'pending',
        'approved',
        'rejected',
        'occupied'
    ) NOT NULL DEFAULT 'pending',
    admin_notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reservations_stall_id (stall_id),
    INDEX idx_reservations_status (status),
    INDEX idx_reservations_number (reservation_number),
    INDEX idx_reservations_expires (expires_at),
    CONSTRAINT fk_reservations_stall_id FOREIGN KEY (stall_id) REFERENCES stalls (id) ON DELETE RESTRICT
) ENGINE = InnoDB;

ALTER TABLE stalls
ADD CONSTRAINT fk_stalls_reservation_id FOREIGN KEY (reservation_id) REFERENCES reservations (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS reservation_counter (
    section VARCHAR(16) PRIMARY KEY,
    counter INT NOT NULL DEFAULT 0
) ENGINE = InnoDB;

-- =============================================================
--  TABLE: stall_maps
--  Defines which stalls appear in each map category.
-- =============================================================
CREATE TABLE IF NOT EXISTS stall_maps (
    map_name VARCHAR(32) NOT NULL,
    stall_id VARCHAR(8) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (map_name, stall_id),
    INDEX idx_stall_maps_map (map_name),
    INDEX idx_stall_maps_stall (stall_id),
    CONSTRAINT fk_stall_maps_stall_id FOREIGN KEY (stall_id) REFERENCES stalls (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Optional: seed a default section if desired. Application will create rows on demand.

-- =============================================================
--  VIEW: v_stall_summary
--  Joins stalls with their latest active reservation.
-- =============================================================
CREATE OR REPLACE VIEW v_stall_summary AS
SELECT
    s.id AS stall_id,
    s.section,
    s.number,
    s.status AS stall_status,
    s.price,
    s.size,
    s.category,
    r.id AS reservation_id,
    r.reservation_number,
    r.full_name AS applicant_name,
    r.contact_number,
    r.business_name,
    r.status AS reservation_status,
    r.created_at AS reserved_at,
    r.expires_at
FROM stalls s
    LEFT JOIN reservations r ON r.id = s.reservation_id;

-- =============================================================
--  VIEW: v_pending_reservations
--  Shows all pending reservations with stall details.
-- =============================================================
CREATE OR REPLACE VIEW v_pending_reservations AS
SELECT r.*, s.section, s.category, s.size, s.price
FROM reservations r
    JOIN stalls s ON s.id = r.stall_id
WHERE
    r.status = 'pending'
ORDER BY r.created_at ASC;

-- =============================================================
--  TRIGGER: auto_expire_reservations
-- =============================================================
DELIMITER /
/

CREATE TRIGGER auto_expire_reservations
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
  IF NEW.status = 'pending' AND NEW.expires_at < NOW() THEN
    UPDATE reservations
    SET    status      = 'rejected',
           admin_notes = 'Auto-cancelled: Reservation expired after 3 days.',
           updated_at  = NOW()
    WHERE  id = NEW.id;

    UPDATE stalls
    SET    status         = 'available',
           reservation_id = NULL,
           updated_at     = NOW()
    WHERE  id = NEW.stall_id
      AND  status = 'pending';
  END IF;
END
/
/

DELIMITER;

-- =============================================================
--  TRIGGER: update_stall_on_approve
-- =============================================================
DELIMITER /
/

CREATE TRIGGER update_stall_on_approve
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE stalls
    SET    status     = 'reserved',
           updated_at = NOW()
    WHERE  id = NEW.stall_id;
  END IF;
END

DELIMITER;

-- =============================================================
--  TRIGGER: update_stall_on_reject
-- =============================================================
DELIMITER / /

CREATE TRIGGER update_stall_on_reject
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
  IF NEW.status = 'rejected' AND OLD.status IN ('pending', 'approved') THEN
    UPDATE stalls
    SET    status         = 'available',
           reservation_id = NULL,
           updated_at     = NOW()
    WHERE  id = NEW.stall_id;
  END IF;
END//

DELIMITER;

-- =============================================================
--  TRIGGER: update_stall_on_occupied
-- =============================================================
DELIMITER / /

CREATE TRIGGER update_stall_on_occupied
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
  IF NEW.status = 'occupied' AND OLD.status = 'approved' THEN
    UPDATE stalls
    SET    status     = 'occupied',
           updated_at = NOW()
    WHERE  id = NEW.stall_id;
  END IF;
END//

DELIMITER;

-- =============================================================
--  SEED: Default admin user
-- =============================================================
INSERT IGNORE INTO
    admin_users (
        username,
        password,
        full_name,
        role
    )
VALUES (
        'admin',
        'bplo2026',
        'BPLO Administrator',
        'admin'
    );