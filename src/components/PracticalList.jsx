import { useT } from '../lib/i18n.jsx';
import { useLab } from '../lib/labStore.jsx';
import { GROUPS, LABS, PRAC } from '../data/content.js';
import { useState } from 'react';
import { progress } from '../lib/calc.js';
import Combobox from './Combobox.jsx';

export default function PracticalList({ go }) {
  const { L, u, lang } = useT();
  const { st, update } = useLab();
  const open = (id) => { update((n) => { n.cur = +id; n.sec = 0; n.view = 'lab'; }, true); go('lab'); };
  const [flash, setFlash] = useState(null);
  // Search: open a ready practical, or scroll to one that is coming soon and highlight it.
  const find = (id) => {
    if (LABS[id]) { open(id); return; }
    const el = document.getElementById(`prac-${id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlash(id); setTimeout(() => setFlash((f) => (f === id ? null : f)), 2200);
  };
  const options = PRAC.map((p) => ({ value: p[0], tag: `P${p[0].padStart(2, '0')}`, label: lang === 'si' ? p[2] : p[3], sub: LABS[p[0]] ? undefined : u('soon'), search: `${p[0]} p${p[0].padStart(2, '0')} ${p[3]} ${GROUPS[p[1]].en || ''}` }));
  return (
    <div className="groups">
      <div className="find-prac"><Combobox id="findPrac" label={u('findPrac')} placeholder={u('searchPrac')} value="" onChange={find} options={options} /></div>
      {GROUPS.map((g, gi) => (
        <div key={gi}>
          <h2 className="sec-h" style={{ marginBottom: 10 }}>{L(g)}</h2>
          <div className="glist">
            {PRAC.filter((p) => p[1] === gi).map((p) => {
              const isOpen = !!LABS[p[0]]; const t = lang === 'si' ? p[2] : p[3];
              const inner = <><span className="n">{p[0].padStart(2, '0')}</span><span>{t}<small>{isOpen ? `${Math.round(progress(st, +p[0]) * 100)}%` : u('soon')}</small></span></>;
              return isOpen
                ? <button type="button" key={p[0]} id={`prac-${p[0]}`} className={`gi open${flash === p[0] ? ' flash' : ''}`} onClick={() => open(p[0])}>{inner}</button>
                : <div key={p[0]} id={`prac-${p[0]}`} className={`gi${flash === p[0] ? ' flash' : ''}`}>{inner}</div>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
