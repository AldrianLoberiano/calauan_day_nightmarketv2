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
