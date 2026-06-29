-- Vendor Users table
CREATE TABLE IF NOT EXISTS vendor_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(128) NOT NULL,
  contact_number VARCHAR(32) DEFAULT NULL,
  business_name VARCHAR(128) DEFAULT NULL,
  email VARCHAR(128) DEFAULT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add vendor_id to reservation tables
ALTER TABLE design_map_reservations
  ADD COLUMN vendor_id INT DEFAULT NULL AFTER id,
  ADD FOREIGN KEY (vendor_id) REFERENCES vendor_users(id) ON DELETE SET NULL;

ALTER TABLE all_stalls_reservations
  ADD COLUMN vendor_id INT DEFAULT NULL AFTER id,
  ADD FOREIGN KEY (vendor_id) REFERENCES vendor_users(id) ON DELETE SET NULL;
