// Smoke test in a real browser: builds the app, opens every page of every practical, and checks that
// each measurement can actually be taken on the 3D instrument.
//   npm run smoke                     all practicals, English
//   npm run smoke -- --only 5         one practical
//   npm run smoke -- --langs en,si,ta also render Sinhala and Tamil
// Screenshots go to .smoke/shots/ (look at them). Needs Chrome: set CHROME_PATH, or
// `npx playwright install chromium`.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { build } from 'vite';
import { chromium } from 'playwright-core';
import { ROOT, args, load, pad2 } from './lib.mjs';

const a = args();
const only = a.only ? String(a.only).split(',').map(Number) : null;
const langs = typeof a.langs === 'string' ? a.langs.split(',') : ['en'];
const OUT = path.join(ROOT, '.smoke'), DIST = path.join(OUT, 'dist'), SHOTS = path.join(OUT, 'shots');
fs.rmSync(SHOTS, { recursive: true, force: true }); fs.mkdirSync(SHOTS, { recursive: true });

console.log('Building…');
await build({ root: ROOT, logLevel: 'error', build: { outDir: DIST, emptyOutDir: true } });

const { PRACTICALS } = await load('src/practicals/index.js');
const { instrument } = await load('src/instruments/index.js');
const list = PRACTICALS.filter((P) => !only || only.includes(P.id));
if (!list.length) { console.error('No matching practicals.'); process.exit(1); }

// ---------- lab states ----------
const fresh = (P) => ({ lc: false, zero: instrument(P.lab.inst).setup === 'none', e: 0, S0: 0, S0rec: null, act: 0, mk: null, rec: {}, means: {}, calc: {}, N: 20, notes: '', ...(P.start ? P.start({ pick: (l) => l[0], rand: (x, y) => (x + y) / 2 }) : {}) });
// With a step before the readings (preMeas, e.g. drawing the parallelogram of forces), use the profile's finished sample.
const ready = (P) => { const s = fresh(P); s.lc = true; s.zero = true; const I = instrument(P.lab.inst); if (I.setup === 'init') s.S0rec = s.S0; if (I.preMeas && I.preMeas.sample) s.pre = I.preMeas.sample(s, P.lab); return s; };
const full = (P) => {
  const s = ready(P);
  for (const m of P.lab.meas) {
    s.rec[m.key] = Array.from({ length: m.n }, (_, i) => { const v = m.vals ? m.vals[i % m.vals.length] / (P.lab.unit === 'cm' ? 10 : 1) : 1 + i * 0.1; return { raw: v, corr: v }; });
    if (m.n > 1 && !m.noMean) s.means[m.key] = { v: String(s.rec[m.key][0].corr), ok: true };
  }
  for (const c of P.lab.calcs) s.calc[c.key] = { v: '1.00', ok: true };
  return s;
};
const labsWith = (P, ls) => Object.fromEntries(PRACTICALS.map((Q) => [Q.id, Q.id === P.id ? ls : fresh(Q)]));

const pages = [];
const first = list[0];
pages.push({ name: 'home', st: { view: 'home', cur: first.id, sec: 0, labs: labsWith(first, fresh(first)) }, sel: 'main' });
pages.push({ name: 'list', st: { view: 'list', cur: first.id, sec: 0, labs: labsWith(first, fresh(first)) }, sel: 'main' });
for (const P of list) {
  const NN = pad2(P.id);
  for (let sec = 0; sec < 5; sec++) pages.push({ name: `p${NN}-s${sec + 1}-start`, st: { view: 'lab', cur: P.id, sec, labs: labsWith(P, fresh(P)) }, sel: '.labgrid' });
  pages.push({ name: `p${NN}-s3-setup`, st: { view: 'lab', cur: P.id, sec: 2, labs: labsWith(P, { ...fresh(P), lc: true }) }, sel: '.labgrid' });
  if (instrument(P.lab.inst).preMeas) P.lab.acts.forEach((x, a) => pages.push({ name: `p${NN}-s3-pre${a + 1}`, st: { view: 'lab', cur: P.id, sec: 2, labs: labsWith(P, { ...ready(P), act: a, pre: a ? { 0: ready(P).pre[0] } : {} }) }, sel: '.labgrid' }));
  for (const m of P.lab.meas) pages.push({ name: `p${NN}-s3-${m.key}`, st: { view: 'lab', cur: P.id, sec: 2, labs: labsWith(P, { ...ready(P), act: m.act, mk: m.key }) }, sel: '.labgrid', rig: true });
  for (let sec = 3; sec < 5; sec++) pages.push({ name: `p${NN}-s${sec + 1}-done`, st: { view: 'lab', cur: P.id, sec, labs: labsWith(P, full(P)) }, sel: '.labgrid' });
}

// ---------- serve + browse ----------
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((req, res) => {
  let p = path.join(DIST, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(DIST) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const port = srv.address().port;
const exe = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

let fails = 0;
for (const lang of langs) {
  for (const pg of pages) {
    if (lang !== 'en' && !pg.name.startsWith('p')) continue;
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
    // Offline: block fonts and the API so pages load fast and the test doesn't depend on the network.
    await ctx.route((u) => !/^https?:\/\/localhost[:/]/.test(u.href), (r) => r.abort());
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e.message || e)));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::|fetch|api/i.test(m.text())) errs.push(m.text()); });
    await page.addInitScript(([st, l]) => { if (!sessionStorage.getItem('smoke')) { localStorage.clear(); localStorage.setItem('quanta-practicals-v1', st); localStorage.setItem('quanta-lang', l); sessionStorage.setItem('smoke', '1'); } }, [JSON.stringify(pg.st), lang]);
    await page.goto(`http://localhost:${port}/?debug`, { waitUntil: 'domcontentloaded' });
    const ok = await page.waitForSelector(pg.sel, { timeout: 45000 }).then(() => true, () => false);
    if (!ok) errs.push(`page did not render (${pg.sel} missing)`);
    await page.waitForTimeout(1200);
    const name = `${lang}-${pg.name}`;
    if (ok) {
      const shot = await (await page.$(pg.sel)).screenshot({ path: path.join(SHOTS, `${name}.png`) });
      if (pg.sel === '.labgrid') {
        const canvas = await page.$('.stage-host canvas');
        if (!canvas) errs.push('no 3D canvas');
        else if ((await canvas.screenshot()).length < 12000) errs.push('3D view looks blank');
        const txt = await page.evaluate(() => document.querySelector('.panel .body')?.innerText || '');
        if (txt.trim().length < 20) errs.push('handbook panel is empty');
      }
      void shot;
    }
    // The measurement can really be taken: move the instrument until it touches, then read it.
    if (ok && pg.rig && lang === 'en') {
      const r = await page.evaluate(() => {
        const R = window.__engine && window.__engine.rig; if (!R) return { err: 'no rig on stage' };
        try {
          const v0 = R.value(); let found = null;
          for (let v = -5; v <= 320 && found === null; v += 0.02) { R.set(v); if (R.contact()) found = R.value(); }
          const out = { type: R.type, found };
          if (found !== null) { out.ideal = R.ideal(); out.hint = R.hintText('en'); out.status = R.status(); }
          const cv = document.createElement('canvas'); cv.width = 320; cv.height = 140; R.loupe(cv.getContext('2d'), 320, 140, true);
          R.set(v0); return out;
        } catch (e) { return { err: String(e) }; }
      });
      if (r.err) errs.push(`rig: ${r.err}`);
      else if (r.found === null) errs.push(`rig ${r.type}: never touches the object (contact() stays false)`);
      else if (!Number.isFinite(r.ideal) || !r.hint) errs.push(`rig ${r.type}: ideal() or hintText() is empty at contact`);
    }
    if (errs.length) { fails++; console.log(`✗ ${name}\n    ${errs.join('\n    ')}`); } else console.log(`✓ ${name}`);
    await ctx.close();
  }
}
await browser.close(); srv.close();
console.log(`\n${fails ? `✗ ${fails} page(s) failed` : '✓ All pages passed'} · screenshots in .smoke/shots/\n`);
process.exit(fails ? 1 : 0);
