# Hen → han/hun

Browser extension (Manifest V3, Chrome/Edge; Firefox needs a small manifest tweak) that replaces the Norwegian neopronoun "hen" with han/hun on Norwegian pages.

## Install (Chrome / Edge)

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Click the extension icon to choose your settings.

## Settings

- **han/hun** (default): hen → han/hun, ham/henne (object), hans/hennes (possessive). On Nynorsk text the forms are han/ho, han/henne, hans/hennar (in "always hun" mode: ho, henne, hennar). Nynorsk is picked from the nearest `lang` attribute (`nn`), or, for `lang="no"` or no `lang`, from marker words like *ikkje*, *eg*, *kva*.
- **always han** or **always hun**
- **random per page**: one pick per page load, so a text never flips gender midway
- Per-site disable list, and an option to skip the language check
- Dictionary sites are always skipped, since they discuss "hen" as a word: ordnett.no, naob.no, ordbokene.no, ordbok.uib.no and dokpro.uio.no (including subdomains). The list is `DICTIONARY_HOSTS` in `content.js`.

The extension only runs on pages marked `lang="nb|nn|no"`, or detected as Norwegian from the text. Elements with a different `lang` attribute are skipped.

## How it works

- `hen.js` is the core logic. Every standalone "hen" is treated as the pronoun except in a few adverb uses (*gå hen til/og*, *la det stå hen*, *falle hen i søvn*, *hen i det uvisse*, *adverbet hen*, and the interrogative *Hvor/Kvar skal du hen?*, *hvor du bor hen*). Subject vs. object form is decided with word lists (prepositions, finite verbs, fronted words for V2 order). The lists at the top of the file are the tuning surface.
- `content.js` walks text nodes, passes surrounding text as context, and watches for dynamically added content with a `MutationObserver`.

## Tests

```
node test/run.js
```

Add real-world sentences that go wrong to the `cases` array in `test/run.js`, then adjust the word lists in `hen.js`.

## Known limitations

- Subject/object detection is heuristic. Rare constructions can pick the wrong form (e.g. *Hvorfor kom hen?* variants with unusual fronting).
- Pages that talk about the word itself (e.g. Språkrådet's [hen article](https://sprakradet.no/spraksporsmal-og-svar/hen/)) come out odd, since a mention of the word ("pronomenet hen", a heading like "Eit anna hen") can't be told from a use. Add such sites to the per-site disable list.
- *hvor … hen* is recognised only with a locational verb (*bo, dra, reise, gå, sitte …*) or a bare modal + subject (*Hvor skal du hen?*). *Hvor sa du hen?* with other verbs is treated as the pronoun.
- Nynorsk verb coverage is a word list too: forms not in `VERB`/`VERB_NN` (many weak -ar verbs) are not seen as finite, so subject/object can be wrong in *ho/henne* mode. The object form of *han* is the same as the subject form in Nynorsk, so "always han" is unaffected.
- Text in canvas, images or closed shadow DOM is not touched.
- Swedish/Danish pages are skipped by the language check, which can occasionally misjudge short pages; use "Skip language check" to override.
