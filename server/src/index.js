import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import pool from './db.js';
import { generateInitialStalls } from './stalls.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());

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
    price: row.stall_price != null ? Number(row.stall_price) : undefined,
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
    price: row.stall_price != null ? Number(row.stall_price) : undefined,
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

async function updateReservationById(connection, id, fields) {
  const result1 = await connection.query(
    `UPDATE design_map_reservations SET ${fields} WHERE id = ?`, [id]
  );
  const result2 = await connection.query(
    `UPDATE all_stalls_reservations SET ${fields} WHERE id = ?`, [id]
  );
  return (result1[0].affectedRows + result2[0].affectedRows) > 0;
}

async function selectReservationWithStall(id) {
  let [rows] = await pool.query(
    `SELECT d.*, s.price AS stall_price FROM design_map_reservations d
     LEFT JOIN design_map_stalls s ON s.id = d.stall_id WHERE d.id = ?`, [id]
  );
  if (rows.length > 0) return mapViewReservation(rows[0]);
  [rows] = await pool.query(
    `SELECT a.*, s.price AS stall_price FROM all_stalls_reservations a
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

async function nextReservationNumber(connection) {
  // legacy single-counter support removed — use nextReservationNumberBySection
  throw new Error('Use nextReservationNumberBySection(connection, section) instead');
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

app.get('/api/health/details', async (req, res, next) => {
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

app.put('/api/stalls/:id', async (req, res, next) => {
  try {
    const payload = req.body;
    const source = req.query.source;
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
      `SELECT d.*, s.price AS stall_price
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
      `SELECT a.*, s.price AS stall_price
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
      `SELECT d.*, s.price AS stall_price
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
      `SELECT a.*, s.price AS stall_price
       FROM all_stalls_reservations a
       LEFT JOIN all_stalls_stalls s ON s.id = a.stall_id
       ORDER BY a.created_at DESC`
    );
    res.json(rows.map(mapViewReservation));
  } catch (err) {
    next(err);
  }
});

app.post('/api/reservations', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const payload = req.body;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 4);

    await connection.beginTransaction();

    // determine stall section so counters are per-section
    const source = payload.source;
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
        (id, reservation_number, stall_id, full_name, contact_number, business_name, dti_number, cedula_number, address, stall_usage_type, status, created_at, expires_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        reservationId,
        reservationNumber,
        payload.stallId,
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
    // ensure reservation DTO includes the stall price on create
    if (createdStall && createdStall.price != null) createdReservation.price = createdStall.price;

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

app.put('/api/reservations/:id', async (req, res, next) => {
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

app.post('/api/reservations/:id/approve', async (req, res, next) => {
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

app.post('/api/reservations/:id/reject', async (req, res, next) => {
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

app.post('/api/reservations/:id/occupy', async (req, res, next) => {
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

app.post('/api/admin/reset', async (req, res, next) => {
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

app.post('/api/admin/extend-pending', async (req, res, next) => {
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
    res.json({ ok: true, updated: (result1[0].affectedRows ?? 0) + (result2[0].affectedRows ?? 0) });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

app.delete('/api/reservations/:id', async (req, res, next) => {
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
    res.json({ removed: (result1[0].affectedRows + result2[0].affectedRows) > 0 });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

app.post('/api/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query(
      'SELECT id FROM admin_users WHERE username = ? AND password = ? LIMIT 1',
      [username, password]
    );
    res.json({ ok: rows.length > 0 });
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
  .then(() => {
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
