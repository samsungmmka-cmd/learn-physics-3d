// Force board: React pieces shown in the handbook pages.
//  TheoryFig: figures 5.1–5.3.
//  PreMeas: the steps before each reading. Each is done on the 3D board (rig.js) and this card follows it,
//           with buttons as a fallback for keyboard users: load the pans → add up the weights → pull and
//           release → mark the strings → draw the parallelogram to scale. The reading (OC) waits for it.
import { useEffect, useState } from 'react';
import { useT } from '../../lib/i18n.jsx';
import { useLab } from '../../lib/labStore.jsx';
import { getEngine } from '../../engine/engine.js';
import { forces, dir, diagonal, fromDots, perfectDots, loadMass, sameLoad, DENOMS, OC_MIN, OC_MAX } from './physics.js';
import { targets, startLoads } from './index.js';

const T = {
  stepL: { si: 'තැටිවලට භාර දැමීම', en: 'Load the pans', ta: 'தட்டுகளில் நிறைகளை இடுதல்' },
  loadInfo: { si: 'මේසය මත ඇති පෙට්ටියේ ස්කන්ධයක් ක්ලික් කර තැටියක් ක්ලික් කරන්න, නැතහොත් එය තැටියට අදින්න. තැටියක ඇති ස්කන්ධයක් ක්ලික් කළ විට එය ආපසු පෙට්ටියට යයි. භාර වෙනස් වන විට O ගැටය චලනය වන අයුරු බලන්න.', en: 'Click a mass in the box on the table and then click a pan, or drag it onto the pan. Click a mass on a pan to put it back. Watch the knot O move as the loads change.', ta: 'மேசையிலுள்ள பெட்டியில் ஒரு திணிவைக் கிளிக் செய்து பின் ஒரு தட்டைக் கிளிக் செய்யவும், அல்லது அதைத் தட்டுக்கு இழுக்கவும். தட்டிலுள்ள திணிவைக் கிளிக் செய்தால் அது பெட்டிக்குத் திரும்பும். நிறைகள் மாறும்போது முடிச்சு O நகர்வதைப் பார்க்கவும்.' },
  loadInfo1: { si: 'w₃ තැටියේ ස්කන්ධ ක්ලික් කර පෙට්ටියට ආපසු දමන්න. ඉන්පසු මේසය මත ඇති වස්තුව (ගල) ක්ලික් කර එම තැටිය ක්ලික් කරන්න.', en: 'Click the masses on the w₃ pan to put them back in the box. Then click the object (the stone) on the table and click that pan.', ta: 'w₃ தட்டிலுள்ள திணிவுகளைக் கிளிக் செய்து பெட்டிக்குத் திருப்பவும். பின் மேசையிலுள்ள பொருளை (கல்லை) கிளிக் செய்து அத்தட்டைக் கிளிக் செய்யவும்.' },
  need: { si: 'අවශ්‍යයි', en: 'needs', ta: 'தேவை' },
  onIt: { si: 'දැනට', en: 'on it', ta: 'இப்போது' },
  theObject: { si: 'වස්තුව', en: 'the object', ta: 'பொருள்' },
  undo: { si: 'ඉවත් කරන්න', en: 'Take one off', ta: 'ஒன்றை அகற்று' },
  putObj: { si: 'වස්තුව දමන්න', en: 'Put the object in', ta: 'பொருளை இடு' },
  loaded: { si: 'තැටිවලට නිවැරදි භාර දමා ඇත.', en: 'The pans hold the right loads.', ta: 'தட்டுகளில் சரியான நிறைகள் உள்ளன.' },
  stepW: { si: 'භාර එකතු කිරීම', en: 'Add up the weights', ta: 'நிறைகளைக் கூட்டுதல்' },
  wQ: { si: 'තැටිවල ස්කන්ධ (තුලාවෙන් මැනූ) අදාළ භාරවලට එකතු කර w₁, w₂ හා w₃ ලියන්න.', en: 'Add each pan’s mass (measured on the balance) to the masses on it, and enter w₁, w₂ and w₃.', ta: 'ஒவ்வொரு தட்டின் திணிவையும் (தராசில் அளந்தது) அதிலுள்ள திணிவுகளுடன் கூட்டி w₁, w₂, w₃ ஐ எழுதவும்.' },
  pan: { si: 'තැටිය', en: 'Pan', ta: 'தட்டு' },
  panM: { si: 'තැටියේ ස්කන්ධය (g)', en: 'Pan mass (g)', ta: 'தட்டின் திணிவு (g)' },
  slotM: { si: 'දැමූ ස්කන්ධ (g)', en: 'Masses on it (g)', ta: 'இட்ட திணிவுகள் (g)' },
  total: { si: 'භාරය (g)', en: 'Weight (g)', ta: 'நிறை (g)' },
  wrongW: { si: 'නැවත එකතු කරන්න: තැටියේ ස්කන්ධය + තැටියට දැමූ ස්කන්ධ.', en: 'Add again: pan mass + the masses on the pan.', ta: 'மீண்டும் கூட்டவும்: தட்டின் திணிவு + தட்டிலுள்ள திணிவுகள்.' },
  needAct0: { si: 'පළමුව 1 වන ක්‍රියාකාරකම සම්පූර්ණ කරන්න: මෙම ඇඳීමට එහි පරිමාණය ම භාවිත කළ යුතු ය.', en: 'Finish activity 1 first: this drawing uses the same scale.', ta: 'முதலில் செயற்பாடு 1 ஐ முடிக்கவும்: இவ்வரைபுக்கும் அதே அளவுத்திட்டம் தேவை.' },
  stepP: { si: 'ඝර්ෂණය පරීක්ෂා කිරීම', en: 'Check the pulleys run freely', ta: 'கப்பிகள் சுதந்திரமாகச் சுழல்கின்றனவா எனச் சரிபார்த்தல்' },
  pullInfo: { si: '3D දර්ශනයේ මැද තැටිය අල්ලා මදක් පහළට ඇද අතහරින්න.', en: 'In the 3D view, grab the middle pan, pull it down a little and let go.', ta: '3D காட்சியில் நடுத் தட்டைப் பிடித்துச் சிறிது கீழே இழுத்து விடவும்.' },
  pullBtn: { si: 'බොත්තමෙන් කරන්න', en: 'Do it with a button', ta: 'பொத்தானால் செய்' },
  pullSmall: { si: 'තව ටිකක් පහළට අදින්න.', en: 'Pull it a little further down.', ta: 'இன்னும் சிறிது கீழே இழுக்கவும்.' },
  pullOk: { si: 'එය පළමු තිබූ පිහිටීමට නැවත පැමිණියේ ය: කප්පි නිදහසේ කරකැවේ.', en: 'It came back to where it was: the pulleys turn freely.', ta: 'அது முன்பிருந்த இடத்துக்கே திரும்பியது: கப்பிகள் சுதந்திரமாகச் சுழல்கின்றன.' },
  stepM: { si: 'තන්තු සලකුණු කිරීම', en: 'Mark the strings', ta: 'இழைகளைக் குறித்தல்' },
  markInfo: { si: 'කඩදාසිය මත, තන්තුවක් යටින් ක්ලික් කර තිතක් තබන්න. විශාලනයේ දර්පණ තීරුව බලන්න: තන්තුව එහි ප්‍රතිබිම්බය වසන විට ඔබ හරියට ම තන්තුවට ඉහළින් ය. එක් එක් තන්තුව යටින් හැකි තරම් දුරින් තිත් දෙක බැගින් තබන්න.', en: 'Click on the paper under a string to make a dot. Watch the mirror strip in the magnifier: when the string hides its image you are right above the string. Make two dots under each string, as far apart as you can.', ta: 'தாளில் ஓர் இழையின் கீழ் கிளிக் செய்து புள்ளியிடவும். உருப்பெருக்கியிலுள்ள ஆடிப் பட்டையைப் பார்க்கவும்: இழை தனது விம்பத்தை மறைக்கும்போது நீங்கள் இழைக்குச் சரியாக மேலே உள்ளீர்கள். ஒவ்வோர் இழையின் கீழும் இயன்றவரை தொலைவில் இரு புள்ளிகளை இடவும்.' },
  dotOff: { si: 'එම ස්ථානය තන්තුව යටින් නොවේ. තන්තුව එහි ප්‍රතිබිම්බය වසන තැන ක්ලික් කරන්න.', en: 'That spot isn’t under a string. Click where the string hides its image.', ta: 'அவ்விடம் இழையின் கீழ் இல்லை. இழை தனது விம்பத்தை மறைக்கும் இடத்தில் கிளிக் செய்யவும்.' },
  dotFull: { si: 'මෙම තන්තුවට තිත් දෙක ම ඇත.', en: 'This string already has its two dots.', ta: 'இவ்விழைக்கு ஏற்கெனவே இரு புள்ளிகள் உள்ளன.' },
  dotClose: { si: 'තිත් දෙක එකිනෙකට ළං වැඩිය. දෙවැන්න තවත් දුරින් තබන්න.', en: 'Too close to the other dot. Put the second one further along the string.', ta: 'மற்றப் புள்ளிக்கு மிக அருகில் உள்ளது. இரண்டாவதை இழை வழியே மேலும் தொலைவில் இடவும்.' },
  strings: [{ si: 'වම් තන්තුව (w₁)', en: 'Left string (w₁)', ta: 'இடது இழை (w₁)' }, { si: 'දකුණු තන්තුව (w₂)', en: 'Right string (w₂)', ta: 'வலது இழை (w₂)' }, { si: 'මැද තන්තුව', en: 'Middle string', ta: 'நடு இழை' }],
  clear: { si: 'තිත් මකන්න', en: 'Clear the dots', ta: 'புள்ளிகளை அழி' },
  markForMe: { si: 'බොත්තමෙන් කරන්න', en: 'Do it with a button', ta: 'பொத்தானால் செய்' },
  stepD: { si: 'සමාන්තරාස්‍රය ඇඳීම', en: 'Draw the parallelogram', ta: 'இணைகரத்தை வரைதல்' },
  drawInfo: { si: 'කඩදාසිය මේසය මත ඇත; තිත් හරහා ඇඳි රේඛා O හි හමු වේ. පරිමාණයක් තෝරා, OA හා OB, පරිමාණයට අනුව w₁ හා w₂ වන සේ A හා B රේඛා දිගේ අදින්න (නැතහොත් දිග ලියන්න).', en: 'The paper is on the table; the lines through your dots meet at O. Choose a scale, then drag A and B along the lines (or type the lengths) so that OA and OB are w₁ and w₂ to scale.', ta: 'தாள் மேசையில் உள்ளது; உங்கள் புள்ளிகளூடான கோடுகள் O இல் சந்திக்கின்றன. அளவுத்திட்டத்தைத் தெரிவு செய்து, OA, OB என்பன அளவுத்திட்டப்படி w₁, w₂ ஆகுமாறு A, B ஐக் கோடுகள் வழியே இழுக்கவும் (அல்லது நீளங்களை எழுதவும்).' },
  scaleL: { si: 'පරිමාණය: 1 cm =', en: 'Scale: 1 cm represents', ta: 'அளவுத்திட்டம்: 1 cm =' },
  scaleSame: { si: 'පළමු වන පරිමාණය ම', en: 'Same scale as activity 1', ta: 'செயற்பாடு 1 இன் அதே அளவுத்திட்டம்' },
  tooSmall: { si: 'මෙම පරිමාණයෙන් ඇඳීම කුඩා වැඩිය; මිනුමේ දෝෂය වැඩි වේ. 1 cm කට අඩු ග්‍රෑම් ගණනක් තෝරන්න.', en: 'At this scale the drawing is too small to measure well. Choose fewer grams per cm.', ta: 'இந்த அளவுத்திட்டத்தில் வரைபு மிகச் சிறியது; நன்றாக அளக்க முடியாது. ஒரு cm க்குக் குறைந்த கிராம்களைத் தெரிவு செய்யவும்.' },
  tooBig: { si: 'මෙම පරිමාණයෙන් ඇඳීම A4 කඩදාසියට නොගැළපේ. 1 cm කට වැඩි ග්‍රෑම් ගණනක් තෝරන්න.', en: 'At this scale the drawing won’t fit on the A4 sheet. Choose more grams per cm.', ta: 'இந்த அளவுத்திட்டத்தில் வரைபு A4 தாளில் அடங்காது. ஒரு cm க்குக் கூடுதல் கிராம்களைத் தெரிவு செய்யவும்.' },
  badA: { si: 'OA, පරිමාණයට අනුව w₁ නොවේ. w₁ ÷ පරිමාණය ගණනය කරන්න.', en: 'OA isn’t w₁ to scale. Work out w₁ ÷ scale.', ta: 'OA அளவுத்திட்டப்படி w₁ அல்ல. w₁ ÷ அளவுத்திட்டம் ஐக் கணிக்கவும்.' },
  badB: { si: 'OB, පරිමාණයට අනුව w₂ නොවේ. w₂ ÷ පරිමාණය ගණනය කරන්න.', en: 'OB isn’t w₂ to scale. Work out w₂ ÷ scale.', ta: 'OB அளவுத்திட்டப்படி w₂ அல்ல. w₂ ÷ அளவுத்திட்டம் ஐக் கணிக்கவும்.' },
  offSheet: { si: 'රේඛාව කඩදාසියෙන් පිටතට යයි. 1 cm කට වැඩි ග්‍රෑම් ගණනක් තෝරන්න.', en: 'That runs off the sheet. Choose more grams per cm.', ta: 'அது தாளுக்கு வெளியே செல்கிறது. ஒரு cm க்குக் கூடுதல் கிராம்களைத் தெரிவு செய்யவும்.' },
  ready: { si: 'නිවැරදියි. දැන් සමාන්තරාස්‍රය සම්පූර්ණ කරන්න.', en: 'Right. Now complete the parallelogram.', ta: 'சரி. இப்போது இணைகரத்தைப் பூர்த்தி செய்யவும்.' },
  complete: { si: 'සමාන්තරාස්‍රය සම්පූර්ණ කරන්න', en: 'Complete the parallelogram', ta: 'இணைகரத்தைப் பூர்த்தி செய்யவும்' },
};

const VB_W = 297, O_UP = 25;
const reach = (u) => Math.min(u[0] ? (VB_W / 2 - 4) / Math.abs(u[0]) : 1e9, u[1] > 0 ? (210 - O_UP - 4) / u[1] : 1e9) / 10; // cm on A4
const countBy = (dots) => [0, 1, 2].map((s) => (dots || []).filter((d) => d[2] === s).length);

export function PreMeas({ act }) {
  const { L, u } = useT();
  const { st, update } = useLab();
  const ls = st.labs[st.cur]; const all = ls.pre || {}; const pre = all[act] || {};
  const f = forces(ls, act); const pans = ls.pans || [50, 50, 50], slot = ls.slot || [200, 250, 300];
  const want = targets(ls, act), loads = pre.loads || startLoads(ls, act);
  const label = act === 1 ? ['A′', 'B′', 'C′'] : ['A', 'B', 'C'];
  const set = (fn) => update((n) => { const l = n.labs[n.cur]; l.pre = { ...(l.pre || {}) }; l.pre[act] = { ...(l.pre[act] || {}) }; fn(l.pre[act], l); });
  const [w, setW] = useState(['', '', '']); const [wFb, setWFb] = useState(null);
  const [msg, setMsg] = useState(null);
  const [scale, setScale] = useState(pre.scale ? String(pre.scale) : act === 1 && all[0] && all[0].scale ? String(all[0].scale) : '');
  const [ab, setAb] = useState({ OA: pre.OA || 0, OB: pre.OB || 0 });
  const [dFb, setDFb] = useState(null); const [ok, setOk] = useState(!!pre.done);

  // the right loads: pans 1 and 2 as given; pan 3 the given masses (activity 1) or only the object (activity 2)
  const panOk = (i) => (act === 1 && i === 2 ? sameLoad(loads[2], ['stone']) : !loads[i].includes('stone') && Math.abs(loadMass(loads[i], 0) - want[i]) < 0.5);
  const loadsOk = [0, 1, 2].every(panOk);
  useEffect(() => { if (!pre.done && !pre.pulled && !!pre.loaded !== loadsOk) set((p) => { p.loaded = loadsOk; }); }, [loadsOk]); // eslint-disable-line react-hooks/exhaustive-deps

  // What the student does on the 3D board arrives as events from the rig.
  useEffect(() => getEngine().on((ev, d) => {
    if (ev === 'loads') { setMsg(null); set((p) => { p.loads = d; }); }
    if (ev === 'pulled') set((p) => { p.pulled = true; });
    if (ev === 'pullSmall') setMsg(['info', L(T.pullSmall)]);
    if (ev === 'dots') { setMsg(null); set((p) => { p.dots = d; const c = countBy(d); p.marked = c[0] >= 2 && c[1] >= 2 && c[2] >= 2; }); }
    if (ev === 'dotOff') setMsg(['bad', L(T.dotOff)]);
    if (ev === 'dotFull') setMsg(['info', L(T.dotFull)]);
    if (ev === 'dotClose') setMsg(['info', L(T.dotClose)]);
    if (ev === 'ab') { setAb({ OA: d.OA, OB: d.OB }); setDFb(null); setOk(false); if (d.final) set((p) => { p.OA = d.OA; p.OB = d.OB; }); }
  }), [act, st.cur]); // eslint-disable-line react-hooks/exhaustive-deps

  if (act === 1 && !(all[0] && all[0].done)) return <p className="insight">{L(T.needAct0)}</p>;
  const tick = (on) => (on ? <span className="st">✓</span> : null);
  const fmt0 = (x) => String(Math.round(x));

  // 1 · load the pans (3D, with buttons as a fallback)
  const setLoads = (fn) => set((p) => { const n = (p.loads || loads).map((l) => [...l]); fn(n); p.loads = n; });
  const loadCard = (
    <div className={`card${pre.loaded ? ' done' : ''}`}>
      <h3>{L(T.stepL)}{tick(pre.loaded)}</h3>
      <p>{L(act === 1 ? T.loadInfo1 : T.loadInfo)}</p>
      <div className="fb-loads">
        {[0, 1, 2].map((i) => {
          const isObj = act === 1 && i === 2;
          return (
            <div key={i} className={`fb-pan${panOk(i) ? ' ok' : ''}`}>
              <b><i>{isObj ? 'w' : `w${'₁₂₃'[i]}`}</i></b>
              <span className="muted">{L(T.need)}: {isObj ? L(T.theObject) : `${want[i]} g`}</span>
              <span>{L(T.onIt)}: {loads[i].length ? loads[i].map((x) => (x === 'stone' ? L(T.theObject) : `${x}`)).join(' + ') : '—'}{loads[i].some((x) => x !== 'stone') ? ` = ${loadMass(loads[i].filter((x) => x !== 'stone'), 0)} g` : ''}</span>
              {pre.pulled ? null : (
                <span className="fb-btns">
                  {isObj ? <button type="button" className="btn ghost sm" disabled={loads[2].includes('stone')} onClick={() => setLoads((n) => { n[2].push('stone'); })}>{L(T.putObj)}</button>
                    : DENOMS.map((d) => <button type="button" key={d} className="btn ghost sm" aria-label={`+${d} g → w${i + 1}`} onClick={() => setLoads((n) => { n[i].push(d); })}>+{d}</button>)}
                  <button type="button" className="btn ghost sm" disabled={!loads[i].length} onClick={() => setLoads((n) => { n[i].pop(); })}>{L(T.undo)}</button>
                </span>
              )}
            </div>
          );
        })}
      </div>
      {pre.loaded ? <p className="fb good">{L(T.loaded)}</p> : null}
    </div>
  );
  if (!pre.loaded) return <>{loadCard}{msg ? <p className={`fb ${msg[0]}`}>{msg[1]}</p> : null}</>;

  // 2 · add up the weights (activity 1 only)
  const wNeed = [f.w1, f.w2, f.W];
  const checkW = () => {
    if (wNeed.some((x, i) => Math.abs(parseFloat(w[i]) - x) > 0.5)) { setWFb(['bad', L(T.wrongW)]); return; }
    set((p) => { p.w = wNeed; }); setWFb(null);
  };
  const wDone = act === 1 || !!pre.w;
  const weights = act === 1 ? null : (
    <div className={`card${wDone ? ' done' : ''}`}>
      <h3>{L(T.stepW)}{tick(wDone)}</h3>
      <p>{L(T.wQ)}</p>
      <div className="tbl-wrap"><table>
        <thead><tr><th>{L(T.pan)}</th><th>{L(T.panM)}</th><th>{L(T.slotM)}</th><th>{L(T.total)}</th></tr></thead>
        <tbody>{[0, 1, 2].map((i) => (
          <tr key={i}><td className="lab"><i>w{'₁₂₃'[i]}</i></td><td>{fmt0(pans[i])}</td><td>{fmt0(slot[i])}</td>
            <td>{wDone ? fmt0(pre.w[i]) : <input className="num" style={{ width: 84 }} inputMode="decimal" aria-label={`w${i + 1}`} value={w[i]} onChange={(e) => { const n = [...w]; n[i] = e.target.value; setW(n); }} onKeyDown={(e) => { if (e.key === 'Enter') checkW(); }} />}</td></tr>
        ))}</tbody>
      </table></div>
      {!wDone ? <div className="row"><button type="button" className="btn" onClick={checkW}>{u('check')}</button></div> : null}
      {wFb ? <p className={`fb ${wFb[0]}`}>{wFb[1]}</p> : null}
    </div>
  );
  if (!wDone) return <>{loadCard}{weights}</>;

  // 3 · pull and release
  const pullCard = (
    <div className={`card${pre.pulled ? ' done' : ''}`}>
      <h3>{L(T.stepP)}{tick(pre.pulled)}</h3>
      {pre.pulled ? <p className="fb good">{L(T.pullOk)}</p> : (
        <>
          <p>{L(T.pullInfo)}</p>
          <div className="row"><button type="button" className="btn ghost sm" onClick={() => { const R = getEngine().rig; if (R && R.pull) R.pull(); }}>{L(T.pullBtn)}</button></div>
        </>
      )}
    </div>
  );
  // 4 · mark the strings
  const c = countBy(pre.dots);
  const markCard = pre.pulled ? (
    <div className={`card${pre.marked ? ' done' : ''}`}>
      <h3>{L(T.stepM)}{tick(pre.marked)}</h3>
      {pre.marked ? null : <p>{L(T.markInfo)}</p>}
      <div className="fb-dots">{T.strings.map((s, i) => <span key={i} className={c[i] >= 2 ? 'ok' : ''}>{L(s)}: {Math.min(2, c[i])}/2</span>)}</div>
      {pre.done ? null : (
        <div className="row">
          <button type="button" className="btn ghost sm" disabled={!c.some(Boolean)} onClick={() => set((p) => { p.dots = []; p.marked = false; p.OA = 0; p.OB = 0; })}>{L(T.clear)}</button>
          {pre.marked ? null : <button type="button" className="btn ghost sm" onClick={() => set((p) => { p.dots = perfectDots(f); p.marked = true; })}>{L(T.markForMe)}</button>}
        </div>
      )}
    </div>
  ) : null;

  // 5 · draw to scale (on the 3D paper, or by typing the lengths)
  const lines = fromDots(pre.dots) || { m1: f.m1, m2: f.m2 };
  const sc = parseFloat(scale); const OA = ab.OA, OB = ab.OB;
  const check = () => {
    if (!(sc > 0)) { setDFb(['bad', L(T.tooBig)]); return; }
    if (act === 0) { const oc = f.W / sc; if (oc < OC_MIN) { setDFb(['bad', L(T.tooSmall)]); return; } if (oc > OC_MAX) { setDFb(['bad', L(T.tooBig)]); return; } }
    if (f.w1 / sc > reach(dir(lines.m1, -1)) || f.w2 / sc > reach(dir(lines.m2, 1))) { setDFb(['bad', L(T.offSheet)]); return; }
    if (Math.abs(OA - f.w1 / sc) > 0.06) { setDFb(['bad', L(T.badA)]); return; }
    if (Math.abs(OB - f.w2 / sc) > 0.06) { setDFb(['bad', L(T.badB)]); return; }
    set((p) => { p.OA = OA; p.OB = OB; }); setOk(true); setDFb(['good', L(T.ready)]);
  };
  const typeLen = (k, v) => { const x = parseFloat(v) || 0; setAb((q) => ({ ...q, [k]: x })); setOk(false); setDFb(null); set((p) => { p[k] = x; }); };
  const D = pre.done ? diagonal(pre.OA, pre.OB, lines.m1, lines.m2) : null;
  const doneMsg = D ? L(act === 0
    ? { si: `සමාන්තරාස්‍රය ඇඳ ඇත. OC සිරස සමග ${Math.abs(D.tilt).toFixed(1)}° ක කෝණයක් සාදයි. දැන් කෝදුවෙන් OC මනින්න.`, en: `Drawn. OC makes ${Math.abs(D.tilt).toFixed(1)}° with the vertical. Now measure OC with the rule.`, ta: `வரையப்பட்டது. OC நிலைக்குத்துடன் ${Math.abs(D.tilt).toFixed(1)}° கோணத்தை ஆக்குகிறது. இப்போது அளவுகோலால் OC ஐ அளக்கவும்.` }
    : { si: 'සමාන්තරාස්‍රය ඇඳ ඇත. දැන් කෝදුවෙන් OC′ මනින්න.', en: 'Drawn. Now measure OC′ with the rule.', ta: 'வரையப்பட்டது. இப்போது அளவுகோலால் OC′ ஐ அளக்கவும்.' }) : '';
  const name = act === 1 ? 'OA′C′B′' : 'OACB';
  const drawCard = pre.marked ? (
    <div className={`card${pre.done ? ' done' : ''}`}>
      <h3>{L(T.stepD)} {name}{tick(pre.done)}</h3>
      {pre.done ? null : <p>{L(T.drawInfo)}</p>}
      <div className="row"><span>{L(T.scaleL)}</span>
        <input className={`num${pre.done ? ' ok' : ''}`} style={{ width: 84 }} inputMode="decimal" aria-label={L(T.scaleL)} value={scale} disabled={pre.done || act === 1 || ok} onChange={(e) => { setScale(e.target.value); setDFb(null); }} />
        <span className="unit">g</span>{act === 1 ? <span className="muted">{L(T.scaleSame)}</span> : null}</div>
      <div className="row">
        <span><i>O{label[0]}</i></span><input className="num" style={{ width: 76 }} inputMode="decimal" aria-label={`O${label[0]}`} value={pre.done ? pre.OA : OA || ''} disabled={pre.done || ok} onChange={(e) => typeLen('OA', e.target.value)} /><span className="unit">cm</span>
        <span><i>O{label[1]}</i></span><input className="num" style={{ width: 76 }} inputMode="decimal" aria-label={`O${label[1]}`} value={pre.done ? pre.OB : OB || ''} disabled={pre.done || ok} onChange={(e) => typeLen('OB', e.target.value)} /><span className="unit">cm</span>
      </div>
      {pre.done ? <p className="fb good">{doneMsg}</p> : ok
        ? <div className="row"><button type="button" className="btn" onClick={() => set((p) => { p.scale = sc; p.OA = OA; p.OB = OB; p.done = true; })}>{L(T.complete)} {name}</button></div>
        : <div className="row"><button type="button" className="btn" onClick={check}>{u('check')}</button></div>}
      {dFb && !pre.done ? <p className={`fb ${dFb[0]}`}>{dFb[1]}</p> : null}
    </div>
  ) : null;
  return <>{loadCard}{weights}{pullCard}{markCard}{drawCard}{msg && !pre.done ? <p className={`fb ${msg[0]}`}>{msg[1]}</p> : null}</>;
}

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
