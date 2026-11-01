// Shared helpers for the practical / instrument scripts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const P_DIR = path.join(ROOT, 'src/practicals');
export const I_DIR = path.join(ROOT, 'src/instruments');
export const pad2 = (n) => String(n).padStart(2, '0');

export function args(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; out[k] = v; } else out._.push(a);
  }
  return out;
}
export const die = (msg) => { console.error(`\n✗ ${msg}\n`); process.exit(1); };
export const load = (rel) => import(path.join(ROOT, rel));

// Copy a template folder, replacing __KEY__ placeholders in every file.
export function copyTemplate(from, to, vars) {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    let s = fs.readFileSync(path.join(from, f), 'utf8');
    for (const [k, v] of Object.entries(vars)) s = s.split(`__${k}__`).join(v);
    fs.writeFileSync(path.join(to, f), s);
  }
  return fs.readdirSync(to).map((f) => path.relative(ROOT, path.join(to, f)));
}

export const practicalFolders = () => fs.readdirSync(P_DIR).filter((d) => /^p\d{2,}-/.test(d)).sort();
