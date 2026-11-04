// Registry of 3D instruments. Each folder holds one instrument:
//   rig.js    3D model built from code + the rig contract (see README.md)
//   loupe.js  the magnified-scale drawing
//   index.js  the profile: how the app treats readings taken with it
//   ui.jsx    optional React bits (theory figure, measuring note), registered in ./ui.js
// To add an instrument: make a folder, then add it here (and to ./ui.js if it has ui.jsx).
import caliper from './caliper/index.js';
import micro from './micro/index.js';
import sphero from './sphero/index.js';
import travel from './travel/index.js';
import forceBoard from './forceBoard/index.js';

export const INSTRUMENTS = { caliper, micro, sphero, travel, forceBoard };

// Defaults for anything a profile leaves out.
const BASE = { setup: 'none', zeroTol: 0.051, zeroDp: 1, resolution: 0.01, turnOne: null, theoryDemo: false, offMsg: null, thumb: { mode: 'show' } };
const cache = {};
export function instrument(type) {
  if (cache[type]) return cache[type];
  const p = INSTRUMENTS[type];
  if (!p) throw new Error(`Unknown instrument "${type}". Add it to src/instruments/index.js.`);
  return (cache[type] = { ...BASE, ...p });
}

// UI text key naming each setup step (the step after the least count).
export const SETUP_NAME = { zero: 'zero', init: 'init', level: 'levelT' };
// Correction rule for a reading: which setup value is taken off the raw reading.
// A measurement taken with a second instrument (m.rig) is recorded as read.
export function setupKind(lab, m) {
  if (m && m.rig && m.rig !== lab.inst) return 'raw';
  return instrument(lab.inst).setup;
}
// Only zero-error and initial-reading setups produce a separate "corrected reading".
export const hasCorr = (lab) => ['zero', 'init'].includes(instrument(lab.inst).setup);
