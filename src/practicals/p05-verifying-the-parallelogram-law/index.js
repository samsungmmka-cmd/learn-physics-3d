// Practical 05 · Verifying the parallelogram law of forces and finding the mass of an object.
// content.js = handbook text, measurements and calculations; ta.js = Tamil.
import lab from './content.js';
import ta from './ta.js';

export default {
  id: 5,
  lab,
  ta,
  // What differs for each student (grams): the masses put on the pans, the pans' own masses, the object's
  // mass (as the triple-beam balance reads it) and small marking errors (degrees) from friction and parallax.
  // Every combination balances with the knot on the board and the drawing on an A4 sheet.
  start: ({ pick, rand }) => {
    const slot = pick([[200, 250, 300], [150, 200, 250], [200, 300, 350], [250, 300, 400]]);
    const pans = [0, 1, 2].map(() => Math.round(rand(46, 54)));
    const mObj = Math.round((slot[2] + pans[2]) * rand(0.9, 1.08) - pans[2]);
    // Both strings of an activity are marked off the same way (as friction in the pulleys does), so the drawn
    // resultant comes out 1–4 % off, like a real experiment, giving the discussion something to explain.
    const e = () => { const sg = pick([-1, 1]); return [+(sg * rand(0.6, 1.6)).toFixed(2), +(sg * rand(0.4, 1.4)).toFixed(2)]; };
    return { slot, pans, mObj, err: [e(), e()], pre: {} };
  },
  // Values shared to the class results board.
  share: ['W3d', 'M'],
};
