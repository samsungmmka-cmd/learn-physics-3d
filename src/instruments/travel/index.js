// Travelling microscope: instrument profile plus its 3D rig.
import rig from './rig.js';

// Where the microscope looks for a measurement: each tube sits at its own spot on the scales (ls.pos, per activity).
const at = ({ ls, m, ri = 0 }, mode) => {
  const [cx, cy] = (ls.pos && ls.pos[m.act]) || [60, 70];
  return { mode, obj: m.obj, edge: m.edge, din: m.din, dout: m.dout, cx, cy, ri };
};

export default {
  type: 'travel',
  rig,
  setup: 'level',       // step after the least count: level the microscope with the spirit level
  resolution: 0.01,
  theoryDemo: false,
  offMsg: 'notEdge',    // UI key shown when the crosswire isn't on an edge
  // One screw at a time: horizontal, vertical, or the levelling screw (chosen by ctrl() below).
  controls: {
    travelX: { label: { si: 'තිරස් ඉස්කුරුප්පුව', en: 'Horizontal screw', ta: 'கிடைத் திருகாணி' }, buttons: [{ t: '⏪', v: -4, s: -1 }, { t: '◀', v: -0.12, s: -0.01 }, { t: '▶', v: 0.12, s: 0.01 }, { t: '⏩', v: 4, s: 1 }] },
    travelY: { label: { si: 'සිරස් ඉස්කුරුප්පුව', en: 'Vertical screw', ta: 'நிலைக்குத்துத் திருகாணி' }, buttons: [{ t: '▼▼', v: -4, s: -1 }, { t: '▼', v: -0.12, s: -0.01 }, { t: '▲', v: 0.12, s: 0.01 }, { t: '▲▲', v: 4, s: 1 }] },
    level: { label: { si: 'සංතලන ඉස්කුරුප්පුව', en: 'Levelling screw', ta: 'மட்டமாக்கும் திருகாணி' }, buttons: [{ t: '⟲', v: -0.4, s: -0.05 }, { t: '⟳', v: 0.4, s: 0.05 }] },
  },
  thumb: { mode: 'show' },
  // 3D placement for each phase of the practical: 'show' | 'none' | 'setup' | 'meas'.
  place(ctx) {
    if (ctx.phase === 'setup') return { ...at(ctx, 'level'), tilt: ctx.ls.tilt || 0 };
    return at(ctx, ctx.phase);
  },
  measHud: (label, m, ri) => `${label} · ${m.heads[ri]}`,
  ctrl: (place) => (place.mode === 'level' ? 'level' : place.mode === 'meas' && place.ri >= 2 ? 'travelY' : 'travelX'),
};
