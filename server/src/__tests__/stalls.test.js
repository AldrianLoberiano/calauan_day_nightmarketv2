import { describe, it, expect } from 'vitest';
import { generateInitialStalls } from '../stalls.js';

describe('generateInitialStalls (server)', () => {
  const stalls = generateInitialStalls();

  it('generates exactly 300 numbered stalls + 13 corner stalls + 6 corner D = 319 total', () => {
    expect(stalls.length).toBe(319);
  });

  it('first 300 stalls have sequential string IDs', () => {
    for (let i = 0; i < 300; i++) {
      expect(stalls[i].id).toBe(String(i + 1));
      expect(stalls[i].number).toBe(i + 1);
    }
  });

  it('all stalls have required DB-facing fields', () => {
    for (const stall of stalls) {
      expect(stall).toHaveProperty('id');
      expect(stall).toHaveProperty('section');
      expect(stall).toHaveProperty('number');
      expect(stall).toHaveProperty('status');
      expect(stall).toHaveProperty('price');
      expect(stall).toHaveProperty('size');
      expect(stall).toHaveProperty('category');
      expect(stall).toHaveProperty('description');
      expect(stall).toHaveProperty('image_url');
      expect(stall).toHaveProperty('reservation_id');
      expect(stall.reservation_id).toBeNull();
    }
  });

  it('all stalls have valid statuses', () => {
    const valid = ['available', 'pending', 'reserved', 'occupied'];
    for (const stall of stalls) {
      expect(valid).toContain(stall.status);
    }
  });

  it('all stalls have valid sizes', () => {
    const valid = ['small', 'medium', 'large', 'corner'];
    for (const stall of stalls) {
      expect(valid).toContain(stall.size);
    }
  });

  it('small stalls cost 1500', () => {
    const small = stalls.filter((s) => s.size === 'small');
    expect(small.length).toBeGreaterThan(0);
    for (const s of small) {
      expect(s.price).toBe(1500);
    }
  });

  it('medium stalls cost 2500', () => {
    const medium = stalls.filter((s) => s.size === 'medium');
    expect(medium.length).toBeGreaterThan(0);
    for (const s of medium) {
      expect(s.price).toBe(2500);
    }
  });

  it('large stalls cost 3500', () => {
    const large = stalls.filter((s) => s.size === 'large');
    expect(large.length).toBeGreaterThan(0);
    for (const s of large) {
      expect(s.price).toBe(3500);
    }
  });

  it('corner stalls cost 4500', () => {
    const corners = stalls.filter((s) => s.size === 'corner');
    expect(corners.length).toBeGreaterThan(0);
    for (const c of corners) {
      expect(c.price).toBe(4500);
    }
  });

  it('stalls 1-47 are in Section A', () => {
    const sectionA = stalls.filter((s) => s.number >= 1 && s.number <= 47);
    expect(sectionA.length).toBe(47);
    for (const s of sectionA) {
      expect(s.section).toBe('Section A');
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
    const stall = stalls.find((s) => s.number === 29);
    expect(stall).toBeDefined();
    expect(stall.status).toBe('occupied');
  });

  it('stall 17 (divisible by 17) is reserved', () => {
    const stall = stalls.find((s) => s.number === 17);
    expect(stall).toBeDefined();
    expect(stall.status).toBe('reserved');
  });

  it('corner A1-A5 exist with corner size', () => {
    const ids = ['A1', 'A2', 'A3', 'A4', 'A5'];
    for (const id of ids) {
      const stall = stalls.find((s) => s.id === id);
      expect(stall).toBeDefined();
      expect(stall.size).toBe('corner');
      expect(stall.section).toBe('Corner A');
    }
  });

  it('corner B1-B4 exist', () => {
    for (let i = 1; i <= 4; i++) {
      const stall = stalls.find((s) => s.id === `B${i}`);
      expect(stall).toBeDefined();
      expect(stall.size).toBe('corner');
      expect(stall.section).toBe('Corner B');
    }
  });

  it('corner C1-C4 exist', () => {
    for (let i = 1; i <= 4; i++) {
      const stall = stalls.find((s) => s.id === `C${i}`);
      expect(stall).toBeDefined();
      expect(stall.size).toBe('corner');
      expect(stall.section).toBe('Corner C');
    }
  });

  it('corner D stalls exist', () => {
    const dCorners = ['D36', 'D37', 'D38', 'D39', 'D5', 'D6'];
    for (const id of dCorners) {
      const stall = stalls.find((s) => s.id === id);
      expect(stall).toBeDefined();
      expect(stall.size).toBe('corner');
      expect(stall.section).toBe('Corner D');
    }
  });

  it('all stalls have non-empty descriptions', () => {
    for (const stall of stalls) {
      expect(stall.description.length).toBeGreaterThan(0);
    }
  });

  it('all stalls have image URLs', () => {
    for (const stall of stalls) {
      expect(stall.image_url).toContain('https://');
    }
  });
});
