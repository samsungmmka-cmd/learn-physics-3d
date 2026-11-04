// React pieces that belong to an instrument (kept apart from ./index.js so the 3D engine never loads React code).
// Each entry may provide: TheoryFig (figure on the theory tab), MeasNote({ m, i }) (note above the reading input),
// PreMeas({ act }) (a step each activity needs before its readings; the profile's preMeas.done says when it is finished).
import * as sphero from './sphero/ui.jsx';
import * as travel from './travel/ui.jsx';
import * as forceBoard from './forceBoard/ui.jsx';

const UI = { sphero, travel, forceBoard };
export const instrumentUI = (type) => UI[type] || {};
