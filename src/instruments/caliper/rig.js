// Vernier caliper (units: mm). 3D rig: builds the instrument from code and answers the rig contract
// (see src/instruments/README.md). `kit` is the shared toolkit the engine passes in.
// three.js is imported here (not passed in the kit) so the build only bundles the parts in use.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { loupeCaliper } from './loupe.js';

export default function makeCaliper(kit) {
  const { mats, mesh, extr, lathe, anchor, ctex, engr, scaleMat, clearGroup, camera, root, fmt } = kit;
  const R = { type: 'caliper', S: 0.064, g: 40, e: 0, mode: 'show', size: 0, vel: 0, dirty: true, B: 215 };
  const m = mats(), rootG = new THREE.Group(); R.root = rootG;
  const cal = new THREE.Group(); rootG.add(cal); R.cal = cal; const B = R.B;
  mesh(new RoundedBoxGeometry(B + 15, 18, 3, 2, 0.6), m.steel, (B - 15) / 2, 0, 0, cal);
  const mt = engr(4096, 166, '#c3c8cf', (c, w, h) => {
    const ppm = w / 210; c.textAlign = 'center'; c.font = 'bold 62px Arial';
    for (let mm = 0; mm <= 200; mm++) {
      const X = (mm + 5) * ppm, Lh = mm % 10 === 0 ? h * 0.5 : mm % 5 === 0 ? h * 0.38 : h * 0.26;
      c.fillRect(X - 1.6, h - Lh, 3.2, Lh);
      if (mm % 10 === 0) c.fillText(String(mm / 10), X, h * 0.42);
    }
    c.font = 'bold 38px Arial'; c.fillText('cm', w - 40, h * 0.4);
  });
  mesh(new THREE.PlaneGeometry(210, 8.5), scaleMat(mt), 100, 4.5, 1.52, cal).castShadow = false;
  R.fixed = mesh(extr([[-15, -9], [0, -9], [0, -48], [-4, -46], [-15, -22]], 2.4, 0.3), m.steel, 0, 0, 0, cal);
  mesh(extr([[0, 9], [7, 9], [4, 21], [0, 30]], 1.2, 0.1), m.steel, 0, 0, -0.8, cal);
  const sl = new THREE.Group(); cal.add(sl); R.slider = sl;
  const front = mesh(new RoundedBoxGeometry(46, 12, 1, 2, 0.35), m.steel, 17, -6, 2, sl);
  mesh(new RoundedBoxGeometry(46, 23, 1, 2, 0.35), m.steel, 17, -0.5, -2, sl);
  mesh(new THREE.BoxGeometry(46, 3, 5), m.steelD, 17, -10.5, 0, sl);
  mesh(new THREE.BoxGeometry(46, 2, 5), m.steelD, 17, 10, 0, sl);
  const jaw = mesh(extr([[0, -12], [12, -12], [12, -20], [4, -46], [0, -48]], 2.4, 0.3), m.steel, 0, 0, 0, sl);
  mesh(extr([[-7, 11], [0, 11], [0, 30], [-4, 21]], 1.2, 0.1), m.steel, 0, 0, 0.8, sl);
  const wh = mesh(new THREE.CylinderGeometry(4, 4, 5, 32), m.knurlBlack, 26, -15.5, 0, sl); wh.rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(2.4, 2.4, 4, 24), m.knurl, 14, 13, 0, sl);
  mesh(new THREE.BoxGeometry(B - 40, 1.6, 1), m.steel, 40 + (B - 40) / 2, -3, -0.8, sl);
  R.vMat = scaleMat(null);
  R.vPlane = mesh(new THREE.PlaneGeometry(15, 7), R.vMat, 4.5, -3.5, 2.52, sl); R.vPlane.castShadow = false;
  R.dragTargets = [jaw, wh, front];
  R.objG = new THREE.Group(); rootG.add(R.objG);
  R.anchors = { outer: anchor(cal, -3, -44, 0), inner: anchor(cal, 2, 28, 0), fixed: anchor(cal, -12, -24, 0), slide: anchor(sl, 30, 12, 0), main: anchor(cal, 130, 9, 1.5), vern: anchor(sl, 6, -8, 2.5), rod: anchor(sl, B, -3, 0) };
  R.setE = (e) => {
    if (R.e === e && R.vMat.map) return;
    R.e = e; if (R.vMat.map) R.vMat.map.dispose();
    R.vMat.map = engr(1024, 478, '#cdd2d8', (c, w, h) => {
      c.textAlign = 'center'; c.font = 'bold 54px Arial';
      for (let k = 0; k <= 10; k++) { const X = ((3 + 0.9 * k) / 15) * w, Lh = k % 5 === 0 ? h * 0.48 : h * 0.32; c.fillRect(X - 3, 0, 6, Lh); c.fillText(String(k), X, h * 0.85); }
    });
    R.vMat.needsUpdate = true; R.vPlane.position.x = e + 4.5; R.dirty = true;
  };
  R.limits = () => { let lo = 0, hi = 190; if (R.mode === 'outer') lo = R.size; if (R.mode === 'inner' || R.mode === 'depth') hi = R.size; return [lo, hi]; };
  R.set = (g) => { const [lo, hi] = R.limits(); const ng = Math.min(hi, Math.max(lo, g)); if (ng !== R.g) { R.g = ng; R.dirty = true; } sl.position.x = R.g; };
  R.value = () => R.g;
  R.reading = () => R.g + R.e;
  R.ideal = () => Math.round(R.reading() * 10) / 10;
  R.tol = 0.051;
  R.contact = () => {
    const [lo, hi] = R.limits();
    if (R.mode === 'outer') return R.g <= lo + 1e-6;
    if (R.mode === 'inner' || R.mode === 'depth') return R.g >= hi - 1e-6;
    if (R.mode === 'none') return R.g <= 1e-6;
    if (R.mode === 'free') return Math.abs(R.g - R.size) <= 0.06;
    return null;
  };
  R.status = () => { const c = R.contact(); if (c === null) return null; if (R.mode === 'free') return c ? ['on', 'onMarks'] : ['', 'offMarks']; return c ? ['on', 'touching'] : ['', 'notTouching']; };
  R.step = (dt) => { if (R.vel) R.set(R.g + R.vel * dt); };
  R.nudge = (d) => R.set(R.g + d);
  R.drag = (dx, dy, st0) => {
    const a = new THREE.Vector3(st0.g, -30, 0), b = new THREE.Vector3(st0.g + 10, -30, 0);
    cal.localToWorld(a); cal.localToWorld(b); a.project(camera); b.project(camera);
    const w = root.clientWidth, h = root.clientHeight;
    const vx = ((b.x - a.x) * w) / 2, vy = (-(b.y - a.y) * h) / 2; const len = Math.hypot(vx, vy) || 1;
    R.set(st0.g + (dx * vx + dy * vy) / len / (len / 10));
  };
  R.place = (spec) => {
    clearGroup(R.objG);
    cal.rotation.set(0, 0, 0); cal.position.set(0, 0, 0); R.mode = spec.mode; R.size = spec.size || 0;
    const og = R.objG, s = R.size, ri = spec.ri || 0;
    if (spec.obj === 'block') { const dims = { l: [s, 20.3, 40.2], b: [s, 20.3, 60.4], h: [s, 40.2, 60.4] }[spec.pose]; mesh(new RoundedBoxGeometry(...dims, 2, 0.5), m.wood, s / 2, -30, (ri - 1) * 6, og); }
    if (spec.obj === 'tubeD') { const t = mesh(lathe([[6.6, -30], [s / 2, -30], [s / 2, 30], [6.6, 30], [6.6, -30]]), m.pvc, s / 2, -30, 0, og); t.rotation.x = Math.PI / 2; t.rotation.y = (ri * Math.PI) / 2; }
    if (spec.obj === 'tubeL') { const t = mesh(lathe([[6.6, -s / 2], [10.05, -s / 2], [10.05, s / 2], [6.6, s / 2], [6.6, -s / 2]]), m.pvc, s / 2, -30, 0, og); t.rotation.z = Math.PI / 2; t.rotation.x = ri * 0.6; }
    if (spec.obj === 'tubeIn') mesh(lathe([[s / 2, 0], [s / 2 + 3.4, 0], [s / 2 + 3.4, 60], [s / 2, 60], [s / 2, 0]]), m.pvc, s / 2, 16, 0, og);
    if (spec.obj === 'sphere') { const bl = mesh(new THREE.SphereGeometry(s / 2, 64, 48), m.ball, s / 2, -30, 0, og); bl.rotation.set(ri * 1.2, ri * 0.7, 0); mesh(new THREE.TorusGeometry(s / 2 + 0.02, 0.3, 10, 96), m.red, 0, 0, 0, bl); }
    if (spec.obj === 'cylIn') { const ro = s / 2 + 1.8; mesh(lathe([[s / 2, 0], [ro, 0], [ro, 52], [0, 52], [0, 50], [s / 2, 50], [s / 2, 0]]), m.brass, s / 2, 16, 0, og).rotation.y = ri; }
    if (spec.obj === 'cylDepth') {
      const ri0 = 15.08, ro = 16.9; const m2 = m.brass.clone(); m2.transparent = true; m2.opacity = 0.5; m2.side = THREE.DoubleSide; m2.depthWrite = false;
      const cy = mesh(lathe([[0, -s - 3], [ro, -s - 3], [ro, 0], [ri0, 0], [ri0, -s], [0, -s]]), m2, 0, 0, 0, og); cy.castShadow = false; cy.rotation.y = ri * 2.1;
      cal.rotation.z = -Math.PI / 2; cal.position.set(15, R.B, 0);
    }
    if (spec.obj === 'marks') {
      const pr = [['A', 'B', 'C'], ['B', 'C', 'A'], ['C', 'A', 'B']][ri % 3], PW = 96, PH = 76, cx = s / 2, cz = -16;
      const pts = [[0, 0], [s, 0], [s / 2, -s * 0.866]];
      const tex = ctex(1152, 912, (c, W) => {
        const k = W / PW; const X = (x) => (x - (cx - PW / 2)) * k, Y = (z) => (z - (cz - PH / 2)) * k;
        c.fillStyle = '#fbfaf4'; c.fillRect(0, 0, W, 912);
        c.strokeStyle = 'rgba(120,150,190,.25)'; c.lineWidth = 2;
        for (let y = 40; y < 912; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
        c.setLineDash([26, 18]); c.strokeStyle = 'rgba(70,80,95,.7)'; c.lineWidth = 7; c.beginPath();
        pts.forEach((q, i) => (i ? c.lineTo(X(q[0]), Y(q[1])) : c.moveTo(X(q[0]), Y(q[1])))); c.closePath(); c.stroke(); c.setLineDash([]);
        c.strokeStyle = 'rgba(224,86,11,.85)'; c.lineWidth = 12; c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(s), Y(0)); c.stroke();
        pts.forEach((q, i) => {
          const x = X(q[0]), y = Y(q[1]);
          c.strokeStyle = 'rgba(30,30,30,.55)'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 30, 0, 7); c.stroke();
          const g = c.createRadialGradient(x, y, 0, x, y, 18); g.addColorStop(0, '#000'); g.addColorStop(0.6, '#1a1a1a'); g.addColorStop(1, 'rgba(30,30,30,0)');
          c.fillStyle = g; c.beginPath(); c.arc(x, y, 18, 0, 7); c.fill();
          c.fillStyle = i < 2 ? '#e0560b' : '#3a4250'; c.font = 'bold 96px Arial'; c.textAlign = 'center';
          c.fillText(pr[i], x + (i === 0 ? -70 : i === 1 ? 70 : 0), y + (i === 2 ? 110 : -44));
        });
      });
      const pp = mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 }), cx, -48.6, cz, og);
      pp.rotation.x = -Math.PI / 2; pp.castShadow = false;
    }
    const start = { outer: s + 8, inner: Math.max(8, s - 5), depth: 6, free: Math.max(5, s - 6), none: 14, show: 48 }[R.mode];
    R.g = -1; R.set(start); R.dirty = true;
  };
  R.focusObjs = () => (R.mode === 'depth' || R.mode === 'show' ? [rootG] : R.mode === 'free' ? [R.objG] : [R.objG, R.slider, R.fixed]);
  R.loupe = (c, w, h, hint) => loupeCaliper(c, w, h, R, hint);
  R.hintText = (lang) => {
    const r = R.ideal(); const mm = Math.floor(r + 1e-9), k = Math.round((r - mm) * 10);
    if (lang === 'ta') return `பிரதான அளவுகோல்: ${mm} mm · பொருந்தும் வேணியர் கோடு: ${k} → ${k} × 0.1 = ${fmt(k * 0.1, 1)} mm · வாசிப்பு = ${fmt(r, 1)} mm`;
    return lang === 'si'
      ? `ප්‍රධාන පරිමාණය: ${mm} mm · සම්පාත වන ව’නියර කොටස: ${k} → ${k} × 0.1 = ${fmt(k * 0.1, 1)} mm · පාඨාංකය = ${fmt(r, 1)} mm`
      : `Main scale: ${mm} mm · coinciding vernier line: ${k} → ${k} × 0.1 = ${fmt(k * 0.1, 1)} mm · reading = ${fmt(r, 1)} mm`;
  };
  R.setE(0); R.set(40);
  return R;
}
