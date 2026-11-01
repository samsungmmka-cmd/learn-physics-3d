// Scaffold a 3D instrument module and register it.
//   npm run new:instrument -- <type> --name "Instrument name"
// Creates src/instruments/<type>/ from src/instruments/_template (a working metre rule with a sliding
// cursor that already meets the rig contract) and adds it to src/instruments/index.js.
import fs from 'node:fs';
import path from 'node:path';
import { I_DIR, args, copyTemplate, die } from './lib.mjs';

const a = args();
const type = a._[0];
if (!type || !/^[a-z][a-zA-Z0-9]*$/.test(type)) die('Usage: npm run new:instrument -- <type> --name "Instrument name"   (type: camelCase letters, e.g. metreRule, stopwatch)');
if (fs.existsSync(path.join(I_DIR, type))) die(`src/instruments/${type} already exists.`);
const name = typeof a.name === 'string' ? a.name : type;
const files = copyTemplate(path.join(I_DIR, '_template'), path.join(I_DIR, type), { TYPE: type, NAME: name });
// The rig's function name: make + PascalCase type.
const rigPath = path.join(I_DIR, type, 'rig.js');
fs.writeFileSync(rigPath, fs.readFileSync(rigPath, 'utf8').replace(`function make${type}(`, `function make${type[0].toUpperCase()}${type.slice(1)}(`));

const regPath = path.join(I_DIR, 'index.js');
let reg = fs.readFileSync(regPath, 'utf8');
const imps = [...reg.matchAll(/^import (\w+) from '\.\/(\w+)\/index\.js';$/gm)];
const last = imps[imps.length - 1];
reg = reg.slice(0, last.index + last[0].length) + `\nimport ${type} from './${type}/index.js';` + reg.slice(last.index + last[0].length);
reg = reg.replace(/export const INSTRUMENTS = \{([^}]*)\};/, (m, inner) => `export const INSTRUMENTS = { ${inner.trim()}, ${type} };`);
fs.writeFileSync(regPath, reg);

console.log(`\n✓ Instrument "${type}" (${name})\n  created:\n${files.map((f) => `    ${f}`).join('\n')}\n  registered in src/instruments/index.js\n`);
console.log('Next: model the real instrument in rig.js, its scale in loupe.js, and its behaviour in index.js\n(see src/instruments/README.md). If you add ui.jsx, register it in src/instruments/ui.js.');
