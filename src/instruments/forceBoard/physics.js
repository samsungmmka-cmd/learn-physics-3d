// Parallelogram of forces: equilibrium of three strings meeting at a knot O.
// Weights are in grams (the handbook works with masses on the pans); angles in degrees from the vertical.
// Shared by the 3D rig (where the knot and strings sit), the drawing card and the practical's calculations.

const DEG = Math.PI / 180;

// Angles of the two side strings from the vertical when w1 (left) and w2 (right) balance W hanging from O.
export function angles(w1, w2, W) {
  const c1 = (W * W + w1 * w1 - w2 * w2) / (2 * W * w1);
  const c2 = (W * W + w2 * w2 - w1 * w1) / (2 * W * w2);
  return [Math.acos(Math.max(-1, Math.min(1, c1))) / DEG, Math.acos(Math.max(-1, Math.min(1, c2))) / DEG];
}

// The forces for an activity, from the student's start state:
//   ls.pans  [p1, p2, p3]  pan masses (g), as measured on the balance
//   ls.slot  [s1, s2, s3]  slotted masses put on the pans (g)
//   ls.mObj  mass of the object (g), as the triple-beam balance gives it
//   ls.err   [[e1, e2], [e1, e2]]  small marking errors (deg) for each activity (friction, parallax)
// Activity 0: w3 hangs from O. Activity 1: w3's slotted masses are replaced by the object.
export function forces(ls, act = 0) {
  const pans = ls.pans || [50, 50, 50], slot = ls.slot || [200, 250, 300];
  const w1 = pans[0] + slot[0], w2 = pans[1] + slot[1];
  const W = act === 1 ? pans[2] + (ls.mObj || 300) : pans[2] + slot[2];
  const [t1, t2] = angles(w1, w2, W);
  const e = (ls.err && ls.err[act]) || [0, 0];
  return { w1, w2, W, t1, t2, m1: t1 + e[0], m2: t2 + e[1] };
}

// Unit vectors (x right, y up) along the marked strings from O, and down the middle string.
export const dir = (deg, side) => [side * Math.sin(deg * DEG), Math.cos(deg * DEG)];

// The drawing: OA along the left string, OB along the right one (lengths in cm), C = A + B.
export function diagonal(OA, OB, m1, m2) {
  const u1 = dir(m1, -1), u2 = dir(m2, 1);
  const A = [u1[0] * OA, u1[1] * OA], B = [u2[0] * OB, u2[1] * OB], C = [A[0] + B[0], A[1] + B[1]];
  return { A, B, C, OC: Math.hypot(C[0], C[1]), tilt: Math.atan2(C[0], C[1]) / DEG };
}

// Where the knot hangs on the board: the side strings run from O to pulleys at (±half, top), mm.
export function knot(t1, t2, half, top) {
  const h = (2 * half) / (Math.tan(t1 * DEG) + Math.tan(t2 * DEG));
  return [-half + h * Math.tan(t1 * DEG), top - h];
}

// Scale choices: the drawing must fit on A4 (O is 25 mm above the bottom edge) and be large enough to read.
export const OC_MIN = 8, OC_MAX = 16; // cm, for w3

// ---------- slotted masses and the student's own marks ----------
// The box of slotted masses on the table (g) and their sizes (mm).
export const DENOMS = [100, 50, 20, 10];
export const DISC = { 100: { r: 20, h: 9.6 }, 50: { r: 17, h: 6.4 }, 20: { r: 13, h: 4.2 }, 10: { r: 10.5, h: 3.2 } };
// A load given as slotted masses, largest first (e.g. 250 → [100, 100, 50]).
export function decompose(g) { const out = []; let r = g; for (const d of DENOMS) while (r >= d - 1e-9) { out.push(d); r -= d; } return out; }
// What a pan holds: an array of masses (g) and/or 'stone'.
export const loadMass = (load, mObj) => (load || []).reduce((s, x) => s + (x === 'stone' ? mObj || 0 : x), 0);
export const sameLoad = (a, b) => JSON.stringify([...(a || [])].map(String).sort()) === JSON.stringify([...(b || [])].map(String).sort());

// Equilibrium angles for any loads (deg from vertical). When no balance is possible the knot is dragged
// towards the heavier side; the angles are clamped so the 3D still has somewhere to put it.
export function balance(w1, w2, W) {
  const ok = W > 1 && w1 > 1 && w2 > 1 && W < w1 + w2 && w1 < W + w2 && w2 < W + w1;
  if (ok) { const [t1, t2] = angles(w1, w2, W); return { ok, t1: Math.min(80, Math.max(8, t1)), t2: Math.min(80, Math.max(8, t2)) }; }
  if (W >= w1 + w2) return { ok, t1: 8, t2: 8 };            // the middle weight wins: the knot drops
  return w1 > w2 ? { ok, t1: 80, t2: 30 } : { ok, t1: 30, t2: 80 }; // one side wins: the knot runs to it
}

// The drawn lines from the student's dots (mm, relative to the knot; side 0 = left, 1 = right, 2 = middle).
// Each side string's line goes through its two dots; O is where the two side lines cross.
// Returns the angles of those lines from the vertical (deg) and O, or null until both side strings have two dots.
export function fromDots(dots) {
  const side = (s) => (dots || []).filter((d) => d[2] === s);
  const L = side(0), Rr = side(1); if (L.length < 2 || Rr.length < 2) return null;
  const line = (a, b) => { const v = [b[0] - a[0], b[1] - a[1]]; if (v[1] < 0) { v[0] = -v[0]; v[1] = -v[1]; } const n = Math.hypot(v[0], v[1]) || 1; return { p: a, u: [v[0] / n, v[1] / n] }; };
  const l1 = line(L[0], L[1]), l2 = line(Rr[0], Rr[1]);
  const det = l1.u[0] * -l2.u[1] - l1.u[1] * -l2.u[0];
  const dx = l2.p[0] - l1.p[0], dy = l2.p[1] - l1.p[1];
  const t = Math.abs(det) < 1e-9 ? 0 : (dx * -l2.u[1] - dy * -l2.u[0]) / det;
  const O = [l1.p[0] + l1.u[0] * t, l1.p[1] + l1.u[1] * t];
  return { O, m1: Math.atan2(-l1.u[0], l1.u[1]) / DEG, m2: Math.atan2(l2.u[0], l2.u[1]) / DEG };
}
// Distance (mm) from point p (relative to the knot) to a string at angle deg on side (-1 left, 1 right, 0 middle).
export function offString(p, deg, s) {
  const u = s === 0 ? [0, -1] : dir(deg, s); const along = p[0] * u[0] + p[1] * u[1];
  if (along < 0) return { d: Math.hypot(p[0], p[1]), along };
  return { d: Math.abs(p[0] * u[1] - p[1] * u[0]), along };
}
// Perfect dots for an activity (for "mark for me" and tests): on the strings at 30 and 150 mm (middle: 8 and 18).
export const perfectDots = (f) => [[30, 0], [150, 0], [30, 1], [150, 1], [8, 2], [18, 2]].map(([d, s]) => { const u = s === 2 ? [0, -1] : dir(s ? f.m2 : f.m1, s ? 1 : -1); return [+(u[0] * d).toFixed(2), +(u[1] * d).toFixed(2), s]; });
