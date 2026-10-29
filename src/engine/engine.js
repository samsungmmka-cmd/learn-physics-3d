// Learn Physics 3D engine: one WebGL scene (wooden diorama, studio lighting) shared by every view.
// React mounts it into a container and drives it through a small API; the engine never touches React state.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { loupeCaliper, loupeMicro, loupeSphero } from './loupes.js';

const DEG = Math.PI / 180;
const rand = (a, b) => a + Math.random() * (b - a);
const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '—');

export function createEngine() {
  const root = document.createElement('div');
  root.className = 'stage-gl';
  const coLayer = document.createElement('div');
  coLayer.className = 'co-layer';
  root.appendChild(coLayer);

  const E = { ok: true, mode: 'hero', rig: null, loupeCanvas: null, loupeHint: false, onStatus: null, lastStatus: '' };
  let renderer, scene, camera, controls, base;
  const VIEW = { az: 45 * DEG, el: 33 * DEG, H: 9 };
  const labels = [];
  const pins = new Map(); let zTop = 4; // tags the user dragged: stage fractions, kept until reset

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.prepend(renderer.domElement);
    scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    controls = new OrbitControls(camera, renderer.domElement);
    Object.assign(controls, { enableDamping: true, dampingFactor: 0.1, maxPolarAngle: Math.PI * 0.47, minZoom: 0.3, maxZoom: 14, enablePan: true, screenSpacePanning: true });
    scene.add(new THREE.HemisphereLight(0xfff3e2, 0x7a6650, 0.35));
    const key = new THREE.DirectionalLight(0xfff6ea, 1.25);
    key.position.set(9, 16, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.35);
    fill.position.set(-10, 6, -4);
    scene.add(fill);
  } catch (e) {
    E.ok = false;
    const d = document.createElement('div');
    d.className = 'nogl';
    d.textContent = '3D needs WebGL, which is not available in this browser.';
    root.appendChild(d);
  }

  /* ---------- textures & materials ---------- */
  function ctex(w, h, draw, srgb = true) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.encoding = THREE.sRGBEncoding;
    if (E.ok) t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  function engr(w, h, bg, draw) {
    return ctex(w, h, (c, W, H) => {
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      const n = c.createLinearGradient(0, 0, 0, H);
      n.addColorStop(0, 'rgba(255,255,255,.12)'); n.addColorStop(1, 'rgba(0,0,0,.08)');
      c.fillStyle = n; c.fillRect(0, 0, W, H);
      c.fillStyle = '#14171c';
      draw(c, W, H);
    });
  }
  let MT = null;
  function mats() {
    if (MT) return MT;
    const brushed = ctex(512, 512, (c, w, h) => {
      c.fillStyle = '#8c8c8c'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 3200; i++) {
        c.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${Math.random() * 0.14})` : `rgba(0,0,0,${Math.random() * 0.14})`;
        c.fillRect(Math.random() * w, Math.random() * h, Math.random() * w * 0.6, 1);
      }
    }, false);
    brushed.wrapS = brushed.wrapT = THREE.RepeatWrapping; brushed.repeat.set(2, 2);
    const knurl = ctex(256, 256, (c, w, h) => {
      c.fillStyle = '#808080'; c.fillRect(0, 0, w, h); c.lineWidth = 5; c.strokeStyle = '#2a2a2a';
      for (let i = -w; i < w * 2; i += 16) {
        c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.stroke();
        c.beginPath(); c.moveTo(i, h); c.lineTo(i + h, 0); c.stroke();
      }
    }, false);
    knurl.wrapS = knurl.wrapT = THREE.RepeatWrapping; knurl.repeat.set(6, 2);
    const P = (o) => new THREE.MeshPhysicalMaterial(o);
    MT = {
      steel: P({ color: 0xb4bbc4, metalness: 1, roughness: 0.3, roughnessMap: brushed }),
      steelD: P({ color: 0x858c96, metalness: 1, roughness: 0.45, roughnessMap: brushed }),
      chrome: P({ color: 0xf1f3f6, metalness: 1, roughness: 0.07 }),
      knurl: P({ color: 0xc2c7ce, metalness: 1, roughness: 0.42, bumpMap: knurl, bumpScale: 0.8 }),
      knurlBlack: P({ color: 0x24262b, metalness: 0.35, roughness: 0.5, bumpMap: knurl, bumpScale: 0.8 }),
      enamel: P({ color: 0x2c4766, metalness: 0.15, roughness: 0.42, clearcoat: 0.85, clearcoatRoughness: 0.22 }),
      brass: P({ color: 0xd6ad55, metalness: 1, roughness: 0.3, roughnessMap: brushed }),
      copper: P({ color: 0xd98a5c, metalness: 1, roughness: 0.28 }),
      pvc: P({ color: 0xeceae3, roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
      ball: P({ color: 0xfaf6ec, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.25 }),
      red: P({ color: 0xd2452f, roughness: 0.45 }),
      paper: P({ color: 0xfbfaf4, roughness: 0.95 }),
      black: P({ color: 0x1c1d21, roughness: 0.6, metalness: 0.2 }),
      glass: P({ color: 0xf4fbff, metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.6, ior: 1.52, attenuationColor: new THREE.Color(0xc9eadc), attenuationDistance: 4, specularIntensity: 1 }),
      glassDS: P({ color: 0xeef8ff, metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.12, ior: 1.52, side: THREE.DoubleSide, specularIntensity: 1 }),
    };
    MT.wood = P({ map: woodTex(), roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.6 });
    return MT;
  }
  function woodTex() {
    const t = ctex(1024, 1024, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#c89462'); g.addColorStop(0.5, '#b98452'); g.addColorStop(1, '#c99a69');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 180; i++) {
        const y0 = Math.random() * h, amp = rand(4, 22), f = rand(0.002, 0.01), ph = rand(0, 6);
        c.strokeStyle = `rgba(${rand(80, 120) | 0},${rand(45, 70) | 0},${rand(20, 40) | 0},${rand(0.08, 0.28)})`;
        c.lineWidth = rand(0.8, 3); c.beginPath();
        for (let x = 0; x <= w; x += 8) { const y = y0 + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.7) * amp * 0.25; x ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.stroke();
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  const scaleMat = (tex) => new THREE.MeshStandardMaterial({ map: tex, metalness: 0.65, roughness: 0.33 });
  function mesh(g, m, x = 0, y = 0, z = 0, p) {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true;
    if (p) p.add(o);
    return o;
  }
  function extr(pts, depth, bev = 0.35) {
    const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach((p) => s.lineTo(p[0], p[1]));
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 2 });
    g.translate(0, 0, -depth / 2);
    return g;
  }
  const lathe = (pts, seg = 64) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
  function anchor(parent, x, y, z) { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; }
  // A label point on a part that spins (thimble, screw head): it follows the part when it moves,
  // but ignores the spin, so the arrow stays steady on the same spot instead of circling round.
  const followers = [];
  function steadyAnchor(spinner, x, y, z) {
    const o = new THREE.Object3D(); o.userData.follow = { spinner, off: new THREE.Vector3(x, y, z) };
    const attach = () => { if (!o.parent && spinner.parent) spinner.parent.add(o); };
    attach(); followers.push(o); o.userData.attach = attach; return o;
  }
  function updFollowers() {
    for (const o of followers) { const { spinner, off } = o.userData.follow; o.userData.attach(); o.position.copy(spinner.position).add(off); }
  }
  const clearGroup = (g) => { while (g.children.length) { const o = g.children.pop(); o.traverse((c) => { if (c.geometry) c.geometry.dispose(); }); } };

  function buildBase() {
    const g = new THREE.Group(), m = mats();
    const slab = new THREE.Mesh(new RoundedBoxGeometry(17, 1.3, 11.5, 5, 0.38), m.wood);
    slab.position.y = -0.65; slab.receiveShadow = true; slab.castShadow = true; g.add(slab);
    const mt = ctex(1500, 1000, (c, w, h) => {
      c.fillStyle = '#1f4235'; c.fillRect(0, 0, w, h);
      for (let i = 0; i <= 60; i++) { const x = (i * w) / 60; c.fillStyle = i % 5 === 0 ? 'rgba(220,240,225,.45)' : 'rgba(220,240,225,.16)'; c.fillRect(x - (i % 5 ? 0.6 : 1.2), 0, i % 5 ? 1.2 : 2.4, h); }
      for (let j = 0; j <= 40; j++) { const y = (j * h) / 40; c.fillStyle = j % 5 === 0 ? 'rgba(220,240,225,.45)' : 'rgba(220,240,225,.16)'; c.fillRect(0, y - (j % 5 ? 0.6 : 1.2), w, j % 5 ? 1.2 : 2.4); }
      c.fillStyle = 'rgba(235,245,238,.7)'; c.font = 'bold 22px Arial';
      for (let i = 0; i <= 12; i++) c.fillText(String(i * 5), (i * w) / 12 + 6, 26);
    });
    const mat = new THREE.Mesh(new RoundedBoxGeometry(15.4, 0.06, 10, 2, 0.03), new THREE.MeshStandardMaterial({ map: mt, roughness: 0.88 }));
    mat.position.y = 0.03; mat.receiveShadow = true; g.add(mat);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.16 }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = -1.32; sh.receiveShadow = true; g.add(sh);
    return g;
  }

  /* ---------- CALIPER (units: mm) ---------- */
  function makeCaliper() {
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
    R.controls = [{ t: '⏪', v: -25, s: -5 }, { t: '◀', v: -1.5, s: -0.05 }, { t: '▶', v: 1.5, s: 0.05 }, { t: '⏩', v: 25, s: 5 }];
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

  /* ---------- MICROMETER (mm) ---------- */
  function makeMicro() {
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
    R.controls = [{ t: '⏪', v: -2, s: -0.5 }, { t: '◀', v: -0.1, s: -0.01 }, { t: '▶', v: 0.1, s: 0.01 }, { t: '⏩', v: 2, s: 0.5 }, { t: 'ratchet', v: -1.2, s: -0.01, ratchet: true }];
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

  /* ---------- SPHEROMETER (mm) ---------- */
  function makeSphero() {
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
    R.controls = [{ t: '▼▼', v: -1.2, s: -0.5 }, { t: '▼', v: -0.06, s: -0.01 }, { t: '▲', v: 0.06, s: 0.01 }, { t: '▲▲', v: 1.2, s: 0.5 }];
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

  /* ---------- rigs, camera, labels ---------- */
  const RIGS = {};
  let thumbAspect = 0;
  let labG = null, camHome = null, camAnim = null, anim = null, lastTouch = 0, lastSpec = null;
  if (E.ok) { base = buildBase(); scene.add(base); labG = new THREE.Group(); scene.add(labG); }
  const getRig = (t) => RIGS[t] || (RIGS[t] = t === 'caliper' ? makeCaliper() : t === 'micro' ? makeMicro() : makeSphero());
  function useRig(t) {
    const R = getRig(t);
    if (E.rig !== R) { if (E.rig && E.ok) labG.remove(E.rig.root); E.rig = R; if (E.ok) { labG.add(R.root); labG.scale.setScalar(R.S); } }
    return R;
  }
  const camDir = (az) => new THREE.Vector3(Math.sin(az) * Math.cos(VIEW.el), Math.sin(VIEW.el), Math.cos(az) * Math.cos(VIEW.el));
  function fitZoom(box, target, az) {
    camera.position.copy(target).addScaledVector(camDir(az), 80); camera.lookAt(target); camera.updateMatrixWorld(true);
    const inv = camera.matrixWorldInverse; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const p = new THREE.Vector3();
    for (let i = 0; i < 8; i++) { p.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(inv); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const a = thumbAspect || root.clientWidth / Math.max(1, root.clientHeight); const hero = E.mode === 'hero';
    const padY = thumbAspect ? 0.82 : hero ? 0.7 : 0.62, padX = thumbAspect ? 0.88 : hero ? 0.86 : 0.86;
    return Math.min(((2 * VIEW.H * a) / (x1 - x0)) * padX, ((2 * VIEW.H) / (y1 - y0)) * padY);
  }
  function settle() {
    if (!E.ok) return; const rig = E.rig;
    labG.position.set(0, 0, 0); labG.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(rig.root);
    labG.position.set(-(b.min.x + b.max.x) / 2, -b.min.y + 0.065, -(b.min.z + b.max.z) / 2); labG.updateMatrixWorld(true);
    const bs = b.getSize(new THREE.Vector3());
    base.scale.set(Math.min(1.5, Math.max(0.7, (bs.x + 3.2) / 17)), 1, Math.min(1.5, Math.max(0.7, (bs.z + 3.6) / 11.5)));
    VIEW.el = (rig.mode === 'free' ? 60 : 33) * DEG;
    const fb = new THREE.Box3(); rig.focusObjs().forEach((o) => fb.expandByObject(o)); const c = fb.getCenter(new THREE.Vector3());
    if (E.mode === 'lab') c.y -= (fb.max.y - fb.min.y) * 0.18;
    const room = labels.length && lastSpec && lastSpec.room && !thumbAspect ? (E.mode === 'hero' ? (root.clientWidth < 560 ? 0.88 : 0.9) : (root.clientWidth < 560 ? 0.8 : 0.74)) : 1; // space around the instrument for part labels
    camHome = { target: c.clone(), zoom: fitZoom(fb, c, VIEW.az) * room, az: VIEW.az, fb: fb.clone(), room }; E.resetView();
  }
  // After the stage is resized (e.g. the user drags the panel divider): fit the instrument to the new
  // width, keeping the user's own zoom level and rotation relative to the fitted view.
  E.refit = () => {
    if (!E.ok || !camHome || !camHome.fb) return; resize();
    const pos = camera.position.clone(), q = camera.quaternion.clone();
    const z = fitZoom(camHome.fb, camHome.target, camHome.az) * camHome.room;
    camera.position.copy(pos); camera.quaternion.copy(q); camera.updateMatrixWorld(true);
    if (!(z > 0)) return;
    const ratio = z / camHome.zoom; camHome.zoom = z;
    camera.zoom = Math.min(controls.maxZoom, Math.max(controls.minZoom, camera.zoom * ratio)); camera.updateProjectionMatrix();
  };
  E.resetView = () => {
    if (!E.ok || !camHome) return; VIEW.az = camHome.az;
    camera.position.copy(camHome.target).addScaledVector(camDir(VIEW.az), 80); controls.target.copy(camHome.target);
    camera.zoom = camHome.zoom; camera.updateProjectionMatrix(); controls.update();
  };
  E.rotateBy = (d) => { if (!E.ok) return; const t = controls.target, off = camera.position.clone().sub(t); const a0 = Math.atan2(off.x, off.z); camAnim = { t: 0, a0, a1: a0 + d, r: Math.hypot(off.x, off.z), y: off.y }; };
  E.zoomBy = (f) => { if (!E.ok) return; camera.zoom = Math.min(controls.maxZoom, Math.max(controls.minZoom, camera.zoom * f)); camera.updateProjectionMatrix(); };

  /* ---------- part labels: name tags placed around the instrument, with arrows to each part ---------- */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const arrowSvg = document.createElementNS(SVGNS, 'svg'); arrowSvg.setAttribute('class', 'co-arrows'); coLayer.appendChild(arrowSvg);
  let coIdx = 0;
  // Tags the user has dragged keep their spot (as a fraction of the stage) until "reset view".
  function addLabel(text, target, key) {
    const n = (coIdx++ % 6) + 1;
    const el = document.createElement('div'); el.className = 'co'; el.style.setProperty('--cc', `var(--c${n})`);
    el.innerHTML = '<span class="pill"><i class="grip" aria-hidden="true"></i><span></span></span>'; el.querySelector('.pill span:last-child').textContent = text;
    el.title = text;
    coLayer.appendChild(el);
    const g = document.createElementNS(SVGNS, 'g'); g.setAttribute('class', 'arw'); g.style.setProperty('--cc', `var(--c${n})`);
    g.innerHTML = '<path class="halo"/><path class="halo-hd"/><path class="ln"/><path class="hd"/><circle class="tail" r="3.2"/>';
    arrowSvg.appendChild(g);
    el.style.setProperty('--i', labels.length); g.style.setProperty('--i', labels.length);
    g.querySelectorAll('.halo, .ln').forEach((pth) => pth.setAttribute('pathLength', '1'));
    const l = { el, g, target, key, pinKey: `${E.rig ? E.rig.type : ''}:${key}`, px: 0, py: 0 };
    labels.push(l);
    // Drag a tag to move it. Pointer events stop here, so dragging a tag never turns the 3D view.
    let drag = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return; e.preventDefault(); e.stopPropagation();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      drag = { sx: e.clientX, sy: e.clientY, x: l.px, y: l.py, moved: false };
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return; e.stopPropagation();
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      if (!drag.moved) { drag.moved = true; el.classList.add('drag'); g.classList.add('hl'); el.style.zIndex = ++zTop; }
      const w = root.clientWidth || 1, h = root.clientHeight || 1;
      pins.set(l.pinKey, { fx: (drag.x + dx) / w, fy: (drag.y + dy) / h });
      lastTouch = performance.now();
    });
    const end = (e) => { if (!drag) return; e.stopPropagation(); if (drag.moved) { el.classList.remove('drag'); g.classList.remove('hl'); } drag = null; };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('pointerenter', () => g.classList.add('hl'));
    el.addEventListener('pointerleave', () => { if (!drag) g.classList.remove('hl'); });
  }
  E.resetLabels = () => pins.clear();
  E.labelsOn = true;
  E.setLabelsVisible = (on) => { E.labelsOn = !!on; coLayer.classList.toggle('lbl-off', !on); };
  E.resetAll = () => { pins.clear(); E.resetView(); };
  function clearLabels() { labels.splice(0).forEach((l) => { l.el.remove(); l.g.remove(); }); coIdx = 0; }
  E.highlight = (key) => labels.forEach((l) => { const on = key != null && l.key === key; l.el.classList.toggle('hl', on); l.g.classList.toggle('hl', on); });
  const _v = new THREE.Vector3(); const _b = new THREE.Box3(); const _p = new THREE.Vector3();
  // Screen rectangles the labels must not cover (info card, tool buttons, loupe, call-to-action).
  function obstacles() {
    const host = root.getBoundingClientRect(); const stage = root.closest('.stage'); if (!stage) return [];
    return [...stage.querySelectorAll('.hud .chipT, .hud .status3, .tools, .hero-cta, .bottom')].map((el) => {
      const r = el.getBoundingClientRect(); return { x0: r.left - host.left - 6, y0: r.top - host.top - 6, x1: r.right - host.left + 6, y1: r.bottom - host.top + 6 };
    }).filter((r) => r.x1 > r.x0 && r.y1 > r.y0);
  }
  // On-screen box of the instrument itself (not the mat), so labels sit outside it.
  function instrumentRect(w, h) {
    _b.makeEmpty(); E.rig.focusObjs().forEach((o) => _b.expandByObject(o));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < 8; i++) {
      _p.set(i & 1 ? _b.max.x : _b.min.x, i & 2 ? _b.max.y : _b.min.y, i & 4 ? _b.max.z : _b.min.z).project(camera);
      const x = ((_p.x + 1) / 2) * w, y = ((1 - _p.y) / 2) * h; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  let obsCache = null, obsT = 0;
  function updLabels() {
    if (!labels.length || !E.rig) return;
    updFollowers();
    const w = root.clientWidth, h = root.clientHeight; if (!w || !h) return;
    const now = performance.now(); if (!obsCache || now - obsT > 500) { obsCache = obstacles(); obsT = now; }
    const box = instrumentRect(w, h); const GAP = w < 560 ? 14 : 26, PAD = 8;
    const items = [];
    for (const l of labels) {
      l.target.getWorldPosition(_v); _v.project(camera);
      const vis = _v.x > -1.05 && _v.x < 1.05 && _v.y > -1.05 && _v.y < 1.05 && _v.z < 1;
      l.el.classList.toggle('hidden', !vis); l.g.style.display = vis ? '' : 'none';
      if (!vis) continue;
      const tx = ((_v.x + 1) / 2) * w, ty = ((1 - _v.y) / 2) * h;
      const ew = l.el.offsetWidth || 110, eh = l.el.offsetHeight || 28;
      // Pick the side of the instrument facing this part, then put the tag just outside the instrument.
      const dx = (tx - box.cx) / Math.max(40, box.x1 - box.x0), dy = (ty - box.cy) / Math.max(40, box.y1 - box.y0);
      const roomL = box.x0 - GAP - PAD, roomR = w - box.x1 - GAP - PAD;
      let side = Math.abs(dx) * 1.15 > Math.abs(dy) ? (dx < 0 ? 'l' : 'r') : (dy < 0 ? 't' : 'b');
      if (side === 'l' && roomL < ew) side = roomR >= ew ? 'r' : (dy < 0 ? 't' : 'b');
      if (side === 'r' && roomR < ew) side = roomL >= ew ? 'l' : (dy < 0 ? 't' : 'b');
      let x, y;
      if (side === 'l') { x = box.x0 - GAP - ew; y = ty - eh / 2; }
      else if (side === 'r') { x = box.x1 + GAP; y = ty - eh / 2; }
      else if (side === 't') { x = tx - ew / 2; y = box.y0 - GAP - eh; }
      else { x = tx - ew / 2; y = box.y1 + GAP; }
      const pin = pins.get(l.pinKey);
      items.push({ l, tx, ty, ew, eh, side, x, y, pinned: !!pin, px: pin ? pin.fx * w : 0, py: pin ? pin.fy * h : 0 });
    }
    // Lay the tags out side by side along each edge of the instrument, in the same order as the
    // parts they point to, so arrows never cross. Tags that don't fit move one row further out,
    // then to the opposite side.
    const placed = []; const G = 6;
    for (const it of items) {
      if (!it.pinned) continue;
      it.px = Math.min(Math.max(PAD, it.px), w - PAD - it.ew); it.py = Math.min(Math.max(PAD, it.py), h - PAD - it.eh);
      placed.push({ x0: it.px - 3, y0: it.py - 3, x1: it.px + it.ew + 3, y1: it.py + it.eh + 3 });
    }
    const FLIP = { t: 'b', b: 't', l: 'r', r: 'l' };
    const blocked = (band, horiz) => [...obsCache, ...placed].filter((q) => (horiz ? q.y0 < band[1] && q.y1 > band[0] : q.x0 < band[1] && q.x1 > band[0]))
      .map((q) => (horiz ? [q.x0, q.x1] : [q.y0, q.y1])).sort((m, n) => m[0] - n[0]);
    function packSide(side, list) {
      const horiz = side === 't' || side === 'b'; let rest = list;
      const eh = Math.max(...list.map((i) => i.eh)), ew = Math.max(...list.map((i) => i.ew));
      for (let row = 0; row < 4 && rest.length; row++) {
        // cross-axis position of this row/column
        let c0;
        if (side === 't') c0 = box.y0 - GAP - eh - row * (eh + G);
        else if (side === 'b') c0 = box.y1 + GAP + row * (eh + G);
        else if (side === 'l') c0 = box.x0 - GAP - ew - row * (ew + G);
        else c0 = box.x1 + GAP + row * (ew + G);
        const cLen = horiz ? eh : ew, cMax = horiz ? h : w;
        if (c0 < PAD || c0 + cLen > cMax - PAD) break;
        const band = [c0 - 2, c0 + cLen + 2], bl = blocked(band, horiz), aMax = (horiz ? w : h) - PAD;
        let cursor = PAD; const next = [];
        for (const it of rest) {
          const len = horiz ? it.ew : it.eh; const want = (horiz ? it.tx : it.ty) - len / 2;
          let pos = Math.max(want, cursor);
          for (const [b0, b1] of bl) if (pos < b1 + G && pos + len > b0 - G) pos = Math.max(pos, b1 + G);
          if (pos + len > aMax) { next.push(it); continue; }
          it.side = side;
          if (horiz) { it.px = pos; it.py = side === 't' ? c0 + (eh - it.eh) : c0; } else { it.py = pos; it.px = side === 'l' ? c0 + (ew - it.ew) : c0; }
          cursor = pos + len + G;
          placed.push({ x0: it.px - 3, y0: it.py - 3, x1: it.px + it.ew + 3, y1: it.py + it.eh + 3 });
        }
        rest = next;
      }
      return rest;
    }
    const bySide = { t: [], b: [], l: [], r: [] }; items.forEach((it) => { if (!it.pinned) bySide[it.side].push(it); });
    const axisSort = (side) => (m, n) => (side === 't' || side === 'b' ? m.tx - n.tx : m.ty - n.ty);
    const left = [];
    for (const side of ['t', 'b', 'l', 'r']) {
      if (!bySide[side].length) continue;
      const rest = packSide(side, bySide[side].sort(axisSort(side)));
      if (rest.length) left.push(...packSide(FLIP[side], rest.sort(axisSort(FLIP[side]))));
    }
    // Tags that still don't fit (small screens): nearest free spot anywhere on the stage that
    // doesn't cover another tag, the buttons/panels, or any of the parts being pointed at.
    const dots = items.map((i) => ({ x0: i.tx - 9, y0: i.ty - 9, x1: i.tx + 9, y1: i.ty + 9 }));
    for (const it of left) {
      let best = null, bestD = 1e18;
      for (let y = PAD; y <= h - PAD - it.eh; y += 6) {
        for (let x = PAD; x <= w - PAD - it.ew; x += 6) {
          const r = { x0: x - 3, y0: y - 3, x1: x + it.ew + 3, y1: y + it.eh + 3 };
          if (placed.some((q) => overlap(r, q)) || obsCache.some((q) => overlap(r, q)) || dots.some((q) => overlap(r, q))) continue;
          const cx = x + it.ew / 2, cy = y + it.eh / 2, d = (cx - it.tx) ** 2 + (cy - it.ty) ** 2;
          if (d < bestD && d > 900) { bestD = d; best = { x, y, r }; }
        }
      }
      if (best) { it.px = best.x; it.py = best.y; placed.push(best.r); }
      else { it.px = Math.min(Math.max(PAD, it.x), w - PAD - it.ew); it.py = Math.min(Math.max(PAD, it.y), h - PAD - it.eh); }
      // arrow leaves from whichever edge faces the part
      const cx = it.px + it.ew / 2, cy = it.py + it.eh / 2, ddx = it.tx - cx, ddy = it.ty - cy;
      it.side = Math.abs(ddx) / it.ew > Math.abs(ddy) / it.eh ? (ddx > 0 ? 'l' : 'r') : (ddy > 0 ? 't' : 'b');
    }
    const LANES = [0.5, 0.3, 0.7, 0.4, 0.6, 0.2, 0.8];
    items.forEach((it, i) => { it.lane = LANES[i % LANES.length]; });
    for (const it of items) {
      it.l.px = it.px; it.l.py = it.py;
      it.l.el.style.transform = `translate(${Math.round(it.px)}px,${Math.round(it.py)}px)`;
      drawArrow(it);
    }
  }
  // Arrow from a tag to its part: square steps with rounded corners, ending in an arrowhead on the part.
  function routeArrow(it) {
    const tx = it.tx, ty = it.ty, x0 = it.px, y0 = it.py, x1 = x0 + it.ew, y1 = y0 + it.eh, cx = x0 + it.ew / 2, cy = y0 + it.eh / 2;
    const outX = tx < x0 - 14 || tx > x1 + 14, outY = ty < y0 - 14 || ty > y1 + 14;
    if (outX && (Math.abs(tx - cx) / it.ew >= Math.abs(ty - cy) / it.eh || !outY)) {
      const sx = tx < cx ? x0 : x1;
      if (Math.abs(ty - cy) < 3) return [[sx, cy], [tx, ty]];
      const mx = sx + (tx - sx) * it.lane; return [[sx, cy], [mx, cy], [mx, ty], [tx, ty]];
    }
    const sy = ty < cy ? y0 : y1, sx = Math.min(Math.max(tx, x0 + 12), x1 - 12);
    if (Math.abs(tx - sx) < 3) return [[sx, sy], [tx, ty]];
    const my = sy + (ty - sy) * it.lane; return [[sx, sy], [sx, my], [tx, my], [tx, ty]];
  }
  function roundedPath(pts, r) {
    const f = (v) => v.toFixed(1); let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], [qx, qy] = pts[i + 1];
      const l1 = Math.hypot(bx - ax, by - ay) || 1, l2 = Math.hypot(qx - bx, qy - by) || 1, rr = Math.min(r, l1 / 2, l2 / 2);
      d += ` L${f(bx - ((bx - ax) / l1) * rr)},${f(by - ((by - ay) / l1) * rr)} Q${f(bx)},${f(by)} ${f(bx + ((qx - bx) / l2) * rr)},${f(by + ((qy - by) / l2) * rr)}`;
    }
    const e = pts[pts.length - 1]; return `${d} L${f(e[0])},${f(e[1])}`;
  }
  function drawArrow(it) {
    const pts = routeArrow(it), tx = it.tx, ty = it.ty, HL = 11, HW = 6.5;
    const a = pts[pts.length - 2], len = Math.hypot(tx - a[0], ty - a[1]) || 1, ux = (tx - a[0]) / len, uy = (ty - a[1]) / len;
    const body = pts.slice(0, -1).concat([[tx - ux * (HL + 2), ty - uy * (HL + 2)]]);
    const d = roundedPath(body, 12);
    const ex = tx - ux * 2, ey = ty - uy * 2, bx = ex - ux * HL, by = ey - uy * HL, f = (v) => v.toFixed(1);
    const head = `M${f(ex)},${f(ey)} L${f(bx - uy * HW)},${f(by + ux * HW)} L${f(bx + uy * HW)},${f(by - ux * HW)} Z`;
    const [halo, haloHd, ln, hd, tail] = it.l.g.children;
    halo.setAttribute('d', d); ln.setAttribute('d', d); haloHd.setAttribute('d', head); hd.setAttribute('d', head);
    tail.setAttribute('cx', f(pts[0][0])); tail.setAttribute('cy', f(pts[0][1]));
    const total = Math.hypot(tx - pts[0][0], ty - pts[0][1]);
    it.l.g.style.display = total < 16 ? 'none' : '';
  }

  /* ---------- public scene API ---------- */
  // spec: {type, place:{...}, e, S0, labels:[[key,text]], zeroAt:bool, hint:bool}
  E.show = (spec) => {
    lastSpec = spec; clearLabels(); E.loupeHint = !!spec.hint;
    const R = useRig(spec.type);
    if (R.type === 'caliper' || R.type === 'micro') R.setE(spec.e || 0);
    if (R.type === 'sphero') R.setS0(spec.S0 ?? 5);
    R.place(spec.place);
    if (spec.zeroAt) R.set(0);
    (spec.labels || []).forEach(([k, text]) => addLabel(text, R.anchors[k], k));
    resize(); if (E.ok) settle();
    R.dirty = true; E.lastStatus = '~';
  };
  E.setMode = (m) => { E.mode = m; root.dataset.mode = m; };
  E.setLoupe = (cv) => { E.loupeCanvas = cv; if (E.rig) E.rig.dirty = true; };
  E.setHint = (b) => { E.loupeHint = b; if (E.rig) E.rig.dirty = true; };
  E.animateTo = (to, dur = 1.2) => { if (E.rig) anim = { from: E.rig.value(), to, t: 0, dur }; };
  E.hold = (c) => { const R = E.rig; if (!R) return () => {}; R.ratchet = !!c.ratchet; R.nudge(c.s, c); const tm = setTimeout(() => { R.vel = c.v; }, 320); return () => { clearTimeout(tm); R.vel = 0; R.ratchet = false; }; };
  E.press = (c) => { const R = E.rig; if (!R) return; R.ratchet = !!c.ratchet; R.nudge(c.s, c); R.ratchet = false; };
  E.attach = (el) => { if (root.parentNode !== el) el.appendChild(root); resize(); if (lastSpec && E.ok) settle(); };
  E.thumbnails = () => {
    if (!E.ok) return {}; const out = {}; const keepMode = E.mode, keep = lastSpec; E.setMode('hero');
    const TW = 520, TH = 320; thumbAspect = TW / TH;
    const pr = renderer.getPixelRatio(); renderer.setPixelRatio(1); renderer.setSize(TW, TH, false);
    camera.left = -VIEW.H * thumbAspect; camera.right = VIEW.H * thumbAspect; camera.top = VIEW.H; camera.bottom = -VIEW.H; camera.updateProjectionMatrix();
    for (const t of ['caliper', 'micro', 'sphero']) {
      const R = useRig(t); R.place(t === 'sphero' ? { surf: 'flat', mode: 'show' } : { mode: 'show' }); settle(); controls.update(); renderer.render(scene, camera);
      try { out[t] = renderer.domElement.toDataURL('image/png'); } catch (e) { /* ignore */ }
    }
    thumbAspect = 0; renderer.setPixelRatio(pr); resize();
    E.setMode(keepMode); if (keep) E.show(keep);
    return out;
  };
  function resize() {
    if (!E.ok) return; const w = root.clientWidth, h = root.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); const a = w / h;
    camera.left = -VIEW.H * a; camera.right = VIEW.H * a; camera.top = VIEW.H; camera.bottom = -VIEW.H; camera.updateProjectionMatrix();
    if (E.rig) E.rig.dirty = true;
  }
  if (E.ok) new ResizeObserver(resize).observe(root);

  /* ---------- pointer drag on the instrument ---------- */
  if (E.ok) {
    const ray = new THREE.Raycaster(), p2 = new THREE.Vector2(); let drag = null;
    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', (e) => {
      lastTouch = performance.now();
      if (!E.rig || !E.rig.dragTargets || E.mode !== 'lab') return;
      const r = cv.getBoundingClientRect(); p2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(p2, camera);
      if (ray.intersectObjects(E.rig.dragTargets, true).length) { drag = { x: e.clientX, y: e.clientY, g: E.rig.value() }; controls.enabled = false; cv.setPointerCapture(e.pointerId); }
    });
    cv.addEventListener('pointermove', (e) => { if (drag) E.rig.drag(e.clientX - drag.x, e.clientY - drag.y, drag); });
    const end = () => { if (drag) { drag = null; controls.enabled = true; } };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  }
  let actx = null;
  function tick() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain(); o.type = 'square'; o.frequency.value = 2600;
      g.gain.setValueAtTime(0.05, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.025);
      o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.03);
    } catch (e) { /* audio optional */ }
  }

  /* ---------- loop ---------- */
  function drawLoupe() {
    const cv = E.loupeCanvas; const R = E.rig; if (!cv || !R || E.mode !== 'lab') return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); R.loupe(c, w, h, E.loupeHint);
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clock = new THREE.Clock();
  let raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop); const dt = Math.min(clock.getDelta(), 0.25); const R = E.rig;
    if (R) {
      if (anim) { anim.t += dt; const k = Math.min(1, anim.t / anim.dur); const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; R.set(anim.from + (anim.to - anim.from) * e); if (k >= 1) anim = null; }
      R.step(dt); if (R.dirty) { drawLoupe(); R.dirty = false; }
      const s = E.mode === 'lab' && R.status ? R.status() : null; const k = s ? s.join('|') : '';
      if (k !== E.lastStatus) { E.lastStatus = k; if (E.onStatus) E.onStatus(s); }
    }
    if (!root.isConnected) return;
    if (camAnim) { camAnim.t = Math.min(1, camAnim.t + dt / 0.5); const k = 1 - Math.pow(1 - camAnim.t, 3); const a = camAnim.a0 + (camAnim.a1 - camAnim.a0) * k; const t = controls.target; camera.position.set(t.x + Math.sin(a) * camAnim.r, t.y + camAnim.y, t.z + Math.cos(a) * camAnim.r); if (camAnim.t >= 1) camAnim = null; }
    if (E.mode === 'hero' && !camAnim && !document.hidden && !reduce.matches && performance.now() - lastTouch > 6000) {
      const t = controls.target, off = camera.position.clone().sub(t); const a = Math.atan2(off.x, off.z) + dt * 0.08, r = Math.hypot(off.x, off.z);
      camera.position.set(t.x + Math.sin(a) * r, camera.position.y, t.z + Math.cos(a) * r);
    }
    controls.update(); updLabels(); renderer.render(scene, camera);
  }
  if (E.ok) loop();
  E.dispose = () => cancelAnimationFrame(raf);
  E.root = root;
  return E;
}

let singleton = null;
export const getEngine = () => singleton || (singleton = createEngine());
