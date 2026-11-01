// Practical 04 · Using the travelling microscope.
// content.js = handbook text, measurements and calculations; ta.js = Tamil.
import lab from './content.js';
import ta from './ta.js';

export default {
  id: 4,
  lab,
  ta,
  // The microscope starts tilted (to be levelled), and each tube sits at its own spot on the scales
  // (centre of the circle, in mm, on the 0.01 mm grid).
  start: ({ pick, rand }) => {
    const grid = (a, b) => Math.round(rand(a, b) * 100) / 100;
    const tilt = pick([-1, 1]) * Math.round(rand(14, 30)) * 0.05;
    return { tilt: +tilt.toFixed(2), pos: [0, 1, 2].map(() => [grid(52, 96), grid(58, 84)]) };
  },
  // Values shared to the class results board (measurement means or calculation keys).
  share: ['Dc', 'Di', 'Do'],
};
