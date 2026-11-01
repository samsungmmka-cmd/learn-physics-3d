// Travelling microscope: React pieces shown in the handbook pages.
import { useT } from '../../lib/i18n.jsx';

// Theory tab: figures 4.2–4.5: where the crosswire sits for each reading (inner circle = bore, outer = tube wall).
export function TheoryFig() {
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

// Procedure tab: which edge the crosswire should touch for this reading.
export function MeasNote({ m, i }) {
  const { u, L } = useT();
  const edge = [u('edgeL'), u('edgeR'), u('edgeT'), u('edgeB')][i];
  const what = m.edge === 'out'
    ? L({ si: 'නළයේ බාහිර පෘෂ්ඨයේ', en: 'outside of the tube', ta: 'குழாயின் வெளிப்புறத்தின்' })
    : L({ si: 'සිදුරේ', en: 'bore', ta: 'துளையின்' });
  const wire = i < 2 ? L({ si: 'සිරස් හරස් කම්බිය', en: 'vertical crosswire', ta: 'நிலைக்குத்துக் குறுக்குக்கம்பி' }) : L({ si: 'තිරස් හරස් කම්බිය', en: 'horizontal crosswire', ta: 'கிடைக் குறுக்குக்கம்பி' });
  const move = i < 2 ? L({ si: 'අණ්වීක්ෂය තිරස්ව', en: 'the microscope sideways', ta: 'நுணுக்குக்காட்டியைப் பக்கவாட்டில்' }) : L({ si: 'අණ්වීක්ෂය සිරස්ව', en: 'the microscope up or down', ta: 'நுணுக்குக்காட்டியை மேலும் கீழும்' });
  const head = m.heads[i];
  return (
    <p className="fb info">{L({
      si: `${head}: ${wire} ${what} ${edge} ස්පර්ශ වන තුරු ${move} චලනය කරන්න, ඉන්පසු ${i < 2 ? 'තිරස්' : 'සිරස්'} පරිමාණය කියවන්න.`,
      en: `${head}: move ${move} until the ${wire} just touches the ${edge} of the ${what}, then read the ${i < 2 ? 'horizontal' : 'vertical'} scale.`,
      ta: `${head}: ${wire} ${what} ${['இடது விளிம்பை', 'வலது விளிம்பை', 'மேல் விளிம்பை', 'கீழ் விளிம்பை'][i]}த் தொடும் வரை ${move} நகர்த்தி, ${i < 2 ? 'கிடை' : 'நிலைக்குத்து'} அளவுகோலை வாசிக்கவும்.`,
    })}<br /><span className="muted" style={{ fontSize: 12 }}>{u('lensTip')}</span></p>
  );
}
