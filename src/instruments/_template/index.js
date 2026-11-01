// __NAME__: instrument profile (how the app treats readings taken with it) plus its 3D rig.
// Fields are explained in src/instruments/README.md.
import rig from './rig.js';

export default {
  type: '__TYPE__',
  rig,
  setup: 'none',        // 'zero' | 'init' | 'level' | 'none': the step after the least count
  resolution: 1,        // mm, smallest reading
  theoryDemo: false,
  // Buttons under the 3D view: hold to move (v mm per second), tap to nudge (s mm).
  controls: {
    __TYPE__: { label: { si: 'දර්ශකය', en: 'Cursor', ta: 'சுட்டி' }, buttons: [{ t: '⏪', v: -60, s: -10 }, { t: '◀', v: -4, s: -1 }, { t: '▶', v: 4, s: 1 }, { t: '⏩', v: 60, s: 10 }] },
  },
  thumb: { mode: 'show' },
};
