// Practical __NN__ · __TITLE__: handbook content (Sinhala + English), measurements and calculations.
// Transcribed from the NIE G.C.E. (A/L) Physics Practical Handbook. Tamil is in ./ta.js.
// Every { si, en } pair is shown in the student's language. Replace each TODO with the handbook text.

export default {
  inst: '__INST__',            // instrument from src/instruments/ used for this practical
  unit: 'mm', dp: 1,           // unit students record readings in ('mm' or 'cm') and decimals shown
  lcAns: 1, lcUnit: 'mm',      // least count the student must work out, and its unit

  // Activities: the handbook's numbered parts. Index 0, 1 … is the `act` of each measurement below.
  acts: [{ si: 'TODO', en: 'TODO activity 1' }],
  // Apparatus list, as in the handbook.
  materials: { si: 'TODO', en: 'TODO' },
  // Part labels on the 3D model: [anchor key in the rig's R.anchors, name].
  parts: [['rule', { si: 'TODO', en: 'Rule' }], ['scale', { si: 'TODO', en: 'Scale' }], ['cursor', { si: 'TODO', en: 'Cursor' }]],
  // Theory tab (HTML): <p>, <i>, <div class="formula">, <ol><li>.
  theory: { si: '<p>TODO</p>', en: '<p>TODO</p>' },
  lcQ: { si: 'TODO', en: 'TODO: what is the least count of this instrument?' },
  lcWork: '1 mm',              // worked answer shown once the least count is right
  // Question for the setup step (zero error, initial reading or levelling). Unused when setup is 'none'.
  zeroQ: { si: 'TODO', en: 'TODO' },
  // zeroEx: [{ e: 0.3, fig: '1.8', si: '…', en: '…' }],   // handbook zero-error examples (setup 'zero' only)
  // "Setting up" paragraph above the procedure.
  setup: { si: 'TODO', en: 'TODO' },
  // Procedure steps, one list per activity.
  steps: [{ si: ['TODO'], en: ['TODO step 1'] }],

  // Readings. key: used by calcs; act: activity; table: handbook table no.; n: readings to take;
  // vals: the object's true size (mm) for each reading (the 3D object is built at this size);
  // mode / obj / pose / surf: passed to the rig's place(); heads: column headings (default (i), (ii)…);
  // rig: borrow another instrument for this reading; noMean: no mean column; dp: decimals.
  meas: [
    { key: 'L', act: 0, table: '__NN__.1', n: 3, mode: 'outer', obj: 'block', vals: [52.4, 52.6, 52.3], label: { si: 'TODO', en: 'Length L (mm)' } },
  ],
  // Calculations from the means. fn(means, labState) → number; f is the formula shown to students.
  calcs: [
    { act: 0, key: 'Lm', unit: 'mm', label: { si: 'TODO', en: 'Mean length' }, f: 'L = (L₁ + L₂ + L₃) / 3', fn: (m) => m.L },
  ],
  // Optional per calculation: tolAbs (accepted difference, e.g. for percentages, instead of 1.5 %),
  // work(means, labState) → text shown by the "Working" button.
  // Optional: info(labState) → { si, en, ta } line on the Readings page (e.g. the scale used);
  // resultTxt / disc: the handbook's own Results and Discussion text, when it differs from the usual one.
  // Note under the results.
  note: { si: 'TODO', en: 'TODO' },
};
