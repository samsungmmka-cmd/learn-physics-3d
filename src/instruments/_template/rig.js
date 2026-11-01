// __NAME__ (units: mm). 3D rig: builds the instrument from code and answers the rig contract
// (see src/instruments/README.md). Started from the template, a metre rule with a sliding cursor:
// replace the geometry with the real instrument and keep the members below.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { loupe } from './loupe.js';

export default function make__TYPE__(kit) {
  const { mats, mesh, anchor, engr, scaleMat, clearGroup, camera, root, fmt } = kit;
  const LEN = 300; // scale length, mm
  const R = { type: '__TYPE__', S: 0.05, g: 120, mode: 'show', size: 0, vel: 0, dirty: true };
  const m = mats(), rootG = new THREE.Group(); R.root = rootG;

  // Fixed part: a wooden rule with an engraved mm scale along its top face (0 mm at x = 0).
  const rule = new THREE.Group(); rootG.add(rule);
  mesh(new RoundedBoxGeometry(LEN + 20, 4, 30, 2, 0.8), m.wood, LEN / 2, 2, 0, rule);
  const tex = engr(4096, 256, '#efe6cf', (c, w, h) => {
    const ppm = w / (LEN + 20); c.textAlign = 'center'; c.font = 'bold 70px Arial';
    for (let mm = 0; mm <= LEN; mm++) {
      const X = (mm + 10) * ppm, Lh = mm % 10 === 0 ? h * 0.55 : mm % 5 === 0 ? h * 0.4 : h * 0.25;
      c.fillRect(X - 2, 0, 4, Lh);
      if (mm % 10 === 0) c.fillText(String(mm / 10), X, h * 0.9);
    }
  });
  const face = mesh(new THREE.PlaneGeometry(LEN + 20, 14), scaleMat(tex), LEN / 2, 4.02, -6, rule);
  face.rotation.x = -Math.PI / 2; face.castShadow = false;

  // Moving part: a cursor with a red index line, slid along the rule.
  const cur = new THREE.Group(); rootG.add(cur); R.cursor = cur;
  const body = mesh(new RoundedBoxGeometry(12, 10, 34, 2, 1), m.steel, 0, 5, 0, cur);
  const index = mesh(new THREE.BoxGeometry(0.6, 0.4, 16), m.red, 0, 4.25, -6, cur); index.castShadow = false;
  R.dragTargets = [body];

  R.objG = new THREE.Group(); rootG.add(R.objG);
  // One anchor per part key used in a practical's `parts` list (labels point at these).
  R.anchors = { rule: anchor(rule, 40, 4, 12), scale: anchor(rule, LEN * 0.65, 4, -6), cursor: anchor(cur, 0, 10, 0) };

  R.set = (g) => { const ng = Math.min(LEN, Math.max(0, g)); if (ng !== R.g) { R.g = ng; R.dirty = true; } cur.position.x = R.g; };
  R.value = () => R.g;
  R.reading = () => R.g;
  R.ideal = () => Math.round(R.reading());       // read to the nearest mm
  R.tol = 0.51;
  R.contact = () => (R.mode === 'show' ? null : R.mode === 'none' ? R.g <= 0.26 : Math.abs(R.g - R.size) <= 0.26);
  R.status = () => { const c = R.contact(); if (c === null) return null; return c ? ['on', 'touching'] : ['', 'notTouching']; };
  R.step = (dt) => { if (R.vel) R.set(R.g + R.vel * dt); };
  R.nudge = (d) => R.set(R.g + d);
  // Drag: project the rule's x axis to the screen and move the cursor along it.
  R.drag = (dx, dy, st0) => {
    const a = new THREE.Vector3(st0.g, 0, 0), b = new THREE.Vector3(st0.g + 10, 0, 0);
    rootG.localToWorld(a); rootG.localToWorld(b); a.project(camera); b.project(camera);
    const w = root.clientWidth, h = root.clientHeight;
    const vx = ((b.x - a.x) * w) / 2, vy = (-(b.y - a.y) * h) / 2; const len = Math.hypot(vx, vy) || 1;
    R.set(st0.g + (dx * vx + dy * vy) / len / (len / 10));
  };
  // spec: { mode: 'show' | 'none' | 'outer', obj, size (mm), ri (reading index) }
  R.place = (spec) => {
    clearGroup(R.objG); R.mode = spec.mode; R.size = spec.size || 0;
    if (spec.obj === 'block' && R.size) mesh(new RoundedBoxGeometry(R.size, 12, 16, 2, 0.6), m.ball, R.size / 2, 6, 24, R.objG);
    R.g = -1; R.set(R.mode === 'show' ? 120 : R.mode === 'none' ? 20 : R.size + 25); R.dirty = true;
  };
  R.focusObjs = () => (R.mode === 'show' ? [rootG] : [R.objG, cur]);
  R.loupe = (c, w, h, hint) => loupe(c, w, h, R, hint);
  R.hintText = (lang) => {
    const r = R.ideal();
    if (lang === 'ta') return `சுட்டி ${r} mm கோட்டில் உள்ளது → வாசிப்பு = ${fmt(r / 10, 1)} cm`;
    return lang === 'si' ? `දර්ශකය ${r} mm රේඛාව මත ඇත → පාඨාංකය = ${fmt(r / 10, 1)} cm` : `The index line is on the ${r} mm mark → reading = ${fmt(r / 10, 1)} cm`;
  };
  R.set(120);
  return R;
}
