import { useState, useRef, useEffect } from 'react';
import { Stall } from '../../types';
import { getDisplayCategoryById } from '../../utils/helpers';

interface StallGridViewProps {
  stalls: Stall[];
  onStallClick: (stall: Stall) => void;
  selectedStallId?: string;
}

// ─── Actual section boundaries matching the DB & Design Map ───
// A  : 1–47    → bottom outer row  (reversed →)
// B  : 48–91   → inner bottom row  (reversed →)
// AA : 92–133  → left outer col    (↓)
// BB : 134–167 → left inner col    (↓)
// C  : 168–204 → top outer row     (→)
// D  : 205–243 → inner top row     (→)
// R  : 244–300 → right column      (↓)
// ──────────────────────────────────────────────────────────────

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
  // Save & restore scroll position when a stall modal opens/closes
  const savedScrollRef = useRef<number>(0);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = savedScrollRef.current;
    }
  }, [selectedStallId]);

  function handleStallClick(stall: Stall) {
    if (containerRef.current) {
      savedScrollRef.current = containerRef.current.scrollTop;
    }
    onStallClick(stall);
  }

  const idMap = new Map(
    stalls
      .filter(s => s.number > 0 && /^\d+$/.test(s.id))
      .map(s => [Number(s.id), s])
  );

  // ── Stall button — identical look to StallMap's S component ──
  const S = ({ num, w, h }: { num: number; w: number; h: number }) => {
    const stall  = idMap.get(num);
    const sel    = stall ? selectedStallId === stall.id : false;
    const disabled = !stall;
    return (
      <button
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
          boxShadow:    sel
            ? '0 0 8px rgba(59,130,246,0.5)'
            : '0 1px 2px rgba(0,0,0,0.15)',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }}
        onMouseEnter={e => {
          if (!sel && !disabled) {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.zIndex = '10';
          }
        }}
        onMouseLeave={e => {
          if (!sel && !disabled) {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.zIndex = '';
          }
        }}
      >{num}</button>
    );
  };

  // ── Row / column helpers ──
  const HR = ({ nums, w, h }: { nums: number[]; w: number; h: number }) => (
    <div style={{ display: 'flex', gap: 1 }}>
      {nums.map(n => <S key={n} num={n} w={w} h={h} />)}
    </div>
  );
  const VC = ({ nums, w, h }: { nums: number[]; w: number; h: number }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {nums.map(n => <S key={n} num={n} w={w} h={h} />)}
    </div>
  );

  // ── Section circle marker — matches StallMap's CL ──
  const CL = ({ t, color }: { t: string; color: string }) => (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      border: `3px solid ${color}`, background: '#fff', color,
      fontWeight: 900, fontSize: 11,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }}>{t}</div>
  );

  // ── Stall groups using REAL boundaries ──
  const bottomOuter = range(1,   47).reverse();   // A  (47)
  const innerBottom = range(48,  91).reverse();   // B  (44)
  const leftOuter   = range(92,  133);            // AA (42) ↓
  const leftInner   = range(134, 167);            // BB (34) ↓
  const topOuter    = range(168, 204);            // C  (37)
  const innerTop    = range(205, 243);            // D  (39)
  const rightCol    = range(244, 300);            // R  (57) ↓

  const W = 22, H = 16; // stall button dimensions

  // Helper: how many in a section have a given status
  const countStatus = (nums: number[], status: string) =>
    nums.filter(n => idMap.get(n)?.status === status).length;

  return (
    <div style={{ position: 'relative' }}>

      {/* ── Zoom controls (mirrors StallMap) ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        padding: '8px 12px', background: 'rgba(255,255,255,0.95)',
        borderBottom: '1px solid #e5e7eb', gap: 6,
      }}>
        <span style={{ fontSize: 12, color: '#888', marginRight: 8 }}>
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
          minWidth: 1300, padding: 14, background: '#fff',
          fontFamily: "'Courier New', monospace",
          position: 'relative', width: 'fit-content',
        }}>

          {/* Faint dot-grid background */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.035, pointerEvents: 'none',
            backgroundImage:
              'repeating-linear-gradient(0deg,#1a1a6e 0,#1a1a6e 1px,transparent 1px,transparent 30px),' +
              'repeating-linear-gradient(90deg,#1a1a6e 0,#1a1a6e 1px,transparent 1px,transparent 30px)',
          }} />

          {/* Outer border — same navy as StallMap */}
          <div style={{ position: 'relative', border: '3px solid #1a1a6e' }}>

            {/* Road / walkway SVG overlay */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
              {/* top road */}
              <line x1="5%" y1="17%" x2="95%" y2="17%" stroke="#caef46" strokeWidth="2.5" opacity="0.45"/>
              {/* bottom road */}
              <line x1="5%" y1="84%" x2="95%" y2="84%" stroke="#0027b4" strokeWidth="2.5" opacity="0.45"/>
              {/* left road */}
              <line x1="4%" y1="3%" x2="4%" y2="97%" stroke="#4400ff" strokeWidth="2.5" opacity="0.38"/>
              {/* right road */}
              <line x1="84%" y1="3%" x2="84%" y2="97%" stroke="#35d3de" strokeWidth="2.5" opacity="0.38"/>
              {/* inner walkway rectangle */}
              <rect x="6%" y="20%" width="75%" height="62%" rx="7"
                fill="none" stroke="#000" strokeWidth="0.8" opacity="0.12"/>
            </svg>

            <div style={{ position: 'relative', zIndex: 2, padding: '12px 16px' }}>

              {/* ═══ MARKET SITE banner ═══ */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <div style={{
                  width: 520, height: 84, position: 'relative',
                  border: '2.5px solid #555',
                  background: 'linear-gradient(180deg,#f5f5f5,#ebebeb)',
                }}>
                  <div style={{ position: 'absolute', inset: 9, border: '1.5px solid #bbb' }} />
                  <div style={{ position: 'absolute', inset: 16, border: '1px dashed #ccc' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{
                      fontSize: 30, fontWeight: 900, color: '#3a3a3a',
                      letterSpacing: '0.22em',
                      textShadow: '1px 1px 0 rgba(255,255,255,0.8)',
                      userSelect: 'none',
                    }}>MARKET SITE</span>
                  </div>
                </div>
              </div>

              {/* ═══ TOP OUTER ROW — C (168–204) ═══ */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 2, alignItems: 'center', marginLeft: 48 }}>
                <CL t="C" color="#10b981" />
                <div>
                  <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 1, marginLeft: 2 }}>
                    Stalls 168–204 &nbsp;·&nbsp; {countStatus(topOuter, 'available')} available
                  </div>
                  <HR nums={topOuter} w={W} h={H} />
                </div>
              </div>

              {/* ═══ INNER TOP ROW — D (205–243) ═══ */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center', marginLeft: 48 }}>
                <CL t="D" color="#ef4444" />
                <div>
                  <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 1, marginLeft: 2 }}>
                    Stalls 205–243 &nbsp;·&nbsp; {countStatus(innerTop, 'available')} available
                  </div>
                  <HR nums={innerTop} w={W} h={H} />
                </div>
              </div>

              {/* ═══ MAIN BODY ═══ */}
              <div style={{ display: 'flex', gap: 0, position: 'relative', alignItems: 'stretch', marginTop: 4 }}>

                {/* Left paired columns AA (92–133) + BB (134–167) */}
                <div style={{ flexShrink: 0, marginRight: 8, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  {/* Section labels */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4, justifyContent: 'center' }}>
                    <CL t="AA" color="#06b6d4" />
                    <CL t="BB" color="#f59e0b" />
                  </div>
                  <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 3, textAlign: 'center' }}>
                    92–133 · 134–167
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <VC nums={leftOuter} w={W} h={H} />
                    <VC nums={leftInner} w={W} h={H} />
                  </div>
                </div>

                {/* Centre open walkway */}
                <div style={{
                  flex: 1,
                  minHeight: 420,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: '88%', height: '78%',
                    border: '1.5px dashed #c7d2fe',
                    background: 'linear-gradient(135deg,rgba(224,231,255,0.35),rgba(199,210,254,0.15))',
                    borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: '#a5b4fc',
                      letterSpacing: '0.14em', userSelect: 'none',
                    }}>WALKWAY / OPEN SPACE</span>
                  </div>
                </div>

                {/* Right column R (244–300) */}
                <div style={{ flexShrink: 0, marginLeft: 8, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                    <CL t="R" color="#8b5cf6" />
                  </div>
                  <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 3, textAlign: 'center' }}>
                    244–300
                  </div>
                  <VC nums={rightCol} w={W} h={H} />
                </div>

              </div>

              {/* ═══ INNER BOTTOM ROW — B (48–91) ═══ */}
              <div style={{ display: 'flex', gap: 6, marginTop: 4, marginBottom: 2, alignItems: 'center', marginLeft: 48 }}>
                <CL t="B" color="#8b5cf6" />
                <div>
                  <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 1, marginLeft: 2 }}>
                    Stalls 48–91 &nbsp;·&nbsp; {countStatus(innerBottom, 'available')} available
                  </div>
                  <HR nums={innerBottom} w={W} h={H} />
                </div>
              </div>

              {/* ═══ BOTTOM OUTER ROW — A (1–47) ═══ */}
              <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center', marginLeft: 48 }}>
                <CL t="A" color="#3b82f6" />
                <div>
                  <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 1, marginLeft: 2 }}>
                    Stalls 1–47 &nbsp;·&nbsp; {countStatus(bottomOuter, 'available')} available
                  </div>
                  <HR nums={bottomOuter} w={W} h={H} />
                </div>
              </div>

            </div>{/* /inner padding */}
          </div>{/* /outer border */}

          {/* ── Legend (identical to StallMap) ── */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'center', gap: 18,
            marginTop: 16, paddingTop: 12, borderTop: '1px solid #e5e7eb',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#777', letterSpacing: '0.08em' }}>LEGEND:</span>
            {[
              { c: '#22c55e', l: 'Available' },
              { c: '#facc15', l: 'Pending'   },
              { c: '#ef4444', l: 'Reserved'  },
              { c: '#6b7280', l: 'Occupied'  },
            ].map(item => (
              <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 16, height: 16, background: item.c,
                  border: '1.5px solid rgba(0,0,0,0.2)', borderRadius: 2,
                }} />
                <span style={{ fontSize: 12, color: '#555' }}>{item.l}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '3px solid #dc2626', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900, color: '#dc2626',
              }}>A</div>
              <span style={{ fontSize: 12, color: '#555' }}>Section Marker</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
