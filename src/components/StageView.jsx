import { useEffect, useRef, useState } from 'react';
import { getEngine } from '../engine/engine.js';
import { useT } from '../lib/i18n.jsx';
import { UI } from '../data/content.js';

const CONTROLS = {
  caliper: [{ t: '⏪', v: -25, s: -5 }, { t: '◀', v: -1.5, s: -0.05 }, { t: '▶', v: 1.5, s: 0.05 }, { t: '⏩', v: 25, s: 5 }],
  micro: [{ t: '⏪', v: -2, s: -0.5 }, { t: '◀', v: -0.1, s: -0.01 }, { t: '▶', v: 0.1, s: 0.01 }, { t: '⏩', v: 2, s: 0.5 }, { t: 'ratchet', v: -1.2, s: -0.01, ratchet: true }],
  sphero: [{ t: '▼▼', v: -1.2, s: -0.5 }, { t: '▼', v: -0.06, s: -0.01 }, { t: '▲', v: 0.06, s: 0.01 }, { t: '▲▲', v: 1.2, s: 0.5 }],
};

function HoldButton({ c, label, wide }) {
  const stop = useRef(null);
  const [on, setOn] = useState(false);
  const end = () => { setOn(false); if (stop.current) { stop.current(); stop.current = null; } };
  return (
    <button
      type="button" className={`hb${wide ? ' wide' : ''}${on ? ' on' : ''}`} aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); setOn(true); stop.current = getEngine().hold(c); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ } }}
      onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); getEngine().press(c); } }}
    >{label}</button>
  );
}

const Icon = {
  rotL: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 12a8 8 0 1 0 2.5-5.8" /><path d="M4 4v4h4" /></svg>,
  rotR: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 12a8 8 0 1 1-2.5-5.8" /><path d="M20 4v4h-4" /></svg>,
  out: <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14" /></svg>,
  in: <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5v14" /></svg>,
  tagOn: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M3 12.6V4.5A1.5 1.5 0 0 1 4.5 3h8.1a1.5 1.5 0 0 1 1.06.44l6.9 6.9a1.5 1.5 0 0 1 0 2.12l-8.1 8.1a1.5 1.5 0 0 1-2.12 0l-6.9-6.9A1.5 1.5 0 0 1 3 12.6Z" /><circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" /></svg>,
  tagOff: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><path d="M3 12.6V4.5A1.5 1.5 0 0 1 4.5 3h8.1a1.5 1.5 0 0 1 1.06.44l6.9 6.9a1.5 1.5 0 0 1 0 2.12l-8.1 8.1a1.5 1.5 0 0 1-2.12 0l-6.9-6.9A1.5 1.5 0 0 1 3 12.6Z" opacity=".45" /><path d="M3 3l18 18" /></svg>,
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 5l2.6 7H9.4Z" fill="var(--c6)" stroke="none" /><path d="M12 19l-2.6-7h5.2Z" fill="currentColor" stroke="none" /></svg>,
};

// Hosts the shared WebGL stage. `spec` changes trigger a new scene; overlays are React.
export default function StageView({ mode, spec, hud, sub, cta, className = '' }) {
  const { u, L } = useT();
  const host = useRef(null);
  const loupeRef = useRef(null);
  const [status, setStatus] = useState(null);
  const [loupeMin, setLoupeMin] = useState(false);
  const eng = getEngine();
  const specKey = JSON.stringify(spec);
  // Show / hide part labels: one setting for every 3D view, remembered on this device.
  const [labelsOn, setLabelsOn] = useState(() => { try { return localStorage.getItem('lp-labels') !== '0'; } catch { return true; } });
  const toggleLabels = () => setLabelsOn((v) => { const n = !v; try { localStorage.setItem('lp-labels', n ? '1' : '0'); } catch { /* private mode */ } return n; });
  useEffect(() => { eng.setLabelsVisible(labelsOn); }, [labelsOn, specKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    eng.setMode(mode);
    eng.attach(host.current);
    eng.onStatus = setStatus;
    return () => { if (eng.onStatus === setStatus) eng.onStatus = null; };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { eng.setMode(mode); eng.show(spec); }, [specKey, mode]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { eng.setLoupe(mode === 'lab' && !loupeMin ? loupeRef.current : null); }, [mode, loupeMin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
      const k = e.key.toLowerCase();
      if (k === 'q') eng.rotateBy(-Math.PI / 4); else if (k === 'e') eng.rotateBy(Math.PI / 4);
      else if (k === '+' || k === '=') eng.zoomBy(1.2); else if (k === '-') eng.zoomBy(0.83);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [eng]);

  const controls = CONTROLS[spec.type] || [];
  return (
    <div className={`stage ${className}`} data-mode={mode}>
      <div className="stage-host" ref={host} />
      <div className="hud">
        <div className="chipT"><b>{hud}</b>{sub ? <span>{sub}</span> : null}</div>
        {mode === 'lab' && status ? <div className={`status3 ${status[0]}`}><i /><span>{u(status[1])}</span></div> : null}
      </div>
      <div className="tools">
        <button type="button" aria-label="Rotate left" onClick={() => eng.rotateBy(-Math.PI / 4)}>{Icon.rotL}</button>
        <button type="button" aria-label="Rotate right" onClick={() => eng.rotateBy(Math.PI / 4)}>{Icon.rotR}</button>
        <span className="dv" />
        <button type="button" aria-label="Zoom out" onClick={() => eng.zoomBy(0.8)}>{Icon.out}</button>
        <button type="button" aria-label="Zoom in" onClick={() => eng.zoomBy(1.25)}>{Icon.in}</button>
        <span className="dv" />
        <button type="button" aria-label={u('resetView')} onClick={() => eng.resetAll()}>{Icon.home}</button>
        {spec.labels && spec.labels.length ? (
          <>
            <span className="dv" />
            <button type="button" className={`lbl-btn${labelsOn ? ' on' : ''}`} aria-pressed={labelsOn} aria-label={labelsOn ? u('hideLabels') : u('showLabels')} title={labelsOn ? u('hideLabels') : u('showLabels')} onClick={toggleLabels}>{labelsOn ? Icon.tagOn : Icon.tagOff}</button>
          </>
        ) : null}
      </div>
      {mode === 'hero' && cta ? <div className="hero-cta">{cta}</div> : null}
      {mode === 'lab' ? (
        <div className="bottom">
          <div className={`loupe${loupeMin ? ' min' : ''}`}>
            <div className="lh"><span>{u('loupe')}</span><button type="button" onClick={() => setLoupeMin(!loupeMin)}>{loupeMin ? u('show') : u('hide')}</button></div>
            <canvas ref={loupeRef} />
          </div>
          <div className="ctrlbar">
            <span className="cap">{L(UI.ctrl[spec.type])}</span>
            <div className="hold">{controls.filter((c) => !c.ratchet).map((c) => <HoldButton key={c.t} c={c} label={c.t} />)}</div>
            {controls.filter((c) => c.ratchet).map((c) => <HoldButton key="r" c={c} label={u('ratchet')} wide />)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
