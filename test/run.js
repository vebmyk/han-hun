// Run with: node test/run.js
const { replaceHen } = require('../hen.js');

// [mode, input, expected, optional ctx]
const cases = [
  // --- subject ---
  ['han', 'Hen kom hjem sent.', 'Han kom hjem sent.'],
  ['han', 'Hen er hjemme.', 'Han er hjemme.'],
  ['han', 'Hen selv sa det.', 'Han selv sa det.'],
  ['han', 'Hen og hun gikk hjem.', 'Han og hun gikk hjem.'],
  ['han', 'HEN kom.', 'HAN kom.'],
  // --- inverted subject (V2) ---
  ['han', 'Så gikk hen hjem.', 'Så gikk han hjem.'],
  ['han', 'Så gikk hen til døren.', 'Så gikk han til døren.'],
  ['han', 'Hva sier hen til det?', 'Hva sier han til det?'],
  ['han', 'Der står hen og venter.', 'Der står han og venter.'],
  ['han', 'Er hen hjemme?', 'Er han hjemme?'],
  ['han', 'Hvorfor kom ikke hen?', 'Hvorfor kom ikke han?'],
  ['han', 'Så skrek hen.', 'Så skrek han.'],
  ['han', 'Hvem er hen egentlig?', 'Hvem er han egentlig?'],
  ['han', 'Det var hen.', 'Det var han.'],
  // --- subordinate clauses ---
  ['han', 'Når hen kommer, ringer jeg.', 'Når han kommer, ringer jeg.'],
  ['han', 'Jeg tror hen kommer.', 'Jeg tror han kommer.'],
  ['han', 'Jeg skjønte ikke hva hen mente.', 'Jeg skjønte ikke hva han mente.'],
  ['han', 'Per og hen gikk på kino.', 'Per og han gikk på kino.'],
  // --- object ---
  ['han', 'Jeg møtte hen i går.', 'Jeg møtte ham i går.'],
  ['han', 'Jeg lot hen gjøre det.', 'Jeg lot ham gjøre det.'],
  ['han', 'Hun la hen i sengen.', 'Hun la ham i sengen.'],
  ['han', 'Jeg ga hen en gave.', 'Jeg ga ham en gave.'],
  ['han', 'Jeg ser ikke hen.', 'Jeg ser ikke ham.'],
  ['han', 'Jeg skal hente hen.', 'Jeg skal hente ham.'],
  ['han', 'Hent hen fra skolen.', 'Hent ham fra skolen.'],
  ['han', 'Jeg møtte Per og hen.', 'Jeg møtte Per og ham.'],
  ['han', 'Jeg snakket med hen om det.', 'Jeg snakket med ham om det.'],
  ['han', 'Gi det til hen.', 'Gi det til ham.'],
  ['han', 'Han ble sint på hen.', 'Han ble sint på ham.'],
  ['han', 'Møtte jeg hen i går?', 'Møtte jeg ham i går?'],
  ['hun', 'Jeg møtte hen i går.', 'Jeg møtte henne i går.'],
  // --- possessive ---
  ['han', 'Det er hens bok.', 'Det er hans bok.'],
  ['hun', 'Det er hens bok.', 'Det er hennes bok.'],
  ['slash', 'Hens bok ligger der.', 'Hans/hennes bok ligger der.'],
  // --- slash mode ---
  ['slash', 'Hen kom.', 'Han/hun kom.'],
  ['slash', 'Jeg møtte hen.', 'Jeg møtte ham/henne.'],
  ['slash', 'HEN kom.', 'HAN/HUN kom.'],
  // --- multiple sentences ---
  ['han', 'Jeg møtte hen. Hen smilte.', 'Jeg møtte ham. Han smilte.'],
  // --- must stay unchanged: adverb idioms ---
  ['han', 'Han gikk hen til døren.', 'Han gikk hen til døren.'],
  ['han', 'Han gikk hen og sa det.', 'Han gikk hen og sa det.'],
  ['han', 'La det stå hen.', 'La det stå hen.'],
  ['han', 'Han falt hen i søvn.', 'Han falt hen i søvn.'],
  ['han', 'Det ble sendt hen i det uvisse.', 'Det ble sendt hen i det uvisse.'],
  // --- must stay unchanged: look-alikes ---
  ['han', 'Han henvendte seg til henne.', 'Han henvendte seg til henne.'],
  ['han', 'Han hentet henne og hengte opp jakken.', 'Han hentet henne og hengte opp jakken.'],
  ['han', 'Ordet hen-pronomen er nytt.', 'Ordet hen-pronomen er nytt.'],
  // --- context across text-node boundaries (e.g. <b>hen</b>) ---
  ['han', 'hen', 'ham', { before: 'Jeg møtte ', after: '.' }],
  ['han', 'Hen', 'Han', { before: '', after: ' kom.' }],
  ['han', 'hen', 'han', { before: 'Så gikk ', after: ' hjem.' }],
  // --- interrogative adverb "hvor ... hen" must stay unchanged ---
  ['han', 'Hvor skal du hen?', 'Hvor skal du hen?'],
  ['han', 'Jeg vet ikke hvor du skal hen.', 'Jeg vet ikke hvor du skal hen.'],
  ['han', 'Hvor bor du hen?', 'Hvor bor du hen?'],
  ['han', 'Hvor har du bodd hen?', 'Hvor har du bodd hen?'],
  ['han', 'Hvor skal du egentlig hen?', 'Hvor skal du egentlig hen?'],
  ['han', 'Hvor kan jeg dra hen?', 'Hvor kan jeg dra hen?'],
  ['han', 'Hvor flyttet de hen i fjor?', 'Hvor flyttet de hen i fjor?'],
  ['han', 'Kvar skal du hen?', 'Kvar skal du hen?'],
  ['han', 'Det er adverbet hen.', 'Det er adverbet hen.'],
  // --- "hvor" with the pronoun must still be rewritten ---
  ['han', 'Hvor bodde hen?', 'Hvor bodde han?'],
  ['han', 'Hvor tror du hen bor?', 'Hvor tror du han bor?'],
  ['han', 'Hvor ofte ser du hen?', 'Hvor ofte ser du ham?'],
  ['han', 'Hvor kjenner du hen fra?', 'Hvor kjenner du ham fra?'],
  ['han', 'Hvor reiste du med hen?', 'Hvor reiste du med ham?'],
  ['han', 'Hvor skal du møte hen?', 'Hvor skal du møte ham?'],
  ['han', 'Hvor gammel er hen?', 'Hvor gammel er han?'],
  ['hun', 'Hvor har du sett hen?', 'Hvor har du sett henne?'],
  // --- Nynorsk (ctx.lang = 'nn'): ho / han (object) / hennar ---
  ['hun', 'Hen er fødd i 1991.', 'Ho er fødd i 1991.', { lang: 'nn' }],
  ['hun', 'Eg har ikkje sett hen her på lenge.', 'Eg har ikkje sett henne her på lenge.', { lang: 'nn' }],
  ['han', 'Eg har ikkje sett hen her på lenge.', 'Eg har ikkje sett han her på lenge.', { lang: 'nn' }],
  ['slash', 'Hen var her i går.', 'Han/ho var her i går.', { lang: 'nn' }],
  ['slash', 'Eg møtte hen i går.', 'Eg møtte han/henne i går.', { lang: 'nn' }],
  ['slash', 'Eg har gløymt namnet hens.', 'Eg har gløymt namnet hans/hennar.', { lang: 'nn' }],
  ['hun', 'Det er hens bok.', 'Det er hennar bok.', { lang: 'nn' }],
  ['hun', 'Eg trur hen kjem.', 'Eg trur ho kjem.', { lang: 'nn' }],
  ['hun', 'Kva seier hen?', 'Kva seier ho?', { lang: 'nn' }],
  ['hun', 'Korleis ser objektsforma av hen ut?', 'Korleis ser objektsforma av henne ut?', { lang: 'nn' }],
  ['hun', 'Blir studenten teken i fusk, kan hen bli utestengd.', 'Blir studenten teken i fusk, kan ho bli utestengd.', { lang: 'nn' }],
  ['hun', 'Eg gav hen ei gåve frå dei.', 'Eg gav henne ei gåve frå dei.', { lang: 'nn' }],
  ['hun', 'Eg snakka med hen.', 'Eg snakka med henne.', { lang: 'nn' }],
  ['hun', 'Hen gjekk heim.', 'Ho gjekk heim.', { lang: 'nn' }],
  ['hun', 'Han gjekk hen til døra.', 'Han gjekk hen til døra.', { lang: 'nn' }],
  ['hun', 'Kvar skal du hen?', 'Kvar skal du hen?', { lang: 'nn' }],
  ['hun', 'Kvar budde hen?', 'Kvar budde ho?', { lang: 'nn' }],
  ['hun', 'Eg veit ikkje kvar du bur hen.', 'Eg veit ikkje kvar du bur hen.', { lang: 'nn' }],
  // Bokmål is unaffected by an explicit lang = 'nb'
  ['hun', 'Jeg møtte hen i går.', 'Jeg møtte henne i går.', { lang: 'nb' }],
  ['hun', 'Hen er hjemme.', 'Hun er hjemme.', { lang: 'nb' }],
];

let failed = 0;
for (const [mode, input, expected, ctx] of cases) {
  const got = replaceHen(input, mode, ctx);
  if (got !== expected) {
    failed++;
    console.log(`FAIL [${mode}] ${input}\n  expected: ${expected}\n  got:      ${got}`);
  }
}
console.log(`${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
