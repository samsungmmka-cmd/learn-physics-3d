// Practical title in the current language. PRAC rows: [id, group, si, en, ta?]
export const pTitle = (p, lang) => (!p ? '' : lang === 'si' ? p[2] : lang === 'ta' ? (p[4] || p[3]) : p[3]);
