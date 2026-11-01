// Spherometer: instrument profile plus its 3D rig.
import rig from './rig.js';

export default {
  type: 'sphero',
  rig,
  setup: 'init',        // step after the least count: initial reading on flat glass (S0rec)
  resolution: 0.01,
  turnOne: { step: 1, max: 10 },
  theoryDemo: false,
  controls: {
    sphero: { label: { si: 'ඉස්කුරුප්පුව', en: 'Screw', ta: 'திருகாணி' }, buttons: [{ t: '▼▼', v: -1.2, s: -0.5 }, { t: '▼', v: -0.06, s: -0.01 }, { t: '▲', v: 0.06, s: 0.01 }, { t: '▲▲', v: 1.2, s: 0.5 }] },
  },
  thumb: { surf: 'flat', mode: 'show' },
};
