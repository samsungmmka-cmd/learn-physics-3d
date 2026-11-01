// Micrometer screw gauge: instrument profile plus its 3D rig.
import rig from './rig.js';

export default {
  type: 'micro',
  rig,
  setup: 'zero',
  zeroTol: 0.0051,
  zeroDp: 2,
  resolution: 0.01,
  turnOne: { step: 0.5, max: 24 },   // "turn one revolution" button on the least-count card (mm per turn)
  theoryDemo: true,
  controls: {
    micro: { label: { si: 'දිදාලය', en: 'Thimble', ta: 'விரல்மூடி' }, buttons: [{ t: '⏪', v: -2, s: -0.5 }, { t: '◀', v: -0.1, s: -0.01 }, { t: '▶', v: 0.1, s: 0.01 }, { t: '⏩', v: 2, s: 0.5 }, { t: 'ratchet', v: -1.2, s: -0.01, ratchet: true }] },
  },
  thumb: { mode: 'show' },
};
