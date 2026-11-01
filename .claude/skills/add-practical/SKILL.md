---
name: add-practical
description: Add a new practical (or rebuild one) in Cubiphy from the A/L Physics Practical Handbook — check the practical number, build or reuse the 3D instrument, and fill every page (apparatus, theory, procedure, readings, results) in Sinhala, English and Tamil. Use when asked to "add practical N", "build practical N in 3D", or similar.
---

# Add a practical to Cubiphy

The user says something like **"add practical 10"**. You deliver a working, deployed practical:
a 3D instrument students can operate, and all five handbook pages in Sinhala, English and Tamil.
Read `CLAUDE.md` and `src/instruments/README.md` first.

## 1. Check the practical number

- Find the row for N in `PRAC` (`src/data/content.js`): `[id, group, Sinhala title, English title]`.
  No row → tell the user the handbook list has no practical N and stop.
- `ls src/practicals/` — if `pNN-*` already exists, this is an update, not a new practical. Ask
  whether to rebuild it before touching it.
- Tamil title: `TA_PRAC` in `src/data/ta-prac.js`.

## 2. Read the handbook for practical N

Never write handbook content from memory. Get the NIE *G.C.E. (A/L) Physics Practical Handbook* PDF:
1. a PDF attached to the conversation, or
2. the claude.ai project's files (`Projects` tool: `project_search` "practical handbook", then `project_read`), or
3. ask the user to attach it (one short question), and wait.

Find N in the contents pages, then read its pages **as images** (Read with `pages`; Sinhala text often
extracts badly with pdftotext). Note for each section:
- **Apparatus** (ද්‍රව්‍ය හා උපකරණ), **theory** (සිද්ධාන්තය) with formulas, **procedure** (ක්‍රියාපිළිවෙළ)
  per activity, **tables** (numbers, columns, how many readings), **calculations**, **notes/discussion**.
- Every **figure**: it decides how the 3D instrument and objects look and how readings are taken.

## 3. Decide the 3D

List what the student must handle and read. Then for each instrument:
- **Already in `src/instruments/`?** Reuse it. If the practical measures a new kind of object, add a new
  `obj` branch to that rig's `place()` without changing the existing branches.
- **New instrument?** `npm run new:instrument -- <type> --name "Name"` (camelCase type, e.g. `metreRule`,
  `stopwatch`, `sonometer`). The template is a working metre rule; replace its geometry.

Building a rig (contract in `src/instruments/README.md`):
- Real dimensions in **mm**; set `R.S` so it fills the mat (≈ 0.05 for a 300 mm object).
- Build from primitives: `RoundedBoxGeometry`, `lathe()` for turned parts, `extr()` for profiles, with the
  shared `mats()` (steel, chrome, brass, wood, glass, enamel…). Engrave scales with `engr()` + `scaleMat()`.
- One `anchor()` per labelled part, keys matching the practical's `parts`. Use `steadyAnchor()` on spinning parts.
- The moving part follows `R.set(v)`; `contact()` must become true when the object is touched correctly;
  `ideal()` is what a careful student reads; `loupe()` draws the magnified scale exactly like the real one
  (vernier lines must coincide the way the handbook figure shows); `hintText()` explains the reading in si/en/ta.
- Profile (`index.js`): `setup` (`zero` | `init` | `level` | `none`), `resolution`, `controls` with si/en/ta
  captions, `thumb`. Figures for the theory tab and notes above the input go in `ui.jsx` (SVG using
  `var(--ink)`, `var(--accent)`, `var(--muted)`), registered in `src/instruments/ui.js`.
- Look at the practical you are modelling alongside an existing rig (`caliper`, `micro`) for style.

**If the practical doesn't fit the pages' flow** (least count → setup → readings → means → calculations →
results) — e.g. it needs timing, a graph, or a circuit — tell the user what new page type it needs and ask
before changing the shared section components in `src/components/sections/`.

## 4. Scaffold and fill the practical

```bash
npm run new:practical -- <N> --inst <type>
```
This creates `src/practicals/pNN-<slug>/` and registers it. Then fill:
- **`content.js`** (si + en): every field is commented in the file. Sinhala is the handbook's own wording;
  English is a faithful translation. `acts` = the handbook's numbered parts; `steps` one list per activity;
  `meas` one per table row (`table` = handbook table number, `n` = readings, `vals` = true sizes in mm,
  realistic and slightly varied); `calcs` = the handbook's formulas (`fn(means, labState)`), `f` as printed.
- **`index.js`**: `start()` for what varies per student (zero error `e` from `pick([...])`, start position
  `S0`, positions); `share` = the results the class compares.
- **`ta.js`**: Tamil for every text, keyed by path (`'acts.0'`, `'parts.2.1'`, `'steps.1'`). Reuse the terms
  in the other practicals' `ta.js` so the vocabulary stays consistent. Add the Tamil title to
  `src/data/ta-prac.js` if it's missing.

## 5. Check, build, look

```bash
npm run check                 # 0 errors; no TODO; no missing Tamil (npm run check -- --ta lists gaps)
npm run smoke -- --only <N>   # renders every page, and takes each reading on the 3D instrument
```
Then **open the screenshots** in `.smoke/shots/` with Read and look at them: instrument recognisable
and in proportion, labels pointing at the right parts, loupe readable, objects the right size, nothing
overlapping. Fix and repeat. Finish with the full `npm run smoke` so the other practicals still pass.

## 6. Ship

- Work on a branch `practical-NN`; commit with a message listing what was added.
- Merge to `main` and push: Vercel deploys `main` automatically (project `learn-physics-3d`,
  live at https://cubiphy.vercel.app). Confirm the deployment is READY with the Vercel tools.

## 7. Report back (short)

What the student can now do, the live link, and what to review: object sizes you chose, any handbook
figure you simplified, and Tamil (and Sinhala) terms a teacher should check.
