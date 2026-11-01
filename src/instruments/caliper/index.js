// Vernier caliper: instrument profile (how the app treats readings taken with it) plus its 3D rig.
import rig from './rig.js';

export default {
  type: 'caliper',
  rig,
  setup: 'zero',        // step after the least count: find the zero error
  zeroTol: 0.051,       // mm, accepted error when the student enters the zero error
  zeroDp: 1,
  resolution: 0.1,      // mm, smallest reading
  theoryDemo: true,     // the theory tab shows the handbook's zero-error examples on this instrument
  // Buttons under the 3D view: hold to move (v per second), tap to nudge (s). Values in mm.
  controls: {
    caliper: { label: { si: 'සර්පණ හනුව', en: 'Sliding jaw', ta: 'வழுக்கும் தாடை' }, buttons: [{ t: '⏪', v: -25, s: -5 }, { t: '◀', v: -1.5, s: -0.05 }, { t: '▶', v: 1.5, s: 0.05 }, { t: '⏩', v: 25, s: 5 }] },
  },
  thumb: { mode: 'show' },
};
