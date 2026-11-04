// Force board magnifier.
//  · On the board: a close-up of the knot O with the three strings (and the marks, once made).
//  · On the drawing: the half-metre rule around the index, with the diagonal ending at C.
import { dir } from './physics.js';

export function loupe(c, w, h, R, hint) {
  c.fillStyle = '#1b2333'; c.fillRect(0, 0, w, h);
  if (R.mode === 'meas') return ruleView(c, w, h, R, hint);
  return knotView(c, w, h, R);
}

function knotView(c, w, h, R) {
  const { f } = R, cx = w / 2, cy = h * 0.42, k = Math.min(w, h) / 120; // px per mm
  c.fillStyle = '#fbfaf5'; c.fillRect(8, 6, w - 16, h - 12);
  // mirror strip under the left string
  const u1 = dir(f.t1, -1);
  c.save(); c.translate(cx + u1[0] * 70 * k, cy - u1[1] * 70 * k); c.rotate(-Math.atan2(u1[1], u1[0]));
  c.fillStyle = 'rgba(160,185,205,.55)'; c.fillRect(-46 * k, -6 * k, 92 * k, 12 * k); c.restore();
  // strings
  c.strokeStyle = '#8a7a58'; c.lineWidth = 2.4; c.lineCap = 'round';
  const ray = (u, len) => { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + u[0] * len * k, cy - u[1] * len * k); c.stroke(); };
  ray(dir(f.t1, -1), 200); ray(dir(f.t2, 1), 200); ray([0, -1], 200);
  // reflection of the left string in the mirror strip, lined up with the string when you look straight on
  c.strokeStyle = 'rgba(138,122,88,.35)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx + u1[0] * 26 * k + 1.5, cy - u1[1] * 26 * k + 1.5); c.lineTo(cx + u1[0] * 116 * k + 1.5, cy - u1[1] * 116 * k + 1.5); c.stroke();
  c.fillStyle = '#e8dcc0'; c.beginPath(); c.arc(cx, cy, 4, 0, 7); c.fill(); c.strokeStyle = '#6b5d40'; c.lineWidth = 1; c.stroke();
  if (R.marked) {
    c.fillStyle = '#15171c';
    [[dir(f.m1, -1), 30], [dir(f.m2, 1), 30], [[0, -1], 8], [[0, -1], 18]].forEach(([u, d]) => { c.beginPath(); c.arc(cx + u[0] * d * k, cy - u[1] * d * k, 2.6, 0, 7); c.fill(); });
  }
  c.fillStyle = '#0e131c'; c.font = `italic 700 ${Math.max(12, Math.round(h * 0.11))}px Georgia`; c.textAlign = 'center';
  c.fillText('O', cx + 14, cy + 18);
  c.font = `600 ${Math.max(10, Math.round(h * 0.085))}px Arial`;
  c.fillText(`w₁ = ${Math.round(f.w1)} g`, w * 0.2, h - 12); c.fillText(`w₂ = ${Math.round(f.w2)} g`, w * 0.8, h - 12);
  c.fillText(R.act === 1 ? 'w' : `w₃ = ${Math.round(f.W)} g`, w * 0.5, h - 12);
}

function ruleView(c, w, h, R, hint) {
  const g = R.g, span = 24, left = g - span / 2, ppm = (w - 16) / span, X = (mm) => 8 + (mm - left) * ppm;
  const yE = Math.round(h * 0.52), fs = Math.max(11, Math.round(h * 0.11));
  // paper with the diagonal along the rule's edge, ending at C
  c.fillStyle = '#fbfaf5'; c.fillRect(8, yE, w - 16, h - yE - 6);
  c.strokeStyle = 'rgba(200,70,10,.95)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(X(Math.max(left, 0)), yE + 3); c.lineTo(X(Math.min(R.OCmm, left + span)), yE + 3); c.stroke();
  if (R.OCmm > left - 2 && R.OCmm < left + span + 2) {
    const x = X(R.OCmm); c.fillStyle = '#15171c'; c.beginPath(); c.arc(x, yE + 3, 3.4, 0, 7); c.fill();
    c.font = `italic 700 ${fs}px Georgia`; c.textAlign = 'center'; c.fillText(R.label[2], x, h - 12);
    c.strokeStyle = 'rgba(30,30,30,.5)'; c.lineWidth = 1; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(x - 9, yE + 3); c.lineTo(x + 9, yE + 3); c.stroke(); c.setLineDash([]);
  }
  // the rule
  c.fillStyle = '#efe6cf'; c.fillRect(8, 6, w - 16, yE - 6);
  c.textAlign = 'center';
  const near = Math.round(g);
  for (let mm = Math.ceil(left); mm <= left + span; mm++) {
    if (mm < 0 || mm > 500) continue; const L = mm % 10 === 0 ? 0.62 : mm % 5 === 0 ? 0.46 : 0.3; const x = X(mm);
    c.fillStyle = hint && mm === near ? '#e0560b' : '#0e131c'; c.fillRect(x - 1, yE - (yE - 6) * L, 2, (yE - 6) * L);
    if (mm % 10 === 0) { c.fillStyle = '#0e131c'; c.font = `700 ${fs}px Arial`; c.fillText(String(mm / 10), x, 6 + fs); }
  }
  c.fillStyle = '#0e131c'; c.fillRect(8, yE - 1, w - 16, 1.5);
  // the index the student slides
  const xi = X(g); c.fillStyle = '#d2452f'; c.fillRect(xi - 1, 6, 2, h - 12);
  c.fillStyle = R.contact() ? '#52c68d' : '#c6cfdb'; c.font = `700 ${fs}px Arial`; c.textAlign = 'right'; c.fillText(R.contact() ? '✓' : '↔', w - 12, h - 12);
}
