import React, { useState, useRef } from 'react';
import { Stall } from '../../types';
import { getStallColorClass } from '../../utils/helpers';

interface StallMapProps {
  stalls: Stall[];
  onStallClick: (stall: Stall) => void;
  selectedStallId?: string;
  initialZoom?: number;
  maxHeight?: string;
}

function range(a: number, b: number) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

export function StallMap({ stalls, onStallClick, selectedStallId, initialZoom, maxHeight }: StallMapProps) {
  const [zoom, setZoom] = useState(initialZoom ?? 1);
  const containerRef = useRef<HTMLDivElement>(null);
  const numericStalls = stalls.filter(s => s.number > 0 && /^\d+$/.test(s.id));
  const idMap = new Map(numericStalls.map(s => [Number(s.id), s]));
  const cm = new Map(stalls.filter(s => s.number === 0).map(s => [s.id, s]));

  type StallSlot = { stall?: Stall; label: string; disabled?: boolean };

  const usedIds = new Set<number>();
  const makeRangeSlots = (prefix: string, startId: number, count: number): StallSlot[] => {
    const slots: StallSlot[] = [];
    for (let i = 0; i < count; i += 1) {
      const id = startId + i;
      const stall = idMap.get(id);
      if (stall) usedIds.add(id);
      slots.push({ stall, label: `${prefix}${i + 1}`, disabled: !stall });
    }
    return slots;
  };

  const makeDirectionalSlots = (
    prefix: string,
    startId: number,
    count: number,
    direction: 'top' | 'bottom'
  ): StallSlot[] => {
    const slots = makeRangeSlots(prefix, startId, count);
    return direction === 'bottom' ? slots.reverse() : slots;
  };

  const makeListSlots = (items: Stall[], count: number): StallSlot[] => {
    const slots: StallSlot[] = items.slice(0, count).map((stall) => ({
      stall,
      label: stall.id,
      disabled: false,
    }));
    const missing = count - slots.length;
    for (let i = 0; i < missing; i += 1) {
      slots.push({ label: '', disabled: true });
    }
    return slots;
  };

  // Groups
  const topOutLSlots = makeRangeSlots('C', 168, 37);
  const topOutLLeft = topOutLSlots.slice(0, 18);
  const topOutLRight = topOutLSlots.slice(18);
  const inTopSlots = makeRangeSlots('D', 205, 39);
  const inTopLeft = inTopSlots.slice(0, 19);
  const inTopRight = inTopSlots.slice(19);
  const lOut = makeDirectionalSlots('AA', 92, 42, 'bottom');
  const bbSlots = makeRangeSlots('BB', 134, 34);
  const lIn = bbSlots.slice(0, 30).reverse();
  const lBot = bbSlots.slice(30).reverse(); // BB31–BB34
  const inBot = makeRangeSlots('B', 48, 40).reverse();
  const outBL = makeRangeSlots('A', 1, 47).reverse();
  const hiddenNumericIds = new Set([88, 89, 90, 91]);

  const remaining = numericStalls
    .filter((stall) => {
      const numericId = Number(stall.id);
      return Number.isFinite(numericId) && !usedIds.has(numericId) && !hiddenNumericIds.has(numericId);
    })
    .sort((a, b) => Number(a.id) - Number(b.id));
  const topOutR = makeListSlots(remaining, 25);
  const outBR = makeListSlots(remaining.slice(25), 33);
  const rCol = [] as StallSlot[];
  const rColOffsetX = 280;
  const cA = ['A1','A2','A3','A4','A5'].map(id=>cm.get(id)).filter(Boolean) as Stall[];
  const cB = ['B1','B2','B3','B4'].map(id=>cm.get(id)).filter(Boolean) as Stall[];
  const cornerBSlots: StallSlot[] = [
    { stall: idMap.get(88), label: 'B41' },
    { stall: idMap.get(89), label: 'B42' },
    { stall: idMap.get(90), label: 'B43' },
    { stall: idMap.get(91), label: 'B44' },
  ];
  const cC = ['C1','C2','C3','C4'].map(id=>cm.get(id)).filter(Boolean) as Stall[];
  const cCLabels = ['BB31','BB32','BB33','BB34'];
  const cCOffsetX = -20;
  const cornerLabel = (labels: string[], idx: number, fallback: string) => labels[idx] ?? fallback;
  const cD = ['D1','D2','D3','D4','D5','D6'].map(id=>cm.get(id)).filter(Boolean) as Stall[];

  const statusColor: Record<string,string> = {
    available:'#22c55e', pending:'#facc15', reserved:'#ef4444', occupied:'#6b7280'
  };
  const statusBorder: Record<string,string> = {
    available:'#16a34a', pending:'#eab308', reserved:'#dc2626', occupied:'#4b5563'
  };

  // Stall button
  const S = ({ slot, w, h }: { slot: StallSlot; w: number; h: number }) => {
    const stall = slot.stall;
    const sel = stall ? selectedStallId === stall.id : false;
    const disabled = slot.disabled || !stall;
    const label = slot.label;
    return (
      <button onClick={()=>{ if (!disabled && stall) onStallClick(stall); }}
        title={stall ? `Stall ${stall.id} · ${stall.status} · ${stall.category} · Price: To be discussed` : 'Unavailable'}
        style={{
          width:w, height:h, fontSize: Math.max(7, Math.min(w,h)*0.42),
          background: stall ? (statusColor[stall.status]||'#ccc') : '#e5e7eb',
          border: `1.5px solid ${stall ? (statusBorder[stall.status]||'#999') : '#cbd5e1'}`,
          color: stall ? '#fff' : '#94a3b8', fontWeight:700, cursor: disabled ? 'default' : 'pointer', display:'inline-flex',
          alignItems:'center', justifyContent:'center', flexShrink:0,
          position:'relative', userSelect:'none', lineHeight:1,
          outline: sel ? '2.5px solid #3b82f6' : 'none',
          outlineOffset: sel ? 1 : 0,
          transform: sel ? 'scale(1.15)' : undefined,
          zIndex: sel ? 20 : undefined,
          boxShadow: sel ? '0 0 8px rgba(59,130,246,0.5)' : '0 1px 2px rgba(0,0,0,0.15)',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }}
        onMouseEnter={e=>{if(!sel && !disabled){e.currentTarget.style.transform='scale(1.08)';e.currentTarget.style.zIndex='10'}}}
        onMouseLeave={e=>{if(!sel && !disabled){e.currentTarget.style.transform='';e.currentTarget.style.zIndex=''}}}
      >{label}</button>
    );
  };

  // Corner stall
  const CS = ({ stall, label }: { stall?: Stall; label: string }) => (
    <button
      onClick={()=>{ if (stall) onStallClick(stall); }}
      title={stall ? `${label} · ${stall.status} · ${stall.category} · Price: To be discussed` : `${label} · Unavailable`}
      disabled={!stall}
      style={{
        width:22,
        height:19,
        border: `2px solid ${stall ? (statusBorder[stall.status] || '#ef4444') : '#cbd5e1'}`,
        background: stall ? (statusColor[stall.status] || '#22c55e') : '#e5e7eb',
        color: '#fff',
        fontSize:7,
        fontWeight:900,
        cursor: stall ? 'pointer' : 'default',
        display:'inline-flex',
        alignItems:'center',
        justifyContent:'center',
        flexShrink:0,
        opacity: stall ? 1 : 0.5,
        outline: stall && selectedStallId === stall.id ? '2.5px solid #3b82f6' : 'none',
        outlineOffset: stall && selectedStallId === stall.id ? 1 : 0,
        transform: stall && selectedStallId === stall.id ? 'scale(1.15)' : undefined,
        zIndex: stall && selectedStallId === stall.id ? 20 : undefined,
        boxShadow: stall && selectedStallId === stall.id ? '0 0 8px rgba(59,130,246,0.5)' : '0 1px 2px rgba(0,0,0,0.15)',
        transition: 'transform 0.1s, box-shadow 0.1s',
      }}
      onMouseEnter={e=>{ if(stall && selectedStallId !== stall.id){ e.currentTarget.style.transform='scale(1.08)'; e.currentTarget.style.zIndex='10'; }}}
      onMouseLeave={e=>{ if(stall && selectedStallId !== stall.id){ e.currentTarget.style.transform=''; e.currentTarget.style.zIndex=''; }}}
    >{label}</button>
  );

  // Corner marker circle
  const CL = ({ t }: { t: string }) => (
    <div style={{ width:28, height:28, borderRadius:'50%', border:'3px solid #dc2626', background:'#fff',
      color:'#dc2626', fontWeight:900, fontSize:13, display:'inline-flex', alignItems:'center',
      justifyContent:'center', flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}>{t}</div>
  );

  // Helpers
  const HR = ({ ss, w, h }: { ss: StallSlot[]; w: number; h: number }) => (
    <div style={{ display:'flex', gap:1 }}>{ss.map((slot, idx)=><S key={slot.stall?.id ?? `${slot.label}-${idx}`} slot={slot} w={w} h={h}/>)}</div>
  );
  const VC = ({ ss, w, h }: { ss: StallSlot[]; w: number; h: number }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:1 }}>{ss.map((slot, idx)=><S key={slot.stall?.id ?? `${slot.label}-${idx}`} slot={slot} w={w} h={h}/>)}</div>
  );

  // Left paired rows
  const aaTopOffset = -100;
  const aaColumnSlots = lOut;
  const bbColumnSlots = lIn;
  const leftColumnRows = Math.max(aaColumnSlots.length, bbColumnSlots.length);


  return (
    <div style={{ position:'relative' }}>
      {/* Zoom controls */}
      <div style={{ position:'sticky', top:0, zIndex:30, display:'flex', justifyContent:'flex-end',
        padding:'8px 12px', background:'rgba(255,255,255,0.95)', borderBottom:'1px solid #e5e7eb', gap:6 }}>
        <span style={{ fontSize:12, color:'#888', marginRight:8, alignSelf:'center' }}>
          Zoom: {Math.round(zoom*100)}%
        </span>
        <button onClick={()=>setZoom(z=>Math.max(0.5,z-0.1))}
          style={{ width:32, height:32, border:'1px solid #ddd', borderRadius:6, cursor:'pointer',
            fontSize:18, fontWeight:'bold', background:'#f9f9f9' }}>−</button>
        <button onClick={()=>setZoom(initialZoom ?? 1)}
          style={{ padding:'0 12px', height:32, border:'1px solid #ddd', borderRadius:6, cursor:'pointer',
            fontSize:11, background:'#f9f9f9' }}>Reset</button>
        <button onClick={()=>setZoom(z=>Math.min(2,z+0.1))}
          style={{ width:32, height:32, border:'1px solid #ddd', borderRadius:6, cursor:'pointer',
            fontSize:18, fontWeight:'bold', background:'#f9f9f9' }}>+</button>
      </div>

      <div ref={containerRef} className="w-full overflow-auto" style={{ maxHeight: maxHeight ?? '80vh' }}>
        <div style={{ transform:`scale(${zoom})`, transformOrigin:'top left', minWidth:1750,
          padding:14, background:'#fff', fontFamily:"'Courier New',monospace", position:'relative',
          width:'fit-content' }}>

          {/* Grid */}
          <div style={{ position:'absolute', inset:0, opacity:0.035, pointerEvents:'none',
            backgroundImage:'repeating-linear-gradient(0deg,#1a1a6e 0,#1a1a6e 1px,transparent 1px,transparent 30px),repeating-linear-gradient(90deg,#1a1a6e 0,#1a1a6e 1px,transparent 1px,transparent 30px)' }}/>

          {/* Outer border */}
          <div style={{ position:'relative', border:'3px solid #1a1a6e' }}>

            {/* Road SVG */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:1 }}
            >
              {/* Horizontal roads */}
              {['15%','15%'].map((y,i)=>(
                <React.Fragment key={`hr${i}`}>
                  <line x1="4%" y1={y} x2="96%" y2={y} stroke="#caef46" strokeWidth={i?1.5:2.5} opacity={i?0.3:0.45}/>
                  <line x1="5%" y1={y} x2="96%" y2={y} stroke="#e4ef46" strokeWidth={i?1.5:2.5} opacity={i?0.3:0.45}/>
                </React.Fragment>
              ))}
              {['96%','96%'].map((y,i)=>(
                <React.Fragment key={`br${i}`}>
                  <line x1="4%" y1={y} x2="96%" y2={y} stroke="#ff0000" strokeWidth={i?1.5:2.5} opacity={i?0.3:0.45}/>
                  <line x1="52%" y1={y} x2="96%" y2={y} stroke="#ff0000" strokeWidth={i?1.5:2.5} opacity={i?0.3:0.45}/>
                </React.Fragment>
              ))}
              {/* Vertical roads */}
              {['3%','3%'].map((x,i)=>(
                <line key={`vl${i}`} x1={x} y1="3%" x2={x} y2="97%" stroke="#4400ff" strokeWidth={i?1.5:2.5} opacity={i?0.3:0.45}/>
              ))}
              {['63%','63%'].map((x,i)=>(
                <line key={`vm${i}`} x1={x} y1="3%" x2={x} y2="97%" stroke="#35d3de" strokeWidth={i?1.5:2.5} opacity={i?0.3:0.45}/>
              ))}
              {/* Inner walkway */}
              <rect x="5.5%" y="18%" width="53%" height="65.5%" rx="8" fill="none" stroke="#000000" strokeWidth="1" opacity="5"/>
            </svg>

            <div style={{ position:'relative', zIndex:2, padding:'12px 14px' }}>

              {/* MARKET SITE */}
              <div style={{ position:'relative', display:'flex', justifyContent:'flex-start', gap:20, marginBottom:8, width:'100%', paddingLeft:270 }}>
                <div style={{ width:500, height:90, flexShrink:0, position:'relative',
                  border:'2.5px solid #555', background:'linear-gradient(180deg,#f5f5f5,#ebebeb)' }}>
                  {/* Pillars */}
                  {range(0,10).map(i=>(
                    <div key={`p${i}`} style={{ position:'absolute', left:0, top:i*8+2, width:8, height:6,
                      borderRight:'1.5px solid #aaa', background:'#e0e0e0' }}/>
                  ))}
                  {/* Inner borders */}
                  <div style={{ position:'absolute', inset:9, border:'1.5px solid #bbb' }}/>
                  <div style={{ position:'absolute', inset:16, border:'1px dashed #ccc' }}/>
                  {/* Bottom arch detail */}
                  <svg style={{ position:'absolute', bottom:4, left:36, width:130, height:16 }}>
                    <path d="M 0,25 Q 50,0 100,25" fill="none" stroke="#bbb" strokeWidth="1"/>
                    <path d="M 100,25 Q 150,0 200,25" fill="none" stroke="#bbb" strokeWidth="1"/>
                  </svg>
                  {/* Title */}
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:32, fontWeight:900, color:'#3a3a3a', letterSpacing:'0.24em',
                      textShadow:'1px 1px 0 rgba(255,255,255,0.8)', userSelect:'none' }}>MARKET SITE</span>
                  </div>
                </div>
                <div style={{ position:'absolute', right:25, top:20, width:32, height:32, borderRadius:'50%',
                  border:'2px solid #777', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:20, fontWeight:'bold', color:'#555', background:'#fff' }}>5</div>
              </div>

              {/* TOP OUTER ROW (C1–C37) */}
              <div style={{ display:'flex', gap:8, marginBottom:2, alignItems:'center', marginLeft:120 }}>
                <CL t="C" />
                <HR ss={topOutLSlots} w={20} h={15} />
              </div>

              {/* INNER TOP ROW (with C/D) */}
              <div style={{ display:'flex', gap:0, marginBottom:2, position:'relative', zIndex:5 }}>
                <div style={{ width:52, flexShrink:0 }}/>
                <div style={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
                  <div style={{ display:'flex', gap:0, marginRight:-13, marginTop:-20, alignItems:'flex-end', transform:`translateX(${cCOffsetX}px) rotate(-40deg)`, transformOrigin:'right bottom', position:'relative', zIndex:10 }}>
                    {cC.map((s, idx) => {
                      const t = idx - (cC.length - 1) / 2;
                      const offsetY = 0 + (t * t) * 2.4;
                      const offsetX = 0;
                      return (
                        <div
                          key={s.id}
                          style={{
                            transform:`translate(${offsetX}px, ${offsetY}px) rotate(${t * 10.5}deg)`,
                            transformOrigin:'50% 100%',
                            position:'relative',
                            zIndex: 5,
                          }}
                        >
                          <CS stall={s} label={cornerLabel(cCLabels, idx, s.id)}/>
                        </div>
                      );
                    })}
                  </div>
                  <HR ss={inTopLeft} w={20} h={16}/>
                  <div style={{ display:'flex', gap:1 }}>
                    {inTopRight.map((slot, idx) => (
                      idx === 0 ? (
                        <div key={slot.stall?.id ?? `inTopRight-${idx}`} style={{ position:'relative', width:20, height:16, transform:'translateY(-6px)' }}>
                          <S slot={slot} w={20} h={16}/>
                          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:6, pointerEvents:'none', marginBottom:-38 }}>
                            <CL t="D"/>
                          </div>
                        </div>
                      ) : (
                        <S key={slot.stall?.id ?? `inTopRight-${idx}`} slot={slot} w={20} h={16}/>
                      )
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:-8, marginLeft:15, marginRight:10, marginTop:-35, alignItems:'flex-end', transform:'rotate(50deg)', transformOrigin:'left bottom' }}>
                    {cD.map((s, idx) => {
                      const t = idx - (cD.length - 1) / 2;
                      const offsetY = 0 + (t * t) * 2.4;
                      const offsetX = 0;
                      return (
                        <div
                          key={s.id}
                          style={{
                            transform:`translate(${offsetX}px, ${offsetY}px) rotate(${t * 10.5}deg)`,
                            transformOrigin:'50% 80%'
                          }}
                        >
                          <CS stall={s} label={s.id}/>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ width:350, flexShrink:0 }}/>
              </div>

              {/* MAIN BODY */}
              <div style={{ display:'flex', gap:0, position:'relative' }}>

                {/* Left paired columns */}
                <div style={{ flexShrink:0, marginLeft:0, marginRight:3, marginTop:25, display:'flex', flexDirection:'column', gap:0, position:'relative' }}>
                  <div style={{ height:28, marginBottom:6 }} />
                  <div style={{ position:'absolute', left:-30, top:'50%', transform:'translateY(-50%)', zIndex:5 }}>
                    <CL t="AA"/>
                  </div>
                  <div style={{ position:'absolute', left:63, top:'50%', transform:'translateY(-50%)', zIndex:5 }}>
                    <CL t="BB"/>
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:0, transform:`translateY(${aaTopOffset}px)` }}>
                      {Array.from({ length: leftColumnRows }, (_, idx) => {
                        const slot = aaColumnSlots[idx];
                        return slot ? <S key={slot.stall?.id ?? `aa-${idx}`} slot={slot} w={25} h={18}/> : <div key={`aa-empty-${idx}`} style={{ width:25, height:18 }} />;
                      })}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                      {Array.from({ length: leftColumnRows }, (_, idx) => {
                        const slot = bbColumnSlots[idx];
                        return slot ? <S key={slot.stall?.id ?? `bb-${idx}`} slot={slot} w={25} h={18}/> : <div key={`bb-empty-${idx}`} style={{ width:25, height:18 }} />;
                      })}
                    </div>
                  </div>
                </div>

                {/* Center + right col */}
                <div style={{ display:'flex', flexDirection:'column', flex:1, position:'relative' }}>
                  <div style={{ flex:1, minHeight:470, position:'relative' }}>
                    <div style={{ position:'absolute', right:'60%', top:93, transform:`translateX(calc(-50% + ${rColOffsetX}px))` }}>
                      <VC ss={rCol} w={25} h={16}/>
                    </div>
                  </div>
                </div>

                {/* PET BOTTLING */}
                <div style={{ width:220, height:160, flexShrink:0, marginLeft:20, marginTop:350, position:'relative', alignSelf:'flex-start' }}>
                  <div style={{ position:'absolute', inset:0, border:'1.5px solid #bbb',
                    background:'linear-gradient(135deg,#fafafa,#f0f0f0)', overflow:'hidden' }}>
                    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
                      <defs>
                        <pattern id="xh" width="12" height="12" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="12" stroke="#ddd" strokeWidth="0.8"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#xh)"/>
                    </svg>
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:16, fontWeight:'bold', color:'#666', letterSpacing:'0.12em',
                        transform:'rotate(-35deg)', userSelect:'none' }}>PET BOTTLING</span>
                    </div>
                    <svg style={{ position:'absolute', right:16, bottom:32, width:60, height:45 }}>
                      <polygon points="30,2 58,22 30,42 2,22" fill="none" stroke="#444" strokeWidth="2"/>
                      <text x="30" y="26" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#444">3</text>
                    </svg>
                  </div>
                </div>

              </div>

              {/* INNER BOTTOM ROW (B/A) */}
              <div style={{ display:'flex', gap:0, marginTop:-65, marginBottom:2, position:'relative' }}>
                <div style={{ width:52, flexShrink:0 }}/>
                <div style={{ position:'absolute', left:'30%', top:'-100%', transform:'translate(-50%, -50%)', zIndex:5 }}>
                  <CL t="B"/>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
                  <div style={{ display:'flex', gap:-10, marginRight:25, marginTop:-305, alignItems:'flex-end', transform:'rotate(-120deg)', transformOrigin:'right bottom' }}>
                    {[...cornerBSlots].reverse().map((slot, idx) => {
                      const t = idx - (cornerBSlots.length - 1) / 2;
                      const offsetY = -110 + (t * t) * 3;
                      const offsetX = -5;
                      return (
                        <div
                          key={slot.stall?.id ?? `corner-b-${idx}`}
                          style={{
                            transform:`translate(${offsetX}px, ${offsetY}px) rotate(${t * 15}deg)`,
                            transformOrigin:'50% 80%'
                          }}
                        >
                          <CS stall={slot.stall} label={slot.label}/>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginLeft:-68 }}>
                    <HR ss={inBot} w={20} h={16}/>
                  </div>
                  <div style={{ display:'flex', gap:0, marginLeft:95, marginRight:0, marginTop:-165, alignItems:'flex-end', transform:'rotate(140deg)', transformOrigin:'left bottom', position:'relative', zIndex:8 }}>
                    {cA.map((s, idx) => {
                      const t = idx - (cA.length - 1) / 2;
                      const offsetY = 0 + (t * t) * 2.5;
                      const offsetX = 0;
                      return (
                        <div
                          key={s.id}
                          style={{
                            transform:`translate(${offsetX}px, ${offsetY}px) rotate(${t * 10.5}deg)`,
                            transformOrigin:'50% 100%',
                            position:'relative',
                            zIndex:5,
                          }}
                        >
                          <CS stall={s} label={s.id}/>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ width:28, flexShrink:0 }} />
                </div>
                <div style={{ width:350, flexShrink:0 }}/>
              </div>

              {/* BOTTOM OUTER ROWS */}
              <div style={{ display:'flex', gap:8, marginTop:-3, alignItems:'center' }}>
                <div style={{ marginLeft:70, display:'flex', alignItems:'center', gap:8 }}>
                  <CL t="A"/>
                  <HR ss={outBL} w={17} h={15}/>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center',
            gap:18, marginTop:16, paddingTop:12, borderTop:'1px solid #e5e7eb' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#777', letterSpacing:'0.08em' }}>LEGEND:</span>
            {[{c:'#22c55e',l:'Available'},{c:'#facc15',l:'Pending'},{c:'#ef4444',l:'Reserved'},{c:'#6b7280',l:'Occupied'}].map(i=>(
              <div key={i.l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:16, height:16, background:i.c, border:'1.5px solid rgba(0,0,0,0.2)', borderRadius:2 }}/>
                <span style={{ fontSize:12, color:'#555' }}>{i.l}</span>
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:22, height:19, border:'2px solid #ef4444', background:'#fef2f2',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, fontWeight:900, color:'#dc2626' }}>A1</div>
              <span style={{ fontSize:12, color:'#555' }}>Corner Stall</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', border:'3px solid #dc2626', background:'#fff',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#dc2626' }}>A</div>
              <span style={{ fontSize:12, color:'#555' }}>Corner Marker</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
