// React pieces that belong to an instrument (kept apart from ./index.js so the 3D engine never loads React code).
// Each entry may provide: TheoryFig (figure on the theory tab), MeasNote({ m, i }) (note above the reading input).
import * as sphero from './sphero/ui.jsx';
import * as travel from './travel/ui.jsx';

const UI = { sphero, travel };
export const instrumentUI = (type) => UI[type] || {};
