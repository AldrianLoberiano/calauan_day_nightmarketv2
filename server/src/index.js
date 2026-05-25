import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import pool from './db.js';
import { generateInitialStalls } from './stalls.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5174);

app.use(cors());
app.use(express.json());

function mapReservation(row) {
  return {
    id: row.id,
    reservationNumber: row.reservation_number,
    stallId: row.stall_id,
    fullName: row.full_name,
    contactNumber: row.contact_number,
    businessName: row.business_name,
    address: row.address,
    status: row.status,
    adminNotes: row.admin_notes,
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

async function ensureStallsSeeded() {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM stalls');
  const count = rows[0]?.count ?? 0;
  if (count > 0) return;

  const stalls = generateInitialStalls();
  const values = stalls.map((s) => [
    s.id,
    s.section,
    s.number,
    s.status,
    s.price,
    s.size,
    s.category,
    s.description,
    s.image_url,
    s.reservation_id,
  ]);

  await pool.query(
    `INSERT INTO stalls
      (id, section, number, status, price, size, category, description, image_url, reservation_id)
     VALUES ?`,
    [values]
  );
}

async function expireReservations() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [expiredRows] = await connection.query(
      'SELECT id, stall_id FROM reservations WHERE status = "pending" AND expires_at < NOW()'
    );

    if (expiredRows.length === 0) {
      await connection.commit();
      return;
    }

    const expiredIds = expiredRows.map((row) => row.id);
    const expiredStalls = expiredRows.map((row) => row.stall_id);

    await connection.query(
      `UPDATE reservations
         SET status = 'rejected',
           admin_notes = 'Auto-cancelled: Reservation expired after 4 days.',
           updated_at = NOW()
       WHERE id IN (?)`,
      [expiredIds]
    );

    await connection.query(
      `UPDATE stalls
       SET status = 'available',
           reservation_id = NULL,
           updated_at = NOW()
       WHERE id IN (?) AND status = 'pending'`,
      [expiredStalls]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
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
    if (numericId >= 1 && numericId <= 47) return 'A';
    if (numericId >= 48 && numericId <= 91) return 'B';
    if (numericId >= 92 && numericId <= 133) return 'AA';
    if (numericId >= 134 && numericId <= 167) return 'BB';
    if (numericId >= 168 && numericId <= 204) return 'C';
    if (numericId >= 205 && numericId <= 243) return 'D';
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

app.get('/api/stalls', async (req, res, next) => {
  try {
    await expireReservations();
    const [rows] = await pool.query('SELECT * FROM stalls');
    res.json(rows.map(mapStall));
  } catch (err) {
    next(err);
  }
});

app.get('/api/stalls/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM stalls WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Stall not found' });
    res.json(mapStall(rows[0]));
  } catch (err) {
    next(err);
  }
});

app.put('/api/stalls/:id', async (req, res, next) => {
  try {
    const payload = req.body;
    await pool.query(
      `UPDATE stalls
       SET status = ?, reservation_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [payload.status, payload.reservationId || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM stalls WHERE id = ?', [req.params.id]);
    res.json(mapStall(rows[0]));
  } catch (err) {
    next(err);
  }
});

app.get('/api/reservations', async (req, res, next) => {
  try {
    await expireReservations();
    const [rows] = await pool.query('SELECT * FROM reservations');
    res.json(rows.map(mapReservation));
  } catch (err) {
    next(err);
  }
});

app.get('/api/reservations/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Reservation not found' });
    res.json(mapReservation(rows[0]));
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
    const [stallInfoRows] = await connection.query('SELECT section FROM stalls WHERE id = ? FOR UPDATE', [payload.stallId]);
    const section = stallInfoRows[0]?.section || 'X';
    const reservationNumber = await nextReservationNumberBySection(connection, section);
    const reservationId = crypto.randomUUID();

    await connection.query(
      `INSERT INTO reservations
        (id, reservation_number, stall_id, full_name, contact_number, business_name, address, status, created_at, expires_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        reservationId,
        reservationNumber,
        payload.stallId,
        payload.fullName,
        payload.contactNumber,
        payload.businessName || null,
        payload.address || null,
        now,
        expiresAt,
        now,
      ]
    );

    await connection.query(
      `UPDATE stalls
       SET status = 'pending', reservation_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [reservationId, payload.stallId]
    );

    await connection.commit();

    const [reservationRows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [reservationId]);
    const [stallRows] = await pool.query('SELECT * FROM stalls WHERE id = ?', [payload.stallId]);

    res.status(201).json({
      reservation: mapReservation(reservationRows[0]),
      stall: mapStall(stallRows[0]),
    });
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

    await connection.query(
      `UPDATE reservations
       SET full_name = ?, contact_number = ?, business_name = ?, address = ?, status = ?, admin_notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        payload.fullName,
        payload.contactNumber,
        payload.businessName || null,
        payload.address || null,
        payload.status,
        payload.adminNotes || null,
        req.params.id,
      ]
    );

    const status = payload.status;
    if (status) {
      if (status === 'rejected') {
        await connection.query(
          `UPDATE stalls
           SET status = 'available', reservation_id = NULL, updated_at = NOW()
           WHERE reservation_id = ?`,
          [req.params.id]
        );
      } else if (status === 'approved') {
        await connection.query(
          `UPDATE stalls
           SET status = 'reserved', reservation_id = ?, updated_at = NOW()
           WHERE id = ?`,
          [req.params.id, payload.stallId]
        );
      } else if (status === 'occupied') {
        await connection.query(
          `UPDATE stalls
           SET status = 'occupied', reservation_id = ?, updated_at = NOW()
           WHERE id = ?`,
          [req.params.id, payload.stallId]
        );
      } else if (status === 'pending') {
        await connection.query(
          `UPDATE stalls
           SET status = 'pending', reservation_id = ?, updated_at = NOW()
           WHERE id = ?`,
          [req.params.id, payload.stallId]
        );
      }
    }

    await connection.commit();
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    res.json(mapReservation(rows[0]));
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
    await connection.query(
      `UPDATE reservations
       SET status = 'approved', updated_at = NOW()
       WHERE id = ?`,
      [req.params.id]
    );
    await connection.query(
      `UPDATE stalls
       SET status = 'reserved', updated_at = NOW()
       WHERE reservation_id = ?`,
      [req.params.id]
    );
    await connection.commit();
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    res.json(mapReservation(rows[0]));
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
    await connection.query(
      `UPDATE reservations
       SET status = 'rejected', admin_notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [notes, req.params.id]
    );
    await connection.query(
      `UPDATE stalls
       SET status = 'available', reservation_id = NULL, updated_at = NOW()
       WHERE reservation_id = ?`,
      [req.params.id]
    );
    await connection.commit();
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    res.json(mapReservation(rows[0]));
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
    await connection.query(
      `UPDATE reservations
       SET status = 'occupied', updated_at = NOW()
       WHERE id = ?`,
      [req.params.id]
    );
    await connection.query(
      `UPDATE stalls
       SET status = 'occupied', updated_at = NOW()
       WHERE reservation_id = ?`,
      [req.params.id]
    );
    await connection.commit();
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    res.json(mapReservation(rows[0]));
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

    await connection.query(
      `UPDATE stalls
       SET status = 'available', reservation_id = NULL, updated_at = NOW()`
    );

    await connection.query('DELETE FROM reservations');
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

    const [result] = await connection.query(
      `UPDATE reservations
       SET expires_at = DATE_ADD(expires_at, INTERVAL 1 DAY),
           updated_at = NOW()
       WHERE status = 'pending'`
    );

    await connection.commit();
    res.json({ ok: true, updated: result.affectedRows ?? 0 });
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
    await connection.query(
      `UPDATE stalls
       SET status = 'available', reservation_id = NULL, updated_at = NOW()
       WHERE reservation_id = ?`,
      [req.params.id]
    );
    const [result] = await connection.query('DELETE FROM reservations WHERE id = ?', [req.params.id]);
    await connection.commit();
    res.json({ removed: result.affectedRows > 0 });
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

ensureStallsSeeded()
  .then(() => {
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
