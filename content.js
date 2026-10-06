/* content.js – walks text nodes, applies HenFilter.replaceHen, watches for dynamic content. */
(async function () {
  'use strict';

  const DEFAULTS = { enabled: true, mode: 'slash', skipLangCheck: false, disabledHosts: '' };
  let settings;
  try {
    settings = await chrome.storage.sync.get(DEFAULTS);
  } catch (e) {
    settings = DEFAULTS;
  }
  if (!settings.enabled) return;

  const host = location.hostname;
  // Dictionary sites discuss "hen" as a word (adverb, neopronoun entry), so rewriting would corrupt them.
  const DICTIONARY_HOSTS = ['ordnett.no', 'naob.no', 'ordbokene.no', 'ordbok.uib.no', 'dokpro.uio.no'];
  const disabled = DICTIONARY_HOSTS.concat(String(settings.disabledHosts || '').split(/\s+/).filter(Boolean));
  if (disabled.some((h) => host === h || host.endsWith('.' + h))) return;

  // "random" = one pick per page load, so a page never flips gender mid-text.
  const mode = settings.mode === 'random' ? (Math.random() < 0.5 ? 'han' : 'hun') : settings.mode;

  const isNoLang = (l) => /^(nb|nn|no)(?:[-_]|$)/i.test(l || '');

  // ---- language check: true / false / null (not enough text yet) ----
  const NO_ONLY = new Set('meg deg seg noen hva nå mye hvordan etter'.split(' '));
  const OTHER = new Set('mig dig sig nogen hvad efter och inte jag är att någon vad'.split(' '));

  function detectLang() {
    if (settings.skipLangCheck) return true;
    if (isNoLang(document.documentElement.lang)) return true;
    const sample = ((document.body && document.body.innerText) || '').slice(0, 6000).toLowerCase();
    const words = sample.match(/\p{L}+/gu) || [];
    if (words.length < 40) return null;
    let no = 0, other = 0;
    for (const w of words) {
      if (NO_ONLY.has(w)) no++;
      else if (OTHER.has(w)) other++;
    }
    return no >= 3 && no > other * 2;
  }

  // ---- Bokmål vs. Nynorsk: han/hun, ham/henne, hans/hennes vs. han/ho, han/henne, hans/hennar ----
  const NN_WORDS = new Set('ikkje eg kva korleis kvifor eit frå dei nokon noko mykje berre'.split(' '));
  const NB_WORDS = new Set('ikke jeg hva hvordan hvorfor et fra de noen noe mye bare'.split(' '));
  let pageVariant = 'nb';   // fallback for lang="no" or no lang attribute; set by sniffVariant()

  function sniffVariant() {
    const sample = ((document.body && document.body.innerText) || '').slice(0, 6000).toLowerCase();
    let nn = 0, nb = 0;
    for (const w of sample.match(/\p{L}+/gu) || []) {
      if (NN_WORDS.has(w)) nn++;
      else if (NB_WORDS.has(w)) nb++;
    }
    return nn > nb ? 'nn' : 'nb';
  }

  function variantFor(el) {
    const langEl = el.closest('[lang]');
    const l = langEl ? langEl.getAttribute('lang') : '';
    if (/^nn(?:[-_]|$)/i.test(l)) return 'nn';
    if (/^nb(?:[-_]|$)/i.test(l)) return 'nb';
    return pageVariant;
  }

  const SKIP = 'script,style,noscript,textarea,input,code,pre,[contenteditable=""],[contenteditable="true"]';
  const BLOCK = 'p,li,div,td,th,h1,h2,h3,h4,h5,h6,blockquote,article,section,dd,dt,figcaption';

  function contextFor(node) {
    const parent = node.parentElement;
    const block = (parent && parent.closest(BLOCK)) || parent;
    if (!block) return { before: '', after: '' };
    try {
      const r1 = document.createRange();
      r1.setStart(block, 0);
      r1.setEnd(node, 0);
      const r2 = document.createRange();
      r2.setStart(node, node.length);
      r2.setEnd(block, block.childNodes.length);
      return { before: r1.toString().slice(-200), after: r2.toString().slice(0, 80) };
    } catch (e) {
      return { before: '', after: '' };
    }
  }

  // Cheap pre-filter: skips nodes that only contain "henne", "hente", "hendelse" etc., so the
  // Range-based context is built only where hen.js may actually replace something.
  const MAYBE_HEN = /(?<![\p{L}\p{N}_])hens?(?![\p{L}\p{N}_])/iu;

  function handleText(node) {
    const text = node.nodeValue;
    if (!text || !MAYBE_HEN.test(text)) return;
    const el = node.parentElement;
    if (!el || el.closest(SKIP)) return;
    const langEl = el.closest('[lang]');
    if (langEl && langEl !== document.documentElement && !isNoLang(langEl.getAttribute('lang'))) return;
    const ctx = contextFor(node);
    ctx.lang = variantFor(el);
    const out = HenFilter.replaceHen(text, mode, ctx);
    if (out !== text) node.nodeValue = out;
  }

  function process(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) return handleText(root);
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(handleText);
  }

  // ---- scheduling ----
  let langOK = null;
  let needFull = true;
  let retries = 0;
  const queue = new Set();
  let timer = null;
  let observer;

  function schedule(n, delay) {
    if (n) queue.add(n);
    if (timer) return;
    timer = setTimeout(flush, delay || 150);
  }

  function flush() {
    timer = null;
    if (langOK === null) langOK = detectLang();
    if (langOK === false) {
      if (observer) observer.disconnect();
      queue.clear();
      return;
    }
    if (langOK === null) {            // too little text yet; try again a few times
      if (++retries <= 5) schedule(null, 1500);
      return;
    }
    if (needFull) {
      needFull = false;
      pageVariant = sniffVariant();
      process(document.body);
    }
    const items = [...queue];
    queue.clear();
    items.forEach((n) => { if (n.isConnected) process(n); });
  }

  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') schedule(m.target);
      else m.addedNodes.forEach((n) => schedule(n));
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  schedule(document.body, 0);
})();
