import React from 'react';
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
  const sm = new Map(stalls.filter(s => s.number > 0).map(s => [s.number, s]));
  const cm = new Map(stalls.filter(s => s.number === 0).map(s => [s.id, s]));
  const g = (n: number) => sm.get(n);

  // Layout groups
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

  // Stall cell
  const S = ({ s, w, h }: { s: Stall; w: number; h: number }) => {
    const sel = selectedStallId === s.id;
    const cc = getStallColorClass(s.status);
    return (
      <button onClick={()=>onStallClick(s)} title={`Stall ${s.id} · ${s.status}`}
        style={{ width: w, height: h, fontSize: Math.min(w,h)*0.45, lineHeight: 1 }}
        className={`inline-flex items-center justify-center shrink-0 border border-black/50 text-white font-bold cursor-pointer relative group select-none ${cc} ${sel?'ring-2 ring-blue-400 z-20 scale-110 shadow-lg':'hover:z-10 hover:brightness-110'}`}>
        {s.id}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 hidden group-hover:block pointer-events-none">
          <div className="bg-gray-900/95 text-white text-[10px] rounded px-2 py-1 shadow-xl whitespace-nowrap">
            <b>Stall {s.id}</b> · {s.category} · <span className="capitalize">{s.status}</span>
            {s.status==='available'&&<span className="text-green-400"> · ₱{s.price.toLocaleString()}</span>}
          </div>
        </div>
      </button>
    );
  };

  // Corner stall (red)
  const CS = ({ s }: { s: Stall }) => (
    <button onClick={()=>onStallClick(s)} title={s.id}
      style={{ width: 20, height: 18 }}
      className={`inline-flex items-center justify-center shrink-0 border-2 border-red-500 bg-white text-red-600 text-[7px] font-black cursor-pointer ${selectedStallId===s.id?'ring-2 ring-blue-400 z-10':''}`}>
      {s.id}
    </button>
  );

  // Corner label
  const CL = ({ t, red }: { t: string; red?: boolean }) => (
    <div style={{ width: 26, height: 26 }}
      className={`inline-flex items-center justify-center rounded-full border-[2.5px] ${red?'border-red-600 text-red-600':'border-blue-800 text-blue-800'} bg-white font-black text-[12px] shrink-0 shadow select-none`}>
      {t}
    </div>
  );

  // Row/col helpers
  const HR = ({ ss, cw, ch }: { ss: Stall[]; cw: number; ch: number }) => (
    <div style={{ display: 'flex', gap: 1 }}>{ss.map(s=><S key={s.id} s={s} w={cw} h={ch}/>)}</div>
  );
  const VC = ({ ss, cw, ch }: { ss: Stall[]; cw: number; ch: number }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{ss.map(s=><S key={s.id} s={s} w={cw} h={ch}/>)}</div>
  );

  // Paired row (like plan shows: 130|131 side by side)
  const PairedRow = ({ a, b, cw, ch }: { a: Stall; b: Stall; cw: number; ch: number }) => (
    <div style={{ display: 'flex', gap: 1 }}>
      <S s={a} w={cw} h={ch} />
      <S s={b} w={cw} h={ch} />
    </div>
  );

  // Build paired left rows (outer[i] | inner[i])
  const leftPairs: JSX.Element[] = [];
  const pairLen = Math.min(lOut.length, lIn.length);
  for (let i = 0; i < pairLen; i++) {
    leftPairs.push(<PairedRow key={`lp${i}`} a={lOut[i]} b={lIn[i]} cw={24} ch={18} />);
  }

  // Top paired stalls (outer[i] shown above inner[i])
  const topPairCells: JSX.Element[] = [];
  const tpLen = Math.min(topOutL.length - 1, inTop.length); // -1 for stall 135
  // First show stall 135 alone
  topPairCells.push(
    <div key="t135" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <S s={topOutL[0]} w={20} h={14} />
    </div>
  );
  // Then paired: topOuter[i+1] above innerTop[i]
  for (let i = 0; i < tpLen; i++) {
    topPairCells.push(
      <div key={`tp${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <S s={topOutL[i + 1]} w={20} h={14} />
        <S s={inTop[i]} w={20} h={14} />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: 1800, padding: 12, background: '#fff', fontFamily: "'Courier New',monospace", position: 'relative' }}>

        {/* Grid background */}
        <div style={{ position:'absolute', inset:0, opacity:0.03, pointerEvents:'none',
          backgroundImage:'repeating-linear-gradient(0deg,#000 0,#000 1px,transparent 1px,transparent 25px),repeating-linear-gradient(90deg,#000 0,#000 1px,transparent 1px,transparent 25px)' }}/>

        {/* Outer boundary */}
        <div style={{ position:'relative', border:'3px solid #1a1a6e', background:'#fff' }}>

          {/* SVG Roads */}
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:1 }}>
            {/* Horizontal magenta roads */}
            <line x1="4%" y1="17%" x2="50%" y2="17%" stroke="#d946ef" strokeWidth="2.5" opacity="0.45"/>
            <line x1="4%" y1="17.5%" x2="50%" y2="17.5%" stroke="#d946ef" strokeWidth="1.5" opacity="0.3"/>
            <line x1="53%" y1="17%" x2="96%" y2="17%" stroke="#d946ef" strokeWidth="2.5" opacity="0.45"/>
            <line x1="53%" y1="17.5%" x2="96%" y2="17.5%" stroke="#d946ef" strokeWidth="1.5" opacity="0.3"/>
            <line x1="4%" y1="91%" x2="50%" y2="91%" stroke="#d946ef" strokeWidth="2.5" opacity="0.45"/>
            <line x1="4%" y1="91.5%" x2="50%" y2="91.5%" stroke="#d946ef" strokeWidth="1.5" opacity="0.3"/>
            <line x1="53%" y1="91%" x2="96%" y2="91%" stroke="#d946ef" strokeWidth="2.5" opacity="0.45"/>
            <line x1="53%" y1="91.5%" x2="96%" y2="91.5%" stroke="#d946ef" strokeWidth="1.5" opacity="0.3"/>
            {/* Vertical magenta roads */}
            <line x1="5.5%" y1="3%" x2="5.5%" y2="97%" stroke="#d946ef" strokeWidth="2.5" opacity="0.45"/>
            <line x1="6%" y1="3%" x2="6%" y2="97%" stroke="#d946ef" strokeWidth="1.5" opacity="0.3"/>
            <line x1="51%" y1="3%" x2="51%" y2="97%" stroke="#d946ef" strokeWidth="2.5" opacity="0.45"/>
            <line x1="51.5%" y1="3%" x2="51.5%" y2="97%" stroke="#d946ef" strokeWidth="1.5" opacity="0.3"/>
            {/* Right blue road */}
            <line x1="97%" y1="3%" x2="97%" y2="97%" stroke="#1a1a6e" strokeWidth="2" opacity="0.35"/>
            {/* Curved corners */}
            <path d="M 5.5%,17% Q 5.5%,3% 15%,3%" fill="none" stroke="#d946ef" strokeWidth="2" opacity="0.3"/>
            <path d="M 5.5%,91% Q 5.5%,97% 15%,97%" fill="none" stroke="#d946ef" strokeWidth="2" opacity="0.3"/>
            <path d="M 51%,17% Q 51%,3% 60%,3%" fill="none" stroke="#d946ef" strokeWidth="2" opacity="0.3"/>
            <path d="M 51%,91% Q 51%,97% 60%,97%" fill="none" stroke="#d946ef" strokeWidth="2" opacity="0.3"/>
            <path d="M 97%,17% Q 97%,3% 90%,3%" fill="none" stroke="#1a1a6e" strokeWidth="1.5" opacity="0.25"/>
            <path d="M 97%,91% Q 97%,97% 90%,97%" fill="none" stroke="#1a1a6e" strokeWidth="1.5" opacity="0.25"/>
            {/* Inner walkway curves */}
            <path d="M 8%,20% Q 8%,19% 9%,19% L 49%,19% Q 50%,19% 50%,20% L 50%,89% Q 50%,90% 49%,90% L 9%,90% Q 8%,90% 8%,89% Z"
              fill="none" stroke="#d946ef" strokeWidth="1.5" opacity="0.2"/>
          </svg>

          <div style={{ position:'relative', zIndex:2, padding:'10px 12px' }}>

            {/* ═══ MARKET SITE BUILDING ═══ */}
            <div style={{ display:'flex', gap:30, marginBottom:6 }}>
              <div style={{ width:740, height:150, flexShrink:0, position:'relative', border:'2px solid #666', background:'#f2f2f2' }}>
                {/* Vertical pillar lines on left edge */}
                {range(0,12).map(i => (
                  <div key={`pl${i}`} style={{ position:'absolute', left:0, top:i*12, width:8, height:10, borderRight:'1px solid #bbb', background:'#e8e8e8' }}/>
                ))}
                {/* Inner border */}
                <div style={{ position:'absolute', inset:8, border:'1px solid #aaa' }}/>
                <div style={{ position:'absolute', inset:16, border:'1px solid #ccc', borderStyle:'dashed' }}/>
                {/* Label */}
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:52, fontWeight:900, color:'#444', letterSpacing:'0.35em', userSelect:'none' }}>MARKET SITE</span>
                </div>
                {/* Bottom interior detail lines */}
                <div style={{ position:'absolute', bottom:8, left:30, right:30, height:20, borderTop:'1px solid #bbb' }}/>
                <div style={{ position:'absolute', bottom:8, left:50, right:200, height:15, borderTop:'1px solid #ccc', borderStyle:'dashed' }}/>
              </div>
              {/* Top-right area */}
              <div style={{ flex:1, position:'relative', minHeight:150 }}>
                <div style={{ position:'absolute', right:20, top:15, width:28, height:28, borderRadius:'50%', border:'1.5px solid #888', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:'bold', color:'#666' }}>5</div>
              </div>
            </div>

            {/* ═══ TOP PAIRED STALL ROWS ═══ */}
            <div style={{ display:'flex', gap:50, marginBottom:3 }}>
              <div style={{ display:'flex', gap:1, flexWrap:'wrap' }}>
                {topPairCells}
                {/* Remaining unpaired inner top stalls */}
                {inTop.slice(topOutL.length - 1).map(s => (
                  <div key={s.id} style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    <div style={{ width:20, height:14 }}/>
                    <S s={s} w={20} h={14} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                <HR ss={topOutR} cw={18} ch={14} />
              </div>
            </div>

            {/* ═══ MAIN BODY ═══ */}
            <div style={{ display:'flex', gap:0 }}>

              {/* Left paired columns */}
              <div style={{ flexShrink:0, marginRight:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:2 }}>
                  <span style={{ fontSize:10, fontWeight:'bold', color:'#555' }}>134</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  {leftPairs}
                  {/* Bottom singles */}
                  {lBot.map(s => (
                    <div key={s.id} style={{ display:'flex', gap:1 }}>
                      <S s={s} w={24} h={18} />
                    </div>
                  ))}
                  {/* Remaining outer stalls without pairs */}
                  {lOut.slice(pairLen).map(s => (
                    <div key={s.id} style={{ display:'flex', gap:1 }}>
                      <S s={s} w={24} h={18} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Inner ring */}
              <div style={{ display:'flex', flexDirection:'column', flex:1 }}>

                {/* C + corner stalls + inner top + corner stalls + D */}
                <div style={{ display:'flex', alignItems:'center', gap:2, marginBottom:2 }}>
                  <CL t="C" red />
                  {cC.map(s=><CS key={s.id} s={s}/>)}
                  <HR ss={inTop} cw={20} ch={16} />
                  {cD.map(s=><CS key={s.id} s={s}/>)}
                  <CL t="D" red />
                </div>

                {/* Center + right column */}
                <div style={{ display:'flex', flex:1 }}>
                  {/* Empty interior */}
                  <div style={{ flex:1, minHeight:460 }}/>
                  {/* Right column */}
                  <div style={{ flexShrink:0, marginLeft:2 }}>
                    <VC ss={rCol} cw={24} ch={16} />
                  </div>
                </div>

                {/* B + corner stalls + inner bottom + corner stalls + A */}
                <div style={{ display:'flex', alignItems:'center', gap:2, marginTop:2 }}>
                  <CL t="B" red />
                  {cB.map(s=><CS key={s.id} s={s}/>)}
                  <HR ss={inBot} cw={20} ch={16} />
                  {cA.map(s=><CS key={s.id} s={s}/>)}
                  <CL t="A" red />
                </div>
              </div>

              {/* PET BOTTLING */}
              <div style={{ width:340, flexShrink:0, marginLeft:10, position:'relative' }}>
                <div style={{ position:'absolute', inset:0, border:'1px solid #ccc', background:'#fafafa', overflow:'hidden' }}>
                  {/* Cross hatching */}
                  <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
                    <defs>
                      <pattern id="xhatch" width="14" height="14" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="14" stroke="#e0e0e0" strokeWidth="0.7"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#xhatch)"/>
                  </svg>
                  {/* Diagonal PET BOTTLING text */}
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:24, fontWeight:'bold', color:'#777', letterSpacing:'0.2em', transform:'rotate(-38deg)', whiteSpace:'nowrap', userSelect:'none' }}>
                      PET BOTTLING
                    </span>
                  </div>
                  {/* Diamond shape */}
                  <svg style={{ position:'absolute', right:25, bottom:50, width:90, height:65 }}>
                    <polygon points="45,2 88,32 45,62 2,32" fill="none" stroke="#555" strokeWidth="1.5"/>
                    <text x="45" y="38" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#555">3</text>
                  </svg>
                  {/* Number 10 */}
                  <div style={{ position:'absolute', right:15, bottom:55, fontSize:16, fontWeight:'bold', color:'#555' }}>10</div>
                  {/* Circle 4 */}
                  <div style={{ position:'absolute', right:10, top:'45%', width:26, height:26, borderRadius:'50%', border:'1.5px solid #777', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:'bold', color:'#666', background:'#fff' }}>4</div>
                  {/* Circle 5 */}
                  <div style={{ position:'absolute', right:10, top:12, width:26, height:26, borderRadius:'50%', border:'1.5px solid #777', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:'bold', color:'#666', background:'#fff' }}>5</div>
                  {/* Blue vertical line (right edge) */}
                  <div style={{ position:'absolute', right:5, top:'10%', bottom:'10%', width:2, background:'#1a1a6e', opacity:0.4 }}/>
                </div>
              </div>
            </div>

            {/* ═══ BOTTOM OUTER ROWS ═══ */}
            <div style={{ display:'flex', gap:25, marginTop:4 }}>
              <HR ss={outBL} cw={16} ch={14} />
              <HR ss={outBR} cw={16} ch={14} />
            </div>

          </div>
        </div>

        {/* Legend */}
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:16, marginTop:14, paddingTop:10, borderTop:'1px solid #e5e7eb' }}>
          <span style={{ fontSize:11, fontWeight:600, color:'#888', textTransform:'uppercase', letterSpacing:'0.1em' }}>Legend:</span>
          {[{c:'bg-green-500',l:'Available'},{c:'bg-yellow-400',l:'Pending'},{c:'bg-red-500',l:'Reserved'},{c:'bg-gray-500',l:'Occupied'}].map(i=>(
            <div key={i.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div className={i.c} style={{ width:14, height:14, border:'1px solid rgba(0,0,0,0.2)' }}/>
              <span style={{ fontSize:12, color:'#555' }}>{i.l}</span>
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:20, height:18, border:'2px solid #ef4444', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:7, fontWeight:900, color:'#dc2626' }}>A1</span>
            </div>
            <span style={{ fontSize:12, color:'#555' }}>Corner</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:22, height:22, borderRadius:'50%', border:'2.5px solid #dc2626', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:10, fontWeight:900, color:'#dc2626' }}>B</span>
            </div>
            <span style={{ fontSize:12, color:'#555' }}>Marker</span>
          </div>
        </div>
      </div>
    </div>
  );
}
