import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db.js';
import { generateInitialStalls } from './stalls.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in environment. Add it to .env');
  process.exit(1);
}
const JWT_EXPIRES_IN = '7d';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
const DEFAULT_VENDOR_PASSWORD = process.env.DEFAULT_VENDOR_PASSWORD || 'vendor123';
const NEW_VENDOR_PASSWORD = process.env.NEW_VENDOR_PASSWORD || 'changeme';
const SECURITY_QUESTION = process.env.SECURITY_QUESTION || 'What is the name of this market?';
const SECURITY_ANSWER = (process.env.SECURITY_ANSWER || 'calauan').toLowerCase();

const VALID_SOURCES = ['design_map', 'all_stalls'];

app.disable('x-powered-by');
app.set('trust proxy', 1);

const corsOrigin = process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? false : '*');
app.use(cors(typeof corsOrigin === 'string' ? { origin: corsOrigin } : {}));
app.use(express.json());

// ─── Simple Rate Limiter ─────────────────────────────────────
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `login:${ip}`;
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    loginAttempts.set(key, { start: now, count: 1 });
    return next();
  }
  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ message: 'Too many login attempts. Try again later.' });
  }
  next();
}

// --- Rate limiter for reservation creation ---
const reservationAttempts = new Map();
const RESERVATION_RATE_LIMIT = 5;

function reservationRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `res:${ip}`;
  const now = Date.now();
  const record = reservationAttempts.get(key);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    reservationAttempts.set(key, { start: now, count: 1 });
    return next();
  }
  record.count++;
  if (record.count > RESERVATION_RATE_LIMIT) {
    return res.status(429).json({ message: 'Too many reservations. Please wait before creating another.' });
  }
  next();
}

// --- Simple SSE (Server-Sent Events) broadcaster for real-time updates ---
const sseClients = new Set();
const sseHeartbeats = new Map();

function sendSseEvent(event, data) {
  const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch (err) {
      // ignore broken pipe — remove client
      sseClients.delete(res);
    }
  }
}

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  res.write('\n');
  sseClients.add(res);
  // write a heartbeat every 15s to keep proxies from closing the connection
  const hb = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (err) {
      clearInterval(hb);
      sseClients.delete(res);
    }
  }, 15000);
  sseHeartbeats.set(res, hb);
  req.on('close', () => {
    sseClients.delete(res);
    const id = sseHeartbeats.get(res);
    if (id) clearInterval(id);
    sseHeartbeats.delete(res);
  });
});

function mapReservation(row) {
  return {
    id: row.id,
    reservationNumber: row.reservation_number,
    stallId: row.stall_id,
    fullName: row.full_name,
    contactNumber: row.contact_number,
    businessName: row.business_name,
    dtiNumber: row.dti_number,
    cedulaNumber: row.cedula_number,
    address: row.address,
    status: row.status,
    adminNotes: row.admin_notes,
    price: row.status !== 'pending' && row.stall_price != null ? Number(row.stall_price) : undefined,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    updatedAt: row.updated_at,
  };
}

function mapStall(row) {
  return {
    id: row.id,
    section: row.section,
    number: row.number,
    status: row.status,
    price: Number(row.price),
    size: row.size,
    category: row.category,
    description: row.description,
    image: row.image_url,
    reservationId: row.reservation_id || undefined,
  };
}

function mapViewReservation(row) {
  return {
    id: row.id,
    reservationNumber: row.reservation_number,
    stallId: row.stall_id,
    fullName: row.full_name,
    contactNumber: row.contact_number,
    businessName: row.business_name,
    dtiNumber: row.dti_number,
    cedulaNumber: row.cedula_number,
    address: row.address,
    stallUsageType: row.stall_usage_type,
    status: row.status,
    adminNotes: row.admin_notes,
    price: row.status !== 'pending' && row.stall_price != null ? Number(row.stall_price) : undefined,
    source: row.source,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    updatedAt: row.updated_at,
  };
}

async function ensureStallsSeeded() {
  const tables = ['design_map_stalls', 'all_stalls_stalls'];
  for (const table of tables) {
    const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM ${table}`);
    const count = rows[0]?.count ?? 0;
    if (count > 0) continue;

    const stalls = generateInitialStalls();
    const values = stalls.map((s) => [
      s.id, s.section, s.number, 'available', s.price, s.size, s.category, s.description, s.image_url, null,
    ]);

    await pool.query(
      `INSERT IGNORE INTO ${table}
        (id, section, number, status, price, size, category, description, image_url, reservation_id)
       VALUES ?`,
      [values]
    );
  }
}

async function ensureDefaultVendor() {
  try {
    const [rows] = await pool.query('SELECT id FROM vendor_users WHERE username = ? LIMIT 1', ['vendor']);
    if (rows.length === 0) {
      const hash = await bcrypt.hash(DEFAULT_VENDOR_PASSWORD, 10);
      await pool.query(
        'INSERT INTO vendor_users (username, password_hash, full_name, contact_number, business_name) VALUES (?, ?, ?, ?, ?)',
        ['vendor', hash, 'Sample Vendor', '09171234567', 'Sample Business']
      );
      console.log(`Default vendor account created: vendor / ${DEFAULT_VENDOR_PASSWORD}`);
    }
  } catch (e) {
    console.warn('Could not ensure default vendor:', e?.message || e);
  }
}

async function ensureDefaultAdmin() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(64) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // Ensure password_hash column exists (add if missing)
    try {
      const [hashCol] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'password_hash'`
      );
      if (hashCol.length === 0) {
        await pool.query(`ALTER TABLE admin_users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''`);
      }
    } catch { /* column exists */ }

    // Migrate old plaintext password column to password_hash if needed
    try {
      const [cols] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'password'`
      );
      if (cols.length > 0) {
        const [allAdmins] = await pool.query('SELECT id, password FROM admin_users');
        for (const admin of allAdmins) {
          if (admin.password && !admin.password.startsWith('$2')) {
            const hash = await bcrypt.hash(admin.password, 10);
            await pool.query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, admin.id]);
          } else if (admin.password && admin.password.startsWith('$2')) {
            await pool.query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [admin.password, admin.id]);
          }
        }
        await pool.query('ALTER TABLE admin_users DROP COLUMN password');
      }
    } catch { /* column may already be migrated */ }

    const [rows] = await pool.query('SELECT id FROM admin_users WHERE username = ? LIMIT 1', ['admin']);
    if (rows.length === 0) {
      const hash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      await pool.query(
        'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
        ['admin', hash]
      );
    }
  } catch (e) {
    console.warn('Could not ensure default admin:', e?.message || e);
  }
}

async function ensureAvailableStalls259To276() {
  const tables = ['design_map_stalls', 'all_stalls_stalls'];
  const stalls = generateInitialStalls().filter((stall) => {
    const numericId = Number(stall.id);
    return Number.isFinite(numericId) && numericId >= 259 && numericId <= 276;
  });

  if (stalls.length === 0) return;

  const values = stalls.map((s) => [
    s.id, s.section, s.number, 'available', s.price, s.size, s.category, s.description, s.image_url, null,
  ]);

  for (const table of tables) {
    await pool.query(
      `INSERT IGNORE INTO ${table}
        (id, section, number, status, price, size, category, description, image_url, reservation_id)
       VALUES ?`,
      [values]
    );
  }
}

// Ensure reservation columns for DTI and cedula exist (adds columns if missing)
async function ensureReservationColumns() {
  try {
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservations' AND COLUMN_NAME IN ('dti_number','cedula_number')`
    );
    const existing = new Set(cols.map(c => c.COLUMN_NAME));
    const queries = [];
    if (!existing.has('dti_number')) {
      queries.push(`ALTER TABLE reservations ADD COLUMN dti_number VARCHAR(64) NULL`);
    }
    if (!existing.has('cedula_number')) {
      queries.push(`ALTER TABLE reservations ADD COLUMN cedula_number VARCHAR(64) NULL`);
    }
    for (const q of queries) {
      await pool.query(q);
    }
  } catch (e) {
    // non-fatal: log and continue
    console.warn('Could not ensure reservation columns:', e?.message || e);
  }
}

// Ensure design_map_stalls, all_stalls_stalls, design_map_reservations and all_stalls_reservations tables exist
async function ensureViewTables() {
  const stallCols = `id VARCHAR(8) NOT NULL, section VARCHAR(32) NOT NULL, number INT NOT NULL DEFAULT 0,
    status VARCHAR(16) NOT NULL DEFAULT 'available', price INT NOT NULL DEFAULT 0, size VARCHAR(16) NOT NULL DEFAULT 'medium',
    category VARCHAR(64) NOT NULL DEFAULT '', description TEXT, image_url TEXT, reservation_id VARCHAR(64) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY idx_stall_status (status)`;

  const createDesignMapStalls = `CREATE TABLE IF NOT EXISTS design_map_stalls (${stallCols}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
  const createAllStallsStalls = `CREATE TABLE IF NOT EXISTS all_stalls_stalls (${stallCols}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

  const createDesignMap = `CREATE TABLE IF NOT EXISTS design_map_reservations (
    id VARCHAR(64) NOT NULL,
    reservation_number VARCHAR(32) NOT NULL,
    stall_id VARCHAR(8) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    contact_number VARCHAR(32) NOT NULL,
    business_name VARCHAR(128) DEFAULT NULL,
    dti_number VARCHAR(64) DEFAULT NULL,
    cedula_number VARCHAR(64) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    stall_usage_type VARCHAR(64) DEFAULT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    admin_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_dmr_reservation_number (reservation_number),
    KEY idx_dmr_stall (stall_id),
    KEY idx_dmr_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

  const createAllStalls = `CREATE TABLE IF NOT EXISTS all_stalls_reservations (
    id VARCHAR(64) NOT NULL,
    reservation_number VARCHAR(32) NOT NULL,
    stall_id VARCHAR(8) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    contact_number VARCHAR(32) NOT NULL,
    business_name VARCHAR(128) DEFAULT NULL,
    dti_number VARCHAR(64) DEFAULT NULL,
    cedula_number VARCHAR(64) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    stall_usage_type VARCHAR(64) DEFAULT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    admin_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_asr_reservation_number (reservation_number),
    KEY idx_asr_stall (stall_id),
    KEY idx_asr_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

  try {
    await pool.query(createDesignMapStalls);
    await pool.query(createAllStallsStalls);
    await pool.query(createDesignMap);
    await pool.query(createAllStalls);

    // Vendor users table
    await pool.query(`CREATE TABLE IF NOT EXISTS vendor_users (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // Add vendor_id columns to reservation tables if missing
    for (const table of ['design_map_reservations', 'all_stalls_reservations']) {
      const [cols] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'vendor_id'`,
        [table]
      );
      if (cols.length === 0) {
        await pool.query(`ALTER TABLE ${table} ADD COLUMN vendor_id INT DEFAULT NULL AFTER id`);
      }
    }

    // Add passcode column to vendor_users if missing
    const [passcodeCol] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_users' AND COLUMN_NAME = 'passcode'`,
    );
    if (passcodeCol.length === 0) {
      await pool.query(`ALTER TABLE vendor_users ADD COLUMN passcode VARCHAR(8) DEFAULT NULL AFTER email`);
    }

    // Auto-generate passcodes for vendors that don't have one
    const [vendorsWithoutPasscode] = await pool.query(
      'SELECT id FROM vendor_users WHERE passcode IS NULL'
    );
    for (const v of vendorsWithoutPasscode) {
      const passcode = String(Math.floor(100000 + Math.random() * 900000));
      await pool.query('UPDATE vendor_users SET passcode = ? WHERE id = ?', [passcode, v.id]);
    }

    // Add event column to vendor_users if missing
    const [eventCol] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_users' AND COLUMN_NAME = 'event'`,
    );
    if (eventCol.length === 0) {
      await pool.query(`ALTER TABLE vendor_users ADD COLUMN event VARCHAR(32) DEFAULT NULL AFTER passcode`);
    }
  } catch (e) {
    console.warn('Could not ensure view tables:', e?.message || e);
  }
}

async function expireReservations() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const tables = ['design_map_reservations', 'all_stalls_reservations'];
    for (const table of tables) {
      const [expiredRows] = await connection.query(
        `SELECT id, stall_id FROM ${table} WHERE status = 'pending' AND expires_at < NOW()`
      );

      if (expiredRows.length === 0) continue;

      const expiredIds = expiredRows.map((row) => row.id);
      const expiredStallIds = expiredRows.map((row) => row.stall_id);
      const stallTable = table === 'design_map_reservations' ? 'design_map_stalls' : 'all_stalls_stalls';

      await connection.query(
        `UPDATE ${table}
           SET status = 'rejected',
             admin_notes = 'Auto-cancelled: Reservation expired after 4 days.',
             updated_at = NOW()
         WHERE id IN (?)`,
        [expiredIds]
      );

      if (expiredStallIds.length > 0) {
        await connection.query(
          `UPDATE ${stallTable} SET status = 'available', reservation_id = NULL, updated_at = NOW()
           WHERE id IN (?)`,
          [expiredStallIds]
        );
      }
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function findReservationById(id) {
  const [designRows] = await pool.query('SELECT * FROM design_map_reservations WHERE id = ?', [id]);
  if (designRows.length > 0) return { row: designRows[0], table: 'design_map_reservations' };
  const [allRows] = await pool.query('SELECT * FROM all_stalls_reservations WHERE id = ?', [id]);
  if (allRows.length > 0) return { row: allRows[0], table: 'all_stalls_reservations' };
  return { row: null, table: null };
}

async function selectReservationWithStall(id) {
  let [rows] = await pool.query(
    `SELECT d.*, s.price AS stall_price, 'design_map' AS source FROM design_map_reservations d
     LEFT JOIN design_map_stalls s ON s.id = d.stall_id WHERE d.id = ?`, [id]
  );
  if (rows.length > 0) return mapViewReservation(rows[0]);
  [rows] = await pool.query(
    `SELECT a.*, s.price AS stall_price, 'all_stalls' AS source FROM all_stalls_reservations a
     LEFT JOIN all_stalls_stalls s ON s.id = a.stall_id WHERE a.id = ?`, [id]
  );
  if (rows.length > 0) return mapViewReservation(rows[0]);
  return null;
}

async function findReservationSource(id) {
  let [rows] = await pool.query('SELECT id FROM design_map_reservations WHERE id = ?', [id]);
  if (rows.length > 0) return 'design_map';
  [rows] = await pool.query('SELECT id FROM all_stalls_reservations WHERE id = ?', [id]);
  if (rows.length > 0) return 'all_stalls';
  return null;
}

async function updateStallStatus(connection, stallId, status, source) {
  const table = source === 'all_stalls' ? 'all_stalls_stalls' : 'design_map_stalls';
  await connection.query(`UPDATE ${table} SET status = ?, updated_at = NOW() WHERE id = ?`, [status, stallId]);
}

async function nextReservationNumberBySection(connection, section) {
  const year = new Date().getFullYear();
  const sec = (section || 'X').toString().toUpperCase();
  try {
    // Ensure a counter row exists for this section
    await connection.query(
      'INSERT IGNORE INTO reservation_counter (section, counter) VALUES (?, 0)',
      [sec]
    );

    const [rows] = await connection.query(
      'SELECT counter FROM reservation_counter WHERE section = ? FOR UPDATE',
      [sec]
    );
    const current = rows[0]?.counter ?? 0;
    const next = current + 1;
    await connection.query('UPDATE reservation_counter SET counter = ? WHERE section = ?', [next, sec]);
    return `RES-${year}-${sec}-${String(next).padStart(4, '0')}`;
  } catch (err) {
    // Fallback: database still using legacy single-row counter schema.
    if (err && (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE')) {
      // Use legacy single-counter implementation
      return legacyNextReservationNumber(connection, year);
    }
    throw err;
  }
}

function normalizeReservationSection(stallId, section) {
  const id = (stallId || '').toString().toUpperCase();
  if (/^\d+$/.test(id)) {
    const numericId = Number(id);
    if (numericId >= 1   && numericId <= 47)  return 'A';
    if (numericId >= 48  && numericId <= 91)  return 'B';
    if (numericId >= 92  && numericId <= 133) return 'AA';
    if (numericId >= 134 && numericId <= 167) return 'BB';
    if (numericId >= 168 && numericId <= 204) return 'C';
    if (numericId >= 205 && numericId <= 243) return 'D';
    if (numericId >= 244 && numericId <= 300) return 'R';
  }
  return (section || 'X').toString().toUpperCase();
}

async function legacyNextReservationNumber(connection, yearOverride) {
  const year = yearOverride ?? new Date().getFullYear();
  // Behave like the previous single-row counter implementation (id=1)
  const [rows] = await connection.query('SELECT counter FROM reservation_counter WHERE id = 1 FOR UPDATE');
  const current = rows[0]?.counter ?? 0;
  const next = current + 1;
  await connection.query('UPDATE reservation_counter SET counter = ? WHERE id = 1', [next]);
  return `RES-${year}-${String(next).padStart(4, '0')}`;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Detailed health endpoint for dev: DB connectivity, counts, SSE client count, memory, uptime
async function getHealthDetails() {
  const details = {
    ok: true,
    nodeVersion: process.version,
    pid: process.pid,
    uptimeSeconds: process.uptime(),
    memory: process.memoryUsage(),
    sseClients: sseClients.size,
    timestamp: new Date().toISOString(),
  };

  try {
    // quick DB check
    await pool.query('SELECT 1');
    details.db = { ok: true };
  } catch (e) {
    details.db = { ok: false, error: String(e) };
  }

  try {
    const [r1] = await pool.query('SELECT COUNT(*) AS count FROM design_map_stalls');
    const [r2] = await pool.query('SELECT COUNT(*) AS count FROM all_stalls_stalls');
    details.stalls = (r1[0]?.count ?? 0) + (r2[0]?.count ?? 0);
  } catch (e) {
    details.stalls = null;
  }

  try {
    const [res1] = await pool.query('SELECT COUNT(*) AS count FROM design_map_reservations');
    const [res2] = await pool.query('SELECT COUNT(*) AS count FROM all_stalls_reservations');
    details.reservations = (res1[0]?.count ?? 0) + (res2[0]?.count ?? 0);
  } catch (e) {
    details.reservations = null;
  }

  return details;
}

app.get('/api/health/details', authAdmin, async (req, res, next) => {
  try {
    const d = await getHealthDetails();
    res.json(d);
  } catch (err) {
    next(err);
  }
});

// Periodic console health log in development for visibility when running dev
if ((process.env.NODE_ENV || 'development') !== 'production') {
  setInterval(async () => {
    try {
      const d = await getHealthDetails();
      // pretty-print a compact health line
      console.log('[HEALTH]', JSON.stringify({ ts: d.timestamp, db: d.db?.ok, stalls: d.stalls, reservations: d.reservations, sseClients: d.sseClients, memRssMB: Math.round(d.memory.rss / 1024 / 1024) }));
    } catch (e) {
      console.error('[HEALTH] check failed', e);
    }
  }, 30000);
}

app.get('/api/stalls', async (req, res, next) => {
  try {
    await expireReservations();
    const source = req.query.source;
    if (source && !VALID_SOURCES.includes(source)) {
      return res.status(400).json({ message: 'Invalid source parameter' });
    }
    let rows;
    if (source === 'design_map') {
      [rows] = await pool.query('SELECT * FROM design_map_stalls');
    } else if (source === 'all_stalls') {
      [rows] = await pool.query('SELECT * FROM all_stalls_stalls');
    } else {
      const [r1] = await pool.query('SELECT * FROM design_map_stalls');
      const [r2] = await pool.query('SELECT * FROM all_stalls_stalls');
      rows = [...r1, ...r2];
    }
    res.json(rows.map(mapStall));
  } catch (err) {
    next(err);
  }
});

app.get('/api/stalls/:id', async (req, res, next) => {
  try {
    let [rows] = await pool.query('SELECT * FROM design_map_stalls WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      [rows] = await pool.query('SELECT * FROM all_stalls_stalls WHERE id = ?', [req.params.id]);
    }
    if (rows.length === 0) return res.status(404).json({ message: 'Stall not found' });
    res.json(mapStall(rows[0]));
  } catch (err) {
    next(err);
  }
});

app.put('/api/stalls/:id', authAdmin, async (req, res, next) => {
  try {
    const payload = req.body;
    const source = req.query.source;
    if (source && !VALID_SOURCES.includes(source)) {
      return res.status(400).json({ message: 'Invalid source parameter' });
    }
    const table = source === 'all_stalls' ? 'all_stalls_stalls' : 'design_map_stalls';
    await pool.query(
      `UPDATE ${table}
       SET status = ?, reservation_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [payload.status, payload.reservationId || null, req.params.id]
    );
    const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
    const updated = mapStall(rows[0]);
    try { sendSseEvent('stall-updated', { stall: updated }); } catch (e) {}
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

app.get('/api/reservations', async (req, res, next) => {
  try {
    await expireReservations();
    const [designRows] = await pool.query(
      `SELECT d.*, s.price AS stall_price, 'design_map' AS source
       FROM design_map_reservations d
       LEFT JOIN design_map_stalls s ON s.id = d.stall_id`
    );
    const [allStallsRows] = await pool.query(
      `SELECT a.*, s.price AS stall_price, 'all_stalls' AS source
       FROM all_stalls_reservations a
       LEFT JOIN all_stalls_stalls s ON s.id = a.stall_id`
    );
    const all = [...designRows.map(mapViewReservation), ...allStallsRows.map(mapViewReservation)]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(all);
  } catch (err) {
    next(err);
  }
});

app.get('/api/reservations/:id', async (req, res, next) => {
  try {
    // Search in design_map_reservations first
    let [rows] = await pool.query(
      `SELECT d.*, s.price AS stall_price, 'design_map' AS source
       FROM design_map_reservations d
       LEFT JOIN design_map_stalls s ON s.id = d.stall_id
       WHERE d.id = ?`,
      [req.params.id]
    );
    if (rows.length > 0) {
      return res.json(mapViewReservation(rows[0]));
    }
    // Search in all_stalls_reservations
    [rows] = await pool.query(
      `SELECT a.*, s.price AS stall_price, 'all_stalls' AS source
       FROM all_stalls_reservations a
       LEFT JOIN all_stalls_stalls s ON s.id = a.stall_id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Reservation not found' });
    res.json(mapViewReservation(rows[0]));
  } catch (err) {
    next(err);
  }
});

app.get('/api/reservations/design-map', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, s.price AS stall_price, 'design_map' AS source
       FROM design_map_reservations d
       LEFT JOIN design_map_stalls s ON s.id = d.stall_id
       ORDER BY d.created_at DESC`
    );
    res.json(rows.map(mapViewReservation));
  } catch (err) {
    next(err);
  }
});

app.get('/api/reservations/all-stalls', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, s.price AS stall_price, 'all_stalls' AS source
       FROM all_stalls_reservations a
       LEFT JOIN all_stalls_stalls s ON s.id = a.stall_id
       ORDER BY a.created_at DESC`
    );
    res.json(rows.map(mapViewReservation));
  } catch (err) {
    next(err);
  }
});

app.post('/api/reservations', authVendor, reservationRateLimit, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const payload = req.body;
    const source = payload.source;
    if (source && !VALID_SOURCES.includes(source)) {
      return res.status(400).json({ message: 'Invalid source parameter' });
    }
    if (!payload.fullName || typeof payload.fullName !== 'string' || payload.fullName.trim().length === 0) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    if (!payload.contactNumber || typeof payload.contactNumber !== 'string' || payload.contactNumber.trim().length === 0) {
      return res.status(400).json({ message: 'Contact number is required' });
    }
    if (!payload.stallId || typeof payload.stallId !== 'string') {
      return res.status(400).json({ message: 'Stall ID is required' });
    }
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 4);

    await connection.beginTransaction();

    // determine stall section so counters are per-section
    const stallTable = source === 'all_stalls' ? 'all_stalls_stalls' : 'design_map_stalls';
    const [stallInfoRows] = await connection.query(`SELECT section FROM ${stallTable} WHERE id = ? FOR UPDATE`, [payload.stallId]);
    const rawSection = stallInfoRows[0]?.section || 'X';
    const section = normalizeReservationSection(payload.stallId, rawSection);
    const reservationNumber = await nextReservationNumberBySection(connection, section);
    const reservationId = crypto.randomUUID();

    // Insert into view-specific table based on source
    const viewTable = source === 'all_stalls' ? 'all_stalls_reservations' : 'design_map_reservations';
    await connection.query(
      `INSERT INTO ${viewTable}
        (id, reservation_number, stall_id, vendor_id, full_name, contact_number, business_name, dti_number, cedula_number, address, stall_usage_type, status, created_at, expires_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        reservationId,
        reservationNumber,
        payload.stallId,
        req.vendorId || null,
        payload.fullName,
        payload.contactNumber,
        payload.businessName || null,
        payload.dtiNumber || null,
        payload.cedulaNumber || null,
        payload.address || null,
        payload.stallUsageType || null,
        now,
        expiresAt,
        now,
      ]
    );

    // Update the stall status to pending in the correct table
    await connection.query(`UPDATE ${stallTable} SET status = 'pending', reservation_id = ?, updated_at = NOW() WHERE id = ?`, [reservationId, payload.stallId]);

    await connection.commit();

    const [reservationRows] = await pool.query(`SELECT * FROM ${viewTable} WHERE id = ?`, [reservationId]);
    const [stallRows] = await pool.query(`SELECT * FROM ${stallTable} WHERE id = ?`, [payload.stallId]);

    const createdReservation = mapViewReservation(reservationRows[0]);
    createdReservation.source = source;
    const createdStall = mapStall(stallRows[0]);

    // Broadcast to SSE clients
    try { sendSseEvent('reservation-created', { reservation: createdReservation, stall: createdStall }); } catch (e) {}

    res.status(201).json({ reservation: createdReservation, stall: createdStall });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

app.put('/api/reservations/:id', authAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const payload = req.body;
    await connection.beginTransaction();

    // Update both map tables
    const updateParams = [
      payload.fullName,
      payload.contactNumber,
      payload.businessName || null,
      payload.dtiNumber || null,
      payload.cedulaNumber || null,
      payload.address || null,
      payload.status,
      payload.adminNotes || null,
      req.params.id,
    ];
    await connection.query(
      `UPDATE design_map_reservations
       SET full_name = ?, contact_number = ?, business_name = ?, dti_number = ?, cedula_number = ?, address = ?, status = ?, admin_notes = ?, updated_at = NOW()
       WHERE id = ?`,
      updateParams
    );
    await connection.query(
      `UPDATE all_stalls_reservations
       SET full_name = ?, contact_number = ?, business_name = ?, dti_number = ?, cedula_number = ?, address = ?, status = ?, admin_notes = ?, updated_at = NOW()
       WHERE id = ?`,
      updateParams
    );

    // Update stall status in the correct table
    const source = await findReservationSource(req.params.id);
    if (payload.status && source) {
      const stallTable = source === 'all_stalls' ? 'all_stalls_stalls' : 'design_map_stalls';
      const stallStatusMap = { approved: 'reserved', rejected: 'available', occupied: 'occupied', pending: 'pending' };
      const stallStatus = stallStatusMap[payload.status];
      if (stallStatus) {
        await connection.query(`UPDATE ${stallTable} SET status = ?, updated_at = NOW() WHERE id = ?`, [stallStatus, payload.stallId]);
      }
    }

    // If admin edited the price, persist it to the related stall record
    if (payload.price != null && payload.stallId) {
      try {
        const priceTable = 'design_map_stalls';
        await connection.query(`UPDATE ${priceTable} SET price = ?, updated_at = NOW() WHERE id = ?`, [payload.price, payload.stallId]);
        await connection.query(`UPDATE all_stalls_stalls SET price = ?, updated_at = NOW() WHERE id = ?`, [payload.price, payload.stallId]);
      } catch (e) {
        console.warn('Failed to update stall price during reservation update:', e?.message || e);
      }
    }

    await connection.commit();
    const updatedReservation = await selectReservationWithStall(req.params.id);

    try { sendSseEvent('reservation-updated', { reservation: updatedReservation }); } catch (e) {}

    res.json(updatedReservation);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

app.post('/api/reservations/:id/approve', authAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const source = await findReservationSource(req.params.id);
    const resTable = source === 'all_stalls' ? 'all_stalls_reservations' : 'design_map_reservations';

    const [resRows] = await connection.query(`SELECT stall_id FROM ${resTable} WHERE id = ?`, [req.params.id]);
    const stallId = resRows[0]?.stall_id;

    await connection.query(
      `UPDATE design_map_reservations SET status = 'approved', updated_at = NOW() WHERE id = ?`,
      [req.params.id]
    );
    await connection.query(
      `UPDATE all_stalls_reservations SET status = 'approved', updated_at = NOW() WHERE id = ?`,
      [req.params.id]
    );

    if (stallId && source) {
      await updateStallStatus(connection, stallId, 'reserved', source);
    }

    await connection.commit();
    const updatedReservation = await selectReservationWithStall(req.params.id);
    try { sendSseEvent('reservation-updated', { reservation: updatedReservation }); } catch (e) {}

    res.json(updatedReservation);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

app.post('/api/reservations/:id/reject', authAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const notes = req.body?.notes || 'Rejected by admin.';
    await connection.beginTransaction();

    const source = await findReservationSource(req.params.id);
    const resTable = source === 'all_stalls' ? 'all_stalls_reservations' : 'design_map_reservations';

    const [resRows] = await connection.query(`SELECT stall_id FROM ${resTable} WHERE id = ?`, [req.params.id]);
    const stallId = resRows[0]?.stall_id;

    await connection.query(
      `UPDATE design_map_reservations SET status = 'rejected', admin_notes = ?, updated_at = NOW() WHERE id = ?`,
      [notes, req.params.id]
    );
    await connection.query(
      `UPDATE all_stalls_reservations SET status = 'rejected', admin_notes = ?, updated_at = NOW() WHERE id = ?`,
      [notes, req.params.id]
    );

    if (stallId && source) {
      await updateStallStatus(connection, stallId, 'available', source);
    }

    await connection.commit();
    const updatedReservation = await selectReservationWithStall(req.params.id);
    try { sendSseEvent('reservation-updated', { reservation: updatedReservation }); } catch (e) {}

    res.json(updatedReservation);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

app.post('/api/reservations/:id/occupy', authAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const source = await findReservationSource(req.params.id);
    const resTable = source === 'all_stalls' ? 'all_stalls_reservations' : 'design_map_reservations';

    const [resRows] = await connection.query(`SELECT stall_id FROM ${resTable} WHERE id = ?`, [req.params.id]);
    const stallId = resRows[0]?.stall_id;

    await connection.query(
      `UPDATE design_map_reservations SET status = 'occupied', updated_at = NOW() WHERE id = ?`,
      [req.params.id]
    );
    await connection.query(
      `UPDATE all_stalls_reservations SET status = 'occupied', updated_at = NOW() WHERE id = ?`,
      [req.params.id]
    );

    if (stallId && source) {
      await updateStallStatus(connection, stallId, 'occupied', source);
    }

    await connection.commit();
    const updatedReservation = await selectReservationWithStall(req.params.id);
    try { sendSseEvent('reservation-updated', { reservation: updatedReservation }); } catch (e) {}

    res.json(updatedReservation);
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

app.post('/api/admin/reset', authAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('DELETE FROM design_map_reservations');
    await connection.query('DELETE FROM all_stalls_reservations');
    await connection.query('UPDATE design_map_stalls SET status = \'available\', reservation_id = NULL, updated_at = NOW()');
    await connection.query('UPDATE all_stalls_stalls SET status = \'available\', reservation_id = NULL, updated_at = NOW()');
    // reset all per-section counters
    await connection.query('UPDATE reservation_counter SET counter = 0');

    await connection.commit();
    res.json({ ok: true });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

app.post('/api/admin/extend-pending', authAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result1] = await connection.query(
      `UPDATE design_map_reservations
       SET expires_at = DATE_ADD(expires_at, INTERVAL 1 DAY), updated_at = NOW()
       WHERE status = 'pending'`
    );
    const [result2] = await connection.query(
      `UPDATE all_stalls_reservations
       SET expires_at = DATE_ADD(expires_at, INTERVAL 1 DAY), updated_at = NOW()
       WHERE status = 'pending'`
    );

    await connection.commit();
    res.json({ ok: true, updated: (result1.affectedRows ?? 0) + (result2.affectedRows ?? 0) });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

app.delete('/api/reservations/:id', authAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const source = await findReservationSource(req.params.id);
    const stallTable = source === 'all_stalls' ? 'all_stalls_stalls' : 'design_map_stalls';
    const resTable = source === 'all_stalls' ? 'all_stalls_reservations' : 'design_map_reservations';
    const [resRows] = await connection.query(`SELECT stall_id FROM ${resTable} WHERE id = ?`, [req.params.id]);
    const stallId = resRows[0]?.stall_id;

    const [result1] = await connection.query('DELETE FROM design_map_reservations WHERE id = ?', [req.params.id]);
    const [result2] = await connection.query('DELETE FROM all_stalls_reservations WHERE id = ?', [req.params.id]);

    if (stallId && source) {
      await connection.query(`UPDATE ${stallTable} SET status = 'available', reservation_id = NULL, updated_at = NOW() WHERE id = ?`, [stallId]);
    }

    await connection.commit();
    try { sendSseEvent('reservation-deleted', { id: req.params.id }); } catch (e) {}
    const affected = (result1?.[0]?.affectedRows || 0) + (result2?.[0]?.affectedRows || 0);
    res.json({ removed: affected > 0 });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

app.get('/api/admin/security-question', (req, res) => {
  res.json({ question: SECURITY_QUESTION });
});

app.post('/api/admin/login', rateLimit, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query(
      'SELECT id, password_hash FROM admin_users WHERE username = ? LIMIT 1',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: rows[0].id, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, token });
  } catch (err) {
    next(err);
  }
});

// ─── JWT Auth Middleware ─────────────────────────────────────
function authVendor(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    req.vendorId = decoded.id;
    req.vendorRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function authAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.adminId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ─── Vendor Auth Routes ─────────────────────────────────────
app.post('/api/vendors/login', rateLimit, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const [rows] = await pool.query(
      'SELECT id, username, full_name, contact_number, business_name, email, status, event, password_hash FROM vendor_users WHERE username = ? LIMIT 1',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const vendor = rows[0];
    if (vendor.status !== 'active') {
      return res.status(403).json({ message: 'Account is inactive. Contact the admin.' });
    }
    const passwordMatch = await bcrypt.compare(password, vendor.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const token = jwt.sign({ id: vendor.id, role: 'vendor' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({
      token,
      vendor: {
        id: vendor.id,
        username: vendor.username,
        fullName: vendor.full_name,
        contactNumber: vendor.contact_number,
        businessName: vendor.business_name,
        email: vendor.email,
        event: vendor.event,
      },
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/vendors/login-passcode', rateLimit, async (req, res, next) => {
  try {
    const { email, passcode } = req.body;
    if (!email || !passcode) {
      return res.status(400).json({ message: 'Email and passcode are required' });
    }
    const [rows] = await pool.query(
      'SELECT id, username, full_name, contact_number, business_name, email, status, passcode, event FROM vendor_users WHERE email = ? LIMIT 1',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or passcode' });
    }
    const vendor = rows[0];
    if (vendor.status !== 'active') {
      return res.status(403).json({ message: 'Account is inactive. Contact the admin.' });
    }
    if (vendor.passcode !== passcode) {
      return res.status(401).json({ message: 'Invalid email or passcode' });
    }
    const token = jwt.sign({ id: vendor.id, role: 'vendor' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({
      token,
      vendor: {
        id: vendor.id,
        username: vendor.username,
        fullName: vendor.full_name,
        contactNumber: vendor.contact_number,
        businessName: vendor.business_name,
        email: vendor.email,
        event: vendor.event,
      },
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/vendors', authAdmin, async (req, res, next) => {
  try {
    const { fullName, email, contactNumber, businessName, event } = req.body;
    if (!fullName || !email) {
      return res.status(400).json({ message: 'Full name and email are required' });
    }
    const [existingEmail] = await pool.query('SELECT id FROM vendor_users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    const username = email.split('@')[0] + '_' + Date.now().toString(36);
    const passwordHash = await bcrypt.hash(NEW_VENDOR_PASSWORD, 10);
    const passcode = String(Math.floor(100000 + Math.random() * 900000));
    const [result] = await pool.query(
      'INSERT INTO vendor_users (username, password_hash, full_name, contact_number, business_name, email, passcode, event) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, passwordHash, fullName, contactNumber || null, businessName || null, email, passcode, event || null]
    );
    res.status(201).json({
      id: result.insertId,
      username,
      fullName,
      contactNumber: contactNumber || null,
      businessName: businessName || null,
      email,
      passcode,
      event: event || null,
      status: 'active',
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/admin/vendors', authAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, full_name, contact_number, business_name, email, passcode, event, status, created_at FROM vendor_users ORDER BY created_at DESC'
    );
    res.json(rows.map(r => ({
      id: r.id,
      username: r.username,
      fullName: r.full_name,
      contactNumber: r.contact_number,
      businessName: r.business_name,
      email: r.email,
      passcode: r.passcode || null,
      event: r.event || null,
      status: r.status,
      createdAt: r.created_at,
    })));
  } catch (err) {
    // Fallback: try without passcode/event columns in case they don't exist yet
    try {
      const [rows] = await pool.query(
        'SELECT id, username, full_name, contact_number, business_name, email, status, created_at FROM vendor_users ORDER BY created_at DESC'
      );
      res.json(rows.map(r => ({
        id: r.id,
        username: r.username,
        fullName: r.full_name,
        contactNumber: r.contact_number,
        businessName: r.business_name,
        email: r.email,
        passcode: null,
        event: null,
        status: r.status,
        createdAt: r.created_at,
      })));
    } catch (fallbackErr) {
      next(fallbackErr);
    }
  }
});

app.put('/api/admin/vendors/:id', authAdmin, async (req, res, next) => {
  try {
    const { fullName, contactNumber, businessName, email, status, password, event } = req.body;
    if (status !== undefined && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    const fields = [];
    const values = [];
    if (fullName !== undefined) { fields.push('full_name = ?'); values.push(fullName); }
    if (contactNumber !== undefined) { fields.push('contact_number = ?'); values.push(contactNumber); }
    if (businessName !== undefined) { fields.push('business_name = ?'); values.push(businessName); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (event !== undefined) { fields.push('event = ?'); values.push(event || null); }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      fields.push('password_hash = ?');
      values.push(passwordHash);
    }
    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    values.push(req.params.id);
    await pool.query(`UPDATE vendor_users SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query(
      'SELECT id, username, full_name, contact_number, business_name, email, event, status, created_at FROM vendor_users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
    const r = rows[0];
    res.json({
      id: r.id, username: r.username, fullName: r.full_name, contactNumber: r.contact_number,
      businessName: r.business_name, email: r.email, event: r.event, status: r.status, createdAt: r.created_at,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/admin/vendors/:id/reservation-count', authAdmin, async (req, res, next) => {
  try {
    let count = 0;
    try {
      const [dm] = await pool.query('SELECT COUNT(*) AS cnt FROM design_map_reservations WHERE vendor_id = ?', [req.params.id]);
      count += dm[0]?.cnt || 0;
    } catch {}
    try {
      const [as_] = await pool.query('SELECT COUNT(*) AS cnt FROM all_stalls_reservations WHERE vendor_id = ?', [req.params.id]);
      count += as_[0]?.cnt || 0;
    } catch {}
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/admin/vendors/:id', authAdmin, async (req, res, next) => {
  try {
    let count = 0;
    try {
      const [dm] = await pool.query('SELECT COUNT(*) AS cnt FROM design_map_reservations WHERE vendor_id = ?', [req.params.id]);
      count += dm[0]?.cnt || 0;
    } catch {}
    try {
      const [as_] = await pool.query('SELECT COUNT(*) AS cnt FROM all_stalls_reservations WHERE vendor_id = ?', [req.params.id]);
      count += as_[0]?.cnt || 0;
    } catch {}
    if (count > 0) {
      return res.status(400).json({ message: 'Cannot delete vendor with existing reservations. Deactivate instead.' });
    }
    await pool.query('DELETE FROM vendor_users WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── Vendor-Protected Routes ─────────────────────────────────
app.get('/api/vendors/me', authVendor, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, full_name, contact_number, business_name, email, event, status, created_at FROM vendor_users WHERE id = ?',
      [req.vendorId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
    const r = rows[0];
    res.json({
      id: r.id, username: r.username, fullName: r.full_name, contactNumber: r.contact_number,
      businessName: r.business_name, email: r.email, event: r.event, status: r.status, createdAt: r.created_at,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/vendors/me/reservations', authVendor, async (req, res, next) => {
  try {
    const [designRows] = await pool.query(
      `SELECT d.*, s.price AS stall_price, 'design_map' AS source
       FROM design_map_reservations d
       LEFT JOIN design_map_stalls s ON s.id = d.stall_id
       WHERE d.vendor_id = ?
       ORDER BY d.created_at DESC`,
      [req.vendorId]
    );
    const [allStallsRows] = await pool.query(
      `SELECT a.*, s.price AS stall_price, 'all_stalls' AS source
       FROM all_stalls_reservations a
       LEFT JOIN all_stalls_stalls s ON s.id = a.stall_id
       WHERE a.vendor_id = ?
       ORDER BY a.created_at DESC`,
      [req.vendorId]
    );
    const all = [...designRows.map(mapViewReservation), ...allStallsRows.map(mapViewReservation)]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(all);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

// Ensure DB schema additions then start
Promise.resolve()
  .then(() => ensureReservationColumns())
  .then(() => ensureViewTables())
  .then(() => ensureStallsSeeded())
  .then(() => ensureAvailableStalls259To276())
  .then(() => ensureDefaultVendor())
  .then(() => ensureDefaultAdmin())
  .then(() => {
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
