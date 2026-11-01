// Magnified-scale view (the loupe) for the micrometer screw gauge, drawn on a 2D canvas whenever the rig changes.
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
