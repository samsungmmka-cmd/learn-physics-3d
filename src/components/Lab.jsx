import { useMemo, useState } from 'react';
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

const SECTIONS = [Apparatus, Theory, Procedure, Readings, Results];

export default function Lab() {
  const { L, u, lang } = useT();
  const { st, update } = useLab();
  const [theoryE, setTheoryE] = useState(null);
  const { spec, hud, sub } = useMemo(() => sceneSpec(st, false, theoryE, L, u, lang), [st, theoryE, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const p = PRAC.find((x) => x[0] === String(st.cur));
  const Section = SECTIONS[st.sec];
  const setSec = (i) => { setTheoryE(null); update((n) => { n.sec = i; }, true); };
  return (
    <div className="labgrid">
      <div className="labstage"><StageView mode="lab" spec={spec} hud={hud} sub={sub} /></div>
      <div className="panel">
        <div className="phead"><span className="no">{u('pracNo').toUpperCase()} {String(st.cur).padStart(2, '0')}</span><h1>{lang === 'si' ? p[2] : p[3]}</h1></div>
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
