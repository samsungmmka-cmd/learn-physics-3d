// Magnified-scale view (the loupe) for the __NAME__, drawn on a 2D canvas whenever the rig changes.
// Template: the mm scale around the cursor, with the index line in red. `hint` highlights the mark to read.
export function loupe(c, w, h, R, hint) {
  const r = R.reading(); c.fillStyle = '#1b2333'; c.fillRect(0, 0, w, h);
  const span = 24, left = r - span / 2, ppm = w / span, X = (mm) => (mm - left) * ppm;
  const y0 = Math.round(h * 0.18), y1 = Math.round(h * 0.82);
  c.fillStyle = '#efe6cf'; c.fillRect(0, y0, w, y1 - y0);
  c.textAlign = 'center'; c.font = `700 ${Math.max(11, Math.round(h * 0.12))}px Arial`;
  const near = Math.round(r);
  for (let mm = Math.ceil(left); mm <= left + span; mm++) {
    if (mm < 0) continue;
    const Lh = (mm % 10 === 0 ? 0.55 : mm % 5 === 0 ? 0.4 : 0.25) * (y1 - y0);
    c.fillStyle = hint && mm === near ? '#e0560b' : '#14171c';
    c.fillRect(X(mm) - 1, y0, 2, Lh);
    if (mm % 10 === 0) c.fillText(String(mm / 10), X(mm), y1 - 6);
  }
  c.fillStyle = '#d2452f'; c.fillRect(X(r) - 1.5, 0, 3, h);
}
