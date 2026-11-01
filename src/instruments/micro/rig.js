// Micrometer screw gauge (units: mm). 3D rig: builds the instrument from code and answers the rig contract
// (see src/instruments/README.md). `kit` is the shared toolkit the engine passes in.
// three.js is imported here (not passed in the kit) so the build only bundles the parts in use.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { loupeMicro } from './loupe.js';

export default function makeMicro(kit) {
  const { mats, mesh, anchor, steadyAnchor, engr, scaleMat, clearGroup, rand, fmt, tick } = kit;
  const R = { type: 'micro', S: 0.2, g: 6, e: 0, mode: 'show', size: 0, vel: 0, squeeze: 0, ratchet: false, tickT: 0, dirty: true };
  const m = mats(), rootG = new THREE.Group(); R.root = rootG; const g0 = new THREE.Group(); rootG.add(g0); R.m = g0;
  const s = new THREE.Shape();
  s.moveTo(-14, -5); s.lineTo(-14, -8); s.absarc(10, -8, 24, Math.PI, 0, false); s.lineTo(34, -5); s.lineTo(24, -5); s.lineTo(24, -8); s.absarc(10, -8, 14, 0, Math.PI, true); s.lineTo(-4, -5); s.lineTo(-14, -5);
  const fg = new THREE.ExtrudeGeometry(s, { depth: 6, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 3, curveSegments: 48 }); fg.translate(0, 0, -3);
  R.frame = mesh(fg, m.enamel, 0, 0, 0, g0);
  mesh(new RoundedBoxGeometry(10, 10, 7.2, 2, 1), m.enamel, -9, 0, 0, g0);
  mesh(new RoundedBoxGeometry(10, 10, 7.2, 2, 1), m.enamel, 29, 0, 0, g0);
  const plate = mesh(new THREE.CylinderGeometry(6, 6, 0.4, 32), m.steel, 10, -28, 3.6, g0); plate.rotation.x = Math.PI / 2;
  const cylX = (r, len, mat, x0, seg = 48) => { const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateZ(-Math.PI / 2); g.translate(x0 + len / 2, 0, 0); const o = new THREE.Mesh(g, mat); o.castShadow = o.receiveShadow = true; return o; };
  g0.add(cylX(3, 4, m.chrome, -4));
  const spG = new THREE.CylinderGeometry(3, 3, 1, 48); spG.rotateZ(-Math.PI / 2); R.spindle = mesh(spG, m.chrome, 0, 0, 0, g0);
  g0.add(cylX(4.2, 28, m.steel, 34));
  R.sMat = scaleMat(null); R.sPlane = mesh(new THREE.PlaneGeometry(28, 5.4), R.sMat, 48, 0, 4.22, g0); R.sPlane.castShadow = false;
  const T = new THREE.Group(); g0.add(T); R.T = T;
  const tTex = engr(1024, 128, '#d0d4da', (c, w, h) => { c.font = 'bold 40px Arial'; c.textAlign = 'center'; for (let d = 0; d < 50; d++) { const x = (d / 50) * w; c.fillRect(x - 1.5, 0, 3, d % 5 === 0 ? h * 0.55 : h * 0.35); if (d % 5 === 0) c.fillText(String(d), x + 14, h * 0.9); } });
  const bev = new THREE.CylinderGeometry(6.5, 5, 3, 64, 1, true); bev.rotateZ(-Math.PI / 2); bev.translate(1.5, 0, 0);
  const bevM = mesh(bev, new THREE.MeshStandardMaterial({ map: tTex, metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide }), 0, 0, 0, T);
  const body = new THREE.CylinderGeometry(6.5, 6.5, 23, 64); body.rotateZ(-Math.PI / 2); body.translate(3 + 11.5, 0, 0); const bodyM = mesh(body, m.knurl, 0, 0, 0, T);
  const rg = new THREE.CylinderGeometry(4.6, 4.6, 10, 40); rg.rotateZ(-Math.PI / 2); rg.translate(31, 0, 0); const ratM = mesh(rg, m.knurlBlack, 0, 0, 0, T);
  mesh(new THREE.CylinderGeometry(1.6, 1.6, 5, 16), m.steel, 29, 6.5, 0, g0); mesh(new THREE.SphereGeometry(2.2, 16, 12), m.black, 29, 9.4, 0, g0);
  R.dragTargets = [bevM, bodyM, ratM]; R.objG = new THREE.Group(); rootG.add(R.objG);
  R.anchors = { anvil: anchor(g0, -2, 4, 0), spindle: anchor(g0, 14, 4, 0), sleeve: anchor(g0, 40, 5, 0), thimble: steadyAnchor(T, 14, 7, 0), circ: steadyAnchor(T, 1, -7, 0), ratchet: steadyAnchor(T, 33, 5, 0), frame: anchor(g0, 10, -32, 0) };
  R.setE = (e) => {
    if (R.e === e && R.sMat.map) return;
    R.e = e; if (R.sMat.map) R.sMat.map.dispose();
    R.sMat.map = engr(2048, 396, '#c6cbd2', (c, w, h) => {
      const ppm = w / 28, mid = h / 2; c.fillRect(0, mid - 3, w, 6); c.font = 'bold 80px Arial'; c.textAlign = 'center';
      for (let k = 0; k <= 25; k++) { const x = (k - e) * ppm; c.fillRect(x - 4, mid - h * 0.28, 8, h * 0.28); if (k % 5 === 0) c.fillText(String(k), x, mid - h * 0.32); const x2 = (k + 0.5 - e) * ppm; c.fillRect(x2 - 4, mid, 8, h * 0.22); }
    });
    R.sMat.needsUpdate = true; R.apply();
  };
  R.limits = () => [R.mode === 'outer' ? R.size : 0, 24];
  R.apply = () => { const len = Math.max(0.1, 40 - R.g); R.spindle.scale.set(len, 1, 1); R.spindle.position.x = R.g + len / 2; T.position.x = 34 + R.g; T.rotation.x = -(R.reading() / 0.5) * Math.PI * 2; R.dirty = true; };
  R.set = (g) => { const [lo, hi] = R.limits(); const ng = Math.min(hi, Math.max(lo, g)); if (ng > R.g + 1e-9) R.squeeze = 0; R.g = ng; R.apply(); };
  R.value = () => R.g;
  R.reading = () => R.g - R.squeeze + R.e;
  R.ideal = () => Math.round(R.reading() * 100) / 100;
  R.tol = 0.0101;
  R.contact = () => { const [lo] = R.limits(); return R.g <= lo + 1e-6; };
  R.status = () => { if (R.mode === 'show') return null; if (R.squeeze > 0) return ['warn', 'tooTight']; return R.contact() ? ['on', 'touching'] : ['', 'notTouching']; };
  R.closeBy = (d, ratchet) => {
    const [lo] = R.limits();
    if (R.g + d < lo) {
      if (R.g > lo + 1e-6) { R.set(lo); return; }
      if (ratchet) tick(); else { R.squeeze = Math.min(0.03, R.squeeze + Math.abs(d) * 0.35 + 0.002); R.apply(); }
    } else R.set(R.g + d);
  };
  R.step = (dt) => {
    if (!R.vel) return; const d = R.vel * dt;
    if (d < 0) {
      if (R.ratchet) { const [lo] = R.limits(); if (R.g <= lo + 1e-6) { R.tickT += dt; if (R.tickT > 0.12) { R.tickT = 0; tick(); } } else R.set(R.g + d); }
      else R.closeBy(d, false);
    } else R.set(R.g + d);
  };
  R.nudge = (d, c) => { if (d < 0) R.closeBy(d, c && c.ratchet); else R.set(R.g + d); };
  R.drag = (dx, dy, st0) => { const g = st0.g + dy * 0.004; if (g < R.g) R.closeBy(g - R.g, false); else R.set(g); };
  R.place = (spec) => {
    clearGroup(R.objG);
    R.mode = spec.mode; R.size = spec.size || 0; R.squeeze = 0; const s2 = R.size, ri = spec.ri || 0, og = R.objG;
    if (spec.obj === 'wire') { const w = mesh(new THREE.CylinderGeometry(s2 / 2, s2 / 2, 46, 20), m.copper, s2 / 2, 0, 0, og); w.rotation.x = Math.PI / 2; w.position.z = (Math.floor(ri / 2) - 1) * 7; w.rotation.y = ((ri % 2) * Math.PI) / 2; }
    if (spec.obj === 'ball') mesh(new THREE.SphereGeometry(s2 / 2, 48, 32), m.chrome, s2 / 2, 0, 0, og);
    if (spec.obj === 'slide') mesh(new THREE.BoxGeometry(s2, 25, 60), m.glass, s2 / 2, 4, (ri - 1) * 10, og);
    if (spec.obj === 'paper') {
      const n = Math.max(1, Math.round(s2 / 0.104)), k = Math.min(n, 30); const pg = new THREE.Group(); og.add(pg); pg.position.set(0, 3, (ri - 1) * 8);
      for (let i = 0; i < k; i++) mesh(new THREE.BoxGeometry((s2 / k) * 0.92, 22 + rand(-0.4, 0.4), 34 + rand(-0.6, 0.6)), m.paper, ((i + 0.5) * s2) / k, rand(-0.3, 0.3), rand(-0.4, 0.4), pg);
    }
    const start = spec.mode === 'outer' ? s2 + 1.6 : spec.mode === 'none' ? 1.2 : 6;
    R.g = -1; R.set(start);
  };
  R.focusObjs = () => [g0];
  R.loupe = (c, w, h, hint) => loupeMicro(c, w, h, R, hint);
  R.hintText = (lang) => {
    const r = R.ideal(); let sl = Math.floor(r / 0.5 + 1e-9) * 0.5; let cd = Math.round((r - sl) / 0.01); if (cd >= 50) { cd -= 50; sl += 0.5; }
    if (lang === 'ta') return `பிரதான அளவுகோல்: ${fmt(sl, 1)} mm · கோட்டிலுள்ள வட்ட அளவுகோல் பிரிவு: ${cd} → ${cd} × 0.01 = ${fmt(cd * 0.01, 2)} mm · வாசிப்பு = ${fmt(r, 2)} mm`;
    return lang === 'si'
      ? `ප්‍රධාන පරිමාණය: ${fmt(sl, 1)} mm · ප්‍රධාන රේඛාව මත වෘත්ත පරිමාණ කොටස: ${cd} → ${cd} × 0.01 = ${fmt(cd * 0.01, 2)} mm · පාඨාංකය = ${fmt(r, 2)} mm`
      : `Main scale: ${fmt(sl, 1)} mm · circular-scale division on the line: ${cd} → ${cd} × 0.01 = ${fmt(cd * 0.01, 2)} mm · reading = ${fmt(r, 2)} mm`;
  };
  R.setE(0); R.set(6);
  return R;
}
