import { useT } from '../../lib/i18n.jsx';
import { useLab } from '../../lib/labStore.jsx';
import { LABS } from '../../data/content.js';
import { LcCard } from './Setup.jsx';

function SpheroFig() {
  const { L } = useT();
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
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>{L({ si: '3.2 රූපය: r² = h(2R − h) සහ r = a/√3 බැවින් R = a²/6h + h/2 ලැබේ.', en: 'Figure 3.2: since r² = h(2R − h) and r = a/√3, R = a²/6h + h/2.', ta: 'உரு 3.2: r² = h(2R − h), r = a/√3 ஆதலால் R = a²/6h + h/2.' })}</p>
    </>
  );
}

// Figures 4.2–4.5: where the crosswire sits for each reading (inner circle = bore, outer = tube wall).
function TravelFig() {
  const { L } = useT();
  const T = (x, y, t, sub, a = 'middle') => <text x={x} y={y} fontSize="13" textAnchor={a} fill="var(--ink)" fontFamily="var(--f-mono)" fontStyle="italic">{t}<tspan fontSize="9" dy="3">{sub}</tspan></text>;
  const ring = (cx, cy, ri, ro, hatch) => (
    <>
      <circle cx={cx} cy={cy} r={ro} fill={hatch ? 'url(#tvHatch)' : 'none'} stroke="var(--ink)" strokeWidth="1.4" />
      <circle cx={cx} cy={cy} r={ri} fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.4" />
    </>
  );
  const vx = (x, y0, y1) => <line x1={x} y1={y0} x2={x} y2={y1} stroke="var(--accent)" strokeWidth="1.3" strokeDasharray="4 3" />;
  const hy = (y, x0, x1) => <line x1={x0} y1={y} x2={x1} y2={y} stroke="var(--accent)" strokeWidth="1.3" strokeDasharray="4 3" />;
  const cross = (x, y) => <path d={`M${x - 9},${y}h18M${x},${y - 9}v18`} stroke="var(--ink)" strokeWidth="1.2" />;
  return (
    <>
      <svg className="fig" viewBox="0 0 520 300" role="img" aria-label="Figures 4.2 to 4.5">
        <defs><pattern id="tvHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--muted)" strokeWidth="1" /></pattern></defs>
        {/* 4.2 capillary, horizontal */}
        {ring(70, 70, 18, 52, true)}{vx(52, 30, 128)}{vx(88, 30, 128)}{cross(52, 70)}{cross(88, 70)}
        {T(50, 145, 'X', '1', 'end')}{T(92, 145, 'X', '2', 'start')}<text x="70" y="166" fontSize="12" textAnchor="middle" fill="var(--muted)">4.2</text>
        {/* 4.3 capillary, vertical */}
        {ring(200, 70, 18, 52, true)}{hy(52, 160, 280)}{hy(88, 160, 280)}{cross(200, 52)}{cross(200, 88)}
        {T(286, 56, 'Y', '1', 'start')}{T(286, 92, 'Y', '2', 'start')}<text x="200" y="166" fontSize="12" textAnchor="middle" fill="var(--muted)">4.3</text>
        {/* 4.4 rubber tube, horizontal */}
        {ring(370, 70, 26, 48, false)}{vx(344, 16, 128)}{vx(396, 16, 128)}{vx(322, 16, 146)}{vx(418, 16, 146)}
        {T(348, 142, 'X', '1', 'start')}{T(392, 142, 'X', '2', 'end')}{T(318, 160, 'X', '3', 'end')}{T(422, 160, 'X', '4', 'start')}
        <text x="370" y="176" fontSize="12" textAnchor="middle" fill="var(--muted)">4.4</text>
        {/* 4.5 rubber tube, vertical */}
        {ring(200, 236, 26, 48, false)}{hy(210, 140, 290)}{hy(262, 140, 290)}{hy(188, 140, 320)}{hy(284, 140, 320)}
        {T(296, 214, 'Y', '1', 'start')}{T(296, 266, 'Y', '2', 'start')}{T(326, 192, 'Y', '3', 'start')}{T(326, 288, 'Y', '4', 'start')}
        <text x="110" y="240" fontSize="12" textAnchor="middle" fill="var(--muted)">4.5</text>
      </svg>
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>{L({
        si: '4.2 – 4.5 රූප: හරස් කම්බිය වෘත්තයේ ප්‍රතිවිරුද්ධ දාර ස්පර්ශ වන පිහිටීම්. කේශික නළය (4.2, 4.3) සහ රබර් නළය (4.4, 4.5).',
        en: 'Figures 4.2–4.5: where the crosswire touches opposite edges of the circle, for the capillary tube (4.2, 4.3) and the rubber tube (4.4, 4.5).',
        ta: 'உருக்கள் 4.2 – 4.5: மயிர்த்துளைக் குழாய் (4.2, 4.3), இறப்பர்க் குழாய் (4.4, 4.5) என்பவற்றில் குறுக்குக்கம்பி வட்டத்தின் எதிர் விளிம்புகளைத் தொடும் நிலைகள்.',
      })}</p>
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
      {lab.inst === 'sphero' ? <SpheroFig /> : null}
      {lab.inst === 'travel' ? <TravelFig /> : null}
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
