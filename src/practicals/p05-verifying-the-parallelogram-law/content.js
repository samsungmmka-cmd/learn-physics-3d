// Practical 05 · Verifying the parallelogram law of forces and finding the mass of an object.
// Transcribed from the NIE G.C.E. (A/L) Physics Practical Handbook (pages 14–15). Tamil is in ./ta.js.
// Before each activity's reading the student sets up the weights, checks the pulleys, marks the strings and
// draws the parallelogram to scale (instruments/forceBoard/ui.jsx · PreMeas). The reading is the diagonal OC.
import { forces } from '../../instruments/forceBoard/physics.js';

const scale = (ls) => (ls.pre && ls.pre[0] && ls.pre[0].scale) || NaN; // g per cm, chosen in activity 1
const pan3 = (ls) => (ls.pans || [50, 50, 50])[2];
const r1 = (x) => Math.round(x * 10) / 10;

export default {
  inst: 'forceBoard',
  unit: 'cm', dp: 1,
  lcAns: 1, lcUnit: 'mm',

  acts: [
    { si: 'බල සමාන්තරාස්‍ර නියමය සත්‍යාපනය කිරීම', en: 'Verifying the parallelogram law of forces' },
    { si: 'වස්තුවක ස්කන්ධය (භාරය w) සෙවීම', en: 'Finding the mass of an object (weight w)' },
  ],
  materials: {
    si: 'බල සමාන්තරාස්‍ර උපකරණය, නොදන්නා ස්කන්ධයෙන් යුත් වස්තුවක් (කුඩා ගල් කැබැල්ලක් හෝ වීදුරු මුඩියක්), අගය දන්නා භාර තුනක්, විහිත චතුරස්‍රය හෝ කෙටි තල දර්පණ තීරුවක්, මීටර බාගයේ කෝදුවක්, පෝරු කටු, A4 සුදු කඩදාසියක්, සහ තෙදඬු තුලාවක්',
    en: 'A parallelogram-of-forces apparatus, an object of unknown mass (a small stone or a glass stopper), three known weights, a set square or a short strip of plane mirror, a half-metre rule, drawing pins, a sheet of white A4 paper and a triple-beam balance',
  },
  parts: [
    ['board', { si: 'පුවරුව', en: 'Board' }], ['pulley', { si: 'කප්පිය', en: 'Pulley' }], ['string', { si: 'තන්තුව', en: 'String' }],
    ['pan', { si: 'තුලා තැටිය', en: 'Scale pan' }], ['weights', { si: 'භාර', en: 'Weights' }], ['knot', { si: 'O ලක්ෂ්‍යය (ගැටය)', en: 'Knot O' }],
    ['paper', { si: 'A4 කඩදාසිය', en: 'A4 paper' }], ['mirror', { si: 'තල දර්පණ තීරුව', en: 'Mirror strip' }],
    ['sheet', { si: 'ඇඳීම (A4 කඩදාසිය)', en: 'Drawing (A4 paper)' }], ['rule', { si: 'මීටර බාගයේ කෝදුව', en: 'Half-metre rule' }],
  ],
  theory: {
    si: '<p>ලක්ෂ්‍යයක් මත ක්‍රියා කරන බල දෙකක් විශාලත්වයෙන් සහ දිශාවෙන් සමාන්තරාස්‍රයක බද්ධ පාද දෙකක් ඔස්සේ නිරූපණය කළ හැකි නම්, එම සමාන්තරාස්‍රයේ බද්ධ පාද හමු වන ලක්ෂ්‍යය හරහා ඇඳි විකර්ණය මගින් විශාලත්වයෙන් හා දිශාවෙන් එම බලවල සම්ප්‍රයුක්තය නිරූපණය කෙරේ.</p><p><b>බල සමාන්තරාස්‍ර නියමය සත්‍යාපනය කිරීම</b></p><p class="insight">සුදුසු පරිමාණයකට අනුව සම්පූර්ණ කරන ලද OACB සමාන්තරාස්‍රයේ (5.2 රූපය) OC විකර්ණයේ දිග, පරිමාණයෙන් ගුණ කළ විට ලැබෙන අගය w₃ භාරයට සමාන ව හා OC සිරස් ව පිහිටයි නම්, බල සමාන්තරාස්‍ර නියමයේ සත්‍යතාව තහවුරු වේ.</p><p><b>වස්තුවක ස්කන්ධය (භාරය w) සෙවීම</b></p><p class="insight">සුදුසු පරිමාණයකට අනුව සම්පූර්ණ කරන ලද OA′C′B′ සමාන්තරාස්‍රයේ (5.3 රූපය) OC′ විකර්ණයේ දිග පරිමාණයෙන් ගුණ කළ විට ලැබෙන අගය ස්කන්ධයේ අගයට සමාන වේ.</p>',
    en: '<p>If two forces acting at a point are represented in size and direction by two adjacent sides of a parallelogram, their resultant is represented in size and direction by the diagonal drawn through the point where those sides meet.</p><p><b>Verifying the parallelogram law of forces</b></p><p class="insight">If the diagonal OC of the parallelogram OACB (Figure 5.2), completed to a suitable scale, multiplied by the scale equals w₃, and OC is vertical, the parallelogram law is verified.</p><p><b>Finding the mass of an object (weight w)</b></p><p class="insight">The diagonal OC′ of the parallelogram OA′C′B′ (Figure 5.3), completed to the same scale, multiplied by the scale gives the mass.</p>',
  },
  lcQ: { si: 'OC දිග මැනීමට භාවිත කරන මීටර බාගයේ කෝදුවේ කුඩා ම කොටස 1 mm කි. එහි කුඩා ම මිනුම කීය ද?', en: 'The half-metre rule used to measure OC has 1 mm as its smallest division. What is its least count?' },
  lcWork: '1 mm',
  setup: { si: 'පෝරු කටු භාවිත කර කඩදාසිය පුවරුව මත සවි කරන්න.', en: 'Fix the paper to the board with drawing pins.' },
  steps: [
    {
      si: [
        '5.1 රූපයේ දැක්වෙන පරිදි w₁, w₂ හා w₃ භාර තුලා තැටි මත තබන්න.',
        'මැද ඇති භාරය මදක් පහළට ඇද එය මුදා හැර පළමු තිබූ පිහිටීමට නැවත පැමිණේ දැයි සෝදිසි කරන්න.',
        'විහිත චතුරස්‍රය තන්තුවලට ලම්බව තැබීමෙන් හෝ තල දර්පණ තීරුව තන්තුවලට යටින් තබා හෝ තන්තුවෙන් එහි ප්‍රතිබිම්බය වැසී යන අවස්ථාවේ දී කඩදාසිය මත එක් එක් තන්තුවෙහි ප්‍රක්ෂේපණය හැකි තරම් දුරින් තිත් දෙකක් තබා සලකුණු කරන්න.',
        'කඩදාසිය පුවරුවෙන් ඉවත් කර සලකුණු කර ගත් ලක්ෂ්‍ය හරහා යන පරිදි රේඛා අඳින්න. තැටිවල ස්කන්ධ මැන අදාළ භාරවලට එකතු කරන්න.',
        'සුදුසු පරිමාණයක් තෝරා ගෙන, w₁ සහ w₂ හි අගයවලට සමානුපාතික වන පරිදි OA සහ OB දිග ප්‍රමාණ සලකුණු කරන්න. OACB සමාන්තරාස්‍රය සම්පූර්ණ කර OC විකර්ණයේ දිග මනින්න. ඉහත සිද්ධාන්තයට අනුව බල සමාන්තරාස්‍ර නියමයේ සත්‍යතාව තහවුරු කරන්න.',
      ],
      en: [
        'Put the weights w₁, w₂ and w₃ on the scale pans as in Figure 5.1.',
        'Pull the middle weight down a little, let it go, and check that it comes back to where it was.',
        'Put a set square at right angles to each string, or put the mirror strip under the string and look so that the string hides its image; then mark the line of each string on the paper with two dots as far apart as possible.',
        'Take the paper off the board and draw lines through the marked points. Measure the masses of the pans and add them to the weights on them.',
        'Choose a suitable scale and mark OA and OB in proportion to w₁ and w₂. Complete the parallelogram OACB and measure the diagonal OC. Verify the parallelogram law using the theory above.',
      ],
    },
    {
      si: [
        'w₃ භාරය ඉවත් කර එම තැටියට සපයා ඇති වස්තුව (භාරය w) ඇතුළු කර පෙර පරිදි පරීක්ෂණය නැවත කරන්න.',
        'පළමු වන පරිමාණය ම භාවිත කර OA′C′B′ බල සමාන්තරාස්‍රය සම්පූර්ණ කර OC′ විකර්ණයේ දිග මනින්න.',
        'ඉහත සිද්ධාන්තයට අනුව සපයා ඇති වස්තුවේ ස්කන්ධය නිර්ණය කරන්න.',
      ],
      en: [
        'Take off the weight w₃, put the object (weight w) in that pan, and repeat the experiment.',
        'Using the same scale as before, complete the parallelogram of forces OA′C′B′ and measure the diagonal OC′.',
        'Find the mass of the object using the theory above.',
      ],
    },
  ],

  // OC and OC′ are measured on the student's own drawing (the rig builds it from their scale, OA and OB).
  meas: [
    { key: 'OC', act: 0, table: 'OC', n: 1, heads: ['OC'], label: { si: 'OC විකර්ණයේ දිග (cm)', en: 'Length of the diagonal OC (cm)' } },
    { key: 'OCp', act: 1, table: 'OC′', n: 1, heads: ['OC′'], label: { si: 'OC′ විකර්ණයේ දිග (cm)', en: 'Length of the diagonal OC′ (cm)' } },
  ],
  calcs: [
    { act: 0, key: 'W3d', unit: 'g', dp: 1, label: { si: 'OC × පරිමාණය (w₃ සමග සසඳන්න)', en: 'OC × scale (compare with w₃)' }, f: 'OC × scale',
      fn: (m, ls) => m.OC * scale(ls), work: (m, ls) => `OC = ${m.OC} cm, 1 cm = ${scale(ls)} g` },
    { act: 0, key: 'E3', unit: '%', dp: 2, tolAbs: 0.25, label: { si: 'OC × පරිමාණය හා w₃ අතර ප්‍රතිශත වෙනස', en: 'Percentage difference between OC × scale and w₃' }, f: '|OC × scale − w₃| / w₃ × 100',
      fn: (m, ls) => { const W = forces(ls, 0).W; return (Math.abs(m.OC * scale(ls) - W) / W) * 100; },
      work: (m, ls) => `OC × scale = ${r1(m.OC * scale(ls))} g, w₃ = ${forces(ls, 0).W} g` },
    { act: 1, key: 'M', unit: 'g', dp: 1, label: { si: 'වස්තුවේ ස්කන්ධය', en: 'Mass of the object' }, f: 'm = OC′ × scale − mass of the pan',
      fn: (m, ls) => m.OCp * scale(ls) - pan3(ls), work: (m, ls) => `OC′ = ${m.OCp} cm, 1 cm = ${scale(ls)} g, pan = ${pan3(ls)} g` },
    { act: 1, key: 'PE', unit: '%', dp: 2, tolAbs: 0.25, label: { si: 'ප්‍රතිශත දෝෂය (තුලාවෙන් මැනූ ස්කන්ධයට සාපේක්ෂව)', en: 'Percentage error (against the mass on the balance)' }, f: '|m − m(balance)| / m(balance) × 100',
      fn: (m, ls) => (Math.abs(m.OCp * scale(ls) - pan3(ls) - ls.mObj) / ls.mObj) * 100,
      work: (m, ls) => `m = ${r1(m.OCp * scale(ls) - pan3(ls))} g, m(balance) = ${ls.mObj} g` },
  ],
  // Line above the tables on the Readings page: the scale used, the weights and the balance reading.
  info: (ls) => {
    const f = forces(ls, 0), s = scale(ls), sc = Number.isFinite(s) ? `1 cm = ${s} g` : '—';
    const w = `w₁ = ${f.w1} g, w₂ = ${f.w2} g, w₃ = ${f.W} g`;
    return {
      si: `භාවිත කළ පරිමාණය: ${sc} · ${w} · 3 වන තැටියේ ස්කන්ධය = ${pan3(ls)} g · වස්තුවේ ස්කන්ධය (තෙදඬු තුලාව) = ${ls.mObj} g`,
      en: `Scale used: ${sc} · ${w} · mass of pan 3 = ${pan3(ls)} g · mass of the object (triple-beam balance) = ${ls.mObj} g`,
      ta: `பயன்படுத்திய அளவுத்திட்டம்: ${sc} · ${w} · 3 ஆம் தட்டின் திணிவு = ${pan3(ls)} g · பொருளின் திணிவு (மூன்று கோல் தராசு) = ${ls.mObj} g`,
    };
  },
  resultTxt: { si: 'පළමු වන පරීක්ෂණයේ ප්‍රතිඵල අනුව බල සමාන්තරාස්‍ර නියමය තහවුරු කරන්න. දෙවන පරීක්ෂණයේ ප්‍රතිඵල අනුව සපයා ඇති වස්තුවේ ස්කන්ධය සටහන් කරන්න.', en: 'Use the results of the first experiment to verify the parallelogram law of forces. Record the mass of the object from the results of the second experiment.' },
  disc: { si: 'වස්තුවේ ස්කන්ධය තුලාවෙන් මැන පරීක්ෂණයෙන් ලැබෙන අගයේ ප්‍රතිශත දෝෂය සොයන්න. කිසියම් අපගමනයක් ඇත් නම් ඊට හේතු සාධක ඉදිරිපත් කරන්න.', en: 'Measure the mass of the object on the balance and find the percentage error in the value from the experiment. If there is any difference, give the reasons for it.' },
  note: {
    si: 'බල සමාන්තරාස්‍ර උපකරණයේ තැටිවලට භාර යොදා මැද ඇති භාරය මදක් පහළට ඇද මුදා හළ විට එය පළමුව තිබූ පිහිටීමට නැවත නොපැමිණේ නම් කප්පිවල ඝර්ෂණය නිසා මෙය සිදු විය හැකි ය. කප්පි භ්‍රමණය වන ස්ථානවලට ලිහිසි තෙල් යෙදීමෙන් ඝර්ෂණය අවම කර ගත හැකි ය. තන්තු බර සහිත වූයේ නම් ඒවායේ බරත් අදාළ භාරවලට එකතු වන බැවින් පරීක්ෂණයේ ප්‍රතිඵලවල නිරවද්‍යතාව අඩු වීමට එය හේතු වේ. තන්තු සැහැල්ලු වූ තරමට පරීක්ෂණයේ ප්‍රතිඵල වඩාත් නිරවද්‍ය වේ.',
    en: 'If, with the weights on the pans, the middle weight does not come back to where it was after being pulled down a little and let go, friction in the pulleys may be the cause. Oiling the pulley bearings keeps friction low. Heavy strings add their own weight to the weights and make the results less accurate: the lighter the strings, the more accurate the results.',
  },
};
