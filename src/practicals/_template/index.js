// Practical __NN__ · __TITLE__.
// content.js = handbook text, measurements and calculations; ta.js = Tamil.
import lab from './content.js';
import ta from './ta.js';

export default {
  id: __ID__,
  lab,
  ta,
  // Values that differ for each student, merged into the fresh lab state (e.g. a zero error
  // `e` in mm for setup 'zero', a start position `S0` for setup 'init'). pick(list), rand(a, b).
  start: () => ({}),
  // Values shared to the class results board (measurement means or calculation keys).
  share: ['Lm'],
};
