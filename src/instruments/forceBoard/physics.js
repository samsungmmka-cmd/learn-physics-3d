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
