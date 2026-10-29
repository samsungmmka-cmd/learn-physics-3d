// Adds Tamil (`ta`) to the existing bilingual content. Missing entries fall back to English.
import { UI, GROUPS, LABS, DISC, RESULT_TXT, PRAC } from './content.js';
import { TA_UI } from './ta-ui.js';
import { TA_LABS } from './ta-labs.js';
import { TA_GROUPS, TA_DISC, TA_RESULT_TXT, TA_PRAC } from './ta-prac.js';

const at = (root, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), root);
const put = (obj, ta) => { if (obj && typeof obj === 'object' && 'en' in obj && ta != null) obj.ta = ta; };

Object.entries(TA_UI).forEach(([k, v]) => put(UI[k] || at(UI, k), v));
GROUPS.forEach((g, i) => put(g, TA_GROUPS[i]));
put(DISC, TA_DISC); put(RESULT_TXT, TA_RESULT_TXT);
Object.entries(TA_LABS).forEach(([path, v]) => put(at(LABS, path), v));
PRAC.forEach((p) => { if (TA_PRAC[p[0]]) p[4] = TA_PRAC[p[0]]; });
