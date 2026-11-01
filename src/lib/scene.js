import { PRAC } from '../data/content.js';
import { LABS } from '../practicals/index.js';
import { instrument, SETUP_NAME } from '../instruments/index.js';
import { curMeas, measSize } from './calc.js';
import { pTitle } from './ptitle.js';

// Where an instrument puts itself and its object for a phase of the practical
// ('show' | 'none' | 'setup' | 'meas'). Instruments with their own place() (e.g. the travelling
// microscope) decide for themselves; the rest use the measurement's mode/obj/pose/size.
function placeFor(P, ctx) {
  if (P.place) return P.place(ctx);
  const { phase, ls, m, ri } = ctx;
  if (phase === 'show') return { mode: 'show', surf: 'flat' };
  if (phase !== 'meas') return { mode: 'none', surf: 'flat' };
  return { mode: m.mode || 'outer', obj: m.obj, pose: m.pose, size: measSize(ls, m, ri), ri, surf: m.surf };
}

// Mirrors the handbook flow: which instrument, object and labels the 3D stage shows for the current step.
export function sceneSpec(st, hero, theoryE, L, u, lang) {
  const id = st.cur, lab = LABS[id], ls = st.labs[id], sec = hero ? 0 : st.sec;
  const p = PRAC.find((x) => x[0] === String(id));
  const P = instrument(lab.inst);
  const first = { ls, m: lab.meas[0], ri: 0 };
  let type = lab.inst, place = placeFor(P, { ...first, phase: 'show' }), hud = '', sub = '', zeroAt = false, hint = false;
  const setup = ls.lc && ls.zero;
  const setupName = SETUP_NAME[P.setup] ? u(SETUP_NAME[P.setup]) : '';
  if (hero) { hud = `${u('pracNo')} ${String(id).padStart(2, '0')}`; sub = pTitle(p, lang); }
  else if (sec === 0) hud = u('parts');
  else if (sec === 1) {
    place = placeFor(P, { ...first, phase: 'none' });
    hud = P.setup === 'zero' || P.setup === 'init' ? `${u('lc')} · ${setupName}` : u('lc');
    if (theoryE !== null && P.theoryDemo) { zeroAt = true; hint = true; }
  } else if (!setup) {
    place = placeFor(P, { ...first, phase: ls.lc ? 'setup' : 'none' });
    hud = !ls.lc ? u('lc') : setupName;
  } else {
    const m = curMeas(ls, id); const ri = Math.min((ls.rec[m.key] || []).length, m.n - 1);
    type = m.rig || lab.inst;
    const Q = instrument(type);
    place = placeFor(Q, { ls, m, ri, phase: 'meas' });
    hud = Q.measHud ? Q.measHud(L(m.label), m, ri) : L(m.label); sub = L(lab.acts[m.act]);
  }
  const ctrl = P.ctrl ? P.ctrl(place) : undefined;
  // Zero error shows on the practical's own instrument (the theory tab can preview the handbook's examples).
  let e = 0;
  if (type === lab.inst && P.setup === 'zero') e = sec === 1 && theoryE !== null ? theoryE : ls.e;
  // Part labels on every page, for the instrument actually on screen (practical 3 also uses the caliper).
  // The show/hide button decides whether they're visible. Only the parts view zooms out to make room.
  const partsLab = type === lab.inst ? lab : Object.values(LABS).find((x) => x.inst === type);
  const labels = partsLab ? partsLab.parts.map(([k, n]) => [k, L(n)]) : [];
  const room = sec === 0;
  return { spec: { type, place, e, S0: ls.S0, labels, room, zeroAt, hint, ...(ctrl ? { ctrl } : {}) }, hud, sub };
}
