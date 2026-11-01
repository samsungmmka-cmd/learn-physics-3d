// Magnified-scale view (the loupe) for the spherometer, drawn on a 2D canvas whenever the rig changes.
export function loupeSphero(c,w,h,R,hint){
  const r=R.reading(); c.fillStyle='#1b2333'; c.fillRect(0,0,w,h);
  const fs=Math.max(10,Math.round(h*.1));
  // A: vertical scale
  const aw=Math.round(w*.3), yD=Math.round(h*.6), ppm=h/4.6, Y=v=>yD-(v-r)*ppm;
  c.fillStyle='#eef1f5'; c.fillRect(10,0,aw-26,h); c.textAlign='right'; c.font=`700 ${fs}px Arial`;
  const hv=hint?Math.floor(R.ideal()+1e-9):null;
  for(let v=Math.floor(r)-3;v<=Math.floor(r)+3;v++){ if(v<0||v>20) continue; const y=Y(v); if(y<0||y>h) continue; c.fillStyle=v===hv?'#e0560b':'#0e131c'; c.fillRect(aw-36,y-1,20,2); c.fillText(String(v),aw-40,y+fs*.35); }
  c.fillStyle='rgba(150,160,175,.92)'; c.fillRect(0,yD,aw,10); c.fillStyle='#0e131c'; c.fillRect(0,yD,aw,1.5);
  // B: circular scale strip
  const bx=aw+6, bw=Math.round(w*.42), cx=bx+bw/2, cdiv=((r%1)+1)%1*100, sp=bw/13;
  c.fillStyle='#e3e7ed'; c.fillRect(bx,h*.3,bw,h*.44); c.fillStyle='#e0560b'; c.fillRect(cx-1,h*.16,2,h*.62);
  c.textAlign='center'; const near=Math.round(cdiv);
  c.save(); c.beginPath(); c.rect(bx,0,bw,h); c.clip();
  for(let d=near-8;d<=near+8;d++){ const x=cx+(d-cdiv)*sp; const val=((d%100)+100)%100; const big=val%10===0, mid5=val%5===0;
    c.fillStyle=(hint&&d===near)?'#e0560b':'#0e131c'; c.fillRect(x-1,h*.3,2,big?h*.24:mid5?h*.17:h*.11); if(big||mid5){ c.font=`700 ${Math.round(fs*.9)}px Arial`; c.fillStyle='#0e131c'; c.fillText(String(val),x,h*.68);} }
  c.restore();
  // C: tip and reflection
  const qx=bx+bw+8, qw=w-qx-6, qc=qx+qw/2, sy=Math.round(h*.55), gap=Math.max(0,R.gap()), gp=Math.min(h*.4,gap*90);
  c.fillStyle='#24324a'; c.fillRect(qx,0,qw,h); c.fillStyle='#7f9cff'; c.fillRect(qx,sy,qw,1.5);
  c.fillStyle='#d8dde5'; c.beginPath(); c.moveTo(qc-9,sy-gp-30); c.lineTo(qc+9,sy-gp-30); c.lineTo(qc,sy-gp); c.fill();
  c.fillStyle='rgba(216,221,229,.45)'; c.beginPath(); c.moveTo(qc-9,sy+gp+30); c.lineTo(qc+9,sy+gp+30); c.lineTo(qc,sy+gp); c.fill();
  c.textAlign='center'; c.font=`700 ${Math.round(fs*.85)}px Arial`; c.fillStyle=R.contact()?'#52c68d':'#c6cfdb'; c.fillText(R.contact()?'✓':'↕',qc,h-6);
}
