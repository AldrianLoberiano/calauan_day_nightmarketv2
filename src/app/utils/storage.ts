import { Stall, Reservation } from '../types';
import { generateInitialStalls } from '../data/stallData';

const STALLS_KEY = 'pwesto_stalls';
const RESERVATIONS_KEY = 'pwesto_reservations';
const COUNTER_KEY = 'pwesto_reservation_counter';

// ─── Stall Operations ───────────────────────────────────────

export function getStalls(): Stall[] {
  try {
    const raw = localStorage.getItem(STALLS_KEY);
    if (!raw) {
      const initial = generateInitialStalls();
      localStorage.setItem(STALLS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as Stall[];
  } catch {
    return generateInitialStalls();
  }
}

export function saveStalls(stalls: Stall[]): void {
  localStorage.setItem(STALLS_KEY, JSON.stringify(stalls));
}

export function updateStall(updatedStall: Stall): Stall[] {
  const stalls = getStalls();
  const idx = stalls.findIndex(s => s.id === updatedStall.id);
  if (idx !== -1) stalls[idx] = updatedStall;
  saveStalls(stalls);
  return stalls;
}

export function getStallById(stallId: string): Stall | undefined {
  return getStalls().find(s => s.id === stallId);
}

// ─── Reservation Operations ─────────────────────────────────

export function getReservations(): Reservation[] {
  try {
    const raw = localStorage.getItem(RESERVATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Reservation[];
  } catch {
    return [];
  }
}

export function saveReservations(reservations: Reservation[]): void {
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
}

export function getReservationById(id: string): Reservation | undefined {
  return getReservations().find(r => r.id === id);
}

export function getReservationByNumber(resNum: string): Reservation | undefined {
  return getReservations().find(r => r.reservationNumber === resNum);
}

export function addReservation(reservation: Reservation): void {
  const reservations = getReservations();
  reservations.push(reservation);
  saveReservations(reservations);
}

export function updateReservation(updated: Reservation): void {
  const reservations = getReservations();
  const idx = reservations.findIndex(r => r.id === updated.id);
  if (idx !== -1) reservations[idx] = updated;
  saveReservations(reservations);
}

// ─── Reservation Number Counter ─────────────────────────────

export function generateReservationNumber(): string {
  const year = new Date().getFullYear();
  const raw = localStorage.getItem(COUNTER_KEY);
  const counter = raw ? parseInt(raw, 10) + 1 : 1;
  localStorage.setItem(COUNTER_KEY, counter.toString());
  const paddedCounter = counter.toString().padStart(4, '0');
  return `RES-${year}-${paddedCounter}`;
}

// ─── UUID Generator ─────────────────────────────────────────

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Expiration Check (3 days) ──────────────────────────────

export function checkAndExpireReservations(): Stall[] {
  const reservations = getReservations();
  const stalls = getStalls();
  const now = new Date();
  let changed = false;

  reservations.forEach((res) => {
    if (res.status === 'pending' && new Date(res.expiresAt) < now) {
      res.status = 'rejected';
      res.updatedAt = now.toISOString();
      res.adminNotes = 'Auto-cancelled: Reservation expired after 3 days.';

      const stallIdx = stalls.findIndex(s => s.id === res.stallId);
      if (stallIdx !== -1 && stalls[stallIdx].status === 'pending') {
        stalls[stallIdx].status = 'available';
        stalls[stallIdx].reservationId = undefined;
        changed = true;
      }
    }
  });

  saveReservations(reservations);
  if (changed) saveStalls(stalls);
  return stalls;
}

// ─── Admin Auth ─────────────────────────────────────────────

export function verifyAdminLogin(username: string, password: string): boolean {
  return username === 'admin' && password === 'bplo2026';
}

// ─── Status Update (Admin Actions) ──────────────────────────

export function approveReservation(reservationId: string): { stalls: Stall[]; reservation: Reservation | null } {
  const reservations = getReservations();
  const stalls = getStalls();

  const resIdx = reservations.findIndex(r => r.id === reservationId);
  if (resIdx === -1) return { stalls, reservation: null };

  const res = reservations[resIdx];
  res.status = 'approved';
  res.updatedAt = new Date().toISOString();

  const stallIdx = stalls.findIndex(s => s.id === res.stallId);
  if (stallIdx !== -1) {
    stalls[stallIdx].status = 'reserved';
  }

  saveReservations(reservations);
  saveStalls(stalls);
  return { stalls, reservation: res };
}

export function rejectReservation(reservationId: string, notes?: string): { stalls: Stall[]; reservation: Reservation | null } {
  const reservations = getReservations();
  const stalls = getStalls();

  const resIdx = reservations.findIndex(r => r.id === reservationId);
  if (resIdx === -1) return { stalls, reservation: null };

  const res = reservations[resIdx];
  res.status = 'rejected';
  res.updatedAt = new Date().toISOString();
  if (notes) res.adminNotes = notes;

  const stallIdx = stalls.findIndex(s => s.id === res.stallId);
  if (stallIdx !== -1) {
    stalls[stallIdx].status = 'available';
    stalls[stallIdx].reservationId = undefined;
  }

  saveReservations(reservations);
  saveStalls(stalls);
  return { stalls, reservation: res };
}

export function markAsOccupied(reservationId: string): { stalls: Stall[]; reservation: Reservation | null } {
  const reservations = getReservations();
  const stalls = getStalls();

  const resIdx = reservations.findIndex(r => r.id === reservationId);
  if (resIdx === -1) return { stalls, reservation: null };

  const res = reservations[resIdx];
  res.status = 'occupied';
  res.updatedAt = new Date().toISOString();

  const stallIdx = stalls.findIndex(s => s.id === res.stallId);
  if (stallIdx !== -1) {
    stalls[stallIdx].status = 'occupied';
  }

  saveReservations(reservations);
  saveStalls(stalls);
  return { stalls, reservation: res };
}
