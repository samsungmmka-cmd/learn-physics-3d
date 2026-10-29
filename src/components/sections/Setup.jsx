import { useState } from 'react';
import { useT } from '../../lib/i18n.jsx';
import { useLab } from '../../lib/labStore.jsx';
import { LABS } from '../../data/content.js';
import { fmt } from '../../lib/calc.js';
import { getEngine } from '../../engine/engine.js';

export function LcCard() {
  const { L, u, lang } = useT();
  const { st, update } = useLab();
  const lab = LABS[st.cur], ls = st.labs[st.cur];
  const [v, setV] = useState('');
  const [bad, setBad] = useState(false);
  const turnOne = () => {
    const eng = getEngine(); if (!eng.rig) return;
    const step = lab.inst === 'micro' ? 0.5 : 1; const val = eng.rig.value();
    eng.animateTo(lab.inst === 'micro' ? Math.min(24, val + step) : Math.min(10, val + step), 1.6);
  };
  const check = () => {
    if (Math.abs(parseFloat(v) - lab.lcAns) < 1e-6) update((n) => { n.labs[n.cur].lc = true; });
    else setBad(true);
  };
  return (
    <div className={`card${ls.lc ? ' done' : ''}`}>
      <h3>{u('lc')}{ls.lc ? <span className="st">✓</span> : null}</h3>
      <p>{L(lab.lcQ)}</p>
      {lab.inst !== 'caliper' ? <div className="row"><button type="button" className="btn ghost sm" onClick={turnOne}>{u('turnOne')}</button></div> : null}
      <div className="row">
        <input className={`num${ls.lc ? ' ok' : ''}`} inputMode="decimal" aria-label={u('lc')} value={ls.lc ? lab.lcAns : v} disabled={ls.lc}
          onChange={(e) => { setV(e.target.value); setBad(false); }} onKeyDown={(e) => { if (e.key === 'Enter') check(); }} />
        <span className="unit">{lab.lcUnit}</span>
        {ls.lc ? null : <button type="button" className="btn" onClick={check}>{u('check')}</button>}
      </div>
      {ls.lc ? <p className="fb good">{lab.lcWork}</p> : bad ? <p className="fb bad">{L({ si: 'නැවත උත්සාහ කරන්න. සූත්‍රය භාවිත කරන්න.', en: 'Try again. Use the formula above.', ta: 'மீண்டும் முயலவும். மேலுள்ள சூத்திரத்தைப் பயன்படுத்தவும்.' })}</p> : null}
    </div>
  );
}

export function ZeroCard() {
  const { L, u, lang } = useT();
  const { st, update } = useLab();
  const lab = LABS[st.cur], ls = st.labs[st.cur], sph = lab.inst === 'sphero';
  const [v, setV] = useState('');
  const [side, setSide] = useState(null);
  const [fb, setFb] = useState(null);
  const eng = getEngine();
  const hint = () => { eng.setHint(true); setFb(['info', eng.rig && eng.rig.contact() ? eng.rig.hintText(lang) : u('notContact')]); };
  const check = () => {
    const R = eng.rig; if (!R || !R.contact()) { setFb(['bad', u('notContact')]); return; }
    const x = parseFloat(v);
    if (sph) {
      if (Math.abs(x - R.ideal()) <= R.tol) update((n) => { n.labs[n.cur].S0rec = x; n.labs[n.cur].zero = true; });
      else setFb(['bad', u('wrongRead')]);
      return;
    }
    const tol = lab.inst === 'micro' ? 0.0051 : 0.051;
    if (!(Math.abs(x - Math.abs(ls.e)) <= tol)) { setFb(['bad', u('wrongRead')]); return; }
    if (!side || (side === 'sub') !== ls.e > 0) { setFb(['bad', L({ si: 'විශාලත්වය නිවැරදියි. ශුන්‍යය පිහිටා ඇත්තේ කුමන පැත්තේ දැයි නැවත සලකා බලන්න.', en: 'The size is right. Look again at which side of the zero line the scale zero sits.', ta: 'பருமன் சரி. அளவுகோலின் பூச்சியம் பூச்சியக் கோட்டின் எப்பக்கத்தில் உள்ளது என மீண்டும் பார்க்கவும்.' })]); return; }
    update((n) => { n.labs[n.cur].zero = true; });
  };
  if (sph) {
    return (
      <div className={`card${ls.zero ? ' done' : ''}`}>
        <h3>{u('init')}{ls.zero ? <span className="st">✓</span> : null}</h3>
        <p>{L(lab.zeroQ)}</p>
        <div className="row">
          <input className={`num${ls.zero ? ' ok' : ''}`} inputMode="decimal" aria-label={u('init')} value={ls.zero ? fmt(ls.S0rec, 2) : v} disabled={ls.zero} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') check(); }} />
          <span className="unit">mm</span>
          {ls.zero ? null : <><button type="button" className="btn" onClick={check}>{u('record')}</button><button type="button" className="btn ghost sm" onClick={hint}>{u('hint')}</button></>}
        </div>
        {fb ? <p className={`fb ${fb[0]}`}>{fb[1]}</p> : null}
      </div>
    );
  }
  return (
    <div className={`card${ls.zero ? ' done' : ''}`}>
      <h3>{u('zero')}{ls.zero ? <span className="st">✓</span> : null}</h3>
      {ls.zero ? <p className="fb good">{u('zero')} = {fmt(Math.abs(ls.e), lab.inst === 'micro' ? 2 : 1)} mm · {ls.e > 0 ? u('subtract') : u('add')}</p> : (
        <>
          <p>{L(lab.zeroQ)}</p>
          <div className="row"><span>{u('magnitude')}</span><input className="num" inputMode="decimal" aria-label={u('magnitude')} value={v} onChange={(e) => setV(e.target.value)} /><span className="unit">mm</span></div>
          <div className="opts">
            <label className="opt"><input type="radio" name="zs" checked={side === 'sub'} onChange={() => setSide('sub')} /> {u('subtract')}</label>
            <label className="opt"><input type="radio" name="zs" checked={side === 'add'} onChange={() => setSide('add')} /> {u('add')}</label>
          </div>
          <div className="row"><button type="button" className="btn" onClick={check}>{u('check')}</button><button type="button" className="btn ghost sm" onClick={hint}>{u('hint')}</button></div>
          {fb ? <p className={`fb ${fb[0]}`}>{fb[1]}</p> : null}
        </>
      )}
    </div>
  );
}
