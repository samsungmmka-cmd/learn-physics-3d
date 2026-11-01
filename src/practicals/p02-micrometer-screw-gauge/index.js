// Practical 02 · Using the micrometer screw gauge.
// content.js = handbook text, measurements and calculations; ta.js = Tamil.
import lab from './content.js';
import ta from './ta.js';

export default {
  id: 2,
  lab,
  ta,
  // Each student gets a different zero error (mm).
  start: ({ pick }) => ({ e: pick([0.02, 0.03, -0.01, -0.02]) }),
  // Values shared to the class results board (measurement means or calculation keys).
  share: ['dw', 'db', 'ts', 'P1'],
};
