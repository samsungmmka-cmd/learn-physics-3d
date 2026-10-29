import { useEffect, useRef, useState } from 'react';
import { onBusy } from '../lib/api.js';
import { useT } from '../lib/i18n.jsx';

// Shows that something is happening when a server request takes a moment:
// a thin progress bar after 250 ms, and a small "Please wait" card if it takes longer than 1.5 s.
export default function GlobalLoader() {
  const { u } = useT();
  const [bar, setBar] = useState(false);
  const [card, setCard] = useState(false);
  const [slow, setSlow] = useState(false);
  const t = useRef([]);
  useEffect(() => onBusy((n) => {
    t.current.forEach(clearTimeout); t.current = [];
    if (n > 0) {
      t.current.push(setTimeout(() => setBar(true), 250));
      t.current.push(setTimeout(() => setCard(true), 1500));
      t.current.push(setTimeout(() => setSlow(true), 8000));
    } else { setBar(false); setCard(false); setSlow(false); }
  }), []);
  useEffect(() => () => t.current.forEach(clearTimeout), []);
  return (
    <>
      <div className={`gl-bar${bar ? ' on' : ''}`} aria-hidden="true"><i /></div>
      {card ? (
        <div className="gl-card" role="status" aria-live="polite">
          <span className="spin" aria-hidden="true" />
          <span>{slow ? u('stillWorking') : u('loading')}</span>
        </div>
      ) : null}
    </>
  );
}
