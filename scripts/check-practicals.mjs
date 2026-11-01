// Validate every registered practical and instrument: npm run check  (add --ta to list missing Tamil)
// Errors (exit 1): broken structure that would crash or mislead students.
// Warnings: unfinished work (TODO text, missing Tamil, calculations that give no number).
import fs from 'node:fs';
import path from 'node:path';
import { I_DIR, P_DIR, args, load, pad2, practicalFolders } from './lib.mjs';

const a = args();
const { PRACTICALS } = await load('src/practicals/index.js');
const { INSTRUMENTS, instrument } = await load('src/instruments/index.js');
const { PRAC } = await load('src/data/content.js');
const { TA_PRAC } = await load('src/data/ta-prac.js');

let errors = 0, warnings = 0;
const err = (where, msg) => { errors++; console.log(`  ✗ ${where}: ${msg}`); };
const warn = (where, msg) => { warnings++; console.log(`  ! ${where}: ${msg}`); };
const isText = (o) => o && typeof o === 'object' && 'en' in o && 'si' in o;
const filled = (v) => (Array.isArray(v) ? v.length && v.every(filled) : typeof v === 'string' && v.trim() !== '');
const todo = (v) => JSON.stringify(v).includes('TODO');

// ---------- instruments ----------
console.log('\nInstruments');
const RIG_MEMBERS = ['anchors', 'place', 'set', 'value', 'reading', 'ideal', 'tol', 'contact', 'status', 'step', 'nudge', 'focusObjs', 'loupe', 'hintText'];
const rigAnchors = {};
for (const [type, p] of Object.entries(INSTRUMENTS)) {
  const w = `instrument ${type}`;
  if (p.type !== type) err(w, `profile type is "${p.type}"`);
  if (typeof p.rig !== 'function') err(w, 'profile has no rig() from ./rig.js');
  if (!['zero', 'init', 'level', 'none'].includes(instrument(type).setup)) err(w, `setup must be zero | init | level | none`);
  const ctrls = p.controls || {};
  if (!ctrls[type] && !p.ctrl) err(w, `controls.${type} is missing (buttons under the 3D view)`);
  for (const [k, c] of Object.entries(ctrls)) {
    if (!isText(c.label)) err(w, `controls.${k}.label needs { si, en }`);
    if (!Array.isArray(c.buttons) || !c.buttons.length) err(w, `controls.${k}.buttons is empty`);
  }
  const rigFile = path.join(I_DIR, type, 'rig.js');
  const src = fs.existsSync(rigFile) ? fs.readFileSync(rigFile, 'utf8') : '';
  if (!src) { err(w, 'rig.js not found'); continue; }
  for (const m of RIG_MEMBERS) if (!new RegExp(`R\\.${m}\\s*=`).test(src)) err(w, `rig.js never sets R.${m} (see src/instruments/README.md)`);
  if (/from 'three'/.test(src) === false) warn(w, "rig.js should `import * as THREE from 'three'` itself");
  const block = (src.match(/R\.anchors\s*=\s*\{([\s\S]*?)\};/) || [])[1] || '';
  rigAnchors[type] = new Set([...block.matchAll(/(\w+)\s*:\s*(?:anchor|steadyAnchor)\(/g)].map((x) => x[1]));
  console.log(`  ✓ ${type}`);
}

// ---------- practicals ----------
console.log('\nPracticals');
const folders = practicalFolders();
const ids = new Set();
for (const P of PRACTICALS) {
  const NN = pad2(P.id), w = `P${NN}`, lab = P.lab;
  const folder = folders.find((d) => d.startsWith(`p${NN}-`));
  if (!folder) err(w, `no folder src/practicals/p${NN}-*`);
  if (ids.has(P.id)) err(w, 'registered twice'); ids.add(P.id);
  const row = PRAC.find((r) => r[0] === String(P.id));
  if (!row) err(w, 'not in the handbook list (PRAC in src/data/content.js)');
  else if (!TA_PRAC[row[0]]) warn(w, 'no Tamil title in src/data/ta-prac.js');
  if (!lab || typeof lab !== 'object') { err(w, 'no lab content'); continue; }
  if (!INSTRUMENTS[lab.inst]) { err(w, `inst "${lab.inst}" is not a registered instrument`); continue; }
  const I = instrument(lab.inst);
  if (!['mm', 'cm'].includes(lab.unit)) err(w, `unit must be 'mm' or 'cm'`);
  for (const k of ['dp', 'lcAns']) if (typeof lab[k] !== 'number') err(w, `${k} must be a number`);
  for (const k of ['materials', 'theory', 'lcQ', 'setup', 'note']) if (!isText(lab[k])) err(w, `${k} needs { si, en }`);
  if (I.setup !== 'none' && !isText(lab.zeroQ)) err(w, `zeroQ needs { si, en } (setup step: ${I.setup})`);
  if (lab.zeroEx && I.setup !== 'zero') warn(w, `zeroEx is only used with setup 'zero'`);
  if (!Array.isArray(lab.acts) || !lab.acts.length) { err(w, 'acts is empty'); continue; }
  lab.acts.forEach((x, i) => { if (!isText(x)) err(w, `acts.${i} needs { si, en }`); });
  if (!Array.isArray(lab.steps) || lab.steps.length !== lab.acts.length) err(w, `steps needs one entry per activity (${lab.acts.length})`);
  (lab.steps || []).forEach((s, i) => { if (!isText(s) || !Array.isArray(s.en) || !Array.isArray(s.si)) err(w, `steps.${i} needs { si: [...], en: [...] }`); });
  // parts ↔ rig anchors
  (lab.parts || []).forEach(([k, n], i) => {
    if (!isText(n)) err(w, `parts.${i} name needs { si, en }`);
    if (rigAnchors[lab.inst] && rigAnchors[lab.inst].size && !rigAnchors[lab.inst].has(k)) err(w, `part "${k}" has no anchor in instruments/${lab.inst}/rig.js (has: ${[...rigAnchors[lab.inst]].join(', ')})`);
  });
  // measurements
  const keys = new Set();
  (lab.meas || []).forEach((m, i) => {
    const mw = `${w} meas.${i} (${m.key})`;
    if (!m.key || keys.has(m.key)) err(mw, 'key missing or repeated'); keys.add(m.key);
    if (!(m.act >= 0 && m.act < lab.acts.length)) err(mw, `act ${m.act} is not an activity`);
    if (!(m.n >= 1)) err(mw, 'n must be at least 1');
    if (!isText(m.label)) err(mw, 'label needs { si, en }');
    if (m.rig && !INSTRUMENTS[m.rig]) err(mw, `rig "${m.rig}" is not a registered instrument`);
    const Q = instrument(m.rig || lab.inst);
    if (!Q.place && (!Array.isArray(m.vals) || !m.vals.length)) err(mw, 'vals (true sizes in mm) are needed to build the 3D object');
    if (m.heads && m.heads.length < m.n) err(mw, `heads has ${m.heads.length} entries for ${m.n} readings`);
  });
  lab.acts.forEach((x, i) => { if (!(lab.meas || []).some((m) => m.act === i)) err(w, `activity ${i + 1} has no measurements`); });
  // calculations: run each on the true values
  const means = {}; (lab.meas || []).forEach((m) => { if (m.vals) means[m.key] = (m.vals.reduce((s, v) => s + v, 0) / m.vals.length) / (lab.unit === 'cm' ? 10 : 1); });
  const ls = { N: 20, rec: {}, ...((P.start && P.start({ pick: (l) => l[0], rand: (x) => x })) || {}) };
  (lab.meas || []).forEach((m) => { ls.rec[m.key] = (m.vals || []).map((v) => ({ raw: v, corr: v })); });
  const ckeys = new Set();
  (lab.calcs || []).forEach((c, i) => {
    const cw = `${w} calcs.${i} (${c.key})`;
    if (!c.key || ckeys.has(c.key) || keys.has(c.key)) err(cw, 'key missing or clashes with another key'); ckeys.add(c.key);
    if (!(c.act >= 0 && c.act < lab.acts.length)) err(cw, `act ${c.act} is not an activity`);
    if (typeof c.fn !== 'function') { err(cw, 'fn must be a function (means, labState) => number'); return; }
    if (!isText(c.label)) err(cw, 'label needs { si, en }');
    if (typeof c.unit !== 'string' || typeof c.f !== 'string') err(cw, 'unit and f (formula text) are needed');
    if (!(lab.meas || []).filter((m) => m.act === c.act).every((m) => m.vals)) return; // positions come from the rig (no true values to test with)
    let v; try { v = c.fn(means, ls); } catch (e) { err(cw, `fn throws: ${e.message}`); return; }
    if (!Number.isFinite(v)) warn(cw, `gives ${v} from the true values; check the formula and measurement keys`);
  });
  for (const k of P.share || []) if (!keys.has(k) && !ckeys.has(k)) err(w, `share key "${k}" is not a measurement or calculation`);
  // text completeness
  const walk = (o, p, out) => {
    if (isText(o)) { out.push([p, o]); return; }
    if (Array.isArray(o)) o.forEach((x, i) => walk(x, p ? `${p}.${i}` : String(i), out));
    else if (o && typeof o === 'object') Object.entries(o).forEach(([k, x]) => walk(x, p ? `${p}.${k}` : k, out));
  };
  const texts = []; walk(lab, '', texts);
  const noTa = [];
  for (const [p, o] of texts) {
    if (!filled(o.en)) err(w, `${p}: English text is empty`);
    if (!filled(o.si)) err(w, `${p}: Sinhala text is empty`);
    if (todo(o.en) || todo(o.si)) warn(w, `${p}: still has TODO text`);
    if (!filled(o.ta)) noTa.push(p);
  }
  for (const k of Object.keys(P.ta || {})) {
    const o = k.split('.').reduce((x, s) => (x == null ? x : x[s]), lab);
    if (!isText(o)) err(w, `ta.js key "${k}" doesn't match any { si, en } text in content.js`);
  }
  if (noTa.length) {
    warn(w, `${noTa.length} of ${texts.length} texts have no Tamil yet${a.ta ? '' : ' (npm run check -- --ta lists them)'}`);
    if (a.ta) noTa.forEach((p) => console.log(`      ${p}`));
  }
  console.log(`  ${errors ? '·' : '✓'} ${w} ${lab.inst} · ${lab.acts.length} activities · ${(lab.meas || []).length} measurements · ${(lab.calcs || []).length} calculations`);
}
for (const d of folders) if (!PRACTICALS.some((P) => d.startsWith(`p${pad2(P.id)}-`))) err(d, 'folder exists but is not registered in src/practicals/index.js');
void P_DIR;

console.log(`\n${errors ? `✗ ${errors} error(s)` : '✓ No errors'}${warnings ? `, ${warnings} warning(s)` : ''}\n`);
process.exit(errors ? 1 : 0);
