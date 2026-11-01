// Magnified-scale view (the loupe) for the vernier caliper, drawn on a 2D canvas whenever the rig changes.
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
