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

  // ── Perimeter layout (clockwise from bottom-left) ─────────────────
  // Bottom row (left)  : 22  – 71   (left → right)
  // Bottom row (right) : 21  – 1    (left → right)
  // Left column        : 72  – 134  (bottom → top)
  // Upper-left link    : 135 (single)
  // Top row (left)     : 136 – 196  (left → right)
  // Top row (right)    : 197 – 225  (left → right)
  // Right column       : 226 – 258  (top → bottom)
  const bottomLeftRow = range(22, 71).map(n => stallMap.get(n)!).filter(Boolean).reverse();
  const bottomRightRow = range(1, 21).map(n => stallMap.get(n)!).filter(Boolean).reverse();
  const leftCol = range(72, 134).map(n => stallMap.get(n)!).filter(Boolean).reverse();
  const upperLeftLink = stallMap.get(135);
  const topLeftRow = range(136, 196).map(n => stallMap.get(n)!).filter(Boolean);
  const topRightRow = range(197, 225).map(n => stallMap.get(n)!).filter(Boolean);
  const rightCol = range(226, 258).map(n => stallMap.get(n)!).filter(Boolean);

  const cornerA = ['A1', 'A2', 'A3', 'A4', 'A5'].map(id => cornerMap.get(id)!).filter(Boolean);
  const cornerB = ['B1', 'B2', 'B3', 'B4'].map(id => cornerMap.get(id)!).filter(Boolean);
  const cornerC = ['C1', 'C2', 'C3', 'C4'].map(id => cornerMap.get(id)!).filter(Boolean);
  const cornerD = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'].map(id => cornerMap.get(id)!).filter(Boolean);

  // ── Sub-components ───────────────────────────────────────────────
  function StallCell({ stall, dir }: { stall: Stall; dir: 'h' | 'v' }) {
    const isSelected = selectedStallId === stall.id;
    const colorClass = getStallColorClass(stall.status);
    const labelClass = stall.id.length >= 3 ? 'text-[7px] sm:text-[8px]' : 'text-[9px] sm:text-[10px]';
    const sizeClass =
      dir === 'h'
        ? 'w-[28px] h-[24px] sm:w-[32px] sm:h-[28px] lg:w-[36px] lg:h-[30px]'
        : 'w-[24px] h-[28px] sm:w-[28px] sm:h-[32px] lg:w-[30px] lg:h-[36px]';

    return (
      <button
        onClick={() => onStallClick(stall)}
        title={`${stall.id} — ${stall.status} — ₱${stall.price.toLocaleString()}/mo`}
        className={[
          'relative flex flex-col items-center justify-center shrink-0',
          'border-2 transition-all duration-150 select-none cursor-pointer group',
          'rounded-sm text-white shadow-sm',
          sizeClass,
          colorClass,
          isSelected
            ? 'ring-4 ring-offset-1 ring-blue-500 scale-110 z-10 shadow-lg'
            : 'hover:scale-105 hover:shadow-md hover:z-10',
        ].join(' ')}
        aria-label={`Stall ${stall.id}, ${stall.status}`}
      >
        <span className={`${labelClass} font-black leading-none`}>{stall.id}</span>
        <span className="text-[7px] sm:text-[8px] leading-none mt-0.5 opacity-90 capitalize">
          {stall.status === 'available'
            ? '₱' + (stall.price / 1000).toFixed(1) + 'k'
            : stall.status.slice(0, 3)}
        </span>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-40 hidden group-hover:block pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap min-w-[120px]">
            <div className="font-bold">{stall.id}</div>
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

  function CornerTag({ label }: { label: string }) {
    return (
      <div className="flex items-center justify-center w-7 h-7 border-2 border-blue-900 bg-white text-blue-900 rounded shrink-0">
        <span className="text-xs font-black leading-none">{label}</span>
      </div>
    );
  }

  function CornerStallCell({ stall }: { stall: Stall }) {
    const isSelected = selectedStallId === stall.id;
    const labelClass = stall.id.length >= 3 ? 'text-[7px] sm:text-[8px]' : 'text-[8px] sm:text-[9px]';

    return (
      <button
        onClick={() => onStallClick(stall)}
        title={`${stall.id} — ${stall.status} — ₱${stall.price.toLocaleString()}/mo`}
        className={[
          'relative flex items-center justify-center shrink-0',
          'border-2 border-red-600 bg-white text-red-700',
          'transition-all duration-150 select-none cursor-pointer group',
          'rounded-sm shadow-sm',
          'w-[22px] h-[20px] sm:w-[24px] sm:h-[22px] lg:w-[26px] lg:h-[24px]',
          isSelected
            ? 'ring-2 ring-offset-1 ring-blue-500 scale-110 z-10'
            : 'hover:scale-105 hover:z-10',
        ].join(' ')}
        aria-label={`Stall ${stall.id}, ${stall.status}`}
      >
        <span className={`${labelClass} font-black leading-none`}>{stall.id}</span>
      </button>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[2200px] p-4 sm:p-6">

        {/* ── Outer site boundary ────────────────────────────────── */}
        <div className="relative border-4 border-blue-900 rounded-2xl bg-blue-50 shadow-inner">

          <div className="px-10 py-10 sm:px-12 sm:py-10">

            <div className="grid grid-cols-[auto,1fr,auto,1fr] gap-2">

              {/* ── TOP ROW ───────────────────────────────────── */}
              <div aria-hidden="true" />
              <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                {upperLeftLink && <StallCell stall={upperLeftLink} dir="h" />}
                {topLeftRow.map(s => <StallCell key={s.id} stall={s} dir="h" />)}
              </div>
              <div aria-hidden="true" />
              <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                {topRightRow.map(s => <StallCell key={s.id} stall={s} dir="h" />)}
              </div>

              {/* ── MIDDLE SECTION ───────────────────────────── */}
              <div className="flex flex-col items-center gap-0.5 sm:gap-1 shrink-0">
                {leftCol.map(s => <StallCell key={s.id} stall={s} dir="v" />)}
              </div>

              {/* ── Left block: MARKET SITE ─────────────────── */}
              <div className="relative flex items-center justify-center" style={{ minHeight: 340 }}>
                <div
                  className="absolute inset-0"
                  style={{
                    background: '#d1d5db',
                    clipPath:
                      'polygon(9% 0%, 91% 0%, 100% 9%, 100% 91%, 91% 100%, 9% 100%, 0% 91%, 0% 9%)',
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    inset: '10px',
                    background: '#e5e7eb',
                    border: '3px solid #6b7280',
                    clipPath:
                      'polygon(8% 0%, 92% 0%, 100% 8%, 100% 92%, 92% 100%, 8% 100%, 0% 92%, 0% 8%)',
                  }}
                />
                <div className="relative z-10 text-center select-none px-6">
                  <div className="text-4xl sm:text-5xl mb-2 leading-none">🏪</div>
                  <div className="font-black text-gray-700 text-lg sm:text-2xl tracking-[0.18em] uppercase leading-tight">
                    MARKET SITE
                  </div>
                  <div className="text-gray-500 text-[10px] sm:text-xs mt-1 font-semibold tracking-widest">
                    Pwesto Night Market
                  </div>
                </div>

                {/* Corner labels */}
                <div className="absolute top-2 left-2 z-20"><CornerTag label="C" /></div>
                <div className="absolute top-2 right-2 z-20"><CornerTag label="D" /></div>
                <div className="absolute bottom-2 left-2 z-20"><CornerTag label="B" /></div>
                <div className="absolute bottom-2 right-2 z-20"><CornerTag label="A" /></div>

                {/* Corner stalls */}
                <div className="absolute top-10 left-3 flex flex-wrap gap-1 max-w-[120px]">
                  {cornerC.map(s => <CornerStallCell key={s.id} stall={s} />)}
                </div>
                <div className="absolute top-10 right-3 flex flex-wrap justify-end gap-1 max-w-[140px]">
                  {cornerD.map(s => <CornerStallCell key={s.id} stall={s} />)}
                </div>
                <div className="absolute bottom-10 left-3 flex flex-wrap gap-1 max-w-[120px]">
                  {cornerB.map(s => <CornerStallCell key={s.id} stall={s} />)}
                </div>
                <div className="absolute bottom-10 right-3 flex flex-wrap justify-end gap-1 max-w-[140px]">
                  {cornerA.map(s => <CornerStallCell key={s.id} stall={s} />)}
                </div>
              </div>

              {/* Right column (road edge) */}
              <div className="flex flex-col items-center gap-0.5 sm:gap-1 shrink-0">
                {rightCol.map(s => <StallCell key={s.id} stall={s} dir="v" />)}
              </div>

              {/* ── Right block: PET BOTTLING ───────────────── */}
              <div className="relative flex items-center justify-center" style={{ minHeight: 340 }}>
                <div className="absolute inset-0 rounded-lg border-2 border-gray-300 bg-gray-100" />
                <div className="relative z-10 text-center select-none">
                  <div className="text-gray-500 text-sm sm:text-base font-semibold tracking-[0.2em] uppercase">
                    PET BOTTLING
                  </div>
                </div>
              </div>

              {/* ── BOTTOM ROW ─────────────────────────────── */}
              <div aria-hidden="true" />
              <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                {bottomLeftRow.map(s => <StallCell key={s.id} stall={s} dir="h" />)}
              </div>
              <div aria-hidden="true" />
              <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                {bottomRightRow.map(s => <StallCell key={s.id} stall={s} dir="h" />)}
              </div>

            </div>

          </div>{/* /inner padding */}
        </div>{/* /outer boundary */}

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
            <div className="w-5 h-5 rounded border-2 border-red-600 bg-white flex items-center justify-center">
              <span className="text-[8px] font-black text-red-700">A1</span>
            </div>
            <span className="text-xs sm:text-sm text-gray-700">Corner Stall</span>
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
