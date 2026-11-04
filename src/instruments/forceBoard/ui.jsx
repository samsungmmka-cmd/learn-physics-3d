// Force board: React pieces shown in the handbook pages.
//  TheoryFig: figures 5.1–5.3.
//  PreMeas: the step before each reading: weights, the free-running check, marking the strings and
//           drawing the parallelogram to scale. The reading (OC) is locked until this is done.
import { useRef, useState } from 'react';
import { useT } from '../../lib/i18n.jsx';
import { useLab } from '../../lib/labStore.jsx';
import { getEngine } from '../../engine/engine.js';
import { forces, dir, diagonal, OC_MIN, OC_MAX } from './physics.js';

const T = {
  stepW: { si: 'භාර සකස් කිරීම', en: 'Set up the weights', ta: 'நிறைகளை அமைத்தல்' },
  wQ: { si: 'තැටිවල ස්කන්ධ අදාළ භාරවලට එකතු කර w₁, w₂ හා w₃ ලියන්න.', en: 'Add each pan’s mass to the masses on it, and enter w₁, w₂ and w₃.', ta: 'ஒவ்வொரு தட்டின் திணிவையும் அதிலுள்ள திணிவுகளுடன் கூட்டி w₁, w₂, w₃ ஐ எழுதவும்.' },
  pan: { si: 'තැටිය', en: 'Pan', ta: 'தட்டு' },
  panM: { si: 'තැටියේ ස්කන්ධය (g)', en: 'Pan mass (g)', ta: 'தட்டின் திணிவு (g)' },
  slotM: { si: 'දැමූ ස්කන්ධ (g)', en: 'Masses on it (g)', ta: 'இட்ட திணிவுகள் (g)' },
  total: { si: 'භාරය (g)', en: 'Weight (g)', ta: 'நிறை (g)' },
  object: { si: 'වස්තුව', en: 'object', ta: 'பொருள்' },
  wrongW: { si: 'නැවත එකතු කරන්න: තැටියේ ස්කන්ධය + තැටියට දැමූ ස්කන්ධ.', en: 'Add again: pan mass + the masses on the pan.', ta: 'மீண்டும் கூட்டவும்: தட்டின் திணிவு + தட்டிலுள்ள திணிவுகள்.' },
  act1W: { si: 'w₁ හා w₂ පෙර පරිදි ම ය. w₃ හි ස්කන්ධ ඉවත් කර, ඒ තැටියට සපයා ඇති වස්තුව දමා ඇත.', en: 'w₁ and w₂ are as before. The masses of w₃ are taken off and the object is put in that pan.', ta: 'w₁, w₂ முன்பு போலவே. w₃ இன் திணிவுகள் அகற்றப்பட்டு, தரப்பட்ட பொருள் அத்தட்டில் இடப்பட்டுள்ளது.' },
  needAct0: { si: 'පළමුව 1 වන ක්‍රියාකාරකම සම්පූර්ණ කරන්න: මෙම ඇඳීමට එහි පරිමාණය ම භාවිත කළ යුතු ය.', en: 'Finish activity 1 first: this drawing uses the same scale.', ta: 'முதலில் செயற்பாடு 1 ஐ முடிக்கவும்: இவ்வரைபுக்கும் அதே அளவுத்திட்டம் தேவை.' },
  stepP: { si: 'ඝර්ෂණය පරීක්ෂා කිරීම', en: 'Check the pulleys run freely', ta: 'கப்பிகள் சுதந்திரமாகச் சுழல்கின்றனவா எனச் சரிபார்த்தல்' },
  pullBtn: { si: 'මැද භාරය මදක් පහළට ඇද මුදා හරින්න', en: 'Pull the middle pan down a little and let go', ta: 'நடுத் தட்டைச் சிறிது கீழே இழுத்து விடவும்' },
  pullOk: { si: 'එය පළමු තිබූ පිහිටීමට නැවත පැමිණියේ ය: කප්පි නිදහසේ කරකැවේ.', en: 'It came back to where it was: the pulleys turn freely.', ta: 'அது முன்பிருந்த இடத்துக்கே திரும்பியது: கப்பிகள் சுதந்திரமாகச் சுழல்கின்றன.' },
  stepM: { si: 'තන්තු සලකුණු කිරීම', en: 'Mark the strings', ta: 'இழைகளைக் குறித்தல்' },
  markInfo: { si: 'තල දර්පණ තීරුව තන්තුවට යටින් තබා, තන්තුවෙන් එහි ප්‍රතිබිම්බය වැසී යන සේ බලා, කඩදාසිය මත තන්තුව යටින් තිතක් තබන්න. එක් එක් තන්තුව යටින් හැකි තරම් දුරින් තිත් දෙක බැගින් තබන්න.', en: 'Put the mirror strip under a string and look so that the string hides its own image, then mark a dot on the paper under the string. Make two dots, as far apart as you can, under each string.', ta: 'ஆடிப்பட்டையை இழையின் கீழ் வைத்து, இழை தனது விம்பத்தை மறைக்குமாறு பார்த்து, இழையின் கீழ் தாளில் ஒரு புள்ளியிடவும். ஒவ்வோர் இழையின் கீழும் இயன்றவரை தொலைவில் இரு புள்ளிகளை இடவும்.' },
  markBtn: { si: 'එක් එක් තන්තුව යටින් තිත් දෙක බැගින් තබන්න', en: 'Mark two dots under each string', ta: 'ஒவ்வோர் இழையின் கீழும் இரு புள்ளிகளை இடவும்' },
  stepD: { si: 'සමාන්තරාස්‍රය ඇඳීම', en: 'Draw the parallelogram', ta: 'இணைகரத்தை வரைதல்' },
  drawInfo: { si: 'කඩදාසිය පුවරුවෙන් ඉවත් කර තිත් හරහා රේඛා අඳින්න. ඒවා O හි හමු වේ.', en: 'Take the paper off the board and draw lines through the dots. They meet at O.', ta: 'தாளைப் பலகையிலிருந்து அகற்றி, புள்ளிகளூடாகக் கோடுகளை வரையவும். அவை O இல் சந்திக்கும்.' },
  scaleL: { si: 'පරිමාණය: 1 cm =', en: 'Scale: 1 cm represents', ta: 'அளவுத்திட்டம்: 1 cm =' },
  scaleSame: { si: 'පළමු වන පරිමාණය ම', en: 'Same scale as activity 1', ta: 'செயற்பாடு 1 இன் அதே அளவுத்திட்டம்' },
  tooSmall: { si: 'මෙම පරිමාණයෙන් ඇඳීම කුඩා වැඩිය; මිනුමේ දෝෂය වැඩි වේ. 1 cm කට අඩු ග්‍රෑම් ගණනක් තෝරන්න.', en: 'At this scale the drawing is too small to measure well. Choose fewer grams per cm.', ta: 'இந்த அளவுத்திட்டத்தில் வரைபு மிகச் சிறியது; நன்றாக அளக்க முடியாது. ஒரு cm க்குக் குறைந்த கிராம்களைத் தெரிவு செய்யவும்.' },
  tooBig: { si: 'මෙම පරිමාණයෙන් ඇඳීම A4 කඩදාසියට නොගැළපේ. 1 cm කට වැඩි ග්‍රෑම් ගණනක් තෝරන්න.', en: 'At this scale the drawing won’t fit on the A4 sheet. Choose more grams per cm.', ta: 'இந்த அளவுத்திட்டத்தில் வரைபு A4 தாளில் அடங்காது. ஒரு cm க்குக் கூடுதல் கிராம்களைத் தெரிவு செய்யவும்.' },
  lenInfo: { si: 'OA හා OB, පරිමාණයට අනුව w₁ හා w₂ වන සේ A හා B රේඛා දිගේ අදින්න (නැතහොත් දිග ලියන්න).', en: 'Drag A and B along the lines (or type the lengths) so that OA and OB are w₁ and w₂ to scale.', ta: 'OA, OB என்பன அளவுத்திட்டப்படி w₁, w₂ ஆகுமாறு A, B ஐக் கோடுகள் வழியே இழுக்கவும் (அல்லது நீளங்களை எழுதவும்).' },
  badA: { si: 'OA, පරිමාණයට අනුව w₁ නොවේ. w₁ ÷ පරිමාණය ගණනය කරන්න.', en: 'OA isn’t w₁ to scale. Work out w₁ ÷ scale.', ta: 'OA அளவுத்திட்டப்படி w₁ அல்ல. w₁ ÷ அளவுத்திட்டம் ஐக் கணிக்கவும்.' },
  badB: { si: 'OB, පරිමාණයට අනුව w₂ නොවේ. w₂ ÷ පරිමාණය ගණනය කරන්න.', en: 'OB isn’t w₂ to scale. Work out w₂ ÷ scale.', ta: 'OB அளவுத்திட்டப்படி w₂ அல்ல. w₂ ÷ அளவுத்திட்டம் ஐக் கணிக்கவும்.' },
  offSheet: { si: 'රේඛාව කඩදාසියෙන් පිටතට යයි. 1 cm කට වැඩි ග්‍රෑම් ගණනක් තෝරන්න.', en: 'That runs off the sheet. Choose more grams per cm.', ta: 'அது தாளுக்கு வெளியே செல்கிறது. ஒரு cm க்குக் கூடுதல் கிராம்களைத் தெரிவு செய்யவும்.' },
  ready: { si: 'නිවැරදියි. දැන් සමාන්තරාස්‍රය සම්පූර්ණ කරන්න.', en: 'Right. Now complete the parallelogram.', ta: 'சரி. இப்போது இணைகரத்தைப் பூர்த்தி செய்யவும்.' },
  complete: { si: 'සමාන්තරාස්‍රය සම්පූර්ණ කරන්න', en: 'Complete the parallelogram', ta: 'இணைகரத்தைப் பூர்த்தி செய்யவும்' },
};

const VB_W = 297, VB_H = 210, OX = 148.5, OY = 185; // A4 landscape in mm; O 25 mm above the bottom edge
const toSvg = (p) => [OX + p[0] * 10, OY - p[1] * 10]; // drawing cm (y up) → svg mm
// How far (mm) a line from O in direction u can run before leaving the sheet.
const reach = (u) => Math.min(u[0] ? (VB_W / 2 - 4) / Math.abs(u[0]) : 1e9, u[1] > 0 ? (OY - 4) / u[1] : 1e9);

function Drawing({ f, OA, OB, label, done, onSet }) {
  const svg = useRef(null); const drag = useRef(null);
  const u1 = dir(f.m1, -1), u2 = dir(f.m2, 1);
  const end = (u) => toSvg([(u[0] * reach(u)) / 10, (u[1] * reach(u)) / 10]);
  const dots = [[u1, 30], [u1, 150], [u2, 30], [u2, 150], [[0, -1], 8], [[0, -1], 18]].map(([u, d]) => toSvg([(u[0] * d) / 10, (u[1] * d) / 10]));
  const D = diagonal(OA || 0, OB || 0, f.m1, f.m2);
  const A = toSvg(D.A), B = toSvg(D.B), C = toSvg(D.C), O = toSvg([0, 0]);
  const at = (e) => { const s = svg.current; const p = s.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(s.getScreenCTM().inverse()); return [(q.x - OX) / 10, (OY - q.y) / 10]; };
  const down = (which) => (e) => { if (done) return; e.preventDefault(); drag.current = which; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e) => {
    const w = drag.current; if (!w) return; const u = w === 'A' ? u1 : u2; const p = at(e);
    const t = Math.max(0.5, Math.min(reach(u) / 10, p[0] * u[0] + p[1] * u[1]));
    onSet(w, Math.round(t * 10) / 10);
  };
  const up = () => { drag.current = null; };
  const lbl = (p, t, dx, dy) => <text x={p[0] + dx} y={p[1] + dy} fontSize="9" fontStyle="italic" fontWeight="700" fontFamily="Georgia, serif" fill="var(--ink)" textAnchor="middle">{t}</text>;
  return (
    <svg ref={svg} className="fig fb-draw" viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label="Parallelogram drawing" onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={{ touchAction: 'none', width: '100%', maxWidth: 'none', height: 'auto', background: '#fdfdfa', borderRadius: 6, border: '1px solid var(--line)' }}>
      {[u1, u2].map((u, i) => <line key={i} x1={O[0]} y1={O[1]} x2={end(u)[0]} y2={end(u)[1]} stroke="#3a3f48" strokeWidth="0.5" />)}
      <line x1={O[0]} y1={O[1]} x2={O[0]} y2={VB_H - 2} stroke="#3a3f48" strokeWidth="0.5" />
      {dots.map((d, i) => <circle key={i} cx={d[0]} cy={d[1]} r="1.1" fill="#15171c" />)}
      <text x={end(u1)[0] + 4} y={end(u1)[1] + 10} fontSize="7" fill="var(--muted)">w₁</text>
      <text x={end(u2)[0] - 10} y={end(u2)[1] + 10} fontSize="7" fill="var(--muted)">w₂</text>
      <text x={O[0] + 4} y={VB_H - 4} fontSize="7" fill="var(--muted)">{label[3]}</text>
      {OA ? <line x1={O[0]} y1={O[1]} x2={A[0]} y2={A[1]} stroke="#15171c" strokeWidth="1.2" /> : null}
      {OB ? <line x1={O[0]} y1={O[1]} x2={B[0]} y2={B[1]} stroke="#15171c" strokeWidth="1.2" /> : null}
      {done ? (
        <g className="fb-done">
          <path d={`M${A[0]},${A[1]}L${C[0]},${C[1]}L${B[0]},${B[1]}`} fill="none" stroke="#15171c" strokeWidth="0.8" strokeDasharray="3 2" />
          <line x1={O[0]} y1={O[1]} x2={C[0]} y2={C[1]} stroke="var(--accent)" strokeWidth="1.4" />
          <circle cx={C[0]} cy={C[1]} r="1.6" fill="var(--accent)" />{lbl(C, label[2], 0, -4)}
        </g>
      ) : null}
      {lbl(O, 'O', 6, 8)}
      {OA ? lbl(A, label[0], -7, 2) : null}{OB ? lbl(B, label[1], 7, 2) : null}
      {!done ? [['A', A, u1, OA], ['B', B, u2, OB]].map(([k, p, u, v]) => {
        const q = v ? p : toSvg([u[0] * 3, u[1] * 3]); // handles start 3 cm out along each line
        return <circle key={k} cx={q[0]} cy={q[1]} r="4.2" fill="color-mix(in srgb, var(--accent) 22%, transparent)" stroke="var(--accent)" strokeWidth="1" style={{ cursor: 'grab' }} onPointerDown={down(k)} aria-label={`Drag ${k}`} />;
      }) : null}
    </svg>
  );
}

export function PreMeas({ act }) {
  const { L, u } = useT();
  const { st, update } = useLab();
  const ls = st.labs[st.cur]; const all = ls.pre || {}; const pre = all[act] || {};
  const f = forces(ls, act); const pans = ls.pans || [50, 50, 50], slot = ls.slot || [200, 250, 300];
  const label = act === 1 ? ['A′', 'B′', 'C′', 'w'] : ['A', 'B', 'C', 'w₃'];
  const set = (fn) => update((n) => { const l = n.labs[n.cur]; l.pre = { ...(l.pre || {}) }; l.pre[act] = { ...(l.pre[act] || {}) }; fn(l.pre[act]); });
  const [w, setW] = useState(['', '', '']); const [wFb, setWFb] = useState(null);
  const [scale, setScale] = useState(pre.scale ? String(pre.scale) : act === 1 && all[0] ? String(all[0].scale) : '');
  const [OA, setOA] = useState(pre.OA || 0), [OB, setOB] = useState(pre.OB || 0);
  const [dFb, setDFb] = useState(null); const [ok, setOk] = useState(!!pre.done);
  const [pulling, setPulling] = useState(false);
  const fmt0 = (x) => String(Math.round(x));

  if (act === 1 && !(all[0] && all[0].done)) return <p className="insight">{L(T.needAct0)}</p>;

  // 1 · weights
  const wNeed = act === 0 ? [f.w1, f.w2, f.W] : null;
  const checkW = () => {
    const bad = wNeed.some((x, i) => Math.abs(parseFloat(w[i]) - x) > 0.5);
    if (bad) { setWFb(['bad', L(T.wrongW)]); return; }
    set((p) => { p.w = wNeed; }); setWFb(null);
  };
  const wDone = act === 1 || !!pre.w;
  const weights = (
    <div className={`card${wDone ? ' done' : ''}`}>
      <h3>{L(T.stepW)}{wDone ? <span className="st">✓</span> : null}</h3>
      {act === 1 ? <p>{L(T.act1W)}</p> : <p>{L(T.wQ)}</p>}
      <div className="tbl-wrap"><table>
        <thead><tr><th>{L(T.pan)}</th><th>{L(T.panM)}</th><th>{L(T.slotM)}</th><th>{L(T.total)}</th></tr></thead>
        <tbody>
          {[0, 1, 2].map((i) => {
            const name = i === 2 && act === 1 ? 'w' : `w${'₁₂₃'[i]}`;
            const on = i === 2 && act === 1 ? L(T.object) : fmt0(slot[i]);
            const tot = act === 1 ? (i === 2 ? '?' : fmt0([f.w1, f.w2][i])) : wDone ? fmt0(pre.w[i]) : (
              <input className="num" style={{ width: 84 }} inputMode="decimal" aria-label={name} value={w[i]} onChange={(e) => { const n = [...w]; n[i] = e.target.value; setW(n); }} onKeyDown={(e) => { if (e.key === 'Enter') checkW(); }} />);
            return <tr key={i}><td className="lab"><i>{name}</i></td><td>{fmt0(pans[i])}</td><td>{on}</td><td>{tot}</td></tr>;
          })}
        </tbody>
      </table></div>
      {!wDone ? <div className="row"><button type="button" className="btn" onClick={checkW}>{u('check')}</button></div> : null}
      {wFb ? <p className={`fb ${wFb[0]}`}>{wFb[1]}</p> : null}
    </div>
  );
  if (!wDone) return weights;

  // 2 · free-running check
  const pull = () => {
    const R = getEngine().rig; if (R && R.pull) R.pull();
    setPulling(true); setTimeout(() => { setPulling(false); set((p) => { p.pulled = true; }); }, 2300);
  };
  const pullCard = (
    <div className={`card${pre.pulled ? ' done' : ''}`}>
      <h3>{L(T.stepP)}{pre.pulled ? <span className="st">✓</span> : null}</h3>
      {pre.pulled ? <p className="fb good">{L(T.pullOk)}</p> : <div className="row"><button type="button" className="btn" disabled={pulling} aria-busy={pulling} onClick={pull}>{L(T.pullBtn)}</button></div>}
    </div>
  );
  // 3 · marks
  const markCard = pre.pulled ? (
    <div className={`card${pre.marked ? ' done' : ''}`}>
      <h3>{L(T.stepM)}{pre.marked ? <span className="st">✓</span> : null}</h3>
      <p>{L(T.markInfo)}</p>
      {pre.marked ? null : <div className="row"><button type="button" className="btn" onClick={() => set((p) => { p.marked = true; })}>{L(T.markBtn)}</button></div>}
    </div>
  ) : null;

  // 4 · drawing to scale
  const sc = parseFloat(scale);
  const check = () => {
    if (!(sc > 0)) { setDFb(['bad', L(T.tooBig)]); return; }
    if (act === 0) {
      const oc = f.W / sc;
      if (oc < OC_MIN) { setDFb(['bad', L(T.tooSmall)]); return; }
      if (oc > OC_MAX) { setDFb(['bad', L(T.tooBig)]); return; }
    }
    if (f.w1 / sc > reach(dir(f.m1, -1)) / 10 || f.w2 / sc > reach(dir(f.m2, 1)) / 10) { setDFb(['bad', L(T.offSheet)]); return; }
    if (Math.abs(OA - f.w1 / sc) > 0.06) { setDFb(['bad', L(T.badA)]); return; }
    if (Math.abs(OB - f.w2 / sc) > 0.06) { setDFb(['bad', L(T.badB)]); return; }
    setOk(true); setDFb(['good', L(T.ready)]);
  };
  const complete = () => set((p) => { p.scale = sc; p.OA = OA; p.OB = OB; p.done = true; });
  const D = pre.done ? diagonal(pre.OA, pre.OB, f.m1, f.m2) : null;
  const doneMsg = D ? L(act === 0
    ? { si: `සමාන්තරාස්‍රය ඇඳ ඇත. OC සිරස සමග ${Math.abs(D.tilt).toFixed(1)}° ක කෝණයක් සාදයි. දැන් කෝදුවෙන් OC මනින්න.`, en: `Drawn. OC makes ${Math.abs(D.tilt).toFixed(1)}° with the vertical. Now measure OC with the rule.`, ta: `வரையப்பட்டது. OC நிலைக்குத்துடன் ${Math.abs(D.tilt).toFixed(1)}° கோணத்தை ஆக்குகிறது. இப்போது அளவுகோலால் OC ஐ அளக்கவும்.` }
    : { si: 'සමාන්තරාස්‍රය ඇඳ ඇත. දැන් කෝදුවෙන් OC′ මනින්න.', en: 'Drawn. Now measure OC′ with the rule.', ta: 'வரையப்பட்டது. இப்போது அளவுகோலால் OC′ ஐ அளக்கவும்.' }) : '';
  const drawCard = pre.marked ? (
    <div className={`card${pre.done ? ' done' : ''}`}>
      <h3>{L(T.stepD)} {act === 1 ? 'OA′C′B′' : 'OACB'}{pre.done ? <span className="st">✓</span> : null}</h3>
      <p>{L(T.drawInfo)}</p>
      <div className="row"><span>{L(T.scaleL)}</span>
        <input className={`num${pre.done ? ' ok' : ''}`} style={{ width: 84 }} inputMode="decimal" aria-label={L(T.scaleL)} value={scale} disabled={pre.done || act === 1 || ok} onChange={(e) => { setScale(e.target.value); setDFb(null); }} />
        <span className="unit">g</span>{act === 1 ? <span className="muted">{L(T.scaleSame)}</span> : null}</div>
      {!pre.done ? <p className="muted" style={{ fontSize: 13 }}>{L(T.lenInfo)}</p> : null}
      <Drawing f={f} OA={pre.done ? pre.OA : OA} OB={pre.done ? pre.OB : OB} label={label} done={!!pre.done} onSet={(k, v) => { if (ok) return; setDFb(null); if (k === 'A') setOA(v); else setOB(v); }} />
      <div className="row">
        <span><i>O{label[0]}</i></span><input className="num" style={{ width: 76 }} inputMode="decimal" aria-label={`O${label[0]}`} value={pre.done ? pre.OA : OA || ''} disabled={pre.done || ok} onChange={(e) => { setOA(parseFloat(e.target.value) || 0); setDFb(null); }} /><span className="unit">cm</span>
        <span><i>O{label[1]}</i></span><input className="num" style={{ width: 76 }} inputMode="decimal" aria-label={`O${label[1]}`} value={pre.done ? pre.OB : OB || ''} disabled={pre.done || ok} onChange={(e) => { setOB(parseFloat(e.target.value) || 0); setDFb(null); }} /><span className="unit">cm</span>
      </div>
      {pre.done ? <p className="fb good">{doneMsg}</p> : ok
        ? <div className="row"><button type="button" className="btn" onClick={complete}>{L(T.complete)} {act === 1 ? 'OA′C′B′' : 'OACB'}</button></div>
        : <div className="row"><button type="button" className="btn" onClick={check}>{u('check')}</button></div>}
      {dFb && !pre.done ? <p className={`fb ${dFb[0]}`}>{dFb[1]}</p> : null}
    </div>
  ) : null;
  return <>{weights}{pullCard}{markCard}{drawCard}</>;
}

// Theory tab: figures 5.1 (the apparatus), 5.2 (OACB) and 5.3 (OA′C′B′).
export function TheoryFig() {
  const { L } = useT();
  const ink = 'var(--ink)';
  const arrow = (x1, y1, x2, y2, k) => { const a = Math.atan2(y2 - y1, x2 - x1), mx = (x1 + x2) / 2, my = (y1 + y2) / 2; return <g key={k}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeWidth="1.4" /><path d={`M${mx + 6 * Math.cos(a)},${my + 6 * Math.sin(a)} l${-9 * Math.cos(a - 0.4)},${-9 * Math.sin(a - 0.4)} l${9 * Math.cos(a - 0.4) - 9 * Math.cos(a + 0.4)},${9 * Math.sin(a - 0.4) - 9 * Math.sin(a + 0.4)}Z`} fill={ink} /></g>; };
  const t = (x, y, s, sub) => <text x={x} y={y} fontSize="14" fontStyle="italic" fontFamily="Georgia, serif" fill={ink} textAnchor="middle">{s}{sub ? <tspan fontSize="9" dy="3">{sub}</tspan> : null}</text>;
  const pan = (x, y) => <g><path d={`M${x},${y}l-14,26h28z`} fill="none" stroke={ink} strokeWidth="1.2" /><path d={`M${x - 16},${y + 26}q16,10 32,0`} fill="none" stroke={ink} strokeWidth="1.4" /><rect x={x - 4} y={y + 14} width="8" height="11" fill="none" stroke={ink} /><line x1={x} y1={y + 32} x2={x} y2={y + 50} stroke={ink} /><path d={`M${x - 4},${y + 46}l4,6l4,-6`} fill={ink} /></g>;
  return (
    <>
      <svg className="fig" viewBox="0 0 560 260" role="img" aria-label="Figures 5.1 to 5.3">
        {/* 5.1 */}
        <rect x="20" y="16" width="180" height="128" fill="none" stroke={ink} strokeWidth="1.6" />
        <rect x="48" y="38" width="124" height="84" fill="none" stroke={ink} strokeDasharray="4 3" />
        <circle cx="34" cy="28" r="7" fill="none" stroke={ink} /><circle cx="186" cy="28" r="7" fill="none" stroke={ink} />
        <path d="M34,21 L110,80 L186,21" fill="none" stroke={ink} strokeWidth="1.1" /><line x1="110" y1="80" x2="110" y2="160" stroke={ink} strokeWidth="1.1" />
        <line x1="27" y1="28" x2="27" y2="160" stroke={ink} strokeWidth="1.1" /><line x1="193" y1="28" x2="193" y2="160" stroke={ink} strokeWidth="1.1" />
        {pan(27, 160)}{pan(110, 160)}{pan(193, 160)}
        {t(20, 234, 'w', '1')}{t(110, 226, 'w', '3')}{t(200, 234, 'w', '2')}
        <text x="110" y="254" fontSize="11" textAnchor="middle" fill="var(--muted)">5.1</text>
        {/* 5.2 */}
        {arrow(330, 200, 284, 140, 'a')}{arrow(330, 200, 382, 152, 'b')}{arrow(330, 200, 336, 92, 'c')}
        <line x1="284" y1="140" x2="336" y2="92" stroke={ink} strokeWidth="1.2" /><line x1="382" y1="152" x2="336" y2="92" stroke={ink} strokeWidth="1.2" />
        {t(272, 144, 'A')}{t(394, 156, 'B')}{t(336, 84, 'C')}{t(330, 220, 'O')}
        <text x="330" y="254" fontSize="11" textAnchor="middle" fill="var(--muted)">5.2</text>
        {/* 5.3 */}
        {arrow(490, 210, 470, 120, 'd')}{arrow(490, 210, 512, 136, 'e')}{arrow(490, 210, 492, 46, 'f')}
        <line x1="470" y1="120" x2="492" y2="46" stroke={ink} strokeWidth="1.2" /><line x1="512" y1="136" x2="492" y2="46" stroke={ink} strokeWidth="1.2" />
        {t(458, 118, 'A′')}{t(526, 140, 'B′')}{t(492, 38, 'C′')}{t(490, 230, 'O')}
        <text x="490" y="254" fontSize="11" textAnchor="middle" fill="var(--muted)">5.3</text>
      </svg>
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>{L({
        si: '5.1 රූපය: බල සමාන්තරාස්‍ර උපකරණය. 5.2 රූපය: OA හා OB, w₁ හා w₂ නිරූපණය කරයි; OC විකර්ණය ඒවායේ සම්ප්‍රයුක්තය. 5.3 රූපය: w₃ වෙනුවට වස්තුව යෙදූ විට.',
        en: 'Figure 5.1: the parallelogram-of-forces apparatus. Figure 5.2: OA and OB represent w₁ and w₂; the diagonal OC is their resultant. Figure 5.3: with the object in place of w₃.',
        ta: 'உரு 5.1: விசைகளின் இணைகர உபகரணம். உரு 5.2: OA, OB என்பன w₁, w₂ ஐக் குறிக்கின்றன; மூலைவிட்டம் OC அவற்றின் விளையுள். உரு 5.3: w₃ க்குப் பதிலாகப் பொருளை இட்டபோது.',
      })}</p>
    </>
  );
}
