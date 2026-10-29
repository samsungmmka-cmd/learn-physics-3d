// Month names: Sinhala uses the everyday names (ජනවාරි, පෙබරවාරි…), not the traditional ones
// that browsers return for the 'si-LK' locale.
export const SI_MONTHS = ['ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි', 'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්'];
export const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// fmtDate(Date | 'YYYY-MM-DD', lang) -> "2026 ඔක්තෝබර් 29" (si) or "Oct 29, 2026" (en)
export function fmtDate(d, lang) {
  let y; let m; let day;
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) { [y, m, day] = d.slice(0, 10).split('-').map(Number); m -= 1; }
  else { const x = d instanceof Date ? d : new Date(d); if (Number.isNaN(x.getTime())) return String(d ?? ''); y = x.getFullYear(); m = x.getMonth(); day = x.getDate(); }
  return lang === 'si' ? `${y} ${SI_MONTHS[m]} ${day}` : `${EN_MONTHS[m]} ${day}, ${y}`;
}
