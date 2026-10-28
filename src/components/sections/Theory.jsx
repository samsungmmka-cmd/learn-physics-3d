import { useT } from '../../lib/i18n.jsx';
import { useLab } from '../../lib/labStore.jsx';
import { LABS } from '../../data/content.js';
import { LcCard } from './Setup.jsx';

function SpheroFig({ lang }) {
  return (
    <>
      <svg className="fig" viewBox="0 0 320 210" role="img" aria-label="Figure 3.2">
        <circle cx="160" cy="120" r="80" fill="none" stroke="var(--accent)" strokeWidth="2" />
        <line x1="160" y1="40" x2="160" y2="200" stroke="var(--muted)" strokeDasharray="4 4" />
        <line x1="96" y1="72" x2="224" y2="72" stroke="var(--ink)" strokeWidth="1.5" />
        <line x1="240" y1="40" x2="240" y2="72" stroke="var(--accent)" strokeWidth="2" />
        <text x="248" y="62" fontSize="14" fill="var(--accent)" fontFamily="var(--f-mono)">h</text>
        <line x1="270" y1="72" x2="270" y2="200" stroke="var(--muted)" />
        <text x="276" y="140" fontSize="13" fill="var(--muted)" fontFamily="var(--f-mono)">2R−h</text>
        <circle cx="160" cy="40" r="3" fill="var(--ink)" />
        <text x="105" y="66" fontSize="12" fill="var(--ink)" fontFamily="var(--f-mono)">r = a/√3</text>
        <text x="166" y="128" fontSize="13" fill="var(--accent)" fontFamily="var(--f-mono)">R</text>
        <line x1="160" y1="120" x2="224" y2="72" stroke="var(--accent)" strokeDasharray="3 3" />
      </svg>
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>{lang === 'si' ? '3.2 රූපය: r² = h(2R − h) සහ r = a/√3 බැවින් R = a²/6h + h/2 ලැබේ.' : 'Figure 3.2: since r² = h(2R − h) and r = a/√3, R = a²/6h + h/2.'}</p>
    </>
  );
}

export default function Theory({ theoryE, setTheoryE }) {
  const { L, u, lang } = useT();
  const { st } = useLab();
  const lab = LABS[st.cur];
  const ex = lab.zeroEx ? lab.zeroEx.find((z) => z.e === theoryE) : null;
  return (
    <>
      {/* theory HTML is static handbook content defined in this repo */}
      <div className="theory" dangerouslySetInnerHTML={{ __html: L(lab.theory) }} />
      {lab.inst === 'sphero' ? <SpheroFig lang={lang} /> : null}
      <LcCard />
      {lab.zeroEx ? (
        <div className="card">
          <h3>{u('zero')} · {u('bookEx')}</h3>
          <div className="chips">
            {lab.zeroEx.map((z) => <button type="button" key={z.fig} className="chip" aria-pressed={theoryE === z.e} onClick={() => setTheoryE(z.e)}>{lang === 'si' ? `${z.fig} රූපය` : `Figure ${z.fig}`}</button>)}
          </div>
          {ex ? <p>{L(ex)}</p> : <p style={{ color: 'var(--muted)' }}>{lang === 'si' ? 'රූපයක් තෝරන්න. 3D උපකරණය හා විශාලනය කළ පරිමාණය එම පිහිටීම පෙන්වයි.' : 'Pick a figure. The 3D instrument and magnified scale will show that position.'}</p>}
        </div>
      ) : null}
    </>
  );
}
