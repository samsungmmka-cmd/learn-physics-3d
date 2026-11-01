// Scaffold a practical module and register it.
//   npm run new:practical -- <number> --inst <instrument> [--slug short-name]
// Creates src/practicals/pNN-<slug>/ from src/practicals/_template and adds it to src/practicals/index.js.
// The practical then shows as open in the app with TODO text, ready to fill from the handbook.
import fs from 'node:fs';
import path from 'node:path';
import { P_DIR, ROOT, args, copyTemplate, die, load, pad2, practicalFolders } from './lib.mjs';

const a = args();
const n = parseInt(a._[0], 10);
if (!n) die('Usage: npm run new:practical -- <number> --inst <instrument> [--slug short-name]');
const { PRAC } = await load('src/data/content.js');
const row = PRAC.find((p) => p[0] === String(n));
if (!row) die(`Practical ${n} is not in the handbook list (PRAC in src/data/content.js).`);
const NN = pad2(n);
const have = practicalFolders().find((d) => d.startsWith(`p${NN}-`));
if (have) die(`Practical ${n} already exists: src/practicals/${have}`);

const { INSTRUMENTS } = await load('src/instruments/index.js');
const inst = a.inst;
if (!inst || inst === true) die(`Pick the instrument with --inst. Available: ${Object.keys(INSTRUMENTS).join(', ')}.\nFor a new one, run: npm run new:instrument -- <type> --name "Instrument name"`);
if (!INSTRUMENTS[inst]) die(`No instrument "${inst}". Available: ${Object.keys(INSTRUMENTS).join(', ')}.\nCreate it first: npm run new:instrument -- ${inst} --name "Instrument name"`);

const title = row[3];
const slug = (typeof a.slug === 'string' ? a.slug : title.replace(/^using (the |a |an )?/i, ''))
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').split('-').filter(Boolean).slice(0, 4).join('-');
const folder = `p${NN}-${slug}`;
const files = copyTemplate(path.join(P_DIR, '_template'), path.join(P_DIR, folder), { NN, ID: String(n), TITLE: title, INST: inst });

// Register: keep the imports and the PRACTICALS list in practical-number order.
const regPath = path.join(P_DIR, 'index.js');
let reg = fs.readFileSync(regPath, 'utf8');
const imports = [...reg.matchAll(/^import (p\d+) from '\.\/(p\d+-[^/]+)\/index\.js';$/gm)];
const list = imports.map((m) => [m[1], m[2]]).concat([[`p${NN}`, folder]]).sort((x, y) => parseInt(x[0].slice(1), 10) - parseInt(y[0].slice(1), 10));
const block = list.map(([v, f]) => `import ${v} from './${f}/index.js';`).join('\n');
const first = imports[0], last = imports[imports.length - 1];
reg = reg.slice(0, first.index) + block + reg.slice(last.index + last[0].length);
reg = reg.replace(/export const PRACTICALS = \[[^\]]*\];/, `export const PRACTICALS = [${list.map(([v]) => v).join(', ')}];`);
fs.writeFileSync(regPath, reg);

console.log(`\n✓ Practical ${NN} · ${title}\n  instrument: ${inst}\n  created:\n${files.map((f) => `    ${f}`).join('\n')}\n  registered in src/practicals/index.js\n`);
console.log('Next: fill content.js from the handbook (si + en), ta.js (Tamil), start/share in index.js,\nthen run `npm run check` and `npm run smoke -- --only ' + n + '`.');
void ROOT;
