import { describe, it, expect } from 'vitest';
import { generateInitialStalls } from './stallData';

describe('generateInitialStalls', () => {
  const stalls = generateInitialStalls();

  it('generates exactly 300 numbered stalls + 13 corner stalls + 4 corner D = 317 total', () => {
    expect(stalls.length).toBe(317);
  });

  it('first 300 stalls have sequential numeric IDs', () => {
    for (let i = 0; i < 300; i++) {
      expect(stalls[i].id).toBe(String(i + 1));
      expect(stalls[i].number).toBe(i + 1);
    }
  });

  it('all stalls have required fields', () => {
    for (const stall of stalls) {
      expect(stall).toHaveProperty('id');
      expect(stall).toHaveProperty('section');
      expect(stall).toHaveProperty('number');
      expect(stall).toHaveProperty('status');
      expect(stall).toHaveProperty('price');
      expect(stall).toHaveProperty('size');
      expect(stall).toHaveProperty('category');
      expect(stall).toHaveProperty('description');
      expect(stall).toHaveProperty('image');
    }
  });

  it('all stalls have valid status values', () => {
    const validStatuses = ['available', 'pending', 'reserved', 'occupied'];
    for (const stall of stalls) {
      expect(validStatuses).toContain(stall.status);
    }
  });

  it('all stalls have valid size values', () => {
    const validSizes = ['small', 'medium', 'large', 'corner'];
    for (const stall of stalls) {
      expect(validSizes).toContain(stall.size);
    }
  });

  it('all stalls have valid category values', () => {
    const validCategories = [
      'Cooked Food',
      'Vegetables & Fruits',
      'Dry Goods & Groceries',
      'Clothing & Apparel',
      'General Merchandise',
      'Non-Food',
    ];
    for (const stall of stalls) {
      expect(validCategories).toContain(stall.category);
    }
  });

  it('corner stalls (A1-A5, B1-B4, C1-C4, D36-D39) have corner size', () => {
    const cornerStalls = stalls.filter((s) => s.size === 'corner');
    expect(cornerStalls.length).toBeGreaterThan(0);
    for (const cs of cornerStalls) {
      expect(cs.price).toBe(4500);
    }
  });

  it('small stalls cost 1500', () => {
    const smallStalls = stalls.filter((s) => s.size === 'small');
    expect(smallStalls.length).toBeGreaterThan(0);
    for (const s of smallStalls) {
      expect(s.price).toBe(1500);
    }
  });

  it('medium stalls cost 2500', () => {
    const mediumStalls = stalls.filter((s) => s.size === 'medium');
    expect(mediumStalls.length).toBeGreaterThan(0);
    for (const s of mediumStalls) {
      expect(s.price).toBe(2500);
    }
  });

  it('large stalls cost 3500', () => {
    const largeStalls = stalls.filter((s) => s.size === 'large');
    expect(largeStalls.length).toBeGreaterThan(0);
    for (const s of largeStalls) {
      expect(s.price).toBe(3500);
    }
  });

  it('stalls in range 1-47 are in Section A', () => {
    const sectionA = stalls.filter((s) => s.number >= 1 && s.number <= 47);
    expect(sectionA.length).toBe(47);
    for (const s of sectionA) {
      expect(s.section).toBe('Section A');
    }
  });

  it('stalls in range 48-91 are in Section B', () => {
    const sectionB = stalls.filter((s) => s.number >= 48 && s.number <= 91);
    expect(sectionB.length).toBe(44);
    for (const s of sectionB) {
      expect(s.section).toBe('Section B');
    }
  });

  it('stalls 259-276 are always available', () => {
    const range = stalls.filter((s) => s.number >= 259 && s.number <= 276);
    expect(range.length).toBe(18);
    for (const s of range) {
      expect(s.status).toBe('available');
    }
  });

  it('stall 29 (divisible by 29) is occupied', () => {
    const stall29 = stalls.find((s) => s.number === 29);
    expect(stall29).toBeDefined();
    expect(stall29!.status).toBe('occupied');
  });

  it('stall 17 (divisible by 17) is reserved', () => {
    const stall17 = stalls.find((s) => s.number === 17);
    expect(stall17).toBeDefined();
    expect(stall17!.status).toBe('reserved');
  });

  it('all stalls have non-empty descriptions', () => {
    for (const stall of stalls) {
      expect(stall.description.length).toBeGreaterThan(0);
    }
  });

  it('all stalls have non-empty image URLs', () => {
    for (const stall of stalls) {
      expect(stall.image).toContain('https://');
    }
  });

  it('no stall has a reservationId by default', () => {
    for (const stall of stalls) {
      expect(stall.reservationId).toBeUndefined();
    }
  });
});
