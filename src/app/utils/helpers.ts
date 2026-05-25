import { StallStatus, ReservationStatus } from '../types';

export function formatPeso(amount: number): string {
  return 'To be discussed';
}

export function getStallColorClass(status: StallStatus): string {
  switch (status) {
    case 'available':
      return 'bg-green-500 hover:bg-green-600 border-green-600';
    case 'pending':
      return 'bg-yellow-400 hover:bg-yellow-500 border-yellow-500';
    case 'reserved':
      return 'bg-red-500 hover:bg-red-600 border-red-600';
    case 'occupied':
      return 'bg-gray-500 hover:bg-gray-600 border-gray-600';
    default:
      return 'bg-gray-300 border-gray-400';
  }
}

export function getStatusTextClass(status: StallStatus | ReservationStatus): string {
  switch (status) {
    case 'available':
      return 'text-green-700 bg-green-100';
    case 'pending':
      return 'text-yellow-700 bg-yellow-100';
    case 'reserved':
    case 'approved':
      return 'text-blue-700 bg-blue-100';
    case 'occupied':
      return 'text-gray-700 bg-gray-200';
    case 'rejected':
      return 'text-red-700 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getStatusLabel(status: StallStatus | ReservationStatus): string {
  switch (status) {
    case 'available': return 'Available';
    case 'pending': return 'Pending';
    case 'reserved': return 'Reserved';
    case 'occupied': return 'Occupied';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    default: return status;
  }
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const exp = new Date(expiresAt);
  const diff = exp.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getDisplayStallId(stallId: string): string {
  if (!stallId) return '';
  if (stallId === 'A1') return 'G5';
  if (stallId === 'A2') return 'G4';
  if (stallId === 'A3') return 'G3';
  if (stallId === 'A4') return 'G4';
  if (stallId === 'A5') return 'G5';
  if (stallId === 'C1') return 'BB31';
  if (stallId === 'C2') return 'BB32';
  if (stallId === 'C3') return 'BB33';
  if (stallId === 'C4') return 'BB34';
  if (!/^\d+$/.test(stallId)) return stallId;
  const numericId = Number(stallId);
  if (numericId >= 1 && numericId <= 47) return `A${numericId}`;
  if (numericId >= 48 && numericId <= 91) return `B${numericId - 47}`;
  if (numericId >= 92 && numericId <= 133) return `AA${numericId - 91}`;
  if (numericId >= 134 && numericId <= 167) return `BB${numericId - 133}`;
  if (numericId >= 168 && numericId <= 204) return `C${numericId - 167}`;
  if (numericId >= 205 && numericId <= 243) return `D${numericId - 204}`;
  return stallId;
}

export function getDisplaySectionById(stallId: string, fallbackSection: string): string {
  if (!stallId) return fallbackSection;

  if (!/^\d+$/.test(stallId)) return fallbackSection;

  const numericId = Number(stallId);
  if (numericId >= 1 && numericId <= 47) return 'A';
  if (numericId >= 48 && numericId <= 91) return 'B';
  if (numericId >= 92 && numericId <= 133) return 'AA';
  if (numericId >= 134 && numericId <= 167) return 'BB';
  if (numericId >= 168 && numericId <= 204) return 'C';
  if (numericId >= 205 && numericId <= 243) return 'D';

  return fallbackSection;
}

export function getCornerDisplayStallId(stallId: string): string {
  return getDisplayStallId(stallId);
}
