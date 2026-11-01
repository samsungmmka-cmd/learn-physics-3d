import { useT } from '../../lib/i18n.jsx';
import { useLab } from '../../lib/labStore.jsx';
import { LABS } from '../../practicals/index.js';
import { LcCard } from './Setup.jsx';
import { instrumentUI } from '../../instruments/ui.js';

export default function Theory({ theoryE, setTheoryE }) {
  const { L, u, lang } = useT();
  const { st } = useLab();
  const lab = LABS[st.cur];
  const { TheoryFig } = instrumentUI(lab.inst);
  const ex = lab.zeroEx ? lab.zeroEx.find((z) => z.e === theoryE) : null;
  return (
    <>
      {/* theory HTML is static handbook content defined in this repo */}
      <div className="theory" dangerouslySetInnerHTML={{ __html: L(lab.theory) }} />
      {TheoryFig ? <TheoryFig /> : null}
      <LcCard />
      {lab.zeroEx ? (
        <div className="card">
          <h3>{u('zero')} · {u('bookEx')}</h3>
          <div className="chips">
            {lab.zeroEx.map((z) => <button type="button" key={z.fig} className="chip" aria-pressed={theoryE === z.e} onClick={() => setTheoryE(z.e)}>{lang === 'si' ? `${z.fig} රූපය` : lang === 'ta' ? `உரு ${z.fig}` : `Figure ${z.fig}`}</button>)}
          </div>
          {ex ? <p>{L(ex)}</p> : <p style={{ color: 'var(--muted)' }}>{L({ si: 'රූපයක් තෝරන්න. 3D උපකරණය හා විශාලනය කළ පරිමාණය එම පිහිටීම පෙන්වයි.', en: 'Pick a figure. The 3D instrument and magnified scale will show that position.', ta: 'ஓர் உருவைத் தெரிவு செய்யவும். 3D கருவியும் பெரிதாக்கிய அளவுகோலும் அந்நிலையைக் காட்டும்.' })}</p>}
        </div>
      ) : null}
    </>
  );
}
