import { Stall, Reservation, VendorUser, VendorLoginResponse } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

const VENDOR_TOKEN_KEY = 'nightmarket_vendor_token';
const VENDOR_USER_KEY = 'nightmarket_vendor_user';
const ADMIN_TOKEN_KEY = 'nightmarket_admin_token';

export function getVendorToken(): string | null {
  try { return localStorage.getItem(VENDOR_TOKEN_KEY); } catch { return null; }
}

export function setVendorToken(token: string): void {
  try { localStorage.setItem(VENDOR_TOKEN_KEY, token); } catch {}
}

export function getVendorUser(): VendorUser | null {
  try {
    const raw = localStorage.getItem(VENDOR_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setVendorUser(user: VendorUser): void {
  try { localStorage.setItem(VENDOR_USER_KEY, JSON.stringify(user)); } catch {}
}

export function clearVendorSession(): void {
  try {
    localStorage.removeItem(VENDOR_TOKEN_KEY);
    localStorage.removeItem(VENDOR_USER_KEY);
  } catch {}
}

export function getAdminToken(): string | null {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
}

export function setAdminToken(token: string): void {
  try { localStorage.setItem(ADMIN_TOKEN_KEY, token); } catch {}
}

export function clearAdminSession(): void {
  try { localStorage.removeItem(ADMIN_TOKEN_KEY); } catch {}
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const vendorToken = getVendorToken();
  const adminToken = getAdminToken();
  const method = (options?.method || 'GET').toUpperCase();
  const isAdminPath = path.startsWith('/admin/')
    || (path.startsWith('/reservations/') && (path.endsWith('/approve') || path.endsWith('/reject') || path.endsWith('/occupy')))
    || (path.startsWith('/reservations/') && (method === 'PUT' || method === 'DELETE'));
  const token = isAdminPath ? adminToken : vendorToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

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

export async function getStalls(source?: string): Promise<Stall[]> {
  const params = source ? `?source=${encodeURIComponent(source)}` : '';
  return apiFetch<Stall[]>(`/stalls${params}`);
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
  cedulaNumber?: string;
  price?: string;
  address?: string;
  source?: string;
  stallUsageType?: string;
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

export async function deleteReservation(reservationId: string): Promise<{ removed: boolean }> {
  return apiFetch<{ removed: boolean }>(`/reservations/${encodeURIComponent(reservationId)}`, {
    method: 'DELETE',
  });
}

// ─── View-Specific Reservation Operations ────────────────────

export async function getDesignMapReservations(): Promise<Reservation[]> {
  return apiFetch<Reservation[]>('/reservations/design-map');
}

export async function getAllStallsReservations(): Promise<Reservation[]> {
  return apiFetch<Reservation[]>('/reservations/all-stalls');
}

// ─── Expiration Check (3 days) ──────────────────────────────

export async function checkAndExpireReservations(source?: string): Promise<Stall[]> {
  return getStalls(source);
}

// ─── Admin Auth ─────────────────────────────────────────────

export async function verifyAdminLogin(username: string, password: string): Promise<string | null> {
  const result = await apiFetch<{ ok: boolean; token?: string }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return result.ok && result.token ? result.token : null;
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

// ─── Vendor Auth ─────────────────────────────────────────────

export async function vendorLogin(username: string, password: string): Promise<VendorLoginResponse> {
  return apiFetch<VendorLoginResponse>('/vendors/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function vendorLoginPasscode(email: string, passcode: string): Promise<VendorLoginResponse> {
  return apiFetch<VendorLoginResponse>('/vendors/login-passcode', {
    method: 'POST',
    body: JSON.stringify({ email, passcode }),
  });
}

export async function getVendorProfile(): Promise<VendorUser> {
  return apiFetch<VendorUser>('/vendors/me');
}

export async function getVendorReservations(): Promise<Reservation[]> {
  return apiFetch<Reservation[]>('/vendors/me/reservations');
}

// ─── Admin Vendor Management ─────────────────────────────────

export async function getVendors(): Promise<VendorUser[]> {
  return apiFetch<VendorUser[]>('/admin/vendors');
}

export async function createVendor(input: {
  fullName: string;
  email: string;
  contactNumber?: string;
  businessName?: string;
  event?: string;
}): Promise<VendorUser> {
  return apiFetch<VendorUser>('/admin/vendors', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateVendor(id: number, input: {
  fullName?: string;
  contactNumber?: string;
  businessName?: string;
  email?: string;
  status?: string;
  password?: string;
  event?: string;
}): Promise<VendorUser> {
  return apiFetch<VendorUser>(`/admin/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteVendor(id: number): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/admin/vendors/${id}`, {
    method: 'DELETE',
  });
}

export async function getVendorReservationCount(id: number): Promise<number> {
  const result = await apiFetch<{ count: number }>(`/admin/vendors/${id}/reservation-count`);
  return result.count;
}
