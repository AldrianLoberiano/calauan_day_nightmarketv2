import React from 'react';
import { Stall } from '../types';
import { getStallColorClass } from '../utils/helpers';

interface StallMapProps {
  stalls: Stall[];
  onStallClick: (stall: Stall) => void;
  selectedStallId?: string;
}

function range(a: number, b: number): number[] {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

export function StallMap({ stalls, onStallClick, selectedStallId }: StallMapProps) {
  const sm = new Map(stalls.filter(s => s.number > 0).map(s => [s.number, s]));
  const cm = new Map(stalls.filter(s => s.number === 0).map(s => [s.id, s]));
  const g = (n: number) => sm.get(n);

  // ═══ STALL GROUPS matching plan.png exactly ═══

  // Top outer left: 135,136,138,140,...196
  const topOutL = [135,...range(136,196).filter(n=>n%2===0)].map(g).filter(Boolean) as Stall[];
  // Top outer right: 197-225
  const topOutR = range(197,225).map(g).filter(Boolean) as Stall[];
  // Inner top C→D: odd 137-195
  const inTop = range(137,195).filter(n=>n%2===1).map(g).filter(Boolean) as Stall[];
  // Left outer col: even 134→76 (top to bottom)
  const lOut = range(76,134).filter(n=>n%2===0).reverse().map(g).filter(Boolean) as Stall[];
  // Left inner col: odd 133→77
  const lIn = range(77,133).filter(n=>n%2===1).reverse().map(g).filter(Boolean) as Stall[];
  // Left bottom singles: 75,74,73,72
  const lBot = [75,74,73,72].map(g).filter(Boolean) as Stall[];
  // Right col D→A: 61→35
  const rCol = range(35,61).reverse().map(g).filter(Boolean) as Stall[];
  // Inner bottom B→A: 1-34
  const inBot = range(1,34).map(g).filter(Boolean) as Stall[];
  // Outer bottom left: 71→22
  const outBL = range(22,71).reverse().map(g).filter(Boolean) as Stall[];
  // Outer bottom right: 226-258
  const outBR = range(226,258).map(g).filter(Boolean) as Stall[];

  const cA = ['A1','A2','A3','A4','A5'].map(id=>cm.get(id)).filter(Boolean) as Stall[];
  const cB = ['B1','B2','B3','B4'].map(id=>cm.get(id)).filter(Boolean) as Stall[];
  const cC = ['C1','C2','C3','C4'].map(id=>cm.get(id)).filter(Boolean) as Stall[];
  const cD = ['D1','D2','D3','D4','D5','D6'].map(id=>cm.get(id)).filter(Boolean) as Stall[];

  // ═══ STALL CELL ═══
  const S = ({ s, w, h }: { s: Stall; w: number; h: number }) => {
    const sel = selectedStallId === s.id;
    const cc = getStallColorClass(s.status);
    return (
      <button onClick={()=>onStallClick(s)}
        title={`Stall ${s.id} — ${s.status} — ₱${s.price.toLocaleString()}/mo`}
        style={{ width: w, height: h, fontSize: Math.min(w,h) * 0.42 }}
        className={`flex items-center justify-center shrink-0 border border-black/40 text-white font-bold cursor-pointer relative group select-none transition-all ${cc} ${sel ? 'ring-2 ring-blue-400 z-20 scale-110 shadow-lg' : 'hover:scale-105 hover:z-10 hover:shadow-md'}`}
        aria-label={`Stall ${s.id}`}>
        <span className="leading-none">{s.id}</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 hidden group-hover:block pointer-events-none">
          <div className="bg-gray-900/95 text-white text-[10px] rounded-md px-2.5 py-1.5 shadow-xl whitespace-nowrap backdrop-blur-sm">
            <div className="font-bold text-[11px]">Stall {s.id}</div>
            <div className="text-gray-300">{s.category}</div>
            <div className="text-gray-300 capitalize">{s.status}</div>
            {s.status==='available' && <div className="text-green-400 font-semibold">₱{s.price.toLocaleString()}/mo</div>}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"/>
        </div>
      </button>
    );
  };

  // Corner stall (red border)
  const CS = ({ s }: { s: Stall }) => {
    const sel = selectedStallId === s.id;
    return (
      <button onClick={()=>onStallClick(s)} title={s.id}
        style={{ width: 18, height: 16, fontSize: 7 }}
        className={`flex items-center justify-center shrink-0 border-2 border-red-500 bg-white text-red-600 font-black cursor-pointer ${sel?'ring-2 ring-blue-400 z-10':''}`}>
        {s.id}
      </button>
    );
  };

  // Corner label circle (A, B, C, D)
  const CL = ({ t }: { t: string }) => (
    <div style={{ width: 24, height: 24 }}
      className="flex items-center justify-center rounded-full border-[2.5px] border-red-600 bg-white text-red-600 font-black text-[11px] shrink-0 shadow-sm select-none">
      {t}
    </div>
  );

  // Intersection number circle
  const IC = ({ n, x, y }: { n: string; x: number; y: number }) => (
    <div className="absolute flex items-center justify-center rounded-full border-[1.5px] border-gray-500 bg-white text-gray-600 font-bold select-none"
      style={{ width: 22, height: 22, fontSize: 10, left: x, top: y }}>{n}</div>
  );

  // Horizontal row
  const HR = ({ ss, cw, ch }: { ss: Stall[]; cw: number; ch: number }) => (
    <div className="flex items-center" style={{ gap: 1 }}>
      {ss.map(s => <S key={s.id} s={s} w={cw} h={ch} />)}
    </div>
  );

  // Vertical column
  const VC = ({ ss, cw, ch }: { ss: Stall[]; cw: number; ch: number }) => (
    <div className="flex flex-col items-center" style={{ gap: 1 }}>
      {ss.map(s => <S key={s.id} s={s} w={cw} h={ch} />)}
    </div>
  );

  // Cell sizes
  const TW = 18, TH = 15;   // top outer row cells
  const IW = 20, IH = 17;   // inner ring horizontal cells
  const LW = 22, LH = 18;   // left column cells
  const RW = 22, RH = 17;   // right column cells
  const BW = 18, BH = 15;   // bottom outer row cells

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1700px] p-2 relative bg-white" style={{ fontFamily: "'Courier New', monospace" }}>

        {/* ═══ BACKGROUND GRID (architectural blueprint) ═══ */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#000 0,#000 1px,transparent 1px,transparent 20px),repeating-linear-gradient(90deg,#000 0,#000 1px,transparent 1px,transparent 20px)' }} />

        {/* ═══ OUTER BOUNDARY (dark blue) ═══ */}
        <div className="relative border-[3px] border-[#1a1a6e] rounded-sm">

          {/* ═══ SVG ROAD LINES & CURVES ═══ */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}
            viewBox="0 0 1700 950" preserveAspectRatio="none">
            
            {/* Top horizontal roads */}
            <line x1="60" y1="155" x2="770" y2="155" stroke="#d946ef" strokeWidth="2.5" opacity="0.5"/>
            <line x1="60" y1="160" x2="770" y2="160" stroke="#d946ef" strokeWidth="1.5" opacity="0.35"/>
            <line x1="820" y1="155" x2="1640" y2="155" stroke="#d946ef" strokeWidth="2.5" opacity="0.5"/>
            <line x1="820" y1="160" x2="1640" y2="160" stroke="#d946ef" strokeWidth="1.5" opacity="0.35"/>

            {/* Bottom horizontal roads */}
            <line x1="60" y1="845" x2="770" y2="845" stroke="#d946ef" strokeWidth="2.5" opacity="0.5"/>
            <line x1="60" y1="850" x2="770" y2="850" stroke="#d946ef" strokeWidth="1.5" opacity="0.35"/>
            <line x1="820" y1="845" x2="1640" y2="845" stroke="#d946ef" strokeWidth="2.5" opacity="0.5"/>
            <line x1="820" y1="850" x2="1640" y2="850" stroke="#d946ef" strokeWidth="1.5" opacity="0.35"/>

            {/* Left vertical roads */}
            <line x1="85" y1="30" x2="85" y2="920" stroke="#d946ef" strokeWidth="2.5" opacity="0.5"/>
            <line x1="90" y1="30" x2="90" y2="920" stroke="#d946ef" strokeWidth="1.5" opacity="0.35"/>

            {/* Center vertical roads (between market & right area) */}
            <line x1="790" y1="30" x2="790" y2="920" stroke="#d946ef" strokeWidth="2.5" opacity="0.5"/>
            <line x1="795" y1="30" x2="795" y2="920" stroke="#d946ef" strokeWidth="1.5" opacity="0.35"/>

            {/* Right vertical road (blue) */}
            <line x1="1660" y1="30" x2="1660" y2="920" stroke="#1a1a6e" strokeWidth="2" opacity="0.4"/>

            {/* Road curves at intersections */}
            {/* Top-left corner curve */}
            <path d="M 85,155 Q 85,30 200,30" fill="none" stroke="#d946ef" strokeWidth="2" opacity="0.35"/>
            {/* Top-right market curve */}
            <path d="M 770,155 Q 790,155 790,175" fill="none" stroke="#d946ef" strokeWidth="2" opacity="0.35"/>
            {/* Bottom-left curve */}
            <path d="M 85,845 Q 85,920 200,920" fill="none" stroke="#d946ef" strokeWidth="2" opacity="0.35"/>
            {/* Bottom-right market curve */}
            <path d="M 770,845 Q 790,845 790,825" fill="none" stroke="#d946ef" strokeWidth="2" opacity="0.35"/>
            {/* Top-right outer curve */}
            <path d="M 1640,155 Q 1660,155 1660,175" fill="none" stroke="#1a1a6e" strokeWidth="1.5" opacity="0.3"/>
            {/* Bottom-right outer curve */}
            <path d="M 1640,845 Q 1660,845 1660,825" fill="none" stroke="#1a1a6e" strokeWidth="1.5" opacity="0.3"/>
          </svg>

          <div className="relative" style={{ zIndex: 2, padding: '8px 10px' }}>

            {/* ╔══════════════════════════════════════════════╗
                ║  MARKET SITE BUILDING (top area)             ║
                ╚══════════════════════════════════════════════╝ */}
            <div className="flex" style={{ gap: 20, marginBottom: 4 }}>
              {/* MARKET SITE block */}
              <div className="relative border-2 border-gray-500 bg-[#f0f0f0]"
                style={{ width: 680, height: 140, flexShrink: 0 }}>
                {/* Inner borders (architectural detail) */}
                <div className="absolute border border-gray-400" style={{ inset: 6 }} />
                <div className="absolute border border-gray-300 border-dashed" style={{ inset: 14 }} />
                {/* Diagonal hatch at bottom */}
                <svg className="absolute bottom-0 left-0 w-full" style={{ height: 30 }} preserveAspectRatio="none">
                  <defs>
                    <pattern id="hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#ccc" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hatch)" opacity="0.5"/>
                </svg>
                {/* Label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-black text-gray-700 tracking-[0.35em] select-none"
                    style={{ fontSize: 48 }}>MARKET SITE</span>
                </div>
              </div>
              {/* Empty road junction area (top right) */}
              <div className="flex-1 relative min-h-[140px]">
                <IC n="5" x={340} y={10}/>
              </div>
            </div>

            {/* ╔══════════════════════════════════════════════╗
                ║  TOP OUTER STALL ROWS                        ║
                ╚══════════════════════════════════════════════╝ */}
            <div className="flex" style={{ gap: 55, marginBottom: 3 }}>
              <HR ss={topOutL} cw={TW} ch={TH} />
              <HR ss={topOutR} cw={TW} ch={TH} />
            </div>

            {/* ╔══════════════════════════════════════════════╗
                ║  MAIN BODY: Left cols + Inner ring + Right   ║
                ╚══════════════════════════════════════════════╝ */}
            <div className="flex" style={{ gap: 0 }}>

              {/* ── LEFT PAIRED COLUMNS ── */}
              <div className="flex shrink-0" style={{ gap: 1, marginRight: 3 }}>
                {/* Outer column (even numbers) + bottom singles */}
                <div className="flex flex-col" style={{ gap: 1 }}>
                  <VC ss={lOut} cw={LW} ch={LH} />
                  <VC ss={lBot} cw={LW} ch={LH} />
                </div>
                {/* Inner column (odd numbers) */}
                <VC ss={lIn} cw={LW} ch={LH} />
              </div>

              {/* ── INNER RING ── */}
              <div className="flex flex-col flex-1">

                {/* Inner top: C + corners + stalls + corners + D */}
                <div className="flex items-center" style={{ gap: 2, marginBottom: 2 }}>
                  <CL t="C"/>
                  {cC.map(s=><CS key={s.id} s={s}/>)}
                  <HR ss={inTop} cw={IW} ch={IH} />
                  {cD.map(s=><CS key={s.id} s={s}/>)}
                  <CL t="D"/>
                </div>

                {/* Middle: empty interior + right column */}
                <div className="flex flex-1" style={{ minHeight: 440 }}>
                  
                  {/* Interior walkway */}
                  <div className="flex-1 relative">
                    {/* Inner walkway lines (matching plan's curved interior lines) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 440" preserveAspectRatio="none">
                      {/* Curved walkway path inside the inner ring */}
                      <path d="M 10,10 Q 10,0 20,0 L 580,0 Q 590,0 590,10 L 590,430 Q 590,440 580,440 L 20,440 Q 10,440 10,430 Z"
                        fill="none" stroke="#d946ef" strokeWidth="1.5" opacity="0.25"/>
                      <path d="M 15,15 Q 15,5 25,5 L 575,5 Q 585,5 585,15 L 585,425 Q 585,435 575,435 L 25,435 Q 15,435 15,425 Z"
                        fill="none" stroke="#d946ef" strokeWidth="1" opacity="0.2"/>
                    </svg>
                  </div>

                  {/* Right column D→A */}
                  <div className="shrink-0" style={{ marginLeft: 2 }}>
                    <VC ss={rCol} cw={RW} ch={RH} />
                  </div>
                </div>

                {/* Inner bottom: B + corners + stalls + corners + A */}
                <div className="flex items-center" style={{ gap: 2, marginTop: 2 }}>
                  <CL t="B"/>
                  {cB.map(s=><CS key={s.id} s={s}/>)}
                  <HR ss={inBot} cw={IW} ch={IH} />
                  {cA.map(s=><CS key={s.id} s={s}/>)}
                  <CL t="A"/>
                </div>

              </div>

              {/* ── PET BOTTLING AREA ── */}
              <div className="shrink-0 relative" style={{ width: 320, marginLeft: 8 }}>
                <div className="absolute inset-0 border border-gray-300 bg-[#fafafa] rounded-sm overflow-hidden">
                  {/* Diagonal hatching */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <pattern id="petHatch" width="12" height="12" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="12" stroke="#e5e7eb" strokeWidth="0.8"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#petHatch)"/>
                  </svg>
                  {/* PET BOTTLING diagonal label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-gray-500 tracking-[0.18em] select-none"
                      style={{ fontSize: 22, transform: 'rotate(-38deg)', whiteSpace: 'nowrap' }}>
                      PET BOTTLING
                    </span>
                  </div>
                  {/* Diamond shape for PET BOTTLING (like in plan) */}
                  <svg className="absolute" style={{ right: 30, bottom: 60, width: 80, height: 60 }}>
                    <polygon points="40,0 80,30 40,60 0,30" fill="none" stroke="#555" strokeWidth="1.5"/>
                    <text x="40" y="34" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#555">3</text>
                  </svg>
                  {/* Number markers */}
                  <IC n="4" x={270} y={180}/>
                  <IC n="5" x={270} y={10}/>
                  <div className="absolute font-bold text-gray-500 select-none" style={{ right: 20, bottom: 50, fontSize: 14 }}>10</div>
                </div>
              </div>
            </div>

            {/* ╔══════════════════════════════════════════════╗
                ║  BOTTOM OUTER STALL ROWS                     ║
                ╚══════════════════════════════════════════════╝ */}
            <div className="flex" style={{ gap: 30, marginTop: 3 }}>
              <HR ss={outBL} cw={BW} ch={BH} />
              <HR ss={outBR} cw={BW} ch={BH} />
            </div>

          </div>
        </div>

        {/* ═══ LEGEND ═══ */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-200">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Legend:</span>
          {[
            { c: 'bg-green-500', l: 'Available' },
            { c: 'bg-yellow-400', l: 'Pending' },
            { c: 'bg-red-500', l: 'Reserved' },
            { c: 'bg-gray-500', l: 'Occupied' },
          ].map(i => (
            <div key={i.l} className="flex items-center gap-1.5">
              <div className={`w-3.5 h-3.5 rounded-sm border border-black/20 ${i.c}`}/>
              <span className="text-xs text-gray-600">{i.l}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-[18px] h-[16px] border-2 border-red-500 bg-white flex items-center justify-center">
              <span className="text-[6px] font-black text-red-600">A1</span>
            </div>
            <span className="text-xs text-gray-600">Corner Stall</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full border-[2.5px] border-red-600 bg-white flex items-center justify-center">
              <span className="text-[9px] font-black text-red-600">A</span>
            </div>
            <span className="text-xs text-gray-600">Corner Marker</span>
          </div>
        </div>

      </div>
    </div>
  );
}
