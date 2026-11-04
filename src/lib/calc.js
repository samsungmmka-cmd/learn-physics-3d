import { LABS, practical } from '../practicals/index.js';
import { instrument } from '../instruments/index.js';

export const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '—');
export const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (a, b) => a + Math.random() * (b - a);

// A practical's state when a student starts it. The practical's own start() adds what varies per student
// (zero error, starting positions…). With no setup step the practical opens ready to measure.
export function freshLab(id) {
  const p = practical(id);
  const noSetup = !!p && instrument(p.lab.inst).setup === 'none';
  return {
    lc: false, zero: noSetup, e: 0, S0: 0,
    S0rec: null, act: 0, mk: null, rec: {}, means: {}, calc: {}, N: 20, notes: '',
    ...(p && p.start ? p.start({ pick, rand }) : {}),
  };
}

export function progress(st, id) {
  const lab = LABS[id], ls = st.labs[id];
  if (!ls || !lab) return 0;
  let tot = 2, done = (ls.lc ? 1 : 0) + (ls.zero ? 1 : 0);
  lab.meas.forEach((m) => {
    tot += m.n; done += Math.min(m.n, (ls.rec[m.key] || []).length);
    if (m.n > 1 && !m.noMean) { tot++; if (ls.means[m.key] && ls.means[m.key].ok) done++; }
  });
  lab.calcs.forEach((c) => { tot++; if (ls.calc[c.key] && ls.calc[c.key].ok) done++; });
  const pre = instrument(lab.inst).preMeas;
  if (pre) lab.acts.forEach((a, i) => { tot++; if (pre.done(ls, i)) done++; });
  return done / tot;
}

export function measMeans(ls, id) {
  const lab = LABS[id], m = {};
  lab.meas.forEach((x) => { const r = ls.rec[x.key] || []; if (r.length >= x.n) m[x.key] = avg(r.map((q) => q.corr)); });
  return m;
}

export function curMeas(ls, id) {
  const lab = LABS[id];
  const list = lab.meas.filter((m) => m.act === ls.act);
  return list.find((x) => x.key === ls.mk) || list.find((x) => (ls.rec[x.key] || []).length < x.n) || list[0];
}

export function measSize(ls, m, ri) {
  if (m.paper) return ls.N * 0.104 + m.vals[ri % m.vals.length];
  return m.vals[Math.min(ri, m.vals.length - 1)];
}

export const shareKeys = (id) => (practical(id) || {}).share || [];

export function myShare(st, id) {
  const lab = LABS[id], ls = st.labs[id]; if (!ls) return {};
  const mm = measMeans(ls, id); const out = {};
  shareKeys(id).forEach((k) => {
    const c = lab.calcs.find((x) => x.key === k);
    if (c) { const cv = ls.calc[k]; if (cv && cv.ok) out[k] = parseFloat(cv.v); }
    else if (mm[k] !== undefined) out[k] = +mm[k].toFixed(4);
  });
  return out;
}
