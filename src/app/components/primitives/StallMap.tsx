import React, { useState, useRef } from 'react';
import { Stall } from '../../types';
import { getStallColorClass } from '../../utils/helpers';

interface StallMapProps {
  stalls: Stall[];
  onStallClick: (stall: Stall) => void;
  selectedStallId?: string;
}

function range(a: number, b: number) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

export function StallMap({ stalls, onStallClick, selectedStallId }: StallMapProps) {
