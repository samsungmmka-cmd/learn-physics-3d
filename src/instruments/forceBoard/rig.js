// Force board for the parallelogram law (units: mm, weights in g). Two scenes in one rig:
//  · the board (mode 'show' | 'none' | 'board'): a vertical board on a stand, two pulleys at the top corners,
//    three strings knotted at O with scale pans and slotted masses (or the object) hanging from them,
//    A4 paper pinned behind the knot and a plane-mirror strip; marks appear on the paper once made;
//  · the drawing (mode 'meas'): the paper lying on the table with the student's parallelogram, and a
//    half-metre rule along OC with a sliding index the student brings to C.
// The knot's position comes from the equilibrium angles (physics.js), so the strings hang as they would.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { loupe } from './loupe.js';
import { forces, knot, dir, diagonal } from './physics.js';

const HALF = 335, TOP = 860, PR = 22;           // pulley centres at (±HALF, TOP), radius PR
const PAPER_W = 297, PAPER_H = 210, O_UP = 25;  // A4 landscape; O sits 25 mm above its bottom edge
const RULE = 500;                                // half-metre rule

export default function makeForceBoard(kit) {
  const { mats, mesh, anchor, lathe, ctex, engr, scaleMat, clearGroup, camera, root, fmt, DEG } = kit;
  const R = { type: 'forceBoard', S: 0.017, g: 60, mode: 'show', vel: 0, dirty: true, act: 0, f: forces({}, 0), marked: false, OCmm: 0, pullT: -1, label: ['A', 'B', 'C'] };
  const m = mats(), rootG = new THREE.Group(); R.root = rootG;
  const stringMat = new THREE.MeshStandardMaterial({ color: 0x2b2620, roughness: 0.8 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.92, flatShading: true });
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x15171c });

  /* ---------------- board scene ---------------- */
  // turned 45° so the board's face looks at the default camera (which sits at 45° round the table)
  const boardG = new THREE.Group(); boardG.rotation.y = Math.PI / 4; rootG.add(boardG);
  [-300, 300].forEach((x) => mesh(new RoundedBoxGeometry(70, 16, 220, 2, 3), m.steelD, x, 8, -42, boardG));
  [-300, 300].forEach((x) => { mesh(new THREE.BoxGeometry(26, 880, 26), m.steel, x, 454, -42, boardG); });
  const board = mesh(new RoundedBoxGeometry(690, 490, 18, 3, 4), m.wood, 0, 640, -20, boardG);
  // pulleys on brackets at the top corners
  const pulleys = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(s * HALF, TOP, -5); boardG.add(g);
    mesh(new THREE.BoxGeometry(40, 16, 24), m.steelD, -s * 22, 0, -8, g);
    const wheel = mesh(new THREE.CylinderGeometry(PR, PR, 8, 40), m.brass, 0, 0, 0, g); wheel.rotation.x = Math.PI / 2;
    const groove = mesh(new THREE.TorusGeometry(PR - 1, 1.6, 8, 40), m.steelD, 0, 0, 0, g); void groove;
    mesh(new THREE.CylinderGeometry(3, 3, 22, 12), m.chrome, 0, 0, -6, g).rotation.x = Math.PI / 2;
    return { g, wheel };
  });
  // A4 paper pinned on the board (its texture shows the marks), with four drawing pins
  const paperTex = { tex: null };
  const paper = mesh(new THREE.PlaneGeometry(PAPER_W, PAPER_H), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), 0, 0, -10.9, boardG); paper.castShadow = false;
  const pins = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(() => { const p = mesh(new THREE.CylinderGeometry(4.5, 4.5, 3, 18), m.brass, 0, 0, -9, boardG); p.rotation.x = Math.PI / 2; return p; });
  // plane-mirror strip, lying under the left string
  const mirror = mesh(new THREE.BoxGeometry(110, 14, 1.4), m.chrome, 0, 0, -9.8, boardG); mirror.castShadow = false;
  // marks (two per string) and the knot
  const marks = Array.from({ length: 6 }, () => { const d = mesh(new THREE.CircleGeometry(2.2, 14), dotMat, 0, 0, -10.6, boardG); d.castShadow = false; d.visible = false; return d; });
  const knotM = mesh(new THREE.SphereGeometry(6, 16, 12), stringMat, 0, 0, -6, boardG);
  // strings: unit cylinders stretched between two points
  const seg = () => mesh(new THREE.CylinderGeometry(2.2, 2.2, 1, 8), stringMat, 0, 0, 0, boardG);
  const strings = Array.from({ length: 5 }, seg);
  const setSeg = (o, a, b) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length() || 1;
    o.position.copy(A).addScaledVector(d, 0.5); o.scale.set(1, len, 1); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  };
  // scale pans: dish + three hanger threads + ring; stacks of 50 g slotted masses or the object
  const makePan = () => {
    const g = new THREE.Group(); boardG.add(g);
    mesh(lathe([[0, -76], [50, -73], [56, -62], [53, -61], [47, -70], [0, -73]]), m.brass, 0, 0, 0, g);
    for (let k = 0; k < 3; k++) { const a = (k * 2 * Math.PI) / 3; const t = mesh(new THREE.CylinderGeometry(1.4, 1.4, 1, 6), stringMat, 0, 0, 0, g); setSeg(t, [0, -2, 0], [Math.cos(a) * 52, -62, Math.sin(a) * 52]); }
    mesh(new THREE.TorusGeometry(4, 1.1, 8, 20), m.steel, 0, 0, 0, g);
    const load = new THREE.Group(); g.add(load);
    return { g, load };
  };
  const pans = [makePan(), makePan(), makePan()];
  const fillPan = (p, grams, stone) => {
    clearGroup(p.load);
    if (stone) {
      const geo = new THREE.IcosahedronGeometry(24, 1), pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) { const k = 1 + 0.16 * Math.sin(i * 12.9898) * Math.cos(i * 4.1414); pos.setXYZ(i, pos.getX(i) * k * 1.15, pos.getY(i) * k * 0.72, pos.getZ(i) * k); }
      geo.computeVertexNormals(); mesh(geo, stoneMat, 0, -54, 0, p.load);
      return;
    }
    const n = Math.max(1, Math.round(grams / 50));
    for (let i = 0; i < n; i++) mesh(new THREE.CylinderGeometry(17, 17, 6.2, 32), m.brass, 0, -67.5 + i * 6.6, 0, p.load);
    mesh(new THREE.CylinderGeometry(2.5, 2.5, n * 6.6 + 6, 10), m.brass, 0, -70 + (n * 6.6 + 6) / 2, 0, p.load);
  };

  /* ---------------- drawing scene: the paper on the table with the half-metre rule ---------------- */
  const deskG = new THREE.Group(); rootG.add(deskG); deskG.visible = false;
  const sheet = mesh(new THREE.PlaneGeometry(PAPER_W, PAPER_H), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), 0, 0.3, 0, deskG); sheet.rotation.x = -Math.PI / 2; sheet.castShadow = false;
  const ruleG = new THREE.Group(); deskG.add(ruleG);
  mesh(new RoundedBoxGeometry(RULE + 20, 3, 30, 2, 0.8), m.wood, RULE / 2, 1.8, 19, ruleG);
  const rTex = engr(4096, 240, '#efe6cf', (c, w, h) => {
    const ppm = w / (RULE + 20); c.textAlign = 'center'; c.font = 'bold 54px Arial';
    for (let mm = 0; mm <= RULE; mm++) { const X = (mm + 10) * ppm, L = mm % 10 === 0 ? 0.5 : mm % 5 === 0 ? 0.36 : 0.22; c.fillRect(X - 1.3, 0, 2.6, h * L); if (mm % 10 === 0) c.fillText(String(mm / 10), X, h * 0.86); }
  });
  const rFace = mesh(new THREE.PlaneGeometry(RULE + 20, 16), scaleMat(rTex), RULE / 2, 3.32, 12, ruleG); rFace.rotation.x = -Math.PI / 2; rFace.castShadow = false;
  const cur = new THREE.Group(); ruleG.add(cur);
  const curBody = mesh(new RoundedBoxGeometry(9, 8, 40, 2, 1), m.steel, 0, 7, 16, cur);
  mesh(new THREE.BoxGeometry(0.7, 0.5, 26), m.red, 0, 3.6, 8, cur).castShadow = false;
  R.dragTargets = [curBody];

  R.anchors = {
    board: anchor(boardG, -250, 850, -10), pulley: anchor(pulleys[0].g, 0, 0, 0), string: anchor(boardG, 0, 0, -6), pan: anchor(pans[0].g, 30, -66, 0),
    weights: anchor(pans[2].g, 0, -40, 0), knot: anchor(boardG, 0, 0, -6), paper: anchor(boardG, 0, 0, -10), mirror: anchor(boardG, 0, 0, -9),
    rule: anchor(ruleG, RULE * 0.7, 4, 22), sheet: anchor(deskG, -PAPER_W / 2 + 18, 1, -PAPER_H / 2 + 14),
  };

  // Paper texture: plain sheet with marks (board), or the finished construction (drawing).
  function drawPaper(target, spec, done) {
    const W = 1782, H = 1260, k = W / PAPER_W, X = (x) => (x + PAPER_W / 2) * k, Y = (y) => (PAPER_H - (y + O_UP)) * k; // O at (0,0)
    const tex = ctex(W, H, (c) => {
      c.fillStyle = '#fdfdfa'; c.fillRect(0, 0, W, H);
      if (!done) return;
      const { m1, m2 } = spec.f; const u1 = dir(m1, -1), u2 = dir(m2, 1);
      const far = (u) => { const t = Math.min(u[0] ? (PAPER_W / 2 - 4) / Math.abs(u[0]) : 1e9, u[1] > 0 ? (PAPER_H - O_UP - 4) / u[1] : 1e9); return [u[0] * t, u[1] * t]; };
      c.lineCap = 'round'; c.strokeStyle = 'rgba(40,44,52,.8)'; c.lineWidth = 14;
      [u1, u2].forEach((u) => { const e = far(u); c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(e[0]), Y(e[1])); c.stroke(); });
      c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(0), Y(-O_UP + 3)); c.stroke();
      c.fillStyle = '#15171c'; [[u1, 30], [u1, 150], [u2, 30], [u2, 150]].forEach(([u, d]) => { c.beginPath(); c.arc(X(u[0] * d), Y(u[1] * d), 18, 0, 7); c.fill(); });
      [8, 18].forEach((d) => { c.beginPath(); c.arc(X(0), Y(-d), 18, 0, 7); c.fill(); });
      if (spec.OA) {
        const D = diagonal(spec.OA, spec.OB, m1, m2), sc = 10, P = (p) => [X(p[0] * sc), Y(p[1] * sc)];
        c.strokeStyle = 'rgba(20,24,30,.95)'; c.lineWidth = 22; c.beginPath(); c.moveTo(...P([0, 0])); c.lineTo(...P(D.A)); c.moveTo(...P([0, 0])); c.lineTo(...P(D.B)); c.stroke();
        c.setLineDash([44, 28]); c.lineWidth = 15; c.beginPath(); c.moveTo(...P(D.A)); c.lineTo(...P(D.C)); c.moveTo(...P(D.B)); c.lineTo(...P(D.C)); c.stroke(); c.setLineDash([]);
        c.strokeStyle = 'rgba(200,70,10,.95)'; c.lineWidth = 24; c.beginPath(); c.moveTo(...P([0, 0])); c.lineTo(...P(D.C)); c.stroke();
        c.fillStyle = '#15171c'; c.font = 'italic bold 110px Georgia'; c.textAlign = 'center';
        const lab = (p, t, dx, dy) => { const q = P(p); c.fillText(t, q[0] + dx, q[1] + dy); };
        lab([0, 0], 'O', 50, 70); lab(D.A, spec.label[0], -60, 20); lab(D.B, spec.label[1], 60, 20); lab(D.C, spec.label[2], 0, -40);
        [[0, 0], D.A, D.B, D.C].forEach((p) => { const q = P(p); c.beginPath(); c.arc(q[0], q[1], 20, 0, 7); c.fill(); });
      }
    });
    if (target.material.map) target.material.map.dispose();
    target.material.map = tex; target.material.needsUpdate = true;
  }

  // Lay out the board for the current forces (and the pull-and-release offset).
  function layout(pull = 0) {
    const { f } = R; const [ox, oy0] = knot(f.t1, f.t2, HALF, TOP); const oy = oy0 - pull;
    R.O = [ox, oy];
    knotM.position.set(ox, oy, -6); R.anchors.knot.position.set(ox, oy, -6);
    // string from O to where it meets each pulley (radius ⟂ string), over the top and down the outer side to its pan
    const top1 = [-HALF + PR * Math.cos(f.t1 * DEG), TOP + PR * Math.sin(f.t1 * DEG), -6];
    const top2 = [HALF - PR * Math.cos(f.t2 * DEG), TOP + PR * Math.sin(f.t2 * DEG), -6];
    const rise = pull * 0.6;
    const ring1 = [-HALF - PR, 330 + rise, -6], ring2 = [HALF + PR, 330 + rise, -6], ring3 = [ox, 300 - pull, -6];
    setSeg(strings[0], [ox, oy, -6], top1); setSeg(strings[1], [-HALF - PR, TOP, -6], ring1);
    setSeg(strings[2], [ox, oy, -6], top2); setSeg(strings[3], [HALF + PR, TOP, -6], ring2);
    setSeg(strings[4], [ox, oy, -6], ring3);
    pans[0].g.position.set(...ring1); pans[1].g.position.set(...ring2); pans[2].g.position.set(...ring3);
    pulleys[0].wheel.rotation.y = pull * 0.05; pulleys[1].wheel.rotation.y = -pull * 0.05;
    const mid = 0.55; R.anchors.string.position.set(ox + (top1[0] - ox) * mid, oy + (top1[1] - oy) * mid, -6);
  }
  function placeBoardItems() {
    const { f } = R, [ox, oy] = R.O; const u1 = dir(f.t1, -1);
    const cx = ox, cy = oy - O_UP + PAPER_H / 2;
    paper.position.set(cx, cy, -10.9); R.anchors.paper.position.set(cx + PAPER_W / 2 - 24, cy - PAPER_H / 2 + 18, -10);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy], i) => pins[i].position.set(cx + sx * (PAPER_W / 2 - 9), cy + sy * (PAPER_H / 2 - 9), -9));
    // mirror strip under the left string, 40–150 mm from O
    const mc = [ox + u1[0] * 95, oy + u1[1] * 95]; mirror.position.set(mc[0], mc[1], -9.8); mirror.rotation.z = Math.atan2(u1[1], u1[0]);
    R.anchors.mirror.position.set(mc[0], mc[1], -9);
    // the student's marks follow the marked (not exact) directions
    const m1 = dir(f.m1, -1), m2 = dir(f.m2, 1);
    [[m1, 30], [m1, 150], [m2, 30], [m2, 150], [[0, -1], 8], [[0, -1], 18]].forEach(([u, d], i) => { marks[i].position.set(ox + u[0] * d, oy + u[1] * d, -10.6); marks[i].visible = R.marked; });
  }

  R.place = (spec) => {
    R.mode = spec.mode || 'show'; R.act = spec.act || 0; R.f = spec.f || forces({}, 0); R.marked = !!spec.marked; R.pullT = -1;
    R.label = R.act === 1 ? ['A′', 'B′', 'C′'] : ['A', 'B', 'C'];
    const meas = R.mode === 'meas';
    boardG.visible = !meas; deskG.visible = meas;
    if (!meas) {
      const slot = spec.slot || [200, 250, 300];
      fillPan(pans[0], slot[0]); fillPan(pans[1], slot[1]); fillPan(pans[2], slot[2], R.act === 1);
      layout(0); placeBoardItems(); drawPaper(paper, R, false);
    } else {
      // the drawing: paper centred on the table, O at (0, O_UP) from its bottom-left corner; rule along OC from O
      const D = diagonal(spec.OA, spec.OB, R.f.m1, R.f.m2); R.D = D; R.OCmm = D.OC * 10;
      drawPaper(sheet, { ...R, OA: spec.OA, OB: spec.OB }, true);
      const toW = (p) => [p[0] * 10, PAPER_H / 2 - O_UP - p[1] * 10]; // paper cm (y up) → desk x, z (z toward viewer)
      const o = toW([0, 0]), c = toW(D.C), a = Math.atan2(-(c[1] - o[1]), c[0] - o[0]);
      ruleG.position.set(o[0], 0.4, o[1]); ruleG.rotation.y = a;
    }
    R.g = -1; R.set(meas ? Math.max(10, R.OCmm - 34) : 60); R.dirty = true;
  };
  R.set = (g) => { const ng = Math.min(RULE, Math.max(0, g)); if (ng !== R.g) { R.g = ng; R.dirty = true; } cur.position.x = R.g; };
  R.value = () => R.g;
  R.reading = () => R.g;
  R.ideal = () => Math.round(R.g);
  R.tol = 0.51;
  R.contact = () => (R.mode === 'meas' ? Math.abs(R.g - R.OCmm) <= 0.6 : null);
  R.status = () => { const c = R.contact(); if (c === null) return null; return c ? ['on', 'onC'] : ['', 'offC']; };
  R.step = (dt) => {
    if (R.vel) R.set(R.g + R.vel * dt);
    if (R.pullT >= 0) {
      // pulled down 26 mm, then let go: a damped swing back to the same place
      R.pullT += dt; const k = R.pullT / 2.2;
      const p = k < 0.3 ? 26 * Math.sin((k / 0.3) * (Math.PI / 2)) : 26 * Math.exp(-(k - 0.3) * 6) * Math.cos((k - 0.3) * 24);
      if (k >= 1) { R.pullT = -1; layout(0); } else layout(p);
      R.dirty = true;
    }
  };
  // Pull the middle pan down a little and let go: it swings back to the same place when the pulleys run freely.
  R.pull = () => { if (R.mode !== 'meas') R.pullT = 0; };
  R.nudge = (d) => R.set(R.g + d);
  R.drag = (dx, dy, st0) => {
    const a = new THREE.Vector3(st0.g, 0, 0), b = new THREE.Vector3(st0.g + 10, 0, 0);
    ruleG.localToWorld(a); ruleG.localToWorld(b); a.project(camera); b.project(camera);
    const w = root.clientWidth, h = root.clientHeight;
    const vx = ((b.x - a.x) * w) / 2, vy = (-(b.y - a.y) * h) / 2; const len = Math.hypot(vx, vy) || 1;
    R.set(st0.g + (dx * vx + dy * vy) / len / (len / 10));
  };
  R.focusObjs = () => (R.mode === 'meas' ? [sheet, cur] : [boardG]);
  R.loupe = (c, w, h, hint) => loupe(c, w, h, R, hint);
  R.hintText = (lang) => {
    if (R.mode !== 'meas') {
      if (lang === 'ta') return 'கீழே உள்ள அட்டையில் உள்ள படிகளைப் பின்பற்றவும்.';
      return lang === 'si' ? 'පහත කාඩ්පතේ පියවර අනුගමනය කරන්න.' : 'Follow the steps in the card below.';
    }
    const r = R.ideal(), C = R.label[2];
    if (lang === 'ta') return `${C} புள்ளி அளவுகோலின் ${r} mm கோட்டில் உள்ளது (பூச்சியம் O இல்) → O${C} = ${fmt(r / 10, 1)} cm`;
    return lang === 'si' ? `${C} ලක්ෂ්‍යය කෝදුවේ ${r} mm සලකුණ මත ඇත (ශුන්‍යය O හි) → O${C} = ${fmt(r / 10, 1)} cm` : `Point ${C} is on the ${r} mm mark of the rule (its zero is at O) → O${C} = ${fmt(r / 10, 1)} cm`;
  };
  R.place({ mode: 'show' });
  return R;
}
