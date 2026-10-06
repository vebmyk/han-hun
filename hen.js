/*
 * hen.js – core replacement logic for the Norwegian neopronoun "hen".
 * Loaded as a content script in the browser and via require() in Node (tests).
 *
 * Strategy: treat every standalone "hen" as the pronoun, exempt only a few
 * clearly marked adverb idioms, then decide subject vs. object form with
 * cheap word-list heuristics (no POS tagger). The word lists below are the
 * main tuning surface.
 */
(function (root) {
  'use strict';

  const set = (s) => new Set(s.split(/\s+/).filter(Boolean));

  // Bokmål forms. Nynorsk (ctx.lang === 'nn') has its own: ho, han as object, hennar, vedkomande.
  // "vedkommende" does not inflect for case, so subject and object are the same.
  const FORMS = {
    slash: { subj: 'han/hun', obj: 'ham/henne', poss: 'hans/hennes' },
    han:   { subj: 'han',     obj: 'ham',       poss: 'hans' },
    hun:   { subj: 'hun',     obj: 'henne',     poss: 'hennes' },
    vedkommende: { subj: 'vedkommende', obj: 'vedkommende', poss: 'vedkommendes' },
  };
  const FORMS_NN = {
    slash: { subj: 'han/ho', obj: 'han/henne', poss: 'hans/hennar' },
    han:   { subj: 'han',    obj: 'han',       poss: 'hans' },
    hun:   { subj: 'ho',     obj: 'henne',     poss: 'hennar' },
    vedkommende: { subj: 'vedkomande', obj: 'vedkomande', poss: 'vedkomandes' },
  };

  // Prepositions that are always followed by the object form.
  const PREP = set(`til med hos uten mot fra av på ved under over blant gjennom
    mellom rundt omkring bak foran overfor ifølge i innen utenfor innenfor langs
    frå utan hjå millom framfor ifrå`);

  // Words that are either a preposition/conjunction: object unless a finite verb follows.
  const AMBIG = set('for om før etter siden sidan som enn og eller men');

  // Subordinators / wh-words: "hen" right after them is a subject.
  const SUB = set(`at hvis når da mens fordi dersom hvem hva hvor hvordan hvorfor hvilken
    viss då medan kven kva kvar korleis kvifor kor`);

  // Words that can front a clause (V2 word order): "Så gikk hen", "Hva sier hen".
  const FRONT = set(`så da der her nå hvorfor hva hvor hvordan når plutselig ofte aldri
    kanskje deretter derfor og men i går igår senere først endelig dessverre heldigvis
    allerede då no kvifor kva kvar korleis kor seinare endeleg difor allereie plutseleg`);

  const ADV = set(`ikke aldri også alltid bare ofte heller vel jo nok gjerne straks
    endelig allerede fortsatt egentlig ikkje òg berre endeleg allereie framleis eigentleg
    faktisk virkelig verkeleg sikkert neppe visst`);

  // More words that open a fronted phrase: "I dag kom hen", "Neste dag reiste hen".
  const TIMEFRONT = set(`samme neste forrige hver sist tidlig sent klokka dagen natten kvelden
    morgenen uken året helgen sommeren vinteren høsten våren`);
  const PREP_AMBIG = set('etter før om siden sidan');   // also in AMBIG; as a clause opener they are prepositions
  const COORD = set('og men eller for');
  const fronted = (w) => FRONT.has(w) || PREP.has(w) || TIMEFRONT.has(w) || PREP_AMBIG.has(w);

  // Subordinating words: a clause that contains one has its own subject before the verb.
  const CONJ = set('at hvis når da mens fordi dersom viss då medan som');

  const SUBJPRON = set('jeg du han hun vi de man dere det den dette eg ho me dei ein dykk');
  const COPULA = set('er var vært være blir ble bli vart blei vore vere');

  // "gå hen til", "han kom hen til meg": hen is the adverb 'over'. Infinitives/participles always;
  // finite forms only when a subject precedes them (not "I går kom hen til meg").
  const MOTION_INF = set('gå gått komme kommet løpe løpt dra dratt');
  const MOTION_FIN = set('går gikk gjekk kom kommer løp løper dro drar');

  // Verbs that take a clause without "at": "Jeg tror hen planlegger …" – hen is the subject
  // whatever verb follows, which the finite-verb word list cannot guarantee.
  const CLAUSAL = set(`tror trodde mener mente synes syntes håper håpet antar antok trur trudde
    meiner meinte synest håpar`);

  const SAY = set('sa sier seier vet veit visste');   // also take a bare clause: "som sa hen kom"

  // Present/past forms that are identical to the imperative. Sentence-initially they are
  // imperatives ("La hen gå", "Spør hen") unless the sentence ends in "?".
  const IMP_AMBIG = set('la spør gjør finn les skriv syng vinn gjer gjev fortel ligg sit');

  // Pronouns that fix the case of a coordinated hen: "han, hun eller hen", "ham og hen".
  const SUBJ_ONLY = set('jeg du han hun vi de man eg ho me dei');
  const OBJ_ONLY = set('meg deg ham henne oss dem');

  // Interrogative "hvor/kvar … hen" ("Hvor skal du hen?"): hen is an adverb, not the pronoun.
  const WHERE = set('hvor kvar kor');
  const MODAL = set('skal skulle vil ville må måtte kan kunne');
  const LOC = set(`bo bor bodde bodd bur budde budd dra drar dro dratt dreg drog reise reiser reiste
    reist flytte flytter flyttet flyttar gå går gikk gått gjekk kjøre kjører kjørte kjørt køyre
    køyrer køyrde sitte sitter satt sit sat stå står sto stod stått ligge ligger lå ligg låg løpe
    løper løp spring sprang jobbe jobber jobbet jobbar sove sover sov studere studerer`);

  // Finite verb forms (present/past/modals). Infinitives are deliberately left out:
  // "lot hen gjøre" -> object, "tror hen kommer" -> subject.
  const VERB = set(`er var har hadde kan kunne vil ville skal skulle må måtte bør burde
    ble blir får fikk gikk går kom kommer sa sier så ser tok tar ga gav gir sto står satt
    sitter la lar lot lå ligger møtte møter traff treffer kjenner kjente liker likte
    elsker elsket hater hjelper hjalp spurte spør ba ber ringte ringer sendte sender
    fortalte forteller viste viser hørte hører tror trodde mener mente vet visste ønsker
    ønsket følte føler tenker tenkte lærte lærer ventet venter bor bodde jobber jobbet
    sov sover ler lo gråt gråter spiser spiste drikker drakk løp løper kjører kjørte
    skrev skriver leser leste kaller kalte slo slår savnet savner trenger trengte mistet
    mister fant finner gjorde gjør bruker brukte vant vinner kjøpte kjøper smilte smiler
    ropte roper svarte svarer nikket ristet begynte begynner sluttet slutter bestemte
    bestemmer prøvde prøver klarte klarer glemte glemmer husket husker snakket snakker
    lekte leker danset danser sang synger kysset kysser tapte taper valgte velger åpnet
    åpner forsto forstår skjønte skjønner skrek skriker stoppet stopper ble`);

  // Nynorsk finite forms that Bokmål lacks. Weak past tense in -a ("venta", "slutta") is left out:
  // it doubles as the a-infinitive, and infinitives must not count as finite (see above).
  const VERB_NN = set(`vart blei vore kjem seier såg fekk tek gjev stod sit sat let låg ligg
    kjende likar elskar hatar ringde spurde bed fortel fortalde høyrer høyrde trur trudde
    meiner meinte veit ønskjer ønskte tenkjer tenkte ventar bur budde jobbar søv græt skreiv
    skriv les las køyrer køyrde kallar saknar treng fann finn gjer vann vinn smilar ropar
    svarar byrjar sluttar gløymde gløymer snakkar leikar dansar syng kyssar valde opnar
    forstod skjønar hjelpte gjekk drog dreg sprang bar`);

  // "hen" as a standalone word; not part of henne/henvise/hente/hen-pronomen, nor of
  // #hen, @hen, hen@x.no, www.hen.no or hen.txt.
  const RE = /(?<![\p{L}\p{N}_@#]|\p{L}-|\p{L}\.)(hens?)(?![\p{L}\p{N}_@]|-\p{L}|\.\p{L})/giu;

  function sentenceTokens(before) {
    const seg = before.slice(-300).split(/[.!?…:;,«»"“”(\n]/).pop();
    return (seg.match(/[\p{L}\p{N}'’-]+/gu) || []).map((t) => t.toLowerCase());
  }

  // First word after hen, looking past adverbs: "tror hen ikke kommer" -> "kommer".
  function nextWord(after) {
    let rest = after;
    for (let i = 0; i < 3; i++) {
      const m = rest.match(/^\s+(\p{L}+)/u);
      if (!m) return null;
      const w = m[1].toLowerCase();
      if (!ADV.has(w)) return w;
      rest = rest.slice(m[0].length);
    }
    return null;
  }

  // The pronoun hen is coordinated with, if any: "han, hun eller hen", "han/hun/hen", "ham og hen".
  function listMate(before) {
    const m = before.slice(-60).match(/(\p{L}+)(?:\s*[,\/]|\s+(?:og|eller|&|samt))\s*$/u);
    const w = m && m[1].toLowerCase();
    return !w ? null : SUBJ_ONLY.has(w) ? 'subj' : OBJ_ONLY.has(w) ? 'obj' : null;
  }

  // After a comma or closing quote a bare verb starts an inverted main clause ("«…», sa hen");
  // elsewhere a sentence-initial verb is a question or an imperative.
  function afterComma(before) {
    const s = before.slice(-300);
    const m = s.match(/([.!?…:;,«»"“”(\n])[^.!?…:;,«»"“”(\n]*$/);
    if (!m) return false;
    if (m[1] === ',' || m[1] === '»' || m[1] === '”') return true;
    return m[1] === '"' && m.index > 0 && !/[\s(«“]/.test(s[m.index - 1]);
  }

  // Speech tag with a verb we do not know: «Hei», utbrøt hen.
  function speechTag(before) {
    const s = before.slice(-80);
    const m = s.match(/([»”"])\s*,?\s*\p{L}+\s*$/u);
    if (!m) return false;
    return m[1] !== '"' || (m.index > 0 && !/[\s(«“]/.test(s[m.index - 1]));
  }

  function verbFirst(verb, before, after) {
    if (afterComma(before) || !IMP_AMBIG.has(verb)) return 'subj';
    const end = after.match(/[.!?…]/);
    return end && end[0] === '?' ? 'subj' : 'obj';
  }

  // Fronted phrase, no subject before the verb: the subject follows it (V2).
  // A leading "og/men" is skipped: "Og i dag kom hen" is inverted, "Men Per møtte hen" is not.
  function isInverted(pre) {
    const p = COORD.has(pre[0]) ? pre.slice(1) : pre;
    return p.length > 0 && fronted(p[0]) && !p.some((t) => SUBJPRON.has(t) || CONJ.has(t));
  }

  const isVerb = (w) => !!w && (VERB.has(w) || VERB_NN.has(w));

  // "Hvor skal du hen?", "hvor du bor hen", "Kvar flytta dei hen?": hen is the adverb ('to/at where').
  // Needs a locational verb, or a bare modal + subject, between the wh-word and hen; a verb or
  // preposition right before hen means a pronoun instead ("Hvor bodde hen?", "Hvor reiste du med hen?").
  function isWhereHen(tokens, after) {
    if (isVerb(nextWord(after))) return false;                 // "Hvor tror du hen bor?"
    const t = tokens.slice();
    while (t.length && ADV.has(t[t.length - 1])) t.pop();
    let w = -1;
    for (let i = t.length - 1; i >= Math.max(0, t.length - 6); i--) {
      if (WHERE.has(t[i])) { w = i; break; }
    }
    if (w < 0) return false;
    const between = t.slice(w + 1);
    const last = between[between.length - 1];
    if (between.length === 2 && SUBJPRON.has(between[0]) &&
        (LOC.has(last) || MODAL.has(last))) return true;       // subordinate: "hvor du skal hen"
    if (between.length < 2 || isVerb(last) || PREP.has(last) || AMBIG.has(last)) return false;
    if (between.some((x) => LOC.has(x))) return true;
    return between.length === 2 && between.some((x) => MODAL.has(x));
  }

  // Adverb idioms: "gå hen til/og ...", "la det stå hen", "falle hen i søvn", "hen i det uvisse".
  function isAdverbUse(tokens, after) {
    const aft = after.toLowerCase();
    const last = tokens[tokens.length - 1];
    const prev = tokens[tokens.length - 2];
    if (isWhereHen(tokens, after)) return true;
    if (last === 'adverbet' || last === 'adverb') return true;     // "adverbet hen" names the word
    if ((MOTION_INF.has(last) || (MOTION_FIN.has(last) && prev && !isInverted(tokens.slice(0, -1)))) &&
        /^\s+(?:til|mot|imot|ad|og\s+\p{L}+)/u.test(aft)) return true;
    if (/^(?:langt|helt)$/.test(last || '') &&                     // "langt hen på natta"
        /^\s+(?:på|mot|imot|i|over|til|ut|ad|etter)(?![\p{L}])/u.test(aft)) return true;
    if (last === 'stå' && /^(la|lar|lot|lat)$/.test(tokens[tokens.length - 3] || '')) return true;
    if (/^(?:falle|faller|falt|falne)$/.test(last || '') &&
        /^\s+i\s+(?:søvn|glemmeboken)/u.test(aft)) return true;
    if (/^\s+i\s+det\s+uvisse/u.test(aft)) return true;
    return false;
  }

  // 'subj' or 'obj'
  function role(tokens, after, before) {
    const nf = isVerb(nextWord(after)); // a finite verb follows: "tror hen kommer"
    const mate = listMate(before);
    if (mate && !(mate === 'obj' && nf)) return mate;
    if (!tokens.length) return 'subj';
    tokens = tokens.slice();
    while (tokens.length && ADV.has(tokens[tokens.length - 1])) tokens.pop();
    if (!tokens.length) return 'subj';

    const last = tokens[tokens.length - 1];
    if (SUB.has(last)) return 'subj';
    if (last === 'for' && !afterComma(before)) return 'obj';        // "For hen er det viktig": preposition
    if (AMBIG.has(last)) return nf ? 'subj' : 'obj';
    if (PREP.has(last)) return 'obj';
    if (COPULA.has(last)) return 'subj';
    if (SUBJPRON.has(last)) return nf ? 'subj' : 'obj';
    if (CLAUSAL.has(last) && nextWord(after)) return 'subj';          // "Jeg tror hen planlegger …"

    const pre = tokens.slice(0, -1);
    if (isVerb(last)) {
      if (!pre.length) return verbFirst(last, before, after);         // "Er hen hjemme?" / "La hen gå."
      if (pre.every((t) => FRONT.has(t)) || isInverted(pre)) return 'subj';  // "Så gikk hen", "I dag kom hen"
      if (pre[pre.length - 1] === 'som' && !CLAUSAL.has(last) && !SAY.has(last)) {
        return 'obj';                                                 // "alle som kjenner hen vet": som is the subject
      }
    } else if (pre.length) {
      if (pre.every((t) => FRONT.has(t)) ||                           // "Så hvisket hen"
          (isInverted(pre) && /(?:te|de|er|ar)$/.test(last))) return 'subj';  // "Neste dag reiste hen"
    } else if (speechTag(before)) {
      return 'subj';                                                  // «Hei», utbrøt hen.
    }
    return nf ? 'subj' : 'obj';
  }

  function matchCase(src, out) {
    if (src.length > 1 && src === src.toUpperCase()) return out.toUpperCase();
    if (src[0] !== src[0].toLowerCase()) return out[0].toUpperCase() + out.slice(1);
    return out;
  }

  /**
   * @param {string} text   text to convert
   * @param {'slash'|'han'|'hun'|'vedkommende'} mode
   * @param {{before?:string, after?:string, lang?:'nb'|'nn'}} [ctx]
   *   before/after: surrounding text (used only for decisions); lang: 'nn' selects Nynorsk forms
   */
  function replaceHen(text, mode, ctx) {
    const forms = ctx && ctx.lang === 'nn' ? FORMS_NN : FORMS;
    const f = forms[mode] || forms.slash;
    const cb = (ctx && ctx.before) || '';
    const ca = (ctx && ctx.after) || '';
    return text.replace(RE, (m, _g, offset) => {
      let out;
      if (m.toLowerCase() === 'hens') {
        out = f.poss;
      } else {
        const before = (cb + text).slice(0, cb.length + offset);
        const after = (text + ca).slice(offset + m.length);
        const tokens = sentenceTokens(before);
        if (isAdverbUse(tokens, after)) return m;
        out = f[role(tokens, after, before)];
      }
      return matchCase(m, out);
    });
  }

  const api = { replaceHen, FORMS, FORMS_NN };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HenFilter = api;
})(typeof self !== 'undefined' ? self : globalThis);
