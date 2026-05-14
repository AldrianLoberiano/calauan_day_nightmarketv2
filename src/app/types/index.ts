export type StallStatus = 'available' | 'pending' | 'reserved' | 'occupied';
export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'occupied';
export type StallSize = 'small' | 'medium' | 'large' | 'corner';
export type StallCategory =
  | 'Cooked Food'
  | 'Vegetables & Fruits'
  | 'Dry Goods & Groceries'
  | 'Clothing & Apparel'
  | 'General Merchandise';

export interface Stall {
  id: string;
  section: string;
  number: number;
  status: StallStatus;
  price: number;
  size: StallSize;
  category: StallCategory;
  description: string;
  image: string;
  reservationId?: string;
}

export interface Reservation {
  id: string;
  reservationNumber: string;
  stallId: string;
  fullName: string;
  contactNumber: string;
  businessName?: string;
  address?: string;
  status: ReservationStatus;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export interface AdminUser {
  username: string;
  password: string;
}
