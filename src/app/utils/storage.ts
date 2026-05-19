import { Stall, Reservation } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Request failed');
  }

  return res.json() as Promise<T>;
}

export async function resetStorage(): Promise<void> {
  await apiFetch<{ ok: boolean }>('/admin/reset', { method: 'POST' });
}

export async function extendPendingReservations(): Promise<{ updated: number }> {
  return apiFetch<{ updated: number }>('/admin/extend-pending', { method: 'POST' });
}

// ─── Stall Operations ───────────────────────────────────────

export async function getStalls(): Promise<Stall[]> {
  return apiFetch<Stall[]>('/stalls');
}

export async function updateStall(updatedStall: Stall): Promise<Stall> {
  return apiFetch<Stall>(`/stalls/${encodeURIComponent(updatedStall.id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: updatedStall.status,
      reservationId: updatedStall.reservationId ?? null,
    }),
  });
}

export async function getStallById(stallId: string): Promise<Stall | undefined> {
  try {
    return await apiFetch<Stall>(`/stalls/${encodeURIComponent(stallId)}`);
  } catch {
    return undefined;
  }
}

// ─── Reservation Operations ─────────────────────────────────

export async function getReservations(): Promise<Reservation[]> {
  return apiFetch<Reservation[]>('/reservations');
}

export async function getReservationById(id: string): Promise<Reservation | undefined> {
  try {
    return await apiFetch<Reservation>(`/reservations/${encodeURIComponent(id)}`);
  } catch {
    return undefined;
  }
}

export async function getReservationByNumber(resNum: string): Promise<Reservation | undefined> {
  const reservations = await getReservations();
  return reservations.find(r => r.reservationNumber === resNum);
}

export async function addReservation(input: {
  stallId: string;
  fullName: string;
  contactNumber: string;
  businessName?: string;
  dtiNumber?: string;
  address?: string;
}): Promise<{ reservation: Reservation; stall: Stall }> {
  return apiFetch<{ reservation: Reservation; stall: Stall }>('/reservations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateReservation(updated: Reservation): Promise<Reservation> {
  return apiFetch<Reservation>(`/reservations/${encodeURIComponent(updated.id)}`, {
    method: 'PUT',
    body: JSON.stringify(updated),
  });
}

export async function updateReservationAdmin(updated: Reservation): Promise<Reservation> {
  return updateReservation(updated);
}

export async function deleteReservation(reservationId: string): Promise<{ removed: boolean }> {
  return apiFetch<{ removed: boolean }>(`/reservations/${encodeURIComponent(reservationId)}`, {
    method: 'DELETE',
  });
}

// ─── Expiration Check (3 days) ──────────────────────────────

export async function checkAndExpireReservations(): Promise<Stall[]> {
  return getStalls();
}

// ─── Admin Auth ─────────────────────────────────────────────

export async function verifyAdminLogin(username: string, password: string): Promise<boolean> {
  const result = await apiFetch<{ ok: boolean }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return result.ok;
}

// ─── Status Update (Admin Actions) ──────────────────────────

export async function approveReservation(reservationId: string): Promise<Reservation> {
  return apiFetch<Reservation>(`/reservations/${encodeURIComponent(reservationId)}/approve`, {
    method: 'POST',
  });
}

export async function rejectReservation(reservationId: string, notes?: string): Promise<Reservation> {
  return apiFetch<Reservation>(`/reservations/${encodeURIComponent(reservationId)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export async function markAsOccupied(reservationId: string): Promise<Reservation> {
  return apiFetch<Reservation>(`/reservations/${encodeURIComponent(reservationId)}/occupy`, {
    method: 'POST',
  });
}
