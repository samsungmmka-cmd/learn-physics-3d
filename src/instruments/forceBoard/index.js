// Force board (parallelogram law of forces): instrument profile plus its 3D rig.
// Each activity has a step before the reading (see preMeas): set up the weights, check the system
// runs freely, mark the strings, then draw the parallelogram to scale (ui.jsx · PreMeas).
// The reading is OC, measured on that drawing with a half-metre rule.
//
// Lab state used (set by the practical's start()):
//   pans [p1, p2, p3], slot [s1, s2, s3] (g), mObj (g, balance), err [[e1, e2], [e1, e2]] (deg)
//   pre[act] = { w: [w1, w2, w3] entered, pulled, marked, scale (g per cm), OA, OB (cm), done }
import rig from './rig.js';
import { forces, diagonal } from './physics.js';

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
  // Buttons only while measuring on the drawing; on the board the card below drives the experiment.
  ctrl: (place) => (place.mode === 'meas' ? 'forceBoard' : 'board'),
  thumb: { mode: 'show' },
  // 'show' | 'none': the board for activity 1. 'meas': the board until the drawing is done, then the drawing.
  place(ctx) {
    const { ls, m, phase } = ctx; const act = phase === 'meas' ? m.act : 0;
    const f = forces(ls, act), pre = (ls.pre && ls.pre[act]) || {};
    if (phase === 'meas' && pre.done) return { mode: 'meas', act, f, OA: pre.OA, OB: pre.OB };
    return { mode: phase === 'meas' ? 'board' : phase === 'show' ? 'show' : 'none', act, f, slot: ls.slot, marked: phase === 'meas' && !!pre.marked };
  },
  // A step each activity needs before its readings can be taken (drawn by ui.jsx · PreMeas).
  preMeas: {
    done: (ls, act) => !!(ls.pre && ls.pre[act] && ls.pre[act].done),
    // A finished drawing for tests: the scale making OC ≈ 12 cm, OA and OB exactly to scale.
    sample(ls) {
      const f0 = forces(ls, 0), scale = Math.round(f0.W / 12 / 5) * 5, pre = {};
      [0, 1].forEach((a) => { const f = forces(ls, a); pre[a] = { w: [f.w1, f.w2, f.W], pulled: true, marked: true, scale, OA: Math.round((f.w1 / scale) * 10) / 10, OB: Math.round((f.w2 / scale) * 10) / 10, done: true }; });
      return pre;
    },
  },
};
// OC (cm) for a finished drawing, for calculations and checks.
export const drawnOC = (ls, act) => { const p = ls.pre && ls.pre[act]; if (!p || !p.done) return NaN; const f = forces(ls, act); return diagonal(p.OA, p.OB, f.m1, f.m2).OC; };
