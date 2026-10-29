import { useEffect, useMemo, useRef, useState } from 'react';
import { getEngine } from '../engine/engine.js';
import { useT } from '../lib/i18n.jsx';
import { useLab } from '../lib/labStore.jsx';
import { PRAC, UI } from '../data/content.js';
import { sceneSpec } from '../lib/scene.js';
import StageView from './StageView.jsx';
import Apparatus from './sections/Apparatus.jsx';
import Theory from './sections/Theory.jsx';
import Procedure from './sections/Procedure.jsx';
import Readings from './sections/Readings.jsx';
import Results from './sections/Results.jsx';
import { pTitle } from '../lib/ptitle.js';

const SECTIONS = [Apparatus, Theory, Procedure, Readings, Results];

// Width of the 3D panel on wide screens, as a % of the lab area. The user can drag the divider.
const W_KEY = 'lp-stage-w', W_DEF = 55, W_MIN = 34, W_MAX = 72;
const readW = () => { try { const v = parseFloat(localStorage.getItem(W_KEY)); return v >= W_MIN && v <= W_MAX ? v : W_DEF; } catch { return W_DEF; } };

function Splitter({ gridRef, w, setW }) {
  const { u } = useT();
  const drag = useRef(null);
  const commit = (v) => { try { localStorage.setItem(W_KEY, String(Math.round(v * 10) / 10)); } catch { /* private mode */ } };
  const refitSoon = useRef(0);
  const refit = () => { cancelAnimationFrame(refitSoon.current); refitSoon.current = requestAnimationFrame(() => getEngine().refit()); };
  const clamp = (v) => Math.min(W_MAX, Math.max(W_MIN, v));
  const onDown = (e) => {
    e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    drag.current = gridRef.current.getBoundingClientRect(); document.body.classList.add('resizing');
  };
  const onMove = (e) => { if (!drag.current) return; const r = drag.current; setW(clamp(((e.clientX - r.left) / r.width) * 100)); refit(); };
  const onUp = () => { if (!drag.current) return; drag.current = null; document.body.classList.remove('resizing'); setW((v) => { commit(v); return v; }); refit(); };
  const nudge = (d) => setW((v) => { const n = clamp(v + d); commit(n); refit(); return n; });
  return (
    <div className="splitter" role="separator" aria-orientation="vertical" aria-label={u('resizePanel')} title={u('resizePanel')}
      aria-valuemin={W_MIN} aria-valuemax={W_MAX} aria-valuenow={Math.round(w)} tabIndex={0}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onDoubleClick={() => { setW(W_DEF); commit(W_DEF); refit(); }}
      onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-3); } else if (e.key === 'ArrowRight') { e.preventDefault(); nudge(3); } else if (e.key === 'Home') { e.preventDefault(); nudge(W_MIN - 100); } else if (e.key === 'End') { e.preventDefault(); nudge(100); } }}>
      <button type="button" className="sp-btn" tabIndex={-1} aria-hidden="true" onPointerDown={(e) => e.stopPropagation()} onClick={() => nudge(-6)}>‹</button>
      <span className="sp-grip" aria-hidden="true" />
      <button type="button" className="sp-btn" tabIndex={-1} aria-hidden="true" onPointerDown={(e) => e.stopPropagation()} onClick={() => nudge(6)}>›</button>
    </div>
  );
}

export default function Lab() {
  const { L, u, lang } = useT();
  const { st, update } = useLab();
  const [theoryE, setTheoryE] = useState(null);
  const { spec, hud, sub } = useMemo(() => sceneSpec(st, false, theoryE, L, u, lang), [st, theoryE, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const p = PRAC.find((x) => x[0] === String(st.cur));
  const Section = SECTIONS[st.sec];
  const setSec = (i) => { setTheoryE(null); update((n) => { n.sec = i; }, true); };
  const gridRef = useRef(null);
  const [w, setW] = useState(readW);
  useEffect(() => { const t = setTimeout(() => getEngine().refit(), 60); return () => clearTimeout(t); }, []);
  return (
    <div className="labgrid" ref={gridRef} style={{ '--stage-w': `${w}%` }}>
      <div className="labstage"><StageView mode="lab" spec={spec} hud={hud} sub={sub} /></div>
      <Splitter gridRef={gridRef} w={w} setW={setW} />
      <div className="panel">
        <div className="phead"><span className="no">{u('pracNo').toUpperCase()} {String(st.cur).padStart(2, '0')}</span><h1>{pTitle(p, lang)}</h1></div>
        <div className="tabs" role="tablist">
          {L(UI.secs).map((t, i) => (
            <button key={i} type="button" className="tab" role="tab" aria-selected={i === st.sec} onClick={() => setSec(i)}><span className="k">0{i + 1}</span>{t}</button>
          ))}
        </div>
        <div className="body"><Section key={`${st.cur}-${st.sec}`} theoryE={theoryE} setTheoryE={setTheoryE} /></div>
      </div>
    </div>
  );
}
