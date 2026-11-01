// Spherometer: React pieces shown in the handbook pages.
import { useT } from '../../lib/i18n.jsx';

// Theory tab: Figure 3.2 (radius of curvature from h and a).
export function TheoryFig() {
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
