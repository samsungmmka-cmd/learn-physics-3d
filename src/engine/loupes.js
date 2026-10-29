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

// Travelling microscope: the view through the eyepiece (crosswire on the tube's end face) on the left,
// and on the right the vernier of the scale being used: an overview strip with a lens you can slide
// along it, and the lens view magnified underneath. Levelling shows the spirit level instead.
const VL = 24.5; // vernier length: 50 divisions over 49 half-millimetres
export function travelCoincide(r) { const M = Math.floor(r / 0.5 + 1e-9) * 0.5; let k = Math.round((r - M) / 0.01); let m = M; if (k >= 50) { k -= 50; m += 0.5; } return { M: m, k }; }

function ellipse(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2); }

function drawEye(c, ex, ey, Rv, R, hint) {
  c.save(); c.beginPath(); c.arc(ex, ey, Rv, 0, 7); c.clip();
  const bg = c.createRadialGradient(ex, ey, Rv * 0.1, ex, ey, Rv); bg.addColorStop(0, '#f7f2e3'); bg.addColorStop(1, '#d9d2bf');
  c.fillStyle = bg; c.fillRect(ex - Rv, ey - Rv, Rv * 2, Rv * 2);
  const din = R.din || [0.82, 0.8], dout = R.dout || [6.4, 6.4];
  const meas = R.edge === 'out' ? dout : din; const rr = Math.max(meas[0], meas[1]) / 2;
  const k = Rv / (2.3 * rr);
  const ox = ex + (R.cx - R.X) * k, oy = ey + (R.cy - R.Y) * k;
  const rub = R.obj === 'rub';
  ellipse(c, ox, oy, (dout[0] / 2) * k, (dout[1] / 2) * k);
  if (rub) { const g = c.createRadialGradient(ox - 4, oy - 4, 2, ox, oy, (dout[0] / 2) * k); g.addColorStop(0, '#45464b'); g.addColorStop(1, '#202125'); c.fillStyle = g; }
  else { const g = c.createRadialGradient(ox, oy, 2, ox, oy, (dout[0] / 2) * k); g.addColorStop(0, '#d3e8ec'); g.addColorStop(1, '#a9c6cc'); c.fillStyle = g; }
  c.fill(); c.lineWidth = 1.6; c.strokeStyle = rub ? '#0b0b0d' : '#6f8f96'; c.stroke();
  ellipse(c, ox, oy, (din[0] / 2) * k, (din[1] / 2) * k);
  c.fillStyle = rub ? '#b98452' : '#42535c'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = rub ? '#0b0b0d' : '#26333a'; c.stroke();
  if (hint && R.mode === 'meas') {
    const t = R.target(); c.strokeStyle = '#e0560b'; c.lineWidth = 2; c.setLineDash([5, 4]); c.beginPath();
    if (R.axis === 'x') { const x = ex + (t - R.X) * k; c.moveTo(x, ey - Rv); c.lineTo(x, ey + Rv); } else { const y = ey + (t - R.Y) * k; c.moveTo(ex - Rv, y); c.lineTo(ex + Rv, y); }
    c.stroke(); c.setLineDash([]);
  }
  c.strokeStyle = '#11151a'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(ex - Rv, ey); c.lineTo(ex + Rv, ey); c.moveTo(ex, ey - Rv); c.lineTo(ex, ey + Rv); c.stroke();
  c.restore();
  c.lineWidth = 5; c.strokeStyle = '#0c1118'; c.beginPath(); c.arc(ex, ey, Rv, 0, 7); c.stroke();
  if (R.mode === 'meas') { c.fillStyle = R.contact() ? '#52c68d' : '#c6cfdb'; c.font = `700 ${Math.max(11, Math.round(Rv * 0.2))}px Arial`; c.textAlign = 'center'; c.fillText(R.contact() ? '✓' : R.axis === 'x' ? '↔' : '↕', ex + Rv * 0.78, ey + Rv * 0.95); }
}

function drawVernier(c, x0, x1, h, R, hint) {
  const r = R.reading(), rw = x1 - x0; const { M, k: k0 } = travelCoincide(Math.round(r * 100) / 100);
  const oy0 = 5, oy1 = Math.round(h * 0.4), my0 = Math.round(h * 0.47), my1 = h - 5;
  const left = r - 2.5, span = VL + 5, ppm = rw / span, X = (mm) => x0 + (mm - left) * ppm;
  const fs = Math.max(9, Math.round(h * 0.075));
  const lensC = r + R.lensU * VL, LH = 3.2, ppmM = rw / (2 * LH), Xm = (mm) => x0 + (mm - (lensC - LH)) * ppmM;
  // overview strip
  const yE = Math.round((oy0 + oy1) / 2);
  c.fillStyle = '#eef1f5'; c.fillRect(x0, oy0, rw, yE - oy0); c.fillStyle = '#cbd3de'; c.fillRect(X(r - 0.6), yE, (VL + 1.2) * ppm, oy1 - yE);
  c.save(); c.beginPath(); c.rect(x0, oy0, rw, oy1 - oy0); c.clip();
  c.fillStyle = '#0e131c';
  c.font = `700 ${fs}px Arial`; c.textAlign = 'center';
  for (let q = Math.ceil(left * 2); q <= (left + span) * 2; q++) {
    const mm = q / 2; if (mm < 0) continue; const L = mm % 10 === 0 ? 0.45 : mm % 5 === 0 ? 0.36 : mm % 1 === 0 ? 0.28 : 0.18;
    c.fillRect(X(mm) - 0.5, yE - (yE - oy0) * L, 1, (yE - oy0) * L);
    if (mm % 10 === 0) c.fillText(`${mm / 10} cm`, X(mm), oy0 + fs);
  }
  for (let k = 0; k <= 50; k++) { const L = k % 10 === 0 ? 0.8 : k % 5 === 0 ? 0.55 : 0.35; c.fillStyle = hint && k === k0 ? '#e0560b' : '#0e131c'; c.fillRect(X(r + k * 0.49) - 0.5, yE, 1, (oy1 - yE) * L); }
  c.restore();
  c.strokeStyle = '#e0560b'; c.lineWidth = 2; c.strokeRect(X(lensC - LH), oy0 - 1, 2 * LH * ppm, oy1 - oy0 + 2);
  c.fillStyle = '#e0560b'; c.font = `700 ${fs}px Arial`; c.textAlign = 'left'; c.fillText(R.axis === 'y' ? 'Y' : 'X', x0 + 3, oy0 + fs);
  // magnified lens view
  const yM = Math.round((my0 + my1) / 2);
  c.fillStyle = '#eef1f5'; c.fillRect(x0, my0, rw, yM - my0); c.fillStyle = '#cbd3de'; c.fillRect(x0, yM, rw, my1 - yM);
  c.save(); c.beginPath(); c.rect(x0, my0, rw, my1 - my0); c.clip();
  c.textAlign = 'center';
  for (let q = Math.floor((lensC - LH) * 2) - 1; q <= (lensC + LH) * 2 + 1; q++) {
    const mm = q / 2; if (mm < 0) continue; const x = Xm(mm), L = mm % 10 === 0 ? 0.62 : mm % 5 === 0 ? 0.5 : mm % 1 === 0 ? 0.38 : 0.24;
    c.fillStyle = hint && Math.abs(mm - (M + k0 * 0.5)) < 1e-6 ? '#e0560b' : '#0e131c'; c.fillRect(x - 1, yM - (yM - my0) * L, 2, (yM - my0) * L);
    if (mm % 10 === 0) { c.fillStyle = '#0e131c'; c.font = `700 ${Math.round(fs * 1.3)}px Arial`; c.fillText(`${mm / 10} cm`, x, my0 + fs + 2); }
  }
  for (let k = 0; k <= 50; k++) {
    const x = Xm(r + k * 0.49); if (x < x0 - 20 || x > x1 + 20) continue; const L = k % 10 === 0 ? 0.55 : k % 5 === 0 ? 0.42 : 0.3;
    c.fillStyle = hint && k === k0 ? '#e0560b' : '#0e131c'; c.fillRect(x - 1, yM, 2, (my1 - yM) * L);
    if (k % 10 === 0) { c.fillStyle = '#0e131c'; c.font = `700 ${fs}px Arial`; c.fillText(String(k), x, my1 - 3); }
  }
  c.fillStyle = '#0e131c'; c.fillRect(x0, yM, rw, 1);
  c.restore();
  c.strokeStyle = '#e0560b'; c.lineWidth = 2; c.strokeRect(x0 + 1, my0, rw - 2, my1 - my0);
  R._lay = { x0, rw, oy0, oy1, my0, my1, left, ppm, ppmM, r };
}

function drawLevel(c, w, h, R) {
  const x0 = 18, x1 = w - 18, cy = h / 2, L = (x1 - x0) / 2, cx = (x0 + x1) / 2, th = Math.min(46, h * 0.34);
  c.fillStyle = '#c9a24e'; c.beginPath(); c.roundRect(x0 - 10, cy - th / 2 - 10, x1 - x0 + 20, th + 20, 10); c.fill();
  const g = c.createLinearGradient(0, cy - th / 2, 0, cy + th / 2); g.addColorStop(0, '#e9f6d9'); g.addColorStop(0.5, '#c8e6a6'); g.addColorStop(1, '#a9cf83');
  c.fillStyle = g; c.beginPath(); c.roundRect(x0, cy - th / 2, x1 - x0, th, th / 2); c.fill();
  const bw = Math.min(70, L * 0.42), off = Math.max(-1, Math.min(1, R.tilt * 0.6)) * (L - bw / 2 - 6);
  c.fillStyle = '#1a1e24'; [-1, 1].forEach((s) => c.fillRect(cx + s * (bw / 2 + 3) - 1, cy - th / 2, 2.5, th));
  const bx = cx + off; const bg = c.createRadialGradient(bx - bw * 0.15, cy - th * 0.18, 2, bx, cy, bw / 2);
  bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, 'rgba(240,250,225,.75)');
  c.fillStyle = bg; c.beginPath(); c.ellipse(bx, cy, bw / 2 - 2, th / 2 - 5, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(80,110,60,.6)'; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = R.contact() ? '#52c68d' : '#c6cfdb'; c.font = `700 ${Math.max(12, Math.round(h * 0.12))}px Arial`; c.textAlign = 'center';
  c.fillText(R.contact() ? '✓' : R.tilt > 0 ? '⟲' : '⟳', cx, h - 8);
}

export function loupeTravel(c, w, h, R, hint) {
  c.fillStyle = '#1b2333'; c.fillRect(0, 0, w, h);
  if (R.mode === 'level') { R._lay = null; drawLevel(c, w, h, R); return; }
  const D = Math.min(h - 10, Math.round(w * 0.36)), Rv = D / 2, ex = 6 + Rv, ey = h / 2;
  drawEye(c, ex, ey, Rv, R, hint);
  drawVernier(c, ex + Rv + 10, w - 6, h, R, hint);
}
