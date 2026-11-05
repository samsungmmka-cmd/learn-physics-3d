// Force board magnifier, one view per step:
//  load  each pan's load against what it should hold;   pull  the knot and strings;
//  mark  the mirror strip under the pointer: the string and its image line up only when the eye
//        (the pointer) is right above the string;          draw  OA and OB as they are dragged;
//  meas  the half-metre rule around the index, with the diagonal ending at C.
import { dir, loadMass } from './physics.js';

export function loupe(c, w, h, R, hint) {
  c.fillStyle = '#1b2333'; c.fillRect(0, 0, w, h);
  if (R.mode === 'meas') return ruleView(c, w, h, R, hint);
  if (R.mode === 'load') return loadView(c, w, h, R);
  if (R.mode === 'mark' && R.hover) return mirrorView(c, w, h, R);
  if (R.mode === 'draw') return drawView(c, w, h, R);
  return knotView(c, w, h, R);
}

const font = (h, k = 0.1, wgt = 700) => `${wgt} ${Math.max(10, Math.round(h * k))}px Arial`;

function loadView(c, w, h, R) {
  const cols = 3, cw = (w - 24) / cols;
  for (let i = 0; i < cols; i++) {
    const x0 = 12 + i * cw, now = loadMass(R.loads[i], R.mObj), want = R.targets ? R.targets[i] : 0, ok = Math.abs(now - want) < 0.5;
    c.fillStyle = '#243049'; c.fillRect(x0 + 4, 8, cw - 8, h - 16);
    c.fillStyle = '#c6cfdb'; c.font = font(h, 0.1); c.textAlign = 'center';
    c.fillText(i === 2 && R.act === 1 ? 'w' : `w${'₁₂₃'[i]}`, x0 + cw / 2, 8 + h * 0.14);
    // the stack on this pan, drawn to scale
    let y = h * 0.78; const items = (R.loads[i] || []).filter((q) => q !== 'stone');
    items.forEach((d) => { const r = { 100: 20, 50: 17, 20: 13, 10: 10.5 }[d] * (h / 160), t = { 100: 9.6, 50: 6.4, 20: 4.2, 10: 3.2 }[d] * (h / 120); c.fillStyle = '#d6ad55'; c.fillRect(x0 + cw / 2 - r, y - t, 2 * r, t - 1); y -= t; });
    if ((R.loads[i] || []).includes('stone')) { c.fillStyle = '#8a8378'; c.beginPath(); c.ellipse(x0 + cw / 2, y - h * 0.07, h * 0.12, h * 0.07, 0, 0, 7); c.fill(); }
    c.fillStyle = '#8f99a8'; c.fillRect(x0 + cw / 2 - h * 0.17, h * 0.78, h * 0.34, 3);
    c.fillStyle = ok ? '#52c68d' : '#eef1f5'; c.font = font(h, 0.105);
    c.fillText(`${Math.round(now)} / ${Math.round(want)} g`, x0 + cw / 2, h - 16);
  }
}

function knotView(c, w, h, R) {
  const a = R.ang || { t1: R.f.t1, t2: R.f.t2 }, cx = w / 2, cy = h * 0.42, k = Math.min(w, h) / 120;
  c.fillStyle = '#fbfaf5'; c.fillRect(8, 6, w - 16, h - 12);
  const u1 = dir(a.t1, -1);
  c.save(); c.translate(cx + u1[0] * 70 * k, cy - u1[1] * 70 * k); c.rotate(-Math.atan2(u1[1], u1[0]));
  c.fillStyle = 'rgba(160,185,205,.55)'; c.fillRect(-46 * k, -6 * k, 92 * k, 12 * k); c.restore();
  c.strokeStyle = '#3b342a'; c.lineWidth = 2.4; c.lineCap = 'round';
  const ray = (u, len) => { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + u[0] * len * k, cy - u[1] * len * k); c.stroke(); };
  ray(dir(a.t1, -1), 200); ray(dir(a.t2, 1), 200); ray([0, -1], 200);
  c.fillStyle = '#e8dcc0'; c.beginPath(); c.arc(cx, cy, 4, 0, 7); c.fill();
  c.fillStyle = '#15171c'; for (const d of R.dots || []) { c.beginPath(); c.arc(cx + d[0] * k, cy - d[1] * k, 2.6, 0, 7); c.fill(); }
  c.fillStyle = '#0e131c'; c.font = `italic 700 ${Math.max(12, Math.round(h * 0.11))}px Georgia`; c.textAlign = 'center'; c.fillText('O', cx + 14, cy + 18);
  c.font = font(h, 0.085, 600);
  const t = (i) => Math.round(R.pans[i] + loadMass(R.loads[i], R.mObj));
  c.fillText(`w₁ = ${t(0)} g`, w * 0.2, h - 12); c.fillText(`w₂ = ${t(1)} g`, w * 0.8, h - 12); c.fillText(R.act === 1 ? 'w' : `w₃ = ${t(2)} g`, w * 0.5, h - 12);
}

// Close-up of the paper under the pointer (±18 mm). The mirror strip shows each string's image; when the
// pointer is off the string the image appears beside it (twice the offset), so lining them up puts the dot under it.
function mirrorView(c, w, h, R) {
  const H = R.hover, a = R.ang, span = 36, k = (w - 16) / span, cx = w / 2, cy = h / 2;
  c.fillStyle = '#fbfaf5'; c.fillRect(8, 6, w - 16, h - 12);
  const P = (p) => [cx + (p[0] - H.p[0]) * k, cy - (p[1] - H.p[1]) * k];
  c.save(); c.beginPath(); c.rect(8, 6, w - 16, h - 12); c.clip();
  // mirror strip band along the nearest side string
  const strs = [[dir(a.t1, -1), 0], [dir(a.t2, 1), 1], [[0, -1], 2]];
  const [u] = strs[H.side];
  const n = [-u[1], u[0]]; const off = (H.p[0] * n[0] + H.p[1] * n[1]); // signed offset of the pointer from that string
  const A = P([u[0] * -40, u[1] * -40]), B = P([u[0] * 400, u[1] * 400]);
  c.strokeStyle = 'rgba(150,180,205,.45)'; c.lineWidth = 12 * k; c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.stroke();
  // the image of the string in the strip: displaced by twice the pointer's offset
  const sh = (p) => [p[0] - n[0] * 2 * off * k, p[1] + n[1] * 2 * off * k];
  c.strokeStyle = 'rgba(60,52,40,.35)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(...sh(A)); c.lineTo(...sh(B)); c.stroke();
  // the strings themselves
  c.strokeStyle = '#3b342a'; c.lineWidth = 2.6;
  strs.forEach(([v]) => { const p0 = P([0, 0]), p1 = P([v[0] * 400, v[1] * 400]); c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.stroke(); });
  c.fillStyle = '#15171c'; for (const d of R.dots || []) { const q = P(d); c.beginPath(); c.arc(q[0], q[1], 3.2, 0, 7); c.fill(); }
  c.restore();
  const good = H.d <= 3 && H.along >= 3;
  c.strokeStyle = good ? '#2a9a5a' : '#e0560b'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(cx - 10, cy); c.lineTo(cx + 10, cy); c.moveTo(cx, cy - 10); c.lineTo(cx, cy + 10); c.stroke();
  c.fillStyle = good ? '#2a9a5a' : '#0e131c'; c.font = font(h, 0.1); c.textAlign = 'right'; c.fillText(`${H.d.toFixed(1)} mm`, w - 14, h - 12);
}

function drawView(c, w, h, R) {
  c.fillStyle = '#fbfaf5'; c.fillRect(8, 6, w - 16, h - 12);
  c.fillStyle = '#0e131c'; c.font = `italic 700 ${Math.max(13, Math.round(h * 0.13))}px Georgia`; c.textAlign = 'center';
  const L = R.label; const f = (v) => (v > 0 ? `${v.toFixed(1)} cm` : '—');
  c.fillText(`O${L[0]} = ${f(R.OA)}`, w * 0.3, h * 0.55); c.fillText(`O${L[1]} = ${f(R.OB)}`, w * 0.72, h * 0.55);
}

function ruleView(c, w, h, R, hint) {
  const g = R.g, span = 24, left = g - span / 2, ppm = (w - 16) / span, X = (mm) => 8 + (mm - left) * ppm;
  const yE = Math.round(h * 0.52), fs = Math.max(11, Math.round(h * 0.11));
  c.fillStyle = '#fbfaf5'; c.fillRect(8, yE, w - 16, h - yE - 6);
  c.strokeStyle = 'rgba(200,70,10,.95)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(X(Math.max(left, 0)), yE + 3); c.lineTo(X(Math.min(R.OCmm, left + span)), yE + 3); c.stroke();
  if (R.OCmm > left - 2 && R.OCmm < left + span + 2) {
    const x = X(R.OCmm); c.fillStyle = '#15171c'; c.beginPath(); c.arc(x, yE + 3, 3.4, 0, 7); c.fill();
    c.font = `italic 700 ${fs}px Georgia`; c.textAlign = 'center'; c.fillText(R.label[2], x, h - 12);
  }
  c.fillStyle = '#efe6cf'; c.fillRect(8, 6, w - 16, yE - 6);
  c.textAlign = 'center';
  const near = Math.round(g);
  for (let mm = Math.ceil(left); mm <= left + span; mm++) {
    if (mm < 0 || mm > 500) continue; const L = mm % 10 === 0 ? 0.62 : mm % 5 === 0 ? 0.46 : 0.3; const x = X(mm);
    c.fillStyle = hint && mm === near ? '#e0560b' : '#0e131c'; c.fillRect(x - 1, yE - (yE - 6) * L, 2, (yE - 6) * L);
    if (mm % 10 === 0) { c.fillStyle = '#0e131c'; c.font = `700 ${fs}px Arial`; c.fillText(String(mm / 10), x, 6 + fs); }
  }
  c.fillStyle = '#0e131c'; c.fillRect(8, yE - 1, w - 16, 1.5);
  const xi = X(g); c.fillStyle = '#d2452f'; c.fillRect(xi - 1, 6, 2, h - 12);
  c.fillStyle = R.contact() ? '#52c68d' : '#c6cfdb'; c.font = `700 ${fs}px Arial`; c.textAlign = 'right'; c.fillText(R.contact() ? '✓' : '↔', w - 12, h - 12);
}
