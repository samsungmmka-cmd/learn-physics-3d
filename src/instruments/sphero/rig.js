// Spherometer (units: mm). 3D rig: builds the instrument from code and answers the rig contract
// (see src/instruments/README.md). `kit` is the shared toolkit the engine passes in.
// three.js is imported here (not passed in the kit) so the build only bundles the parts in use.
import * as THREE from 'three';
import { loupeSphero } from './loupe.js';

export default function makeSphero(kit) {
  const { DEG, mats, mesh, anchor, steadyAnchor, engr, scaleMat, clearGroup, fmt } = kit;
  const R = { type: 'sphero', S: 0.095, z: 3, S0: null, surf: 'flat', lo: 0, vel: 0, mode: 'show', dirty: true };
  const m = mats(), rootG = new THREE.Group(); R.root = rootG; const body = new THREE.Group(); rootG.add(body); R.body = body;
  R.plate = mesh(new THREE.BoxGeometry(150, 6, 130), m.glass, 0, -3, 0, rootG); R.plate.castShadow = false;
  [0, 120, 240].forEach((a) => {
    const x = Math.cos(a * DEG) * 24, z = Math.sin(a * DEG) * 24;
    mesh(new THREE.CylinderGeometry(1.3, 1.3, 31, 20), m.steel, x, 18.5, z, body);
    mesh(new THREE.ConeGeometry(1.3, 3, 20), m.chrome, x, 1.5, z, body).rotation.x = Math.PI;
  });
  const triS = new THREE.Shape();
  [0, 120, 240].forEach((a, i) => { const x = Math.cos(a * DEG) * 31, y = Math.sin(a * DEG) * 31; i ? triS.lineTo(x, y) : triS.moveTo(x, y); }); triS.closePath();
  const tg = new THREE.ExtrudeGeometry(triS, { depth: 3.4, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 1.6, bevelSegments: 4 }); tg.rotateX(-Math.PI / 2); tg.translate(0, 34.6, 0);
  mesh(tg, m.steel, 0, 0, 0, body);
  mesh(new THREE.CylinderGeometry(6, 6.5, 14, 40), m.steel, 0, 43, 0, body);
  const SC = new THREE.Group(); body.add(SC); R.SC = SC;
  mesh(new THREE.CylinderGeometry(2.4, 2.4, 77, 24), m.chrome, 0, 3 + 38.5, 0, SC);
  mesh(new THREE.ConeGeometry(2.4, 3, 24), m.chrome, 0, 1.5, 0, SC).rotation.x = Math.PI;
  const dTop = engr(1024, 1024, '#cfd4da', (c, w, h) => {
    c.globalCompositeOperation = 'destination-in'; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#14171c'; c.font = 'bold 44px Arial'; c.textAlign = 'center';
    for (let d = 0; d < 100; d++) { const a = (d / 100) * Math.PI * 2, Lh = d % 10 === 0 ? 70 : d % 5 === 0 ? 52 : 36; c.save(); c.translate(w / 2, h / 2); c.rotate(a); c.fillRect(-2, -w / 2, 4, Lh); if (d % 10 === 0) c.fillText(String(d), 0, -w / 2 + Lh + 44); c.restore(); }
  });
  const disc = new THREE.Group(); disc.position.y = 55; SC.add(disc); R.disc = disc;
  const dc = mesh(new THREE.CylinderGeometry(26, 26, 2.5, 96), m.steel, 0, 0, 0, disc);
  const dt = mesh(new THREE.CircleGeometry(25.8, 96), new THREE.MeshStandardMaterial({ map: dTop, metalness: 0.7, roughness: 0.3, transparent: true }), 0, 1.27, 0, disc); dt.rotation.x = -Math.PI / 2; dt.castShadow = false;
  const knob = mesh(new THREE.CylinderGeometry(5, 5, 9, 40), m.knurlBlack, 0, 82, 0, SC);
  mesh(new THREE.BoxGeometry(2.4, 2.4, 22), m.steel, 0, 41, 17, body);
  R.vMat = scaleMat(null); R.vPlate = new THREE.Group(); body.add(R.vPlate);
  R.vPlane = mesh(new THREE.PlaneGeometry(6, 22), R.vMat, 0, 0, 0.55, R.vPlate); R.vPlane.castShadow = false;
  mesh(new THREE.BoxGeometry(6.4, 22.4, 1), m.steelD, 0, 0, 0, R.vPlate);
  R.dragTargets = [dc, dt, knob]; R.surfG = new THREE.Group(); rootG.add(R.surfG);
  R.anchors = { vscale: anchor(R.vPlate, 3, 8, 0), cscale: steadyAnchor(SC, -20, 57, 18), screw: steadyAnchor(SC, 0, 30, 3), tip: steadyAnchor(SC, 0, 0, 3), legs: anchor(body, 24, 16, 0), knob: steadyAnchor(SC, 4, 86, 0) };
  R.setS0 = (S0) => {
    if (R.S0 === S0 && R.vMat.map) return;
    R.S0 = S0; if (R.vMat.map) R.vMat.map.dispose();
    R.vMat.map = engr(256, 940, '#cdd2d8', (c, w, h) => { const ppm = h / 22; c.font = 'bold 42px Arial'; c.textAlign = 'right'; for (let v = 0; v <= 20; v++) { const y = h - (v + 1) * ppm; c.fillRect(w - 110, y - 2, 110, 4); if (v % 2 === 0) c.fillText(String(v), w - 120, y + 15); } });
    R.vMat.needsUpdate = true; R.vPlate.position.set(0, 66.25 - S0, 28);
    if (R.post) { R.vPlate.remove(R.post); R.post.geometry.dispose(); }
    const ph = Math.max(1, 55.25 - S0 - 41); R.post = mesh(new THREE.BoxGeometry(2.4, ph, 2.4), m.steel, 0, -11 - ph / 2, -1, R.vPlate); R.dirty = true;
  };
  R.set = (z) => { const nz = Math.min(12, Math.max(R.lo, z)); if (nz !== R.z) { R.z = nz; R.dirty = true; } SC.position.y = R.z; disc.rotation.y = -(R.z / 1) * Math.PI * 2; };
  R.value = () => R.z;
  R.reading = () => R.S0 + R.z;
  R.ideal = () => Math.round(R.reading() * 100) / 100;
  R.tol = 0.0101;
  R.gap = () => R.z - R.lo;
  R.contact = () => R.gap() <= 0.004;
  R.status = () => (R.mode === 'show' ? null : R.contact() ? ['on', 'touching'] : ['', 'notTouching']);
  R.step = (dt2) => { if (R.vel) R.set(R.z + R.vel * dt2); };
  R.nudge = (d) => R.set(R.z + d);
  R.drag = (dx, dy, st0) => R.set(st0.g - dx * 0.004);
  R.place = (spec) => {
    clearGroup(R.surfG);
    R.surf = spec.surf || 'flat'; R.mode = spec.mode || 'meas'; body.position.y = 0; R.lo = 0; const ri = spec.ri || 0;
    if (R.surf === 'slide') { const t = spec.size; mesh(new THREE.BoxGeometry(25, t, 75), m.glass, 6.5, t / 2, (ri - 1) * 6, R.surfG); R.lo = t; }
    if (R.surf === 'watch') {
      const Rc = 70, capH = 7.74, th = Math.acos((Rc - capH) / Rc);
      const w = mesh(new THREE.SphereGeometry(Rc, 128, 32, 0, Math.PI * 2, 0, th), m.glassDS, 0, capH - Rc, 0, R.surfG); w.castShadow = false;
      const rim = mesh(new THREE.TorusGeometry(32, 0.45, 10, 128), m.glass, 0, 0.3, 0, R.surfG); rim.rotation.x = Math.PI / 2;
      const yLeg = Math.sqrt(Rc * Rc - 24 * 24) - (Rc - capH); body.position.y = yLeg; R.lo = capH - yLeg;
    }
    R.z = -99; R.set(R.lo + (R.mode === 'show' ? 3.5 : 1.6));
  };
  R.focusObjs = () => [body];
  R.loupe = (c, w, h, hint) => loupeSphero(c, w, h, R, hint);
  R.hintText = (lang) => {
    const r = R.ideal(); const v = Math.floor(r + 1e-9), cd = Math.round((r - v) * 100);
    if (lang === 'ta') return `நிலைக்குத்து அளவுகோல்: ${v} mm · வட்ட அளவுகோல்: ${cd} → ${cd} × 0.01 = ${fmt(cd * 0.01, 2)} mm · வாசிப்பு = ${fmt(r, 2)} mm`;
    return lang === 'si'
      ? `සිරස් පරිමාණය: ${v} mm · වෘත්තාකාර පරිමාණය: ${cd} → ${cd} × 0.01 = ${fmt(cd * 0.01, 2)} mm · පාඨාංකය = ${fmt(r, 2)} mm`
      : `Vertical scale: ${v} mm · circular scale: ${cd} → ${cd} × 0.01 = ${fmt(cd * 0.01, 2)} mm · reading = ${fmt(r, 2)} mm`;
  };
  R.setS0(5); R.place({ surf: 'flat', mode: 'show' });
  return R;
}
