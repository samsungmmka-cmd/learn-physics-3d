import { useT } from '../lib/i18n.jsx';
import { useLab } from '../lib/labStore.jsx';
import { GROUPS, LABS, PRAC } from '../data/content.js';
import { progress } from '../lib/calc.js';

export default function PracticalList({ go }) {
  const { L, u, lang } = useT();
  const { st, update } = useLab();
  const open = (id) => { update((n) => { n.cur = +id; n.sec = 0; n.view = 'lab'; }, true); go('lab'); };
  return (
    <div className="groups">
      {GROUPS.map((g, gi) => (
        <div key={gi}>
          <h2 className="sec-h" style={{ marginBottom: 10 }}>{L(g)}</h2>
          <div className="glist">
            {PRAC.filter((p) => p[1] === gi).map((p) => {
              const isOpen = !!LABS[p[0]]; const t = lang === 'si' ? p[2] : p[3];
              const inner = <><span className="n">{p[0].padStart(2, '0')}</span><span>{t}<small>{isOpen ? `${Math.round(progress(st, +p[0]) * 100)}%` : u('soon')}</small></span></>;
              return isOpen
                ? <button type="button" key={p[0]} className="gi open" onClick={() => open(p[0])}>{inner}</button>
                : <div key={p[0]} className="gi">{inner}</div>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
