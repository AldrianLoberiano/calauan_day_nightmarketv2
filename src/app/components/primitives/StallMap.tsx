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
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const sm = new Map(stalls.filter(s => s.number > 0).map(s => [s.number, s]));
  const cm = new Map(stalls.filter(s => s.number === 0).map(s => [s.id, s]));
  const g = (n: number) => sm.get(n);

  // Groups
  const topOutL = [135,...range(136,196).filter(n=>n%2===0)].map(g).filter(Boolean) as Stall[];
  const topOutR = range(197,225).map(g).filter(Boolean) as Stall[];
  const inTop = range(137,195).filter(n=>n%2===1).map(g).filter(Boolean) as Stall[];
  const lOut = range(76,134).filter(n=>n%2===0).reverse().map(g).filter(Boolean) as Stall[];
  const lIn = range(77,133).filter(n=>n%2===1).reverse().map(g).filter(Boolean) as Stall[];
  const lBot = [75,74,73,72].map(g).filter(Boolean) as Stall[];
  const rCol = range(35,61).reverse().map(g).filter(Boolean) as Stall[];
  const inBot = range(1,34).map(g).filter(Boolean) as Stall[];
  const outBL = range(22,71).reverse().map(g).filter(Boolean) as Stall[];
  const outBR = range(226,258).map(g).filter(Boolean) as Stall[];
  const cA = ['A1','A2','A3','A4','A5'].map(id=>cm.get(id)).filter(Boolean) as Stall[];
  const cB = ['B1','B2','B3','B4'].map(id=>cm.get(id)).filter(Boolean) as Stall[];
  const cC = ['C1','C2','C3','C4'].map(id=>cm.get(id)).filter(Boolean) as Stall[];
  const cD = ['D1','D2','D3','D4','D5','D6'].map(id=>cm.get(id)).filter(Boolean) as Stall[];

  const statusColor: Record<string,string> = {
    available:'#22c55e', pending:'#facc15', reserved:'#ef4444', occupied:'#6b7280'
  };
  const statusBorder: Record<string,string> = {
    available:'#16a34a', pending:'#eab308', reserved:'#dc2626', occupied:'#4b5563'
  };

