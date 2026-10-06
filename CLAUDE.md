# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Manifest V3 browser extension (Chrome/Edge) that rewrites the Norwegian neopronoun "hen" to han/hun (subject), ham/henne (object), hans/hennes (possessive) on Norwegian pages. Plain JS, no build step, no dependencies, no package.json.

## Commands

- Run tests: `node test/run.js`
- Build the store package: `node scripts/package.js` → `dist/hen-extension-<version>.zip` (runtime files only; if you add a runtime file, add it to the `files` list in `scripts/package.js`). Store text lives in `store/LISTING.md`, the privacy policy in `PRIVACY.md`; keep both in sync if permissions or stored settings change.
- Try the extension: load this folder unpacked at `chrome://extensions` (Developer mode). After editing, reload the extension and the test page.

Tests are a single `cases` array of `[mode, input, expected, optionalCtx]` in `test/run.js`; add failing real-world sentences there, then tune `hen.js`. There is no single-test runner.

## Architecture

- `hen.js` — pure replacement logic, dual-loaded: content script (exposes `self.HenFilter`) and Node `require` (tests). No DOM access. `replaceHen(text, mode, ctx)` matches standalone `hen`/`hens`, exempts adverb idioms (`isAdverbUse`, e.g. *gå hen til*, *la det stå hen*), then picks subject vs. object in `role()` using word-list heuristics over the preceding tokens in the sentence plus the next word (finite-verb-follows ⇒ subject). The word-list constants at the top (`PREP`, `AMBIG`, `SUB`, `FRONT`, `ADV`, `VERB`, …) are the main tuning surface; infinitives are deliberately excluded from `VERB`. `ctx.before/after` supply text from neighbouring nodes for decisions only; `ctx.lang === 'nn'` switches the output to Nynorsk forms (`FORMS_NN`: ho, han as object, hennar), and `content.js` sets it per text node from the nearest `[lang]` (sniffing marker words for `no`/missing). Interrogative *hvor/kvar … hen* is exempted in `isWhereHen`. `role()` also uses the clause start (`afterComma`, `verbFirst`, `isInverted`), the next word skipping adverbs (`nextWord`) and a coordinated pronoun (`listMate`); when changing it, re-run the whole suite since these rules interact (e.g. `CONJ` vs. bare *når/da* openers).
- `content.js` — injected on `<all_urls>`, all frames, `document_idle`; loads **after** `hen.js` (order in `manifest.json` matters). Reads settings from `chrome.storage.sync`, checks the per-host disable list (user setting plus the built-in `DICTIONARY_HOSTS` list of dictionary sites such as ordnett.no and naob.no), does a Norwegian language check (`lang` attr, else word-frequency sniffing, retried a few times if the page has little text), walks text nodes, builds context from the enclosing block via `Range`, and batches `MutationObserver` additions/changes through a debounced queue. Skips script/style/inputs/code/contenteditable and elements whose nearest `[lang]` isn't nb/nn/no. "random" mode picks han or hun once per page load.
- `options.html` / `options.js` — popup and options page; keep the `DEFAULTS` object in sync with the one in `content.js`. Settings changes only apply after page reload.

Firefox would need a manifest tweak (see README).
