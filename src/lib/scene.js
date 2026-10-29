import { LABS, PRAC } from '../data/content.js';
import { curMeas, measSize } from './calc.js';

// Mirrors the handbook flow: which instrument, object and labels the 3D stage shows for the current step.
export function sceneSpec(st, hero, theoryE, L, u, lang) {
  const id = st.cur, lab = LABS[id], ls = st.labs[id], sec = hero ? 0 : st.sec;
  const p = PRAC.find((x) => x[0] === String(id));
  let type = lab.inst, place = { mode: 'show', surf: 'flat' }, hud = '', sub = '', zeroAt = false, hint = false;
  const setup = ls.lc && ls.zero;
  if (hero) { hud = `${u('pracNo')} ${String(id).padStart(2, '0')}`; sub = lang === 'si' ? p[2] : p[3]; }
  else if (sec === 0) hud = u('parts');
  else if (sec === 1) { place = { mode: 'none', surf: 'flat' }; hud = `${u('lc')} · ${lab.inst === 'sphero' ? u('init') : u('zero')}`; if (theoryE !== null && lab.inst !== 'sphero') { zeroAt = true; hint = true; } }
  else if (!setup) { place = { mode: 'none', surf: 'flat' }; hud = !ls.lc ? u('lc') : lab.inst === 'sphero' ? u('init') : u('zero'); }
  else {
    const m = curMeas(ls, id); const ri = Math.min((ls.rec[m.key] || []).length, m.n - 1);
    type = m.rig || lab.inst;
    place = { mode: m.mode || 'outer', obj: m.obj, pose: m.pose, size: measSize(ls, m, ri), ri, surf: m.surf };
    hud = L(m.label); sub = L(lab.acts[m.act]);
  }
  let e = 0;
  if (type === 'caliper') e = id === 1 ? (sec === 1 && theoryE !== null ? theoryE : ls.e) : 0;
  if (type === 'micro') e = sec === 1 && theoryE !== null ? theoryE : ls.e;
  // Part labels on every page, for the instrument actually on screen (practical 3 also uses the caliper).
  // The show/hide button decides whether they're visible. Only the parts view zooms out to make room.
  const partsLab = type === lab.inst ? lab : Object.values(LABS).find((x) => x.inst === type);
  const labels = partsLab ? partsLab.parts.map(([k, n]) => [k, L(n)]) : [];
  const room = sec === 0;
  return { spec: { type, place, e, S0: ls.S0, labels, room, zeroAt, hint }, hud, sub };
}
