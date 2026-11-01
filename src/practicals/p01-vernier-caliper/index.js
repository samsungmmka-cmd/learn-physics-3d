// Practical 01 · Using the vernier caliper.
// content.js = handbook text, measurements and calculations; ta.js = Tamil.
import lab from './content.js';
import ta from './ta.js';

export default {
  id: 1,
  lab,
  ta,
  // Each student gets a different zero error (mm).
  start: ({ pick }) => ({ e: pick([0.3, 0.2, -0.2, -0.1]) }),
  // Values shared to the class results board (measurement means or calculation keys).
  share: ['V1', 'V2', 'V3', 'V4'],
};
