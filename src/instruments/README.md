# Instruments

Each folder here is one 3D instrument that practicals can use. A practical names its instrument in
`content.js` (`inst: 'caliper'`), and a single measurement can borrow a second one (`rig: 'caliper'`).

```
src/instruments/
  index.js          registry: add new instruments here
  ui.js             registry of React pieces (ui.jsx files)
  <type>/
    rig.js          the 3D model, built from code with three.js, plus the rig contract below
    loupe.js        draws the magnified scale (2D canvas)
    index.js        the profile: how the app treats readings taken with this instrument
    ui.jsx          optional: TheoryFig, MeasNote, PreMeas
```

Start a new one with `npm run new:instrument -- <type>`. It copies `_template/`, a working
example (a metre rule with a sliding marker) that already meets the contract, and registers it.

## Profile (`index.js`)

| Field | Meaning |
| --- | --- |
| `type` | Folder name, used as `inst` / `rig` in practicals. |
| `rig` | `(kit) => R`, from `./rig.js`. |
| `setup` | Step after the least count: `'zero'` (zero error, subtracted), `'init'` (initial reading, subtracted), `'level'` (levelling, readings recorded as read) or `'none'` (no setup step). |
| `zeroTol`, `zeroDp` | For `'zero'`: accepted error (mm) and decimals for the zero error. |
| `resolution` | Smallest reading in mm. Sets the tolerance for students' means. |
| `turnOne` | `{ step, max }` shows a "turn one revolution" button on the least-count card. |
| `theoryDemo` | The theory tab can show the handbook's zero-error examples on this instrument. |
| `controls` | `{ key: { label: {si,en,ta}, buttons: [{ t, v, s, ratchet? }] } }`: buttons under the 3D view. Hold moves at `v` mm/s, tap nudges `s` mm. The key defaults to `type`. |
| `ctrl(place)` | Optional: picks which `controls` key is active (e.g. horizontal vs vertical screw). |
| `place(ctx)` | Optional: returns the `place()` spec for a phase (`'show' | 'none' | 'setup' | 'meas'`). Without it, the measurement's `mode`, `obj`, `pose`, `vals` and `surf` are passed through. |
| `measHud(label, m, i)` | Optional: text on the 3D view while measuring. |
| `offMsg` | Optional UI key shown when the student records without contact. |
| `thumb` | `place()` spec for the home-page picture. |
| `preMeas` | Optional: a step each activity needs before its readings (e.g. drawing the parallelogram of forces). `{ done(ls, act) → bool, sample(ls, lab) → ls.pre }`; the card itself is `PreMeas({ act })` in `ui.jsx`. Readings stay locked until `done`; progress counts it; the smoke test uses `sample` as a finished state. |

## Rig contract (`rig.js`)

`export default function makeX(kit)` returns an object `R`. The engine passes `kit`:
`mats()` (shared PBR materials: steel, chrome, brass, wood, glass…), `mesh(geo, mat, x, y, z, parent)`,
`extr(points, depth, bevel)`, `lathe(points)`, `anchor(parent, x, y, z)`,
`steadyAnchor(spinner, x, y, z)`, `ctex(w, h, draw)`, `engr(w, h, bg, draw)` (engraved scale texture),
`scaleMat(tex)`, `clearGroup(g)`, `camera`, `root`, `tick()` (ratchet click), `DEG`, `rand`, `fmt`.
Import `three` yourself (not through the kit) so the build only bundles what is used.

| Member | Required | Meaning |
| --- | --- | --- |
| `type`, `S` | yes | Type name; world scale (scene units per mm, e.g. 0.064). |
| `root` | yes | `THREE.Group` holding the instrument and its objects. |
| `anchors` | yes | `{ partKey: Object3D }`, one per entry in the practical's `parts`. |
| `place(spec)` | yes | Show the instrument for a step (`spec.mode`, `spec.obj`, `spec.size`, `spec.ri`…). |
| `set(v)`, `value()` | yes | Move the moving part to `v` (mm, clamped) / where it is. |
| `reading()` | yes | What the scale shows now, including any zero error, mm. |
| `ideal()` | yes | The reading a careful student should write, rounded to the instrument. |
| `tol` | yes | Accepted difference from `ideal()`, mm. |
| `contact()` | yes | `true`/`false`, or `null` when contact doesn't apply. |
| `status()` | yes | `null` or `[cls, uiKey]` for the status chip (`'on'`, `''`, `'warn'`). |
| `step(dt)`, `nudge(d)` | yes | Move by velocity `vel` each frame / by `d` mm. |
| `focusObjs()` | yes | Objects the camera frames. |
| `loupe(c, w, h, hint)` | yes | Draw the magnified scale; highlight the coinciding line when `hint`. |
| `hintText(lang)` | yes | How to read the current reading (`'si' | 'en' | 'ta'`). |
| `dirty` | yes | Set `true` whenever the loupe needs redrawing. |
| `dragTargets`, `drag(dx, dy, start)` | no | Meshes the student can drag, and how a drag moves the part. |
| `setE(e)`, `setS0(v)` | no | Called before `place()` with the zero error / start position. |
| `squeeze` | no | Over-tightening amount; a reading can't be recorded while `> 0`. |
| `lensAt`, `onHint` | no | Loupe interaction (see the travelling microscope). |
| `pickTargets()`, `onPointer(phase, info)`, `cursor(info)` | no | Clicks, drags and hover on the rig's own objects: `phase` is `down` (return `true` to take the pointer), `move`, `up` or `hover`; `info` has `ray`, `hit`, `hits`, `dx`, `dy`. |
| `live(state)` | no | Takes `place().live` (state that changes as the student works) without rebuilding the scene or moving the camera. Report the student's actions with `kit.emit(name, data)`; pages listen with `getEngine().on(fn)`. |
| `quietLabels()` | no | `true` while part labels should step aside (e.g. while marking a paper that fills the view). |

Units are millimetres throughout the rig. Practicals in cm convert at the input (`lab.unit`).
