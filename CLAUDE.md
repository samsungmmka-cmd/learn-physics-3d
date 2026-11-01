# Cubiphy (learn-physics-3d)

Interactive 3D physics practicals for G.C.E. (A/L) students, following the NIE *Physics Practical
Handbook*, in Sinhala, English and Tamil, with a class community. React 18 + Vite 5 + three.js r147.
Live at https://cubiphy.vercel.app (Vercel project `learn-physics-3d`; every push to `main` deploys).
The API is in `/backend` (see `backend/README.md`), deployed separately as `learn-physics-api`.

## Adding a practical

Use the **add-practical** skill (`.claude/skills/add-practical/SKILL.md`): "add practical N" means
check N in the handbook, build or reuse the 3D instrument, fill all pages in three languages, check, ship.

## Layout

```
src/practicals/      one folder per built practical (pNN-name/: index.js, content.js, ta.js) + index.js registry
src/instruments/     one folder per 3D instrument (rig.js, loupe.js, index.js profile, ui.jsx) + registries
                     README.md = the rig contract and profile fields
src/engine/engine.js the shared WebGL stage: lighting, camera, labels, loupe loop. Never names an instrument.
src/components/      app shell, Home, Lab and its five handbook sections (sections/), Community
src/lib/             state (labStore), calc, scene (what the 3D stage shows per step), i18n, API client
src/data/            UI strings, the handbook's list of all 42 practicals (PRAC), Tamil UI text
scripts/             new-practical, new-instrument, check-practicals, smoke
```

A practical listed in `PRAC` but not registered in `src/practicals/index.js` shows as "coming soon".

## Commands

```bash
npm run dev                                   # local app (practicals work without the API)
npm run check                                 # validate practicals + instruments
npm run smoke [-- --only N] [-- --langs en,si,ta]   # browser test of every page; screenshots in .smoke/shots/
npm run new:practical -- N --inst <type>      # scaffold a practical
npm run new:instrument -- <type> --name "…"   # scaffold a 3D instrument
npm run build
```

## Conventions

- Every student-facing text is `{ si, en }` (+ `ta` from the practical's `ta.js` or `src/data/ta-*.js`).
  Sinhala follows the handbook's wording.
- Rigs work in millimetres; a practical's `unit` (`mm`/`cm`) applies only to what students type.
- Shared components must not check for a specific practical id or instrument type. Put the difference in
  the instrument profile or the practical module instead.
- Before pushing: `npm run check` and `npm run smoke` pass, and you have looked at the screenshots.
