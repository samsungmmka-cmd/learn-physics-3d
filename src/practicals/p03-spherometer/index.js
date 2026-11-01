// Practical 03 · Using the spherometer.
// content.js = handbook text, measurements and calculations; ta.js = Tamil.
import lab from './content.js';
import ta from './ta.js';

export default {
  id: 3,
  lab,
  ta,
  // Where the screw sits on the flat glass before the initial reading (mm).
  start: ({ rand }) => ({ S0: Math.round(rand(420, 690)) / 100 }),
  // Values shared to the class results board (measurement means or calculation keys).
  share: ['ts', 'R'],
};
