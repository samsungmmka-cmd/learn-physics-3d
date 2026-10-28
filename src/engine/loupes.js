export function loupeCaliper(c,w,h,R,hint){
  const r=R.reading(); c.fillStyle='#1b2333'; c.fillRect(0,0,w,h);
  const span=15.5, left=r-2.6, ppm=w/span, X=mm=>(mm-left)*ppm, yE=Math.round(h*.5);
  c.fillStyle='#eef1f5'; c.fillRect(0,6,w,yE-6);
  const fs=Math.max(11,Math.round(h*.12)); c.textAlign='center';
  let k0=-1,m0=null; if(hint){ const m=Math.floor(r+1e-9); k0=Math.round((r-m)*10); m0=r+.9*k0; }
  for(let mm=Math.ceil(left);mm<=left+span;mm++){ if(mm<0||mm>200) continue; const Lh=mm%10===0?(yE-6)*.62:mm%5===0?(yE-6)*.46:(yE-6)*.3; const x=X(mm);
    c.fillStyle=(m0!==null&&Math.abs(mm-m0)<.02)?'#e0560b':'#0e131c'; c.fillRect(x-1,yE-Lh,2,Lh);
    if(mm%10===0){ c.fillStyle='#0e131c'; c.font=`700 ${fs}px Arial`; c.fillText(String(mm/10),x,6+fs); } }
  const vx0=X(r-1.1), vx1=X(r+10.1); c.fillStyle='#cbd3de'; c.fillRect(vx0,yE,vx1-vx0,h-yE-6);
  for(let k=0;k<=10;k++){ const x=X(r+.9*k), Lh=k%5===0?(h-yE)*.42:(h-yE)*.28; c.fillStyle=k===k0?'#e0560b':'#0e131c'; c.fillRect(x-1,yE,2,Lh); c.font=`600 ${Math.round(fs*.85)}px Arial`; c.fillText(String(k),x,yE+Lh+fs*.95); }
  c.fillStyle='#0e131c'; c.fillRect(0,yE,w,1);
}

export function loupeMicro(c,w,h,R,hint){
  const r=R.reading(); c.fillStyle='#1b2333'; c.fillRect(0,0,w,h);
  const edgeX=Math.round(w*.58), ppm=(edgeX-12)/4.2, X=mm=>edgeX-(r-mm)*ppm, mid=Math.round(h*.5);
  c.fillStyle='#e9edf2'; c.fillRect(0,mid-h*.3,edgeX,h*.6); c.fillStyle='#0e131c'; c.fillRect(0,mid-1,edgeX,2);
  const fs=Math.max(11,Math.round(h*.11)); c.textAlign='center'; c.font=`700 ${fs}px Arial`;
  let hiM=null; if(hint){ hiM=Math.floor(R.ideal()/0.5+1e-9)*0.5; }
  for(let k=Math.floor(r)-6;k<=Math.floor(r)+1;k++){ if(k<0) continue;
    let x=X(k); if(x<edgeX-1){ c.fillStyle=(hiM!==null&&Math.abs(hiM-k)<1e-6)?'#e0560b':'#0e131c'; c.fillRect(x-1,mid-h*.2,2,h*.2); if(k%5===0){ c.fillStyle='#0e131c'; c.fillText(String(k),x,mid-h*.22);} }
    x=X(k+.5); if(x<edgeX-1){ c.fillStyle=(hiM!==null&&Math.abs(hiM-(k+.5))<1e-6)?'#e0560b':'#0e131c'; c.fillRect(x-1,mid,2,h*.15); } }
  const grd=c.createLinearGradient(edgeX,0,w,0); grd.addColorStop(0,'#b9c1cd'); grd.addColorStop(.08,'#dfe4eb'); grd.addColorStop(1,'#c5ccd6');
  c.fillStyle=grd; c.fillRect(edgeX,0,w-edgeX,h); c.fillStyle='#8f99a8'; c.fillRect(edgeX,0,3,h);
  const cdiv=((r%0.5)+0.5)%0.5/0.01, sp=h/12; const near=Math.round(cdiv);
  for(let d=near-7;d<=near+7;d++){ const y=mid-(d-cdiv)*sp; if(y<2||y>h-2) continue; const val=((d%50)+50)%50; const big=val%5===0;
    c.fillStyle=(hint&&d===near)?'#e0560b':'#0e131c'; c.fillRect(edgeX,y-1,big?28:18,2); if(big){ c.textAlign='left'; c.font=`700 ${fs}px Arial`; c.fillText(String(val),edgeX+34,y+fs*.35); } }
}

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
