// Force board (parallelogram law of forces): instrument profile plus its 3D rig.
// Before each activity's reading the student works through steps on the 3D board (see rig.js), guided by
// the card in ui.jsx (PreMeas): load the pans → add up the weights → pull and release → mark the strings →
// draw the parallelogram to scale. The reading is OC, measured on that drawing with a half-metre rule.
//
// Lab state used (set by the practical's start()):
//   pans [p1, p2, p3], slot [s1, s2, s3] (g), mObj (g, balance), err [[e1, e2], [e1, e2]] (deg, friction)
//   pre[act] = { loads: [[…], […], […]], loaded, w: [w1, w2, w3], pulled, dots: [[x, y, side]…], marked,
//                scale (g per cm), OA, OB (cm), done }
import rig from './rig.js';
import { forces, decompose, fromDots, perfectDots } from './physics.js';

// What each pan must hold for an activity (g): activity 2 swaps w3's masses for the object.
export const targets = (ls, act) => { const s = ls.slot || [200, 250, 300]; return act === 1 ? [s[0], s[1], ls.mObj || 300] : [...s]; };
// The pans as the student finds them: empty for activity 1; activity 2 starts as activity 1 left them.
export const startLoads = (ls, act) => (act === 1 ? ((ls.pre && ls.pre[0] && ls.pre[0].loads) || targets(ls, 0).map(decompose)) : [[], [], []]);
// Which step of the activity the student is on.
export function stage(ls, act) {
  const p = (ls.pre && ls.pre[act]) || {};
  if (!p.loaded || (act === 0 && !p.w)) return 'load';
  if (!p.pulled) return 'pull';
  if (!p.marked) return 'mark';
  if (!p.done) return 'draw';
  return 'meas';
}

export default {
  type: 'forceBoard',
  rig,
  setup: 'none',          // no zero error: the rule's zero is put on O
  resolution: 1,          // mm (half-metre rule)
  theoryDemo: false,
  offMsg: 'notOnC',
  controls: {
    forceBoard: { label: { si: 'කෝදුවේ දර්ශකය', en: 'Rule index', ta: 'அளவுகோல் சுட்டி' }, buttons: [{ t: '⏪', v: -40, s: -10 }, { t: '◀', v: -3, s: -1 }, { t: '▶', v: 3, s: 1 }, { t: '⏩', v: 40, s: 10 }] },
  },
  // Buttons only while measuring on the drawing; the other steps are done with the mouse or a finger.
  ctrl: (place) => (place.mode === 'meas' ? 'forceBoard' : 'board'),
  thumb: { mode: 'show', live: { loads: [[100, 100], [100, 100, 50], [100, 100, 100]] } },
  place(ctx) {
    const { ls, m, phase } = ctx; const act = phase === 'meas' ? m.act : 0;
    const f = forces(ls, act), pre = (ls.pre && ls.pre[act]) || {};
    const base = { act, f, pans: ls.pans || [50, 50, 50], mObj: ls.mObj || 300, targets: targets(ls, act) };
    if (phase !== 'meas') return { ...base, mode: phase === 'show' ? 'show' : 'none', live: { loads: targets(ls, 0).map(decompose) } };
    return { ...base, mode: stage(ls, act), live: { loads: pre.loads || startLoads(ls, act), dots: pre.dots || [], OA: pre.OA || 0, OB: pre.OB || 0 } };
  },
  // A step each activity needs before its readings can be taken (the card is ui.jsx · PreMeas).
  preMeas: {
    done: (ls, act) => !!(ls.pre && ls.pre[act] && ls.pre[act].done),
    // Finished work for tests: loads right, perfect marks, the scale making OC ≈ 12 cm, OA and OB to scale.
    sample(ls) {
      const f0 = forces(ls, 0), scale = Math.round(f0.W / 12 / 5) * 5, pre = {};
      [0, 1].forEach((a) => {
        const f = forces(ls, a), dots = perfectDots(f), L = fromDots(dots);
        pre[a] = { loads: targets(ls, a).map((t, i) => (a === 1 && i === 2 ? ['stone'] : decompose(t))), loaded: true, w: [f.w1, f.w2, f.W], pulled: true, dots, marked: true, scale,
          OA: Math.round((f.w1 / scale) * 10) / 10, OB: Math.round((f.w2 / scale) * 10) / 10, done: true, m: [L.m1, L.m2] };
      });
      return pre;
    },
  },
};
