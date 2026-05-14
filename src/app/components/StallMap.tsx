import React from 'react';
import { Stall } from '../types';
import { getStallColorClass } from '../utils/helpers';

interface StallMapProps {
  stalls: Stall[];
  onStallClick: (stall: Stall) => void;
  selectedStallId?: string;
}

export function StallMap({ stalls, onStallClick, selectedStallId }: StallMapProps) {
  const numericStalls = stalls.filter(s => s.number > 0);
  const stallMap = new Map(numericStalls.map(s => [s.number, s]));
  const cornerMap = new Map(stalls.filter(s => s.number === 0).map(s => [s.id, s]));

  // ─── Layout sections (matching plan.png exactly) ──────────────────

  // TOP OUTER ROW (above market site): 135,136,138,140,...196
  const topOuterLeft = [135, ...range(136, 196).filter(n => n % 2 === 0)]
    .map(n => stallMap.get(n)).filter(Boolean) as Stall[];

  // TOP OUTER ROW RIGHT (above pet bottling): 197,198,199,...225
  const topOuterRight = range(197, 225)
    .map(n => stallMap.get(n)).filter(Boolean) as Stall[];

  // INNER TOP ROW C→D: 137,139,141,...195 (odd numbers)
  const innerTopRow = range(137, 195).filter(n => n % 2 === 1)
    .map(n => stallMap.get(n)).filter(Boolean) as Stall[];

  // LEFT COLUMN (two paired columns, top to bottom)
  // Outer (even): 134,132,130,...72
  const leftColOuter = range(72, 134).filter(n => n % 2 === 0).reverse()
    .map(n => stallMap.get(n)).filter(Boolean) as Stall[];
  // Inner (odd): 131,129,...77
  const leftColInner = range(77, 131).filter(n => n % 2 === 1).reverse()
    .map(n => stallMap.get(n)).filter(Boolean) as Stall[];

  // BOTTOM ROW B→A (inner): 1,2,3,...34
  const bottomInnerRow = range(1, 34)
    .map(n => stallMap.get(n)).filter(Boolean) as Stall[];

  // RIGHT COLUMN D→A: 61,60,...35 (top to bottom, so 35 at bottom)
  const rightCol = range(35, 61).reverse()
    .map(n => stallMap.get(n)).filter(Boolean) as Stall[];

  // BOTTOM OUTER ROW LEFT: 71,70,69,...22 (right to left)
  const bottomOuterLeft = range(22, 71).reverse()
    .map(n => stallMap.get(n)).filter(Boolean) as Stall[];

  // BOTTOM OUTER ROW RIGHT: 29,28,27,...1
  const bottomOuterRight = range(226, 258)
    .map(n => stallMap.get(n)).filter(Boolean) as Stall[];

  // Corners
  const cornerA = ['A1', 'A2', 'A3', 'A4', 'A5'].map(id => cornerMap.get(id)).filter(Boolean) as Stall[];
  const cornerB = ['B1', 'B2', 'B3', 'B4'].map(id => cornerMap.get(id)).filter(Boolean) as Stall[];
  const cornerC = ['C1', 'C2', 'C3', 'C4'].map(id => cornerMap.get(id)).filter(Boolean) as Stall[];
  const cornerD = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'].map(id => cornerMap.get(id)).filter(Boolean) as Stall[];

  // ─── Sub-components ───────────────────────────────────────────────

  function StallCell({ stall, dir, small }: { stall: Stall; dir: 'h' | 'v'; small?: boolean }) {
    const isSelected = selectedStallId === stall.id;
    const colorClass = getStallColorClass(stall.status);
    const labelClass = stall.id.length >= 3 ? 'text-[6px] sm:text-[7px]' : 'text-[7px] sm:text-[8px]';
    const sizeClass = small
      ? (dir === 'h'
          ? 'w-[18px] h-[16px] sm:w-[22px] sm:h-[18px] lg:w-[24px] lg:h-[20px]'
          : 'w-[16px] h-[18px] sm:w-[18px] sm:h-[22px] lg:w-[20px] lg:h-[24px]')
      : (dir === 'h'
          ? 'w-[22px] h-[18px] sm:w-[26px] sm:h-[22px] lg:w-[28px] lg:h-[24px]'
          : 'w-[18px] h-[22px] sm:w-[22px] sm:h-[26px] lg:w-[24px] lg:h-[28px]');

    return (
      <button
        onClick={() => onStallClick(stall)}
        title={`Stall ${stall.id} — ${stall.status} — ₱${stall.price.toLocaleString()}/mo`}
        className={[
          'relative flex items-center justify-center shrink-0',
          'border transition-all duration-150 select-none cursor-pointer group',
          'text-white shadow-sm',
          sizeClass,
          colorClass,
          isSelected
            ? 'ring-3 ring-offset-1 ring-blue-500 scale-110 z-10 shadow-lg'
            : 'hover:scale-105 hover:shadow-md hover:z-10',
        ].join(' ')}
        aria-label={`Stall ${stall.id}, ${stall.status}`}
      >
        <span className={`${labelClass} font-black leading-none`}>{stall.id}</span>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-40 hidden group-hover:block pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap min-w-[120px]">
            <div className="font-bold">Stall {stall.id}</div>
            <div className="text-gray-300 text-[10px]">{stall.category}</div>
            <div className="text-gray-300 capitalize text-[10px]">{stall.status}</div>
            {stall.status === 'available' && (
              <div className="text-green-400 text-[10px]">₱{stall.price.toLocaleString()}/mo</div>
            )}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      </button>
    );
  }

  function CornerLabel({ label }: { label: string }) {
    return (
      <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 border-2 border-red-600 bg-white text-red-600 rounded-full shrink-0 font-black text-[10px] sm:text-xs shadow-md">
        {label}
      </div>
    );
  }

  function CornerStallCell({ stall }: { stall: Stall }) {
    const isSelected = selectedStallId === stall.id;
    return (
      <button
        onClick={() => onStallClick(stall)}
        title={`${stall.id} — ${stall.status} — ₱${stall.price.toLocaleString()}/mo`}
        className={[
          'relative flex items-center justify-center shrink-0',
          'border-2 border-red-500 bg-red-50 text-red-700',
          'transition-all duration-150 select-none cursor-pointer group',
          'rounded-sm shadow-sm',
          'w-[20px] h-[18px] sm:w-[22px] sm:h-[20px] lg:w-[24px] lg:h-[22px]',
          isSelected
            ? 'ring-2 ring-offset-1 ring-blue-500 scale-110 z-10'
            : 'hover:scale-105 hover:z-10',
        ].join(' ')}
        aria-label={`Stall ${stall.id}, ${stall.status}`}
      >
        <span className="text-[7px] sm:text-[8px] font-black leading-none">{stall.id}</span>
      </button>
    );
  }

  // ─── MAIN RENDER ──────────────────────────────────────────────────

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1800px] p-4 sm:p-6">

        {/* ── Outer site boundary ──────────────────────────────── */}
        <div className="relative border-[3px] border-blue-900 rounded-xl bg-white shadow-lg">

          {/* Road markings (magenta lines) */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-xl">
            {/* Top road */}
            <div className="absolute top-[52px] left-[60px] right-[60px] h-[3px] bg-pink-400 opacity-50" />
            <div className="absolute top-[56px] left-[60px] right-[60px] h-[2px] bg-pink-300 opacity-40" />
            {/* Bottom road */}
            <div className="absolute bottom-[52px] left-[60px] right-[60px] h-[3px] bg-pink-400 opacity-50" />
            <div className="absolute bottom-[56px] left-[60px] right-[60px] h-[2px] bg-pink-300 opacity-40" />
            {/* Left road */}
            <div className="absolute top-[60px] bottom-[60px] left-[52px] w-[3px] bg-pink-400 opacity-50" />
            <div className="absolute top-[60px] bottom-[60px] left-[56px] w-[2px] bg-pink-300 opacity-40" />
            {/* Right road */}
            <div className="absolute top-[60px] bottom-[60px] right-[52px] w-[3px] bg-pink-400 opacity-50" />
            <div className="absolute top-[60px] bottom-[60px] right-[56px] w-[2px] bg-pink-300 opacity-40" />
          </div>

          <div className="relative z-10 px-4 py-4 sm:px-6 sm:py-5">

            {/* ══════════════════════════════════════════════════════
                TOP OUTER ROWS (above everything)
                ══════════════════════════════════════════════════════ */}
            <div className="flex gap-4 mb-2">
              {/* Top outer left row */}
              <div className="flex items-center gap-[1px] flex-wrap">
                {topOuterLeft.map(s => <StallCell key={s.id} stall={s} dir="h" small />)}
              </div>
              {/* Spacer for the gap between sections */}
              <div className="w-[60px] shrink-0" />
              {/* Top outer right row */}
              <div className="flex items-center gap-[1px] flex-wrap">
                {topOuterRight.map(s => <StallCell key={s.id} stall={s} dir="h" small />)}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                MAIN CONTENT AREA (grid)
                ══════════════════════════════════════════════════════ */}
            <div className="flex gap-1">

              {/* ── LEFT SECTION ──────────────────────────────── */}
              <div className="flex flex-col flex-1">

                {/* Inner top row with corner labels C and D */}
                <div className="flex items-center gap-[1px] mb-1">
                  <CornerLabel label="C" />
                  <div className="flex items-center gap-[1px] flex-wrap flex-1">
                    {cornerC.map(s => <CornerStallCell key={s.id} stall={s} />)}
                    {innerTopRow.map(s => <StallCell key={s.id} stall={s} dir="h" small />)}
                    {cornerD.map(s => <CornerStallCell key={s.id} stall={s} />)}
                  </div>
                  <CornerLabel label="D" />
                </div>

                {/* Middle area: Left columns + Market Site + Right column */}
                <div className="flex gap-1 flex-1">

                  {/* Left paired columns */}
                  <div className="flex gap-[1px] shrink-0">
                    {/* Outer column (even: 134, 132, 130 ... 72) */}
                    <div className="flex flex-col gap-[1px]">
                      {leftColOuter.map(s => <StallCell key={s.id} stall={s} dir="v" small />)}
                    </div>
                    {/* Inner column (odd: 131, 129, 127 ... 77) */}
                    <div className="flex flex-col gap-[1px]">
                      {leftColInner.map(s => <StallCell key={s.id} stall={s} dir="v" small />)}
                    </div>
                  </div>

                  {/* ── MARKET SITE BUILDING ────────────────── */}
                  <div className="flex-1 relative border-2 border-gray-400 bg-gray-100 rounded-lg min-h-[500px] flex items-center justify-center mx-1">
                    {/* Inner border */}
                    <div className="absolute inset-2 border border-gray-300 rounded-md" />
                    <div className="text-center select-none z-10">
                      <div className="font-black text-gray-700 text-3xl sm:text-4xl lg:text-5xl tracking-[0.25em] uppercase leading-tight">
                        MARKET SITE
                      </div>
                    </div>
                  </div>

                  {/* Right column (D→A): 61, 60, ... 35 */}
                  <div className="flex flex-col gap-[1px] shrink-0">
                    {rightCol.map(s => <StallCell key={s.id} stall={s} dir="v" small />)}
                  </div>

                </div>

                {/* Bottom inner row B→A */}
                <div className="flex items-center gap-[1px] mt-1">
                  <CornerLabel label="B" />
                  <div className="flex items-center gap-[1px] flex-wrap flex-1">
                    {cornerB.map(s => <CornerStallCell key={s.id} stall={s} />)}
                    {bottomInnerRow.map(s => <StallCell key={s.id} stall={s} dir="h" small />)}
                    {cornerA.map(s => <CornerStallCell key={s.id} stall={s} />)}
                  </div>
                  <CornerLabel label="A" />
                </div>

              </div>

              {/* ── RIGHT SECTION (PET BOTTLING + area) ───── */}
              <div className="flex flex-col w-[350px] shrink-0 gap-1">

                {/* Empty space above pet bottling (aligns with market area) */}
                <div className="flex-1 relative border-2 border-gray-300 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center select-none">
                    <div className="font-bold text-gray-500 text-base sm:text-lg tracking-[0.2em] uppercase transform -rotate-45">
                      PET BOTTLING
                    </div>
                  </div>

                  {/* Corner markers */}
                  <div className="absolute top-3 right-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center text-[8px] font-bold text-gray-500">5</div>
                  </div>
                  <div className="absolute bottom-10 right-3 flex flex-col gap-1 items-end">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center text-[8px] font-bold text-gray-500">4</div>
                    <div className="flex gap-1">
                      <div className="font-bold text-gray-500 text-sm">3</div>
                      <div className="font-bold text-gray-500 text-sm">10</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* ══════════════════════════════════════════════════════
                BOTTOM OUTER ROWS
                ══════════════════════════════════════════════════════ */}
            <div className="flex gap-4 mt-2">
              {/* Bottom outer left */}
              <div className="flex items-center gap-[1px] flex-wrap">
                {bottomOuterLeft.map(s => <StallCell key={s.id} stall={s} dir="h" small />)}
              </div>
              {/* Spacer */}
              <div className="w-[20px] shrink-0" />
              {/* Bottom outer right */}
              <div className="flex items-center gap-[1px] flex-wrap">
                {bottomOuterRight.map(s => <StallCell key={s.id} stall={s} dir="h" small />)}
              </div>
            </div>

          </div>
        </div>

        {/* ── Legend ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mt-5 pt-4 border-t border-gray-200">
          <span className="text-xs sm:text-sm font-semibold text-gray-600">Legend:</span>
          {[
            { color: 'bg-green-500',  label: 'Available' },
            { color: 'bg-yellow-400', label: 'Pending' },
            { color: 'bg-red-500',    label: 'Reserved' },
            { color: 'bg-gray-500',   label: 'Occupied' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded ${item.color}`} />
              <span className="text-xs sm:text-sm text-gray-700">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border-2 border-red-500 bg-red-50 flex items-center justify-center">
              <span className="text-[8px] font-black text-red-700">A1</span>
            </div>
            <span className="text-xs sm:text-sm text-gray-700">Corner Stall</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full border-2 border-red-600 bg-white flex items-center justify-center">
              <span className="text-[9px] font-black text-red-600">A</span>
            </div>
            <span className="text-xs sm:text-sm text-gray-700">Corner Marker</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// helper: inclusive range as number[]
function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
