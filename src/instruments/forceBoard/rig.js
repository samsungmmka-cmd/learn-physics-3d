// Force board for the parallelogram law (units: mm, weights in g). Everything the student does happens here:
//  · 'load'  a box of slotted masses (100, 50, 20, 10 g) and the object on the table: click or drag a mass onto a
//            pan, click a mass on a pan to put it back. The knot moves to the new balance as the loads change.
//  · 'pull'  grab the middle pan, pull it down and let go: it swings back if the pulleys run freely.
//  · 'mark'  the camera closes in on the paper; click under each string to make a dot (two per string). The
//            magnifier shows the mirror strip: the string hides its image only when you are right above it.
//  · 'draw'  the paper on the table with lines through the dots; drag A and B along them to scale.
//  · 'meas'  the finished parallelogram with a half-metre rule along OC; slide the index to C.
//  · 'show' | 'none'  the loaded board (parts view, least count).
// What the student does goes to the page with kit.emit(); the page sends it back as spec.live (rig.live()).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { loupe } from './loupe.js';
import { forces, knot, dir, diagonal, balance, loadMass, DISC, DENOMS, fromDots, offString } from './physics.js';

const HALF = 335, TOP = 860, PR = 22;           // pulley centres at (±HALF, TOP), radius PR
const PAPER_W = 297, PAPER_H = 210, O_UP = 25;  // A4 landscape; the knot sits 25 mm above its bottom edge
const RULE = 500;                                // half-metre rule
// Marking: a click within DOT_TOL mm of a string counts; the dot settles onto the string keeping DOT_KEEP of the
// student's offset (lining up string and image in the mirror is what makes it accurate). Within DOT_GOOD the
// status shows the pointer is right under the string.
const DOT_TOL = 8, DOT_GOOD = 3, DOT_KEEP = 0.15;

export default function makeForceBoard(kit) {
  const { mats, mesh, anchor, lathe, ctex, engr, scaleMat, clearGroup, camera, root, fmt, DEG, emit } = kit;
  const R = { type: 'forceBoard', S: 0.017, g: 60, mode: 'show', vel: 0, dirty: true, act: 0, f: forces({}, 0), OCmm: 0, pullT: -1, pullFrom: 26, label: ['A', 'B', 'C'],
    loads: [[], [], []], dots: [], OA: 0, OB: 0, pans: [50, 50, 50], mObj: 300, carry: null, hover: null, pullNow: 0, lines: null, liveKey: '' };
  const m = mats(), rootG = new THREE.Group(); R.root = rootG;
  const stringMat = new THREE.MeshStandardMaterial({ color: 0x2b2620, roughness: 0.8 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.92, flatShading: true });
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x15171c });
  const glow = new THREE.MeshStandardMaterial({ color: 0xe0560b, emissive: 0xe0560b, emissiveIntensity: 0.35, roughness: 0.4 });
  const inkMat = new THREE.MeshBasicMaterial({ color: 0x15171c });
  const segUnit = (o, a, b) => { // stretch a unit cylinder (axis y) between two points
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length() || 1;
    o.position.copy(A).addScaledVector(d, 0.5); o.scale.set(1, len, 1); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  };
  const discMesh = (denom, mat = m.brass) => { const s = DISC[denom]; const o = new THREE.Mesh(new THREE.CylinderGeometry(s.r, s.r, s.h, 32), mat); o.castShadow = o.receiveShadow = true; return o; };
  const stoneGeo = (() => { const g = new THREE.IcosahedronGeometry(24, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.16 * Math.sin(i * 12.9898) * Math.cos(i * 4.1414); p.setXYZ(i, p.getX(i) * k * 1.15, p.getY(i) * k * 0.72, p.getZ(i) * k); } g.computeVertexNormals(); return g; })();

  /* ================= board scene ================= */
  // turned 45° so the board's face looks at the default camera (which sits at 45° round the table)
  const boardG = new THREE.Group(); boardG.rotation.y = Math.PI / 4; rootG.add(boardG);
  [-300, 300].forEach((x) => mesh(new RoundedBoxGeometry(70, 16, 220, 2, 3), m.steelD, x, 8, -42, boardG));
  [-300, 300].forEach((x) => mesh(new THREE.BoxGeometry(26, 880, 26), m.steel, x, 454, -42, boardG));
  mesh(new RoundedBoxGeometry(690, 490, 18, 3, 4), m.wood, 0, 640, -20, boardG);
  const pulleys = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(s * HALF, TOP, -5); boardG.add(g);
    mesh(new THREE.BoxGeometry(40, 16, 24), m.steelD, -s * 22, 0, -8, g);
    const wheel = mesh(new THREE.CylinderGeometry(PR, PR, 8, 40), m.brass, 0, 0, 0, g); wheel.rotation.x = Math.PI / 2;
    mesh(new THREE.TorusGeometry(PR - 1, 1.6, 8, 40), m.steelD, 0, 0, 0, g);
    mesh(new THREE.CylinderGeometry(3, 3, 22, 12), m.chrome, 0, 0, -6, g).rotation.x = Math.PI / 2;
    return { g, wheel };
  });
  // A4 paper pinned on the board, four drawing pins, the mirror strip, the student's dots and the knot
  const paper = mesh(new THREE.PlaneGeometry(PAPER_W, PAPER_H), new THREE.MeshStandardMaterial({ color: 0xfdfdfa, roughness: 0.95 }), 0, 0, -10.9, boardG); paper.castShadow = false;
  const pins = [0, 1, 2, 3].map(() => { const p = mesh(new THREE.CylinderGeometry(4.5, 4.5, 3, 18), m.brass, 0, 0, -9, boardG); p.rotation.x = Math.PI / 2; return p; });
  const mirror = mesh(new THREE.BoxGeometry(110, 14, 1.4), m.chrome, 0, 0, -9.8, boardG); mirror.castShadow = false;
  const dotG = new THREE.Group(); boardG.add(dotG);
  const knotM = mesh(new THREE.SphereGeometry(6, 16, 12), stringMat, 0, 0, -6, boardG);
  const strings = Array.from({ length: 5 }, () => mesh(new THREE.CylinderGeometry(2.2, 2.2, 1, 8), stringMat, 0, 0, 0, boardG));
  // scale pans: dish + three threads + ring; their masses sit on a hanger in the dish
  const pans = [0, 1, 2].map((i) => {
    const g = new THREE.Group(); boardG.add(g);
    const dish = mesh(lathe([[0, -76], [50, -73], [56, -62], [53, -61], [47, -70], [0, -73]]), m.brass, 0, 0, 0, g); dish.userData = { pan: i };
    for (let k = 0; k < 3; k++) { const a = (k * 2 * Math.PI) / 3; segUnit(mesh(new THREE.CylinderGeometry(1.4, 1.4, 1, 6), stringMat, 0, 0, 0, g), [0, -2, 0], [Math.cos(a) * 52, -62, Math.sin(a) * 52]); }
    mesh(new THREE.TorusGeometry(4, 1.1, 8, 20), m.steel, 0, 0, 0, g);
    const load = new THREE.Group(); g.add(load);
    // an invisible box around the pan makes it easy to drop onto or grab
    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(150, 200, 150), new THREE.MeshBasicMaterial({ visible: false })); hitBox.position.y = -20; hitBox.userData = { pan: i }; g.add(hitBox);
    return { g, load, dish, hitBox };
  });
  // the box of slotted masses on the table in front of the board, and the object (a stone)
  const trayG = new THREE.Group(); trayG.position.set(-40, 0, 190); boardG.add(trayG);
  mesh(new RoundedBoxGeometry(420, 14, 96, 2, 3), m.wood, 0, 7, 0, trayG);
  const trayPick = [];
  DENOMS.forEach((d, i) => {
    const x = -150 + i * 100, s = DISC[d];
    mesh(new THREE.CylinderGeometry(s.r + 6, s.r + 6, 3, 32), m.steelD, x, 15.5, 0, trayG);
    for (let k = 0; k < 3; k++) { const o = discMesh(d); o.position.set(x, 17 + s.h / 2 + k * (s.h + 0.6), 0); o.userData = { denom: d }; trayG.add(o); trayPick.push(o); }
    const tag = ctex(256, 96, (c, w, h) => { c.fillStyle = '#f6efdc'; c.fillRect(0, 0, w, h); c.fillStyle = '#1b1d22'; c.font = 'bold 60px Arial'; c.textAlign = 'center'; c.fillText(`${d} g`, w / 2, 68); });
    const t = mesh(new THREE.PlaneGeometry(54, 20), new THREE.MeshStandardMaterial({ map: tag, roughness: 0.8 }), x, 9, 48.2, trayG); t.castShadow = false;
  });
  const stone = mesh(stoneGeo, stoneMat, 260, 16, 190, boardG); stone.userData = { stone: true };
  const ghost = new THREE.Group(); boardG.add(ghost); ghost.visible = false;

  /* ================= desk scene: the paper on the table ================= */
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
  // drawing tools on the sheet: OA and OB as pencil lines, with handles at A and B
  const penA = mesh(new THREE.BoxGeometry(1, 0.6, 3.2), inkMat, 0, 0.7, 0, deskG), penB = mesh(new THREE.BoxGeometry(1, 0.6, 3.2), inkMat, 0, 0.7, 0, deskG);
  const hA = mesh(new THREE.SphereGeometry(5, 20, 14), glow, 0, 4, 0, deskG), hB = mesh(new THREE.SphereGeometry(5, 20, 14), glow, 0, 4, 0, deskG);
  hA.userData = { handle: 'A' }; hB.userData = { handle: 'B' };

  R.anchors = {
    board: anchor(boardG, -250, 850, -10), pulley: anchor(pulleys[0].g, 0, 0, 0), string: anchor(boardG, 0, 0, -6), pan: anchor(pans[0].g, 30, -66, 0),
    weights: anchor(pans[2].g, 0, -40, 0), knot: anchor(boardG, 0, 0, -6), paper: anchor(boardG, 0, 0, -10), mirror: anchor(boardG, 0, 0, -9),
    tray: anchor(trayG, -150, 30, 0), rule: anchor(ruleG, RULE * 0.7, 4, 22), sheet: anchor(deskG, -PAPER_W / 2 + 18, 1, -PAPER_H / 2 + 14),
  };

  /* ---------- board layout ---------- */
  const total = (i) => R.pans[i] + loadMass(R.loads[i], R.mObj);
  // Angles the strings hang at: the activity's own (with its small friction offsets) once the pans hold
  // the right loads; otherwise wherever the loads on them balance.
  function stringAngles() {
    const [w1, w2, W] = [0, 1, 2].map(total);
    if (Math.abs(w1 - R.f.w1) < 0.5 && Math.abs(w2 - R.f.w2) < 0.5 && Math.abs(W - R.f.W) < 0.5) return { t1: R.f.m1, t2: R.f.m2, ok: true };
    return balance(w1, w2, W);
  }
  function layout(pull = 0) {
    const a = stringAngles(); R.ang = a;
    let [ox, oy] = knot(a.t1, a.t2, HALF, TOP);
    ox = Math.max(-HALF + 40, Math.min(HALF - 40, ox)); oy = Math.max(430, Math.min(TOP - 40, oy)) - pull;
    R.O = [ox, oy];
    knotM.position.set(ox, oy, -6); R.anchors.knot.position.set(ox, oy, -6);
    const top1 = [-HALF + PR * Math.cos(a.t1 * DEG), TOP + PR * Math.sin(a.t1 * DEG), -6];
    const top2 = [HALF - PR * Math.cos(a.t2 * DEG), TOP + PR * Math.sin(a.t2 * DEG), -6];
    const rise = pull * 0.6, h1 = 330 + rise + (a.ok ? 0 : a.t1 > 60 ? -60 : 40), h2 = 330 + rise + (a.ok ? 0 : a.t2 > 60 ? -60 : 40);
    const ring1 = [-HALF - PR, h1, -6], ring2 = [HALF + PR, h2, -6], ring3 = [ox, Math.min(300, oy + pull - 140) - pull, -6];
    segUnit(strings[0], [ox, oy, -6], top1); segUnit(strings[1], [-HALF - PR, TOP, -6], ring1);
    segUnit(strings[2], [ox, oy, -6], top2); segUnit(strings[3], [HALF + PR, TOP, -6], ring2);
    segUnit(strings[4], [ox, oy, -6], ring3);
    pans[0].g.position.set(...ring1); pans[1].g.position.set(...ring2); pans[2].g.position.set(...ring3);
    pulleys[0].wheel.rotation.y = pull * 0.05; pulleys[1].wheel.rotation.y = -pull * 0.05;
    R.anchors.string.position.set(ox + (top1[0] - ox) * 0.55, oy + (top1[1] - oy) * 0.55, -6);
    // paper, pins and mirror strip stay where they were pinned (around the activity's balance point)
    if (!R.paperAt) R.paperAt = [ox, oy + pull];
    const [px, py] = R.paperAt, cy = py - O_UP + PAPER_H / 2;
    paper.position.set(px, cy, -10.9); R.anchors.paper.position.set(px + PAPER_W / 2 - 24, cy - PAPER_H / 2 + 18, -10);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy], i) => pins[i].position.set(px + sx * (PAPER_W / 2 - 9), cy + sy * (PAPER_H / 2 - 9), -9));
    const u1 = dir(a.t1, -1), mc = [ox + u1[0] * 95, oy + u1[1] * 95];
    mirror.position.set(mc[0], mc[1], -9.8); mirror.rotation.z = Math.atan2(u1[1], u1[0]); R.anchors.mirror.position.set(mc[0], mc[1], -9);
  }
  function fillPans() {
    pans.forEach((p, i) => {
      clearGroup(p.load); let y = -70.5;
      const items = R.loads[i] || [];
      const hasStone = items.includes('stone');
      if (items.some((x) => x !== 'stone')) mesh(new THREE.CylinderGeometry(2.5, 2.5, 70, 10), m.brass, 0, -70 + 35, 0, p.load);
      items.forEach((x, k) => {
        if (x === 'stone') return;
        const o = discMesh(x); const h = DISC[x].h; o.position.set(0, y + h / 2, 0); y += h + 0.4; o.userData = { pan: i, k }; p.load.add(o);
      });
      if (hasStone) { const s = new THREE.Mesh(stoneGeo, stoneMat); s.castShadow = true; s.position.set(0, y + 14, 0); s.userData = { pan: i, k: items.indexOf('stone') }; p.load.add(s); }
    });
    stone.visible = R.act === 1 && !R.loads.some((l) => (l || []).includes('stone'));
  }
  function drawDots() {
    clearGroup(dotG); const [ox, oy] = R.paperAt; // dots are on the paper, measured from where the knot rests
    for (const d of R.dots) { const o = mesh(new THREE.CircleGeometry(2.4, 14), dotMat, ox + d[0], oy + d[1], -10.6, dotG); o.castShadow = false; }
  }

  /* ---------- desk drawing ---------- */
  const toDesk = (p) => [p[0] * 10, PAPER_H / 2 - O_UP - p[1] * 10]; // drawing cm (y up, O at origin) → desk x, z
  const fromDesk = (x, z) => [x / 10, (PAPER_H / 2 - O_UP - z) / 10];
  const reach = (u) => Math.min(u[0] ? (PAPER_W / 2 - 4) / Math.abs(u[0]) : 1e9, u[1] > 0 ? (PAPER_H - O_UP - 4) / u[1] : 1e9) / 10; // cm
  function sheetTexture(done) {
    const L = R.lines; const W = 1782, H = 1260, k = W / PAPER_W, X = (x) => (x + PAPER_W / 2) * k, Y = (y) => (PAPER_H - (y + O_UP)) * k;
    const tex = ctex(W, H, (c) => {
      c.fillStyle = '#fdfdfa'; c.fillRect(0, 0, W, H); if (!L) return;
      const u1 = dir(L.m1, -1), u2 = dir(L.m2, 1);
      c.lineCap = 'round'; c.strokeStyle = 'rgba(40,44,52,.8)'; c.lineWidth = 14;
      [u1, u2].forEach((u) => { const e = reach(u) * 10; c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(u[0] * e), Y(u[1] * e)); c.stroke(); });
      c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(0), Y(-O_UP + 3)); c.stroke();
      c.fillStyle = '#15171c'; for (const d of L.dots) { c.beginPath(); c.arc(X(d[0]), Y(d[1]), 18, 0, 7); c.fill(); }
      c.font = 'italic bold 110px Georgia'; c.textAlign = 'center'; c.fillText('O', X(0) + 60, Y(0) + 80);
      if (done) {
        const D = diagonal(R.OA, R.OB, L.m1, L.m2), P = (p) => [X(p[0] * 10), Y(p[1] * 10)];
        c.strokeStyle = 'rgba(20,24,30,.95)'; c.lineWidth = 22; c.beginPath(); c.moveTo(...P([0, 0])); c.lineTo(...P(D.A)); c.moveTo(...P([0, 0])); c.lineTo(...P(D.B)); c.stroke();
        c.setLineDash([44, 28]); c.lineWidth = 15; c.beginPath(); c.moveTo(...P(D.A)); c.lineTo(...P(D.C)); c.moveTo(...P(D.B)); c.lineTo(...P(D.C)); c.stroke(); c.setLineDash([]);
        c.strokeStyle = 'rgba(200,70,10,.95)'; c.lineWidth = 24; c.beginPath(); c.moveTo(...P([0, 0])); c.lineTo(...P(D.C)); c.stroke();
        const lab = (p, t, dx, dy) => { const q = P(p); c.fillText(t, q[0] + dx, q[1] + dy); };
        lab(D.A, R.label[0], -60, 20); lab(D.B, R.label[1], 60, 20); lab(D.C, R.label[2], 0, -40);
        [D.A, D.B, D.C].forEach((p) => { const q = P(p); c.beginPath(); c.arc(q[0], q[1], 20, 0, 7); c.fill(); });
      }
    });
    if (sheet.material.map) sheet.material.map.dispose();
    sheet.material.map = tex; sheet.material.needsUpdate = true;
  }
  function placePens() {
    const L = R.lines; if (!L) return;
    const u1 = dir(L.m1, -1), u2 = dir(L.m2, 1), o = toDesk([0, 0]);
    const set = (pen, h, u, v) => {
      const t = v > 0 ? v : 3; const p = toDesk([u[0] * t, u[1] * t]);
      h.position.set(p[0], 4, p[1]);
      pen.visible = v > 0; if (v > 0) { const mx = (o[0] + p[0]) / 2, mz = (o[1] + p[1]) / 2, len = Math.hypot(p[0] - o[0], p[1] - o[1]); pen.position.set(mx, 0.7, mz); pen.scale.set(len, 1, 1); pen.rotation.y = -Math.atan2(p[1] - o[1], p[0] - o[0]); }
    };
    set(penA, hA, u1, R.OA); set(penB, hB, u2, R.OB);
  }

  /* ---------- place / live ---------- */
  R.place = (spec) => {
    R.mode = spec.mode || 'show'; R.act = spec.act || 0; R.f = spec.f || forces({}, 0); R.pullT = -1; R.carry = null; R.hover = null; ghost.visible = false; R.paperAt = null;
    R.pans = spec.pans || [50, 50, 50]; R.mObj = spec.mObj || 300; R.targets = spec.targets || null;
    R.label = R.act === 1 ? ['A′', 'B′', 'C′'] : ['A', 'B', 'C'];
    const live = spec.live || {}; R.loads = live.loads || [[], [], []]; R.dots = live.dots || []; R.OA = live.OA || 0; R.OB = live.OB || 0; R.liveKey = JSON.stringify(live); R.pending = null;
    const desk = R.mode === 'draw' || R.mode === 'meas';
    boardG.visible = !desk; deskG.visible = desk;
    R.dragTargets = R.mode === 'meas' ? [curBody] : [];
    if (!desk) {
      // the paper is pinned around the activity's balance point
      const [px, py] = knot(R.f.m1, R.f.m2, HALF, TOP); R.paperAt = [px, py];
      fillPans(); layout(0); drawDots();
    } else {
      const L = fromDots(R.dots); R.lines = L ? { m1: L.m1, m2: L.m2, dots: R.dots.map((d) => [d[0] - L.O[0], d[1] - L.O[1]]) } : { m1: R.f.m1, m2: R.f.m2, dots: [] };
      const meas = R.mode === 'meas';
      sheetTexture(meas); penA.visible = penB.visible = hA.visible = hB.visible = !meas; ruleG.visible = meas;
      if (meas) {
        const D = diagonal(R.OA, R.OB, R.lines.m1, R.lines.m2); R.D = D; R.OCmm = D.OC * 10;
        const o = toDesk([0, 0]), c = toDesk(D.C); ruleG.position.set(o[0], 0.4, o[1]); ruleG.rotation.y = Math.atan2(-(c[1] - o[1]), c[0] - o[0]);
      } else placePens();
    }
    R.g = -1; R.set(R.mode === 'meas' ? Math.max(10, R.OCmm - 34) : 60); R.dirty = true;
  };
  // New live state from the page (after the student's own action, or a button in the card).
  // The page echoes back what the rig reported; until it does, older updates still on their way are ignored.
  const mine = () => JSON.stringify({ loads: R.loads, dots: R.dots, OA: R.OA, OB: R.OB });
  const sent = () => { R.pending = mine(); R.pendingT = performance.now(); R.liveKey = R.pending; };
  R.live = (live) => {
    const key = JSON.stringify(live); if (key === R.liveKey) return;
    if (R.pending) { if (key === R.pending) { R.pending = null; R.liveKey = key; return; } if (performance.now() - R.pendingT < 1500) return; R.pending = null; }
    R.liveKey = key;
    if (live.loads) R.loads = live.loads; if (live.dots) R.dots = live.dots;
    if (live.OA !== undefined) R.OA = live.OA; if (live.OB !== undefined) R.OB = live.OB;
    if (boardG.visible) { fillPans(); layout(0); drawDots(); } else if (R.mode === 'draw') placePens();
  };

  /* ---------- pointer: loading, pulling, marking, drawing ---------- */
  R.pickTargets = () => {
    if (R.mode === 'load') return [...trayPick, stone, ...pans.map((p) => p.load), ...pans.map((p) => p.hitBox)];
    if (R.mode === 'pull') return [pans[2].hitBox];
    if (R.mode === 'mark') return [paper];
    if (R.mode === 'draw') return [hA, hB];
    return [];
  };
  const boardPlane = (z) => { const n = new THREE.Vector3(0, 0, 1).applyQuaternion(boardG.getWorldQuaternion(new THREE.Quaternion())); const p = boardG.localToWorld(new THREE.Vector3(0, 0, z)); return new THREE.Plane().setFromNormalAndCoplanarPoint(n, p); };
  const onBoard = (ray, z) => { const p = new THREE.Vector3(); return ray.intersectPlane(boardPlane(z), p) ? boardG.worldToLocal(p) : null; };
  const panOf = (hit) => { for (let o = hit && hit.object; o; o = o.parent) if (o.userData && o.userData.pan !== undefined) return o.userData; return null; };
  // what the pointer is on: a mass sitting on a pan beats the pan's own (invisible) grab box
  // When the pointer is over two pans' grab boxes, the pan whose dish is nearest the pointer's line wins.
  const panUnder = (i) => {
    const hs = (i.hits || (i.hit ? [i.hit] : [])).map(panOf).filter(Boolean);
    const disc = hs.find((x) => x.k !== undefined); if (disc) return disc;
    if (!hs.length || !i.ray) return hs[0] || null;
    let best = null, bd = 1e18; const c = new THREE.Vector3();
    for (const x of hs) { pans[x.pan].dish.getWorldPosition(c); c.y -= 70 * R.S; const d = i.ray.distanceSqToPoint(c); if (d < bd) { bd = d; best = x; } }
    return best;
  };
  const setLoads = (loads) => { R.loads = loads; fillPans(); layout(0); sent(); emit('loads', loads.map((l) => [...l])); };
  const showGhost = (item) => { clearGroup(ghost); if (!item) { ghost.visible = false; return; } const o = item === 'stone' ? new THREE.Mesh(stoneGeo, stoneMat) : discMesh(item, glow); ghost.add(o); ghost.visible = true; };
  const addTo = (pan, item) => { const n = R.loads.map((l) => [...(l || [])]); n[pan].push(item); setLoads(n); };
  const markSide = (p) => { // nearest string to a point on the paper (relative to the knot)
    const a = R.ang; const c = [offString(p, a.t1, -1), offString(p, a.t2, 1), offString(p, 0, 0)];
    let best = 0; c.forEach((x, i) => { if (x.d < c[best].d) best = i; }); return { side: best, d: c[best].d, along: c[best].along };
  };
  R.onPointer = (phase, i) => {
    if (R.mode === 'load') {
      const hitPan = panUnder(i);
      if (phase === 'down') {
        const top = (i.hits || []).find((h) => h.object.userData && (h.object.userData.denom || h.object.userData.stone)); const ud = (top || i.hit).object.userData || {};
        if (ud.denom || ud.stone) { R.carry = { item: ud.stone ? 'stone' : ud.denom, moved: false }; showGhost(R.carry.item); const p = onBoard(i.ray, -6); if (p) ghost.position.copy(p); return true; }
        if (hitPan && hitPan.k !== undefined) { const n = R.loads.map((l) => [...(l || [])]); n[hitPan.pan].splice(hitPan.k, 1); setLoads(n); emit('removed', { pan: hitPan.pan }); return true; }
        if (hitPan && R.carry) { addTo(hitPan.pan, R.carry.item); R.carry = null; showGhost(null); return true; }
        return false;
      }
      if (phase === 'move' && R.carry) { if (Math.hypot(i.dx, i.dy) > 4) R.carry.moved = true; const p = onBoard(i.ray, -6); if (p) ghost.position.copy(p); }
      if (phase === 'up' && R.carry) {
        if (!R.carry.moved) return; // a click: keep it in hand, then click a pan
        // dropped on a pan (the pointer is over it), or near enough to one in the board's plane
        const over = panUnder(i); const p = ghost.position; let best = over ? over.pan : -1, bd = over ? 0 : 1e9;
        if (!over) pans.forEach((q, k) => { const c = q.g.position; const d = Math.hypot(p.x - c.x, p.y - (c.y - 40)); if (d < bd) { bd = d; best = k; } });
        if (bd < 150) addTo(best, R.carry.item);
        R.carry = null; showGhost(null);
      }
      if (phase === 'hover' && R.carry && !R.carry.moved) { const p = onBoard(i.ray, -6); if (p) ghost.position.copy(p); }
      return;
    }
    if (R.mode === 'pull') {
      if (phase === 'down') { if (R.pullT >= 0) return false; R.pullNow = 0; return true; }
      if (phase === 'move') { R.pullNow = Math.max(0, Math.min(40, i.dy * 0.35)); layout(R.pullNow); }
      if (phase === 'up') {
        if (R.pullNow < 6) { layout(0); emit('pullSmall'); return; }
        R.pullFrom = R.pullNow; R.pullT = 0.3 * 2.2; // start at the "let go" part of the swing
      }
      return;
    }
    if (R.mode === 'mark') {
      const p3 = onBoard(i.ray, -10.9); if (!p3) { R.hover = null; return; }
      const p = [p3.x - R.paperAt[0], p3.y - R.paperAt[1]], s = markSide(p); R.hover = { p, ...s };
      if (phase === 'down') {
        if (s.d > DOT_TOL || s.along < 3) { emit('dotOff', { d: s.d }); return true; }
        if (R.dots.filter((d) => d[2] === s.side).length >= 2) { emit('dotFull', { side: s.side }); return true; }
        const near = R.dots.find((d) => d[2] === s.side && Math.hypot(d[0] - p[0], d[1] - p[1]) < (s.side === 2 ? 6 : 40));
        if (near) { emit('dotClose', { side: s.side }); return true; }
        // settle onto the string, keeping a little of the offset
        const a = R.ang, u = s.side === 2 ? [0, -1] : dir(s.side ? a.t2 : a.t1, s.side ? 1 : -1), n = [-u[1], u[0]];
        const off = p[0] * n[0] + p[1] * n[1], q = [u[0] * s.along + n[0] * off * DOT_KEEP, u[1] * s.along + n[1] * off * DOT_KEEP];
        R.dots = [...R.dots, [+q[0].toFixed(2), +q[1].toFixed(2), s.side]]; drawDots(); sent(); emit('dots', R.dots.map((d) => [...d]));
        return true;
      }
      return;
    }
    if (R.mode === 'draw') {
      if (phase === 'down') { R.carry = { handle: i.hit.object.userData.handle }; return true; }
      if (phase === 'move' && R.carry) {
        const p = new THREE.Vector3(); if (!i.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -deskG.localToWorld(new THREE.Vector3(0, 0.3, 0)).y), p)) return;
        const q = deskG.worldToLocal(p), c = fromDesk(q.x, q.z), L = R.lines, u = R.carry.handle === 'A' ? dir(L.m1, -1) : dir(L.m2, 1);
        const t = Math.max(0.5, Math.min(reach(u), c[0] * u[0] + c[1] * u[1])), v = Math.round(t * 10) / 10;
        if (R.carry.handle === 'A') R.OA = v; else R.OB = v; placePens(); emit('ab', { OA: R.OA, OB: R.OB, final: false });
      }
      if (phase === 'up' && R.carry) { R.carry = null; sent(); emit('ab', { OA: R.OA, OB: R.OB, final: true }); }
    }
  };
  // labels step aside while the student marks or draws on the paper (it fills the view)
  R.quietLabels = () => R.mode === 'mark' || R.mode === 'draw' || !!R.carry;
  R.cursor = (i) => {
    if (R.mode === 'load') { const pu = panUnder(i); return R.carry ? (pu ? 'copy' : 'grabbing') : i.hit ? (pu && pu.k === undefined ? 'default' : 'pointer') : ''; }
    if (R.mode === 'pull') return i.hit ? 'ns-resize' : '';
    if (R.mode === 'mark') return i.hit ? 'crosshair' : '';
    if (R.mode === 'draw') return i.hit || R.carry ? 'grab' : '';
    return '';
  };

  /* ---------- the rule and the rest of the contract ---------- */
  R.set = (g) => { const ng = Math.min(RULE, Math.max(0, g)); if (ng !== R.g) { R.g = ng; R.dirty = true; } cur.position.x = R.g; };
  R.value = () => R.g;
  R.reading = () => R.g;
  R.ideal = () => Math.round(R.g);
  R.tol = 0.51;
  R.contact = () => (R.mode === 'meas' ? Math.abs(R.g - R.OCmm) <= 0.6 : null);
  R.status = () => {
    if (R.mode === 'meas') return Math.abs(R.g - R.OCmm) <= 0.6 ? ['on', 'onC'] : ['', 'offC'];
    if (R.mode === 'mark' && R.hover) return R.hover.d <= DOT_GOOD && R.hover.along >= 3 ? ['on', 'onString'] : R.hover.d <= DOT_TOL ? ['warn', 'nearString'] : ['', 'offString'];
    if (R.mode === 'load' && R.targets) return [0, 1, 2].every((k) => Math.abs(loadMass(R.loads[k], R.mObj) - R.targets[k]) < 0.5) ? ['on', 'loadedOk'] : ['', 'loadPans'];
    return null;
  };
  R.step = (dt) => {
    if (R.vel) R.set(R.g + R.vel * dt);
    if (R.pullT >= 0) {
      // pulled down, then let go: a damped swing back to the same place
      R.pullT += dt; const k = R.pullT / 2.2, A = R.pullFrom;
      const p = k < 0.3 ? A * Math.sin((k / 0.3) * (Math.PI / 2)) : A * Math.exp(-(k - 0.3) * 6) * Math.cos((k - 0.3) * 24);
      if (k >= 1) { R.pullT = -1; layout(0); emit('pulled'); } else layout(p);
      R.dirty = true;
    }
  };
  // The card's button: pull the middle pan down 26 mm and let go.
  R.pull = () => { if (R.mode === 'pull' && R.pullT < 0) { R.pullFrom = 26; R.pullT = 0; } };
  R.nudge = (d) => R.set(R.g + d);
  R.drag = (dx, dy, st0) => {
    const a = new THREE.Vector3(st0.g, 0, 0), b = new THREE.Vector3(st0.g + 10, 0, 0);
    ruleG.localToWorld(a); ruleG.localToWorld(b); a.project(camera); b.project(camera);
    const w = root.clientWidth, h = root.clientHeight;
    const vx = ((b.x - a.x) * w) / 2, vy = (-(b.y - a.y) * h) / 2; const len = Math.hypot(vx, vy) || 1;
    R.set(st0.g + (dx * vx + dy * vy) / len / (len / 10));
  };
  R.focusObjs = () => (R.mode === 'meas' ? [sheet, cur] : R.mode === 'draw' ? [sheet] : R.mode === 'mark' ? [paper] : R.mode === 'load' ? [boardG] : [boardG]);
  R.loupe = (c, w, h, hint) => loupe(c, w, h, R, hint);
  R.hintText = (lang) => {
    const T = {
      load: { si: 'පෙට්ටියේ ස්කන්ධයක් ක්ලික් කර තැටියක් ක්ලික් කරන්න (නැතහොත් එය තැටියට අදින්න). තැටියේ ඇති ස්කන්ධයක් ක්ලික් කළ විට එය ආපසු පෙට්ටියට යයි.', en: 'Click a mass in the box, then click a pan (or drag it onto the pan). Click a mass on a pan to put it back.', ta: 'பெட்டியிலுள்ள ஒரு திணிவைக் கிளிக் செய்து பின் ஒரு தட்டைக் கிளிக் செய்யவும் (அல்லது அதைத் தட்டுக்கு இழுக்கவும்). தட்டிலுள்ள திணிவைக் கிளிக் செய்தால் அது பெட்டிக்குத் திரும்பும்.' },
      pull: { si: 'මැද තැටිය අල්ලා මදක් පහළට ඇද අතහරින්න.', en: 'Grab the middle pan, pull it down a little and let go.', ta: 'நடுத் தட்டைப் பிடித்துச் சிறிது கீழே இழுத்து விடவும்.' },
      mark: { si: 'විශාලනයේ තන්තුව එහි ප්‍රතිබිම්බය වසන තැන සොයා, එහි ක්ලික් කර තිතක් තබන්න.', en: 'Find the spot where the string hides its image in the magnifier, and click there to make a dot.', ta: 'உருப்பெருக்கியில் இழை தனது விம்பத்தை மறைக்கும் இடத்தைக் கண்டு, அங்கு கிளிக் செய்து புள்ளியிடவும்.' },
      draw: { si: 'A හා B රේඛා දිගේ අදින්න.', en: 'Drag A and B along the lines.', ta: 'A, B ஐக் கோடுகள் வழியே இழுக்கவும்.' },
    }[R.mode];
    if (T) return T[lang] || T.en;
    if (R.mode !== 'meas') return lang === 'ta' ? 'கீழே உள்ள அட்டையில் உள்ள படிகளைப் பின்பற்றவும்.' : lang === 'si' ? 'පහත කාඩ්පතේ පියවර අනුගමනය කරන්න.' : 'Follow the steps in the card below.';
    const r = R.ideal(), C = R.label[2];
    if (lang === 'ta') return `${C} புள்ளி அளவுகோலின் ${r} mm கோட்டில் உள்ளது (பூச்சியம் O இல்) → O${C} = ${fmt(r / 10, 1)} cm`;
    return lang === 'si' ? `${C} ලක්ෂ්‍යය කෝදුවේ ${r} mm සලකුණ මත ඇත (ශුන්‍යය O හි) → O${C} = ${fmt(r / 10, 1)} cm` : `Point ${C} is on the ${r} mm mark of the rule (its zero is at O) → O${C} = ${fmt(r / 10, 1)} cm`;
  };
  R.place({ mode: 'show', live: { loads: [[100, 100], [100, 100, 50], [100, 100, 100]] } });
  return R;
}
