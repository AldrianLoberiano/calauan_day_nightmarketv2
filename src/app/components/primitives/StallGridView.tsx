import { useState, useRef } from 'react';
import { Stall } from '../../types';
import { getDisplayCategoryById } from '../../utils/helpers';

interface StallGridViewProps {
  stalls: Stall[];
  onStallClick: (stall: Stall) => void;
  selectedStallId?: string;
}

// ─── Layout plan (total = 300) ─────────────────────────────────
// Top outer row    (C-like) : stalls 176–225  = 50 stalls  →
// Inner top row    (D-like) : stalls 226–270  = 45 stalls  →
// Left outer col   (AA)     : stalls 101–150  = 50 stalls  ↓
// Left inner col   (BB)     : stalls 151–175  = 25 stalls  ↓
// Right column     (R)      : stalls 271–300  = 30 stalls  ↓
// Inner bottom row (B-like) : stalls  51–100  = 50 stalls  ←
// Bottom outer row (A-like) : stalls   1–50   = 50 stalls  ←
// Total: 50+45+50+25+30+50+50 = 300 ✓
// ───────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  available: '#22c55e', pending: '#facc15', reserved: '#ef4444', occupied: '#6b7280',
};
const statusBorder: Record<string, string> = {
  available: '#16a34a', pending: '#eab308', reserved: '#dc2626', occupied: '#4b5563',
};

function range(a: number, b: number) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

export function StallGridView({ stalls, onStallClick, selectedStallId }: StallGridViewProps) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build a lookup: numeric stall ID → Stall (from live server data)
  const idMap = new Map(
    stalls
      .filter(s => s.number > 0 && /^\d+$/.test(s.id))
      .map(s => [Number(s.id), s])
  );

  // ── Stall button — identical look to StallMap's S component ──
  const S = ({ num, w, h }: { num: number; w: number; h: number }) => {
    const stall = idMap.get(num);
    const sel   = stall ? selectedStallId === stall.id : false;
    const disabled = !stall;
    return (
      <button
        onClick={() => { if (!disabled && stall) onStallClick(stall); }}
        title={
          stall
            ? `Stall ${num} · ${stall.status} · ${getDisplayCategoryById(stall.id, stall.category)} · Price: To be discussed`
            : `Stall ${num} · Unavailable`
        }
        style={{
          width: w, height: h,
          fontSize: Math.max(7, Math.min(w, h) * 0.42),
          background:  stall ? (statusColor[stall.status]  || '#ccc') : '#e5e7eb',
          border: `1.5px solid ${stall ? (statusBorder[stall.status] || '#999') : '#cbd5e1'}`,
          color:  stall ? '#fff' : '#94a3b8',
          fontWeight: 700,
          cursor: disabled ? 'default' : 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, position: 'relative', userSelect: 'none', lineHeight: 1,
          outline:      sel ? '2.5px solid #3b82f6' : 'none',
          outlineOffset: sel ? 1 : 0,
          transform:    sel ? 'scale(1.15)' : undefined,
          zIndex:       sel ? 20 : undefined,
          boxShadow:    sel ? '0 0 8px rgba(59,130,246,0.5)' : '0 1px 2px rgba(0,0,0,0.15)',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }}
        onMouseEnter={e => { if (!sel && !disabled) { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.zIndex = '10'; } }}
        onMouseLeave={e => { if (!sel && !disabled) { e.currentTarget.style.transform = ''; e.currentTarget.style.zIndex = ''; } }}
      >{num}</button>
    );
  };

  // ── Horizontal row helper ──
  const HR = ({ nums, w, h }: { nums: number[]; w: number; h: number }) => (
    <div style={{ display: 'flex', gap: 1 }}>
      {nums.map(n => <S key={n} num={n} w={w} h={h} />)}
    </div>
  );

  // ── Vertical column helper ──
  const VC = ({ nums, w, h }: { nums: number[]; w: number; h: number }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {nums.map(n => <S key={n} num={n} w={w} h={h} />)}
    </div>
  );

  // ── Section label circle (matches StallMap's CL) ──
  const CL = ({ t, color }: { t: string; color: string }) => (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      border: `3px solid ${color}`, background: '#fff', color,
      fontWeight: 900, fontSize: 11, display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }}>{t}</div>
  );

  // ── Stall numbers per section ──
  const bottomOuter = range(1,   50).reverse();   // A  →  rendered right-to-left
  const innerBottom = range(51, 100).reverse();   // B  →  reversed
  const leftOuter   = range(101, 150);            // AA ↓
  const leftInner   = range(151, 175);            // BB ↓
  const topOuter    = range(176, 225);            // C  →
  const innerTop    = range(226, 270);            // D  →
  const rightCol    = range(271, 300);            // R  ↓

  const W = 22, H = 16; // stall button size

  return (
    <div style={{ position: 'relative' }}>

      {/* ── Zoom controls (same as StallMap) ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', justifyContent: 'flex-end',
        padding: '8px 12px', background: 'rgba(255,255,255,0.95)',
        borderBottom: '1px solid #e5e7eb', gap: 6,
      }}>
        <span style={{ fontSize: 12, color: '#888', marginRight: 8, alignSelf: 'center' }}>
          Zoom: {Math.round(zoom * 100)}%
        </span>
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
          style={{ width: 32, height: 32, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 18, fontWeight: 'bold', background: '#f9f9f9' }}>−</button>
        <button onClick={() => setZoom(1)}
          style={{ padding: '0 12px', height: 32, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 11, background: '#f9f9f9' }}>Reset</button>
        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}
          style={{ width: 32, height: 32, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 18, fontWeight: 'bold', background: '#f9f9f9' }}>+</button>
      </div>

      {/* ── Scrollable canvas ── */}
      <div ref={containerRef} className="w-full overflow-auto" style={{ maxHeight: '80vh' }}>
        <div style={{
          transform: `scale(${zoom})`, transformOrigin: 'top left',
          minWidth: 1200, padding: 14, background: '#fff',
          fontFamily: "'Courier New', monospace",
          position: 'relative', width: 'fit-content',
        }}>

          {/* Faint grid background */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.035, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(0deg,#1a1a6e 0,#1a1a6e 1px,transparent 1px,transparent 30px),repeating-linear-gradient(90deg,#1a1a6e 0,#1a1a6e 1px,transparent 1px,transparent 30px)',
          }} />

          {/* Outer border */}
          <div style={{ position: 'relative', border: '3px solid #1a1a6e' }}>

            {/* Road / walkway SVG overlay */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
              <line x1="5%" y1="17%" x2="95%" y2="17%" stroke="#caef46" strokeWidth="2" opacity="0.4"/>
              <line x1="5%" y1="83%" x2="95%" y2="83%" stroke="#0027b4" strokeWidth="2" opacity="0.4"/>
              <line x1="3%"  y1="3%"  x2="3%"  y2="97%" stroke="#4400ff" strokeWidth="2" opacity="0.35"/>
              <line x1="83%" y1="3%"  x2="83%" y2="97%" stroke="#35d3de" strokeWidth="2" opacity="0.35"/>
              <rect x="5.5%" y="20%" width="74%" height="60%" rx="6"
                fill="none" stroke="#000" strokeWidth="0.8" opacity="0.15"/>
            </svg>

            <div style={{ position: 'relative', zIndex: 2, padding: '12px 14px' }}>

              {/* ══ MARKET SITE title block ══ */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                <div style={{
                  width: 520, height: 80, flexShrink: 0, position: 'relative',
                  border: '2.5px solid #555', background: 'linear-gradient(180deg,#f5f5f5,#ebebeb)',
                }}>
                  <div style={{ position: 'absolute', inset: 8, border: '1.5px solid #bbb' }} />
                  <div style={{ position: 'absolute', inset: 14, border: '1px dashed #ccc' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 30, fontWeight: 900, color: '#3a3a3a', letterSpacing: '0.22em', textShadow: '1px 1px 0 rgba(255,255,255,0.8)', userSelect: 'none' }}>
                      MARKET SITE
                    </span>
                  </div>
                </div>
              </div>

              {/* ══ TOP OUTER ROW — stalls 176–225 (C-like) ══ */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 2, alignItems: 'center', marginLeft: 60 }}>
                <CL t="C" color="#10b981" />
                <HR nums={topOuter} w={W} h={H} />
              </div>

              {/* ══ INNER TOP ROW — stalls 226–270 (D-like) ══ */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 3, alignItems: 'center', marginLeft: 60 }}>
                <CL t="D" color="#ef4444" />
                <HR nums={innerTop} w={W} h={H} />
              </div>

              {/* ══ MAIN BODY — left columns + centre walkway + right column ══ */}
              <div style={{ display: 'flex', gap: 0, position: 'relative', marginTop: 4 }}>

                {/* Left paired columns AA + BB */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginRight: 6, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -34, top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}>
                    <CL t="AA" color="#06b6d4" />
                  </div>
                  <div style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}>
                    <CL t="BB" color="#f59e0b" />
                  </div>
                  {/* AA outer */}
                  <VC nums={leftOuter} w={W} h={H} />
                  {/* BB inner */}
                  <VC nums={leftInner} w={W} h={H} />
                </div>

                {/* Centre walking area */}
                <div style={{
                  flex: 1, minHeight: 440,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  {/* Inner walkway rectangle */}
                  <div style={{
                    width: '85%', height: '80%',
                    border: '1.5px dashed #c7d2fe',
                    background: 'linear-gradient(135deg,rgba(224,231,255,0.3),rgba(199,210,254,0.15))',
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.14em', userSelect: 'none' }}>
                      WALKWAY / OPEN SPACE
                    </span>
                  </div>
                </div>

                {/* Right column — stalls 271–300 */}
                <div style={{ flexShrink: 0, marginLeft: 6, position: 'relative' }}>
                  <div style={{ position: 'absolute', right: -34, top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}>
                    <CL t="R" color="#8b5cf6" />
                  </div>
                  <VC nums={rightCol} w={W} h={H} />
                </div>

              </div>

              {/* ══ INNER BOTTOM ROW — stalls 51–100 (B-like) ══ */}
              <div style={{ display: 'flex', gap: 6, marginTop: 3, marginBottom: 2, alignItems: 'center', marginLeft: 60 }}>
                <CL t="B" color="#8b5cf6" />
                <HR nums={innerBottom} w={W} h={H} />
              </div>

              {/* ══ BOTTOM OUTER ROW — stalls 1–50 (A-like) ══ */}
              <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center', marginLeft: 60 }}>
                <CL t="A" color="#3b82f6" />
                <HR nums={bottomOuter} w={W} h={H} />
              </div>

            </div>
          </div>

          {/* ── Legend (same as StallMap) ── */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'center', gap: 18, marginTop: 16,
            paddingTop: 12, borderTop: '1px solid #e5e7eb',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#777', letterSpacing: '0.08em' }}>LEGEND:</span>
            {[
              { c: '#22c55e', l: 'Available' },
              { c: '#facc15', l: 'Pending' },
              { c: '#ef4444', l: 'Reserved' },
              { c: '#6b7280', l: 'Occupied' },
            ].map(item => (
              <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 16, background: item.c, border: '1.5px solid rgba(0,0,0,0.2)', borderRadius: 2 }} />
                <span style={{ fontSize: 12, color: '#555' }}>{item.l}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', border: '3px solid #dc2626',
                background: '#fff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#dc2626',
              }}>A</div>
              <span style={{ fontSize: 12, color: '#555' }}>Section Marker</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
