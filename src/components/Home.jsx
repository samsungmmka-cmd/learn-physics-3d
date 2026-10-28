import { useEffect, useMemo, useState } from 'react';
import { useT } from '../lib/i18n.jsx';
import { useLab } from '../lib/labStore.jsx';
import { useCommunity } from '../lib/community.jsx';
import { LABS, PRAC } from '../data/content.js';
import { progress } from '../lib/calc.js';
import { sceneSpec } from '../lib/scene.js';
import { getEngine } from '../engine/engine.js';
import StageView from './StageView.jsx';
import Ring from './Ring.jsx';
import { PostItem, AssignmentRow } from './Community.jsx';

let thumbCache = null;

export default function Home({ go }) {
  const t = useT(); const { L, u, lang } = t;
  const { st, update } = useLab();
  const comm = useCommunity();
  const { spec, hud, sub } = useMemo(() => sceneSpec(st, true, null, L, u, lang), [st.cur, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const [thumbs, setThumbs] = useState(thumbCache || {});
  useEffect(() => {
    if (thumbCache) return undefined;
    const id = setTimeout(() => { thumbCache = getEngine().thumbnails(); setThumbs(thumbCache); }, 400);
    return () => clearTimeout(id);
  }, []);
  const pick = (id) => {
    if (st.cur === +id) { go('lab'); return; }
    update((n) => { n.cur = +id; n.sec = 0; }, true);
  };
  const tops = comm.posts.filter((p) => !p.parent).slice(0, 3);
  return (
    <section>
      <div className="hero">
        <StageView mode="hero" spec={spec} hud={hud} sub={sub}
          cta={<button type="button" className="btn" onClick={() => go('lab')}>{progress(st, st.cur) > 0 ? u('cont') : u('start')}</button>} />
      </div>
      <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
        <div className="rowh"><h2 className="sec-h">{u('hPrac')}</h2><button type="button" className="link" onClick={() => go('list')}>{u('seeAll')}</button></div>
        <div className="carousel">
          {PRAC.slice(0, 8).map((p) => {
            const id = p[0], open = !!LABS[id], title = lang === 'si' ? p[2] : p[3];
            return (
              <button type="button" key={id} className={`pcard${open ? '' : ' lock'}${String(st.cur) === id ? ' cur' : ''}`} tabIndex={open ? 0 : -1} onClick={() => open && pick(id)}>
                <div className="th">
                  {open && thumbs[LABS[id].inst] ? <img alt="" src={thumbs[LABS[id].inst]} /> : <span className="glyph">{id.padStart(2, '0')}</span>}
                  {open ? <Ring p={progress(st, +id)} /> : null}
                </div>
                <div className="bd">
                  <span className="no">{u('pracNo').toUpperCase()} {id.padStart(2, '0')}</span>
                  <span className="nm">{title}</span>
                  {open ? null : <span className="muted" style={{ fontSize: 12 }}>{u('soon')}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="home-grid" style={{ marginTop: 8 }}>
        <div className="card">
          <h3>{u('assignments')}</h3>
          {!comm.uid ? <div className="empty">{u('signInToJoin')} <button type="button" className="link" onClick={() => { comm.setAuthMode('in'); go('comm'); }}>{u('signInTab')}</button></div>
            : comm.assignments.length ? comm.assignments.slice(0, 4).map((a) => <AssignmentRow key={a.id} a={a} onOpen={() => { comm.setFocus(a.id); go('comm'); }} />)
              : <div className="empty">{u('noAssign')}</div>}
        </div>
        <div className="card">
          <div className="rowh"><h3>{u('pulse')}</h3><button type="button" className="link" onClick={() => go('comm')}>{u('toComm')}</button></div>
          {!comm.uid ? <div className="empty">{u('signInToJoin')} <button type="button" className="link" onClick={() => { comm.setAuthMode('in'); go('comm'); }}>{u('signInTab')}</button></div>
            : tops.length ? tops.map((p) => <PostItem key={p.id} p={p} compact />) : <div className="empty">{u('noPosts')}</div>}
        </div>
      </div>
    </section>
  );
}
