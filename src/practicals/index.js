// Registry of built practicals. One folder per practical (pNN-short-name):
//   index.js    id, start state, shared results
//   content.js  handbook content in Sinhala + English: apparatus, theory, steps, measurements, calculations
//   ta.js       Tamil text, keyed by path inside content.js
// Practicals listed in src/data/content.js (PRAC) but not registered here show as "coming soon".
// To add one: `npm run new:practical -- <number>` (see .claude/skills/add-practical/SKILL.md).
import p01 from './p01-vernier-caliper/index.js';
import p02 from './p02-micrometer-screw-gauge/index.js';
import p03 from './p03-spherometer/index.js';
import p04 from './p04-travelling-microscope/index.js';

export const PRACTICALS = [p01, p02, p03, p04];

// Tamil: copy each `ta` entry onto the matching {si, en} object in the lab content.
const at = (root, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), root);
for (const p of PRACTICALS) {
  for (const [path, v] of Object.entries(p.ta || {})) {
    const o = at(p.lab, path);
    if (o && typeof o === 'object' && 'en' in o && v != null) o.ta = v;
  }
}

// LABS[id] = lab content, the shape every page reads.
export const LABS = Object.fromEntries(PRACTICALS.map((p) => [p.id, p.lab]));
export const practical = (id) => PRACTICALS.find((p) => p.id === +id);
