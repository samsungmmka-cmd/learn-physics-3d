// Green tick shown on completed practicals.
export default function Tick({ label }) {
  return (
    <span className="tick" role="img" aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
    </span>
  );
}
