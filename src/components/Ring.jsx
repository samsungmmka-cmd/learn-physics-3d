export default function Ring({ p }) {
  const r = 12, c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r={r} fill="var(--card)" stroke="var(--line)" strokeWidth="3" />
      <circle cx="15" cy="15" r={r} fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 15 15)" strokeLinecap="round" />
    </svg>
  );
}
