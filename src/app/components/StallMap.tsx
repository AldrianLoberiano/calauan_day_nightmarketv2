import React, { useState, useRef } from 'react';
import { Stall } from '../types';
import { getStallColorClass } from '../utils/helpers';

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

  // Stall button
  const S = ({ s, w, h }: { s: Stall; w: number; h: number }) => {
    const sel = selectedStallId === s.id;
    return (
      <button onClick={()=>onStallClick(s)}
        title={`Stall ${s.id} · ${s.status} · ${s.category} · ₱${s.price.toLocaleString()}/mo`}
        style={{
          width:w, height:h, fontSize: Math.max(7, Math.min(w,h)*0.42),
          background: statusColor[s.status]||'#ccc',
          border: `1.5px solid ${statusBorder[s.status]||'#999'}`,
          color:'#fff', fontWeight:700, cursor:'pointer', display:'inline-flex',
          alignItems:'center', justifyContent:'center', flexShrink:0,
          position:'relative', userSelect:'none', lineHeight:1,
          outline: sel ? '2.5px solid #3b82f6' : 'none',
          outlineOffset: sel ? 1 : 0,
          transform: sel ? 'scale(1.15)' : undefined,
          zIndex: sel ? 20 : undefined,
          boxShadow: sel ? '0 0 8px rgba(59,130,246,0.5)' : '0 1px 2px rgba(0,0,0,0.15)',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }}
        onMouseEnter={e=>{if(!sel){e.currentTarget.style.transform='scale(1.08)';e.currentTarget.style.zIndex='10'}}}
        onMouseLeave={e=>{if(!sel){e.currentTarget.style.transform='';e.currentTarget.style.zIndex=''}}}
      >{s.id}</button>
    );
  };

  // Corner stall
  const CS = ({ s }: { s: Stall }) => (
    <button onClick={()=>onStallClick(s)} title={`Corner ${s.id} · ${s.status}`}
      style={{ width:22, height:19, border:'2px solid #ef4444', background:'#fef2f2', color:'#dc2626',
        fontSize:7, fontWeight:900, cursor:'pointer', display:'inline-flex', alignItems:'center',
        justifyContent:'center', flexShrink:0 }}>{s.id}</button>
  );

  // Corner marker circle
  const CL = ({ t }: { t: string }) => (
    <div style={{ width:28, height:28, borderRadius:'50%', border:'3px solid #dc2626', background:'#fff',
      color:'#dc2626', fontWeight:900, fontSize:13, display:'inline-flex', alignItems:'center',
      justifyContent:'center', flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}>{t}</div>
  );

  // Helpers
  const HR = ({ ss, w, h }: { ss: Stall[]; w: number; h: number }) => (
    <div style={{ display:'flex', gap:1 }}>{ss.map(s=><S key={s.id} s={s} w={w} h={h}/>)}</div>
  );
  const VC = ({ ss, w, h }: { ss: Stall[]; w: number; h: number }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:1 }}>{ss.map(s=><S key={s.id} s={s} w={w} h={h}/>)}</div>
  );

  // Left paired rows
  const pairs = Math.min(lOut.length, lIn.length);

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
        <button onClick={()=>setZoom(1)}
          style={{ padding:'0 12px', height:32, border:'1px solid #ddd', borderRadius:6, cursor:'pointer',
            fontSize:11, background:'#f9f9f9' }}>Reset</button>
        <button onClick={()=>setZoom(z=>Math.min(2,z+0.1))}
          style={{ width:32, height:32, border:'1px solid #ddd', borderRadius:6, cursor:'pointer',
            fontSize:18, fontWeight:'bold', background:'#f9f9f9' }}>+</button>
      </div>

      <div ref={containerRef} className="w-full overflow-auto" style={{ maxHeight:'80vh' }}>
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
              {['17%','17.6%'].map((y,i)=>(
                <React.Fragment key={`hr${i}`}>
                  <line x1="4%" y1={y} x2="49%" y2={y} stroke="#d946ef" strokeWidth={i?1.5:2.5} opacity={i?0.3:0.45}/>
                  <line x1="52%" y1={y} x2="96%" y2={y} stroke="#d946ef" strokeWidth={i?1.5:2.5} opacity={i?0.3:0.45}/>
                </React.Fragment>
              ))}
              {['90%','90.6%'].map((y,i)=>(
                <React.Fragment key={`br${i}`}>
                  <line x1="4%" y1={y} x2="49%" y2={y} stroke="#d946ef" strokeWidth={i?1.5:2.5} opacity={i?0.3:0.45}/>
                  <line x1="52%" y1={y} x2="96%" y2={y} stroke="#d946ef" strokeWidth={i?1.5:2.5} opacity={i?0.3:0.45}/>
                </React.Fragment>
              ))}
              {/* Vertical roads */}
              {['5.5%','6.1%'].map((x,i)=>(
                <line key={`vl${i}`} x1={x} y1="3%" x2={x} y2="97%" stroke="#d946ef" strokeWidth={i?1.5:2.5} opacity={i?0.3:0.45}/>
              ))}
              {['50%','50.5%'].map((x,i)=>(
                <line key={`vm${i}`} x1={x} y1="3%" x2={x} y2="97%" stroke="#d946ef" strokeWidth={i?1.5:2.5} opacity={i?0.3:0.45}/>
              ))}
              <line x1="97%" y1="3%" x2="97%" y2="97%" stroke="#1a1a6e" strokeWidth="2" opacity="0.35"/>
              {/* Curves */}
              {
                [
                  "M 5.5 17 Q 5.5 3 15 3",
                  "M 5.5 90 Q 5.5 97 15 97",
                  "M 50 17 Q 50 3 58 3",
                  "M 50 90 Q 50 97 58 97",
                  "M 97 17 Q 97 3 90 3",
                <path key={`c${i}`} d={d} fill="none" stroke={i>=4?"#1a1a6e":"#d946ef"} strokeWidth={i>=4?1.5:2} opacity={0.3}/>
              ))}
              {/* Inner walkway */}
              <rect x="7.5%" y="19.5%" width="42%" height="69.5%" rx="8" fill="none" stroke="#d946ef" strokeWidth="1.5" opacity="0.18"/>
              <rect x="8%" y="20%" width="41%" height="68.5%" rx="6" fill="none" stroke="#d946ef" strokeWidth="1" opacity="0.12"/>
            </svg>

            <div style={{ position:'relative', zIndex:2, padding:'12px 14px' }}>

              {/* MARKET SITE */}
              <div style={{ display:'flex', gap:35, marginBottom:8 }}>
                <div style={{ width:750, height:155, flexShrink:0, position:'relative',
                  border:'2.5px solid #555', background:'linear-gradient(180deg,#f5f5f5,#ebebeb)' }}>
                  {/* Pillars */}
                  {range(0,14).map(i=>(
                    <div key={`p${i}`} style={{ position:'absolute', left:0, top:i*10+2, width:10, height:8,
                      borderRight:'1.5px solid #aaa', background:'#e0e0e0' }}/>
                  ))}
                  {/* Inner borders */}
                  <div style={{ position:'absolute', inset:10, border:'1.5px solid #bbb' }}/>
                  <div style={{ position:'absolute', inset:22, border:'1px dashed #ccc' }}/>
                  {/* Bottom arch detail */}
                  <svg style={{ position:'absolute', bottom:5, left:60, width:200, height:25 }}>
                    <path d="M 0,25 Q 50,0 100,25" fill="none" stroke="#bbb" strokeWidth="1"/>
                    <path d="M 100,25 Q 150,0 200,25" fill="none" stroke="#bbb" strokeWidth="1"/>
                  </svg>
                  {/* Title */}
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:55, fontWeight:900, color:'#3a3a3a', letterSpacing:'0.4em',
                      textShadow:'1px 1px 0 rgba(255,255,255,0.8)', userSelect:'none' }}>MARKET SITE</span>
                  </div>
                </div>
                <div style={{ flex:1, position:'relative' }}>
                  <div style={{ position:'absolute', right:25, top:20, width:32, height:32, borderRadius:'50%',
                    border:'2px solid #777', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:20, fontWeight:'bold', color:'#555', background:'#fff' }}>5</div>
                </div>
              </div>

              {/* TOP OUTER ROWS */}
              <div style={{ display:'flex', gap:55, marginBottom:2 }}>
                <HR ss={topOutL} w={20} h={15}/>
                <HR ss={topOutR} w={20} h={15}/>
              </div>

              {/* INNER TOP ROW (with C/D) */}
              <div style={{ display:'flex', gap:0, marginBottom:2 }}>
                <div style={{ width:52, flexShrink:0 }}/>
                <div style={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
                  <CL t="C"/>
                  {cC.map(s=><CS key={s.id} s={s}/>)}
                  <HR ss={inTop} w={20} h={16}/>
                  {cD.map(s=><CS key={s.id} s={s}/>)}
                  <CL t="D"/>
                </div>
                <div style={{ width:350, flexShrink:0 }}/>
              </div>

              {/* MAIN BODY */}
              <div style={{ display:'flex', gap:0 }}>

                {/* Left paired columns */}
                <div style={{ flexShrink:0, marginRight:3, display:'flex', flexDirection:'column', gap:1 }}>
                  {range(0, pairs-1).map(i=>(
                    <div key={`lp${i}`} style={{ display:'flex', gap:1 }}>
                      <S s={lOut[i]} w={25} h={18}/>
                      <S s={lIn[i]} w={25} h={18}/>
                    </div>
                  ))}
                  {lBot.map(s=>(
                    <div key={s.id} style={{ display:'flex', gap:1 }}>
                      <S s={s} w={25} h={18}/>
                    </div>
                  ))}
                </div>

                {/* Center + right col */}
                <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
                  <div style={{ display:'flex', flex:1 }}>
                    <div style={{ flex:1, minHeight:470 }}/>
                    <VC ss={rCol} w={25} h={16}/>
                  </div>
                </div>

                {/* PET BOTTLING */}
                <div style={{ width:350, flexShrink:0, marginLeft:10, position:'relative' }}>
                  <div style={{ position:'absolute', inset:0, border:'1.5px solid #bbb',
                    background:'linear-gradient(135deg,#fafafa,#f0f0f0)', overflow:'hidden' }}>
                    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
                      <defs>
                        <pattern id="xh" width="16" height="16" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="16" stroke="#ddd" strokeWidth="0.8"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#xh)"/>
                    </svg>
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:26, fontWeight:'bold', color:'#666', letterSpacing:'0.2em',
                        transform:'rotate(-38deg)', userSelect:'none' }}>PET BOTTLING</span>
                    </div>
                    <svg style={{ position:'absolute', right:30, bottom:55, width:95, height:70 }}>
                      <polygon points="47,2 93,35 47,68 2,35" fill="none" stroke="#444" strokeWidth="2"/>
                      <text x="47" y="40" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#444">3</text>
                    </svg>
                    <div style={{ position:'absolute', right:18, bottom:60, fontSize:17, fontWeight:'bold', color:'#444' }}>10</div>
                    <div style={{ position:'absolute', right:12, top:'42%', width:28, height:28, borderRadius:'50%',
                      border:'2px solid #666', background:'#fff', display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:14, fontWeight:'bold', color:'#555' }}>4</div>
                    <div style={{ position:'absolute', right:12, top:15, width:28, height:28, borderRadius:'50%',
                      border:'2px solid #666', background:'#fff', display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:14, fontWeight:'bold', color:'#555' }}>5</div>
                    <div style={{ position:'absolute', right:4, top:'8%', bottom:'8%', width:2.5, background:'#1a1a6e', opacity:0.4 }}/>
                  </div>
                </div>
              </div>

              {/* INNER BOTTOM ROW (B/A) */}
              <div style={{ display:'flex', gap:0, marginTop:2, marginBottom:2 }}>
                <div style={{ width:52, flexShrink:0 }}/>
                <div style={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
                  <CL t="B"/>
                  {cB.map(s=><CS key={s.id} s={s}/>)}
                  <HR ss={inBot} w={20} h={16}/>
                  {cA.map(s=><CS key={s.id} s={s}/>)}
                  <CL t="A"/>
                </div>
                <div style={{ width:350, flexShrink:0 }}/>
              </div>

              {/* BOTTOM OUTER ROWS */}
              <div style={{ display:'flex', gap:30, marginTop:3 }}>
                <HR ss={outBL} w={17} h={15}/>
                <HR ss={outBR} w={17} h={15}/>
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
