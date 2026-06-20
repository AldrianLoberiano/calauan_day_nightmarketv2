import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStalls,
  updateStall,
  getStallById,
  getReservations,
  getReservationById,
  addReservation,
  updateReservation,
  deleteReservation,
  verifyAdminLogin,
  approveReservation,
  rejectReservation,
  markAsOccupied,
  resetStorage,
  extendPendingReservations,
} from './storage';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('getStalls', () => {
  it('fetches stalls without source', async () => {
    const stalls = [{ id: '1', section: 'A', status: 'available' }];
    mockFetch.mockResolvedValue(mockJsonResponse(stalls));

    const result = await getStalls();
    expect(result).toEqual(stalls);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stalls'),
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
    );
  });

  it('fetches stalls with source query param', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse([]));

    await getStalls('design_map');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stalls?source=design_map'),
      expect.any(Object)
    );
  });
});

describe('updateStall', () => {
  it('sends PUT request with stall data', async () => {
    const stall = { id: '1', status: 'reserved', reservationId: 'r1' };
    mockFetch.mockResolvedValue(mockJsonResponse(stall));

    const result = await updateStall(stall as any);
    expect(result).toEqual(stall);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stalls/1'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ status: 'reserved', reservationId: 'r1' }),
      })
    );
  });
});

describe('getStallById', () => {
  it('returns stall when found', async () => {
    const stall = { id: '1', section: 'A' };
    mockFetch.mockResolvedValue(mockJsonResponse(stall));

    const result = await getStallById('1');
    expect(result).toEqual(stall);
  });

  it('returns undefined on error', async () => {
    mockFetch.mockRejectedValue(new Error('Not found'));

    const result = await getStallById('999');
    expect(result).toBeUndefined();
  });
});

describe('getReservations', () => {
  it('fetches all reservations', async () => {
    const reservations = [{ id: 'r1', reservationNumber: 'RES-001' }];
    mockFetch.mockResolvedValue(mockJsonResponse(reservations));

    const result = await getReservations();
    expect(result).toEqual(reservations);
  });
});

describe('getReservationById', () => {
  it('returns reservation when found', async () => {
    const reservation = { id: 'r1' };
    mockFetch.mockResolvedValue(mockJsonResponse(reservation));

    const result = await getReservationById('r1');
    expect(result).toEqual(reservation);
  });

  it('returns undefined on error', async () => {
    mockFetch.mockRejectedValue(new Error('Not found'));

    const result = await getReservationById('missing');
    expect(result).toBeUndefined();
  });
});

describe('addReservation', () => {
  it('sends POST request with reservation data', async () => {
    const input = { stallId: '1', fullName: 'John', contactNumber: '0917' };
    const response = {
      reservation: { id: 'r1', ...input },
      stall: { id: '1', status: 'pending' },
    };
    mockFetch.mockResolvedValue(mockJsonResponse(response));

    const result = await addReservation(input);
    expect(result).toEqual(response);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/reservations'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  });
});

describe('updateReservation', () => {
  it('sends PUT request', async () => {
    const updated = { id: 'r1', fullName: 'Jane' };
    mockFetch.mockResolvedValue(mockJsonResponse(updated));

    const result = await updateReservation(updated as any);
    expect(result).toEqual(updated);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/reservations/r1'),
      expect.objectContaining({ method: 'PUT' })
    );
  });
});

describe('deleteReservation', () => {
  it('sends DELETE request', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ removed: true }));

    const result = await deleteReservation('r1');
    expect(result).toEqual({ removed: true });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/reservations/r1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

describe('verifyAdminLogin', () => {
  it('returns token on successful login', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ ok: true, token: 'fake-admin-token' }));

    const result = await verifyAdminLogin('admin', 'pass');
    expect(result).toBe('fake-admin-token');
  });

  it('returns null on failed login', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ ok: false }));

    const result = await verifyAdminLogin('admin', 'wrong');
    expect(result).toBeNull();
  });
});

describe('approveReservation', () => {
  it('sends POST to approve endpoint', async () => {
    const reservation = { id: 'r1', status: 'approved' };
    mockFetch.mockResolvedValue(mockJsonResponse(reservation));

    const result = await approveReservation('r1');
    expect(result).toEqual(reservation);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/reservations/r1/approve'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('rejectReservation', () => {
  it('sends POST to reject endpoint with notes', async () => {
    const reservation = { id: 'r1', status: 'rejected' };
    mockFetch.mockResolvedValue(mockJsonResponse(reservation));

    const result = await rejectReservation('r1', 'Not qualified');
    expect(result).toEqual(reservation);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/reservations/r1/reject'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ notes: 'Not qualified' }),
      })
    );
  });
});

describe('markAsOccupied', () => {
  it('sends POST to occupy endpoint', async () => {
    const reservation = { id: 'r1', status: 'occupied' };
    mockFetch.mockResolvedValue(mockJsonResponse(reservation));

    const result = await markAsOccupied('r1');
    expect(result).toEqual(reservation);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/reservations/r1/occupy'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('resetStorage', () => {
  it('sends POST to reset endpoint', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ ok: true }));

    await resetStorage();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/reset'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('extendPendingReservations', () => {
  it('sends POST to extend-pending endpoint', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ ok: true, updated: 5 }));

    const result = await extendPendingReservations();
    expect(result).toEqual({ ok: true, updated: 5 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/extend-pending'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('apiFetch error handling', () => {
  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse('Server error', false, 500));

    await expect(getStalls()).rejects.toThrow('Server error');
  });

  it('throws default message when response text is empty', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(''),
    });

    await expect(getStalls()).rejects.toThrow('Request failed');
  });
});
