// Travelling microscope (units: mm). 3D rig: builds the instrument from code and answers the rig contract
// (see src/instruments/README.md). `kit` is the shared toolkit the engine passes in.
// Layout (mm): base rail along x, the object stand in front (+z). The carriage slides along the rail
// (horizontal reading X = carriage x − 30); the slider rides up the pillar (vertical reading Y).
// The microscope axis sits at x = 75 + X, y = 70 + Y, so the tube centre (cx, cy) lines up when X = cx, Y = cy.
// three.js is imported here (not passed in the kit) so the build only bundles the parts in use.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { loupeTravel, travelCoincide } from './loupe.js';

export default function makeTravel(kit) {
  const { DEG, mats, mesh, lathe, anchor, engr, scaleMat, clearGroup, fmt } = kit;
  const R = { type: 'travel', S: 0.05, X: 60, Y: 70, tilt: 0, axis: 'x', mode: 'show', vel: 0, dirty: true, obj: 'cap', edge: 'in', cx: 60, cy: 70, din: [0.82, 0.8], dout: [6.4, 6.4], ri: 0, lensU: 0, _lay: null };
  const m = mats(), rootG = new THREE.Group(); R.root = rootG;
  const pivot = new THREE.Group(); pivot.position.set(150, 0, 0); rootG.add(pivot);
  const body = new THREE.Group(); body.position.set(-150, 0, 0); pivot.add(body);
  const rubber = new THREE.MeshPhysicalMaterial({ color: 0x232326, roughness: 0.78, metalness: 0 });
  const grey = new THREE.MeshPhysicalMaterial({ color: 0x5d6673, metalness: 0.55, roughness: 0.42, clearcoat: 0.4 });
  // base, rails, levelling screws
  mesh(new RoundedBoxGeometry(300, 22, 84, 3, 2), grey, 150, 21, 0, body);
  [-18, 18].forEach((z) => { const g = new THREE.CylinderGeometry(3, 3, 286, 24); g.rotateZ(Math.PI / 2); mesh(g, m.chrome, 150, 35, z, body); });
  R.feet = [];
  [[14, 32], [14, -32], [286, 0]].forEach(([x, z]) => {
    mesh(new THREE.CylinderGeometry(7, 9, 10, 24), m.black, x, 5, z, body);
    const kn = mesh(new THREE.CylinderGeometry(9, 9, 7, 28), m.knurlBlack, x, 36, z, body); R.feet.push(kn);
    mesh(new THREE.CylinderGeometry(2.4, 2.4, 6, 12), m.steel, x, 41, z, body);
  });
  // horizontal main scale on the front face: 0 at x = 30, 0.5 mm divisions, numbered in cm
  const hTex = engr(4096, 180, '#cdd2d8', (c, w, h) => {
    const ppm = w / 240; c.textAlign = 'center'; c.font = 'bold 54px Arial';
    for (let q = 0; q <= 480; q++) { const mm = q / 2, x = mm * ppm, L = mm % 10 === 0 ? 0.55 : mm % 5 === 0 ? 0.42 : mm % 1 === 0 ? 0.32 : 0.2; c.fillRect(x - 1.4, 0, 2.8, h * L); if (mm % 10 === 0) c.fillText(String(mm / 10), x, h * 0.92); }
  });
  mesh(new THREE.PlaneGeometry(240, 12), scaleMat(hTex), 150, 18, 42.05, body).castShadow = false;
  // spirit level on the base
  const lvl = new THREE.Group(); lvl.position.set(252, 33, -2); body.add(lvl);
  mesh(new RoundedBoxGeometry(44, 9, 14, 2, 1.5), m.brass, 0, 0, 0, lvl);
  const vg = new THREE.CylinderGeometry(3.6, 3.6, 34, 24); vg.rotateZ(Math.PI / 2);
  const vial = mesh(vg, new THREE.MeshPhysicalMaterial({ color: 0xd9f2b8, roughness: 0.1, transmission: 0.6, transparent: true, opacity: 0.85 }), 0, 4.6, 0, lvl); vial.castShadow = false;
  R.bubble = mesh(new THREE.SphereGeometry(2.9, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4ffe8, emissiveIntensity: 0.5, roughness: 0.2 }), 0, 6.2, 0, lvl);
  R.bubble.scale.set(1.9, 0.75, 0.9); R.bubble.castShadow = false;
  // horizontal fine-adjustment screw along the back of the rail
  const hs = new THREE.CylinderGeometry(2.6, 2.6, 300, 16); hs.rotateZ(Math.PI / 2); mesh(hs, m.steel, 155, 30, -36, body);
  const hkG = new THREE.CylinderGeometry(10, 10, 12, 32); hkG.rotateZ(Math.PI / 2); R.hKnob = mesh(hkG, m.knurlBlack, 310, 30, -36, body);
  // carriage
  const car = new THREE.Group(); body.add(car); R.car = car;
  const carBody = mesh(new RoundedBoxGeometry(70, 16, 88, 2, 1.5), m.steelD, 15, 40, 0, car);
  const skirt = mesh(new THREE.BoxGeometry(70, 22, 3), m.steelD, 15, 35, 45, car);
  const vTexH = engr(1024, 300, '#d7dce2', (c, w, h) => {
    const ppm = w / 28; c.textAlign = 'center'; c.font = 'bold 44px Arial';
    for (let k = 0; k <= 50; k++) { const x = (1.75 + k * 0.49) * ppm, L = k % 10 === 0 ? 0.62 : k % 5 === 0 ? 0.45 : 0.3; c.fillRect(x - 2, 0, 4, h * L); if (k % 10 === 0) c.fillText(String(k), x, h * 0.95); }
  });
  mesh(new THREE.PlaneGeometry(28, 8), scaleMat(vTexH), 12.25, 28.2, 46.6, car).castShadow = false;
  // pillar with the vertical scale (0 at y = 60)
  mesh(new THREE.BoxGeometry(24, 202, 24), grey, 15, 149, -10, car);
  const vTex = engr(180, 4096, '#cdd2d8', (c, w, h) => {
    const ppm = h / 180; c.textAlign = 'left'; c.font = 'bold 40px Arial';
    for (let q = 0; q <= 340; q++) { const mm = q / 2, y = h - (mm + 5) * ppm, L = mm % 10 === 0 ? 0.6 : mm % 5 === 0 ? 0.45 : mm % 1 === 0 ? 0.32 : 0.2; c.fillRect(w - w * L, y - 1.4, w * L, 2.8); if (mm % 10 === 0) c.fillText(String(mm / 10), 6, y + 14); }
  });
  mesh(new THREE.PlaneGeometry(10, 180), scaleMat(vTex), 8, 145, 2.05, car).castShadow = false;
  R.vKnob = mesh(new THREE.CylinderGeometry(10, 10, 10, 32), m.knurlBlack, 15, 256, -10, car);
  // slider on the pillar, carrying the microscope
  const sl = new THREE.Group(); car.add(sl); R.sl = sl;
  mesh(new THREE.BoxGeometry(14, 30, 34), m.steelD, 34, 12, -10, sl);
  mesh(new THREE.BoxGeometry(24, 30, 6), m.steelD, 15, 12, -25, sl);
  mesh(new THREE.BoxGeometry(14, 30, 4), m.steelD, 21, 12, 4, sl);
  const vTexV = engr(260, 1024, '#d7dce2', (c, w, h) => {
    const ppm = h / 28; c.textAlign = 'right'; c.font = 'bold 40px Arial';
    for (let k = 0; k <= 50; k++) { const y = h - (1.75 + k * 0.49) * ppm, L = k % 10 === 0 ? 0.6 : k % 5 === 0 ? 0.45 : 0.3; c.fillRect(0, y - 2, w * L, 4); if (k % 10 === 0) c.fillText(String(k), w - 6, y + 14); }
  });
  mesh(new THREE.PlaneGeometry(6.5, 28), scaleMat(vTexV), 17, 12.25, 6.1, sl).castShadow = false;
  mesh(new THREE.BoxGeometry(20, 10, 14), m.steelD, 38, 10, -2, sl);
  const mic = new THREE.Group(); mic.position.set(45, 10, 0); sl.add(mic); R.mic = mic;
  const zc = (r1, r2, len, z0, mat, seg = 40) => { const g = new THREE.CylinderGeometry(r1, r2, len, seg); g.rotateX(Math.PI / 2); g.translate(0, 0, z0 + len / 2); return mesh(g, mat, 0, 0, 0, mic); };
  mesh(new THREE.BoxGeometry(16, 14, 40), m.steelD, 0, -10, 10, mic);
  const tubeM = zc(11, 11, 120, -40, m.enamel);
  const eyeM = zc(8, 8, 26, -66, m.steel); zc(9.5, 9, 7, -73, m.black);
  zc(8, 8, 6, 80, m.steel); const objM = zc(6, 5, 16, 86, m.chrome);
  const fkG = new THREE.CylinderGeometry(9, 9, 7, 32); fkG.rotateZ(Math.PI / 2);
  R.fKnob = mesh(fkG, m.knurl, 15, -8, 12, mic); const fk2 = mesh(fkG, m.knurl, -15, -8, 12, mic);
  R.dragTargets = [R.hKnob, R.vKnob, carBody, skirt, tubeM, eyeM, R.feet[0], R.feet[1], R.feet[2]];
  // object stand in front of the microscope (does not tilt with the instrument)
  R.objG = new THREE.Group(); rootG.add(R.objG);
  R.anchors = {
    eyepiece: anchor(mic, 0, 9, -62), objective: anchor(mic, 0, 6, 94), focus: anchor(mic, 18, -8, 12),
    vscale: anchor(car, 8, 205, 2), hscale: anchor(body, 230, 18, 42), vscrew: anchor(car, 15, 261, -10),
    hscrew: anchor(body, 316, 30, -36), feet: anchor(body, 14, 40, 32), level: anchor(lvl, 12, 8, 0),
  };
  void fk2;
  R.target = () => {
    const d = R.edge === 'out' ? R.dout : R.din;
    if (R.axis === 'x') return R.cx + (R.ri % 2 ? 1 : -1) * (d[0] / 2);
    return R.cy + (R.ri % 2 ? 1 : -1) * (d[1] / 2);
  };
  R.apply = () => {
    car.position.x = 30 + R.X; sl.position.y = 60 + R.Y;
    R.hKnob.rotation.x = R.X * Math.PI * 2; R.vKnob.rotation.y = R.Y * Math.PI * 2;
    pivot.rotation.z = R.tilt * DEG * 1.5;
    R.feet[2].rotation.y = R.tilt * 6;
    R.bubble.position.x = Math.max(-13, Math.min(13, R.tilt * 0.6 * 13));
    R.dirty = true;
  };
  const lim = { x: [0, 200], y: [0, 160], level: [-2, 2] };
  R.value = () => (R.axis === 'x' ? R.X : R.axis === 'y' ? R.Y : R.tilt);
  R.set = (v) => {
    const [lo, hi] = lim[R.axis]; const nv = Math.min(hi, Math.max(lo, v));
    if (R.axis === 'x') R.X = nv; else if (R.axis === 'y') R.Y = nv; else R.tilt = nv;
    R.apply();
  };
  R.reading = () => (R.axis === 'y' ? R.Y : R.X);
  R.ideal = () => Math.round(R.reading() * 100) / 100;
  R.tol = 0.0101;
  R.contact = () => {
    if (R.mode === 'level') return Math.abs(R.tilt) <= 0.03;
    if (R.mode === 'meas') return Math.abs(R.reading() - R.target()) <= 0.015;
    return true; // least-count page: any position can be read
  };
  R.status = () => {
    if (R.mode === 'level') return R.contact() ? ['on', 'isLevel'] : ['', 'notLevel'];
    if (R.mode === 'meas') return R.contact() ? ['on', 'onEdge'] : ['', 'offEdge'];
    return null;
  };
  R.step = (dt) => { if (R.vel) R.set(R.value() + R.vel * dt); };
  R.nudge = (d) => R.set(Math.round((R.value() + d) * 1000) / 1000);
  R.drag = (dx, dy, st0) => {
    if (R.axis === 'x') R.set(st0.g + dx * 0.05); else if (R.axis === 'y') R.set(st0.g - dy * 0.05); else R.set(st0.g + dx * 0.004);
  };
  R.onHint = () => { if (R.mode !== 'level') R.lensU = travelCoincide(R.ideal()).k / 50; };
  // Slide the lens along the vernier: click/drag on the overview strip, or drag the magnified view.
  R.lensAt = (x, y, phase, dx = 0) => {
    const L = R._lay; if (!L) return false;
    if (phase === 'down') { if (x < L.x0) return false; R.lensMode = y <= L.oy1 + 6 ? 'o' : 'm'; }
    if (R.lensMode === 'o') R.lensU = Math.min(1, Math.max(0, (L.left + (x - L.x0) / L.ppm - L.r) / 24.5));
    else if (phase === 'move') R.lensU = Math.min(1, Math.max(0, R.lensU - dx / L.ppmM / 24.5));
    R.dirty = true; return true;
  };
  R.place = (spec) => {
    clearGroup(R.objG);
    R.mode = spec.mode || 'show'; R.ri = spec.ri || 0; R.obj = spec.obj || 'cap'; R.edge = spec.edge || 'in';
    R.din = spec.din || [0.82, 0.8]; R.dout = spec.dout || [6.4, 6.4]; R.cx = spec.cx ?? 60; R.cy = spec.cy ?? 70;
    R.axis = R.mode === 'level' ? 'level' : R.mode === 'meas' && R.ri >= 2 ? 'y' : 'x';
    R.tilt = R.mode === 'level' ? spec.tilt || 0 : 0; R.lensU = 0;
    // stand: heavy foot, rod, boss and clamp, holding the tube on the microscope axis
    const og = R.objG, xT = 75 + R.cx, yT = 70 + R.cy, z0 = 128, len = 50;
    mesh(new RoundedBoxGeometry(56, 9, 50, 2, 2), m.black, xT, 4.5, z0 + 46, og);
    mesh(new THREE.CylinderGeometry(3.2, 3.2, yT + 26, 20), m.chrome, xT + 18, (yT + 26) / 2 + 9, z0 + 46, og);
    mesh(new RoundedBoxGeometry(14, 14, 14, 2, 1.5), m.steelD, xT + 18, yT, z0 + 46, og);
    const armG = new THREE.CylinderGeometry(2.2, 2.2, 18, 12); armG.rotateZ(Math.PI / 2); mesh(armG, m.chrome, xT + 9, yT, z0 + 46, og);
    mesh(new RoundedBoxGeometry(12, 16, 16, 2, 2), m.steelD, xT, yT, z0 + 40, og);
    const zt = (pts, mat, z) => { const g = lathe(pts, 64); g.rotateX(Math.PI / 2); g.translate(xT, yT, z); return mesh(g, mat, 0, 0, 0, og); };
    const ri = (R.din[0] + R.din[1]) / 4, ro = (R.dout[0] + R.dout[1]) / 4;
    if (R.obj === 'cap') {
      zt([[ri, 0], [ro, 0], [ro, len], [ri, len], [ri, 0]], m.glass, z0).castShadow = false;
    } else {
      zt([[ri, 0], [ro, 0], [ro, len], [ri, len], [ri, 0]], rubber, z0);
      zt([[0, 6], [ri - 0.05, 6], [ri - 0.05, len + 14], [0, len + 14]], m.wood, z0); // rod pushed into the bore
    }
    R.X = R.cx; R.Y = R.cy;
    if (R.mode === 'none') { R.X = R.cx + 0.37; }
    R.apply();
  };
  R.focusObjs = () => [rootG];
  R.loupe = (c, w, h, hint) => loupeTravel(c, w, h, R, hint);
  R.hintText = (lang) => {
    if (R.mode === 'level') {
      const dir = R.tilt > 0 ? '⟲' : '⟳';
      if (lang === 'ta') return `குமிழி ${R.tilt > 0 ? 'வலப்பக்கம்' : 'இடப்பக்கம்'} உள்ளது. அது நடுவுக்கு வரும் வரை ${dir} பொத்தானால் மட்டமாக்கும் திருகாணியைச் சுழற்றவும்.`;
      return lang === 'si'
        ? `බුබුල ${R.tilt > 0 ? 'දකුණු' : 'වම්'} පැත්තේ ඇත. එය මැදට එන තුරු ${dir} බොත්තමෙන් සංතලන ඉස්කුරුප්පුව කරකවන්න.`
        : `The bubble is on the ${R.tilt > 0 ? 'right' : 'left'}. Turn the levelling screw with ${dir} until it comes to the middle.`;
    }
    const r = R.ideal(); const { M, k } = travelCoincide(r); const ax = R.axis === 'y';
    if (lang === 'ta') return `${ax ? 'நிலைக்குத்து' : 'கிடை'} அளவுகோல்: ${fmt(M, 1)} mm · பொருந்தும் வேணியர் கோடு: ${k} → ${k} × 0.01 = ${fmt(k * 0.01, 2)} mm · வாசிப்பு = ${fmt(r, 2)} mm = ${fmt(r / 10, 3)} cm`;
    return lang === 'si'
      ? `${ax ? 'සිරස්' : 'තිරස්'} පරිමාණය: ${fmt(M, 1)} mm · සම්පාත වන ව’නියර කොටස: ${k} → ${k} × 0.01 = ${fmt(k * 0.01, 2)} mm · පාඨාංකය = ${fmt(r, 2)} mm = ${fmt(r / 10, 3)} cm`
      : `${ax ? 'Vertical' : 'Horizontal'} scale: ${fmt(M, 1)} mm · coinciding vernier line: ${k} → ${k} × 0.01 = ${fmt(k * 0.01, 2)} mm · reading = ${fmt(r, 2)} mm = ${fmt(r / 10, 3)} cm`;
  };
  R.place({ mode: 'show' });
  return R;
}
